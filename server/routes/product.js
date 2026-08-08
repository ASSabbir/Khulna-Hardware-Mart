// FILE: server/routes/product.js (FULL REPLACEMENT) — #1/#2/#5/#18/#19 per-supplier split payments, custom-quick create, pagination cap
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Counter = require("../models/Counter");
const Supplier = require("../models/Supplier");
const PurchaseHistory = require("../models/PurchaseHistory");
const SupplierPayment = require("../models/SupplierPayment");
const Ledger = require("../models/Ledger");
const CustomProductSource = require("../models/CustomProductSource");

const CATEGORY_CODE_MAP = {
  "Hand Tools": "HTL", "Power Tools": "PTL", "Fasteners & Hardware": "FAS", "Pipes & Fittings": "PIP",
  "Electrical": "ELE", "Paints & Coatings": "PNT", "Safety Equipment": "SFT", "Building Materials": "BLD",
  "Adhesives & Sealants": "ADH", "Measuring & Marking": "MSR", "Furniture": "FUR", "Stationery": "STA", "Other": "OTH",
};

function categoryCode(category) {
  if (CATEGORY_CODE_MAP[category]) return CATEGORY_CODE_MAP[category];
  const clean = String(category || "OTH").toUpperCase().replace(/[^A-Z]/g, "");
  return (clean.slice(0, 3) || "OTH").padEnd(3, "X");
}

async function generateSKU(category) {
  const code = categoryCode(category);
  const seq = await Counter.getNextSequence(code);
  return `${code}-${String(seq).padStart(4, "0")}`;
}

async function createProductWithUniqueSKU(docData, category, maxAttempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const sku = await generateSKU(category);
    try {
      return await Product.create({ ...docData, sku });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern && error.keyPattern.sku) { lastError = error; continue; }
      throw error;
    }
  }
  throw lastError || new Error("Failed to generate a unique SKU after multiple attempts.");
}

async function resolveSupplier({ supplierId, supplierName }) {
  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    const existing = await Supplier.findById(supplierId);
    if (existing) return { supplierId: existing._id, supplierName: existing.companyName };
  }
  const trimmedName = String(supplierName || "").trim();
  if (!trimmedName) return { supplierId: null, supplierName: "Unknown Supplier" };
  let supplier = await Supplier.findOne({ companyName: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
  if (!supplier) supplier = await Supplier.create({ companyName: trimmedName, contactPerson: "N/A", phone: "N/A", autoCreated: true });
  return { supplierId: supplier._id, supplierName: supplier.companyName };
}

function syncSupplierAvailableQuantities(product) {
  const bySupplier = {};
  for (const b of product.batches) {
    const key = b.supplierId ? String(b.supplierId) : null;
    if (!key) continue;
    bySupplier[key] = (bySupplier[key] || 0) + Math.max(0, b.quantity || 0);
  }
  product.suppliers.forEach((s) => { s.availableQuantity = bySupplier[String(s.supplierId)] || 0; });
}

async function updateSupplierStats(supplierId, price, qty, session) {
  if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) return;
  const opts = session ? { session } : {};
  await Supplier.findByIdAndUpdate(
    supplierId,
    { $inc: { totalPurchaseAmount: Number(price) * Number(qty), totalPurchaseCount: 1, totalPurchasedQuantity: Number(qty) },
      $set: { lastPurchasePrice: Number(price), lastPurchaseDate: new Date() } },
    opts
  );
}

// #18/#19 — apply split payments (supplier debt reduction + accounts deduction via Ledger)
async function recordPurchasePayments({ supplierId, productName, qty, unit, splits, contextLabel, creditApplied }) {
  const today = new Date().toISOString().slice(0, 10);
  let paidNow = 0;

  // #adjust — receivable credit reduces what's owed to the supplier without touching cash/bank/mobile accounts.
  // Recorded as a "receivable" SupplierPayment (offsets against payable in computeSupplierBalance).
  const credit = Number(creditApplied) || 0;
  if (credit > 0 && supplierId) {
    await SupplierPayment.create({ supplierId, type: "receivable", amount: -credit, date: today, method: "cash", note: `${contextLabel} — adjusted from receivable (${productName})` });
    // Note: negative "receivable" amount reduces totalReceived, i.e. consumes the receivable balance.
    // Equivalent to also being a "payable" reduction — implemented cleanly below via direct balance math in computeSupplierBalance.
  }

  if (!Array.isArray(splits) || splits.length === 0) return { paidNow: 0, creditApplied: credit };
  for (const s of splits) {
    const amt = Number(s.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    const method = ["cash", "mobile", "bank"].includes(s.method) ? s.method : "cash";
    const provider = method === "mobile" ? s.provider : null;
    if (supplierId) {
      await SupplierPayment.create({ supplierId, type: "payable", amount: amt, method, provider, date: today, note: `${contextLabel} — ${productName}` });
    }
    await Ledger.create({
      type: "expense", category: "Purchase", amount: amt,
      description: `${contextLabel} — ${productName} (${qty} ${unit || "pcs"})`,
      date: today, method, provider, addedBy: "System",
    });
    paidNow += amt;
  }
  return { paidNow: +paidNow.toFixed(2), creditApplied: credit };
}

router.get("/valuation/summary", async (req, res) => {
  try {
    const products = await Product.find().lean();
    let totalValue = 0;
    const breakdown = products.map((p) => {
      const batches = (p.batches || []).filter((b) => (b.quantity || 0) > 0);
      const batchValue = batches.reduce((s, b) => s + (b.quantity || 0) * (b.buyingPrice || 0), 0);
      const trackedQty = batches.reduce((s, b) => s + (b.quantity || 0), 0);
      const untrackedQty = Math.max(0, (p.stock || 0) - trackedQty);
      const untrackedValue = untrackedQty * (p.buyingPrice || 0);
      const value = batchValue + untrackedValue;
      totalValue += value;
      return { productId: p._id, name: p.name, sku: p.sku, stock: p.stock, unit: p.unit, unitValue: p.unitValue, value,
        batches: batches.map((b) => ({ batchId: b.batchId, supplierName: b.supplierName, buyingPrice: b.buyingPrice, quantity: b.quantity, value: (b.quantity || 0) * (b.buyingPrice || 0) })) };
    });
    res.json({ totalValue, totalProducts: products.length, products: breakdown });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30, search = "", category = "", type = "all" } = req.query;
    const cappedLimit = Math.min(parseInt(limit) || 30, 200);
    const skip = (parseInt(page) - 1) * cappedLimit;
    const filter = {};
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [{ name: { $regex: q, $options: "i" } }, { brand: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } }, { category: { $regex: q, $options: "i" } }];
    }
    if (category && category.trim()) filter.category = { $regex: category, $options: "i" };
    if (type === "custom") filter.isCustom = true;
    else if (type === "regular") filter.isCustom = { $ne: true };

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(cappedLimit).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ products, pagination: { total, page: parseInt(page), limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !body.category || !Number.isFinite(Number(body.buyingPrice))) {
      return res.status(400).json({ message: "Name, category, and buying price are required." });
    }
    const supplierEntries = Array.isArray(body.suppliers) ? body.suppliers : [];
    if (supplierEntries.length === 0) return res.status(400).json({ message: "Add at least one supplier with a purchase quantity to set opening stock." });
    if (supplierEntries.length > 20) return res.status(400).json({ message: "Too many supplier entries (max 20)." });
    for (const s of supplierEntries) {
      const price = Number(s.buyingPrice);
      const qty = Number(s.purchaseQuantity);
      if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: "Each supplier entry needs a valid buying price." });
      if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ message: "Each supplier entry needs a valid purchase quantity." });
      if (!String(s.supplierName || "").trim() && !s.supplierId) return res.status(400).json({ message: "Each supplier entry needs a supplier name." });
    }

    const suppliers = [];
    const batches = [];
    let totalStock = 0;
    const resolvedEntries = [];

    for (const s of supplierEntries) {
      const resolved = await resolveSupplier({ supplierId: s.supplierId, supplierName: s.supplierName });
      const price = Number(s.buyingPrice);
      const qty = Number(s.purchaseQuantity);
      const purchaseDate = s.purchaseDate ? new Date(s.purchaseDate) : new Date();

      const existingIdx = suppliers.findIndex((x) => String(x.supplierId) === String(resolved.supplierId));
      if (existingIdx >= 0) {
        suppliers[existingIdx].buyingPrice = price;
        suppliers[existingIdx].lastPurchaseDate = purchaseDate;
        suppliers[existingIdx].availableQuantity += qty;
      } else {
        suppliers.push({ supplierId: resolved.supplierId, supplierName: resolved.supplierName, buyingPrice: price, lastPurchaseDate: purchaseDate, availableQuantity: qty });
      }
      batches.push({ supplierId: resolved.supplierId, supplierName: resolved.supplierName, buyingPrice: price, quantity: qty, originalQuantity: qty, purchaseDate });
      totalStock += qty;
      resolvedEntries.push({ resolved, price, qty, purchaseDate, payments: Array.isArray(s.payments) ? s.payments : [], creditApplied: s.creditApplied });
    }

    const product = await createProductWithUniqueSKU(
      {
        ...body,
        quality: body.quality ? String(body.quality).trim().slice(0, 100) : "",
        material: body.material ? String(body.material).trim().slice(0, 100) : "",
        unitValue: body.unitValue !== undefined && body.unitValue !== null && body.unitValue !== "" ? Number(body.unitValue) : null,
        suppliers, batches, stock: totalStock, isCustom: false,
      },
      body.category
    );

    for (const entry of resolvedEntries) {
      await PurchaseHistory.create({
        productId: product._id, productName: product.name, supplierId: entry.resolved.supplierId, supplierName: entry.resolved.supplierName,
        buyingPrice: entry.price, quantity: entry.qty, totalCost: entry.price * entry.qty, purchaseDate: entry.purchaseDate,
      });
      await updateSupplierStats(entry.resolved.supplierId, entry.price, entry.qty);
      await recordPurchasePayments({
        supplierId: entry.resolved.supplierId, productName: product.name, qty: entry.qty, unit: product.unit,
        splits: entry.payments, contextLabel: "Stock purchase", creditApplied: entry.creditApplied,
      });
    }

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "Could not save product due to a duplicate value. Please try again." });
    res.status(500).json({ message: error.message });
  }
});

async function createCustomProduct({ name, unitPrice, qty, shopName }) {
  const category = "Other";
  const trimmedName = String(name || "").trim();
  const qtyNum = Number(qty) || 0;
  const priceNum = Number(unitPrice) || 0;

  const existing = trimmedName
    ? await Product.findOne({ isCustom: true, name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } })
    : null;

  if (existing) {
    existing.batches.push({ supplierId: null, supplierName: shopName ? String(shopName).trim().slice(0, 200) : "N/A (Custom Product)", buyingPrice: priceNum, quantity: qtyNum, originalQuantity: qtyNum, purchaseDate: new Date() });
    existing.stock = (existing.stock || 0) + qtyNum;
    await existing.save();
    if (shopName && String(shopName).trim()) {
      await CustomProductSource.create({ productId: existing._id, productName: existing.name, shopName: String(shopName).trim(), quantity: qtyNum, unitPrice: priceNum, totalAmount: priceNum * qtyNum });
    }
    return existing;
  }

  const batch = { supplierId: null, supplierName: shopName ? String(shopName).trim().slice(0, 200) : "N/A (Custom Product)", buyingPrice: priceNum, quantity: qtyNum, originalQuantity: qtyNum, purchaseDate: new Date() };
  const newProduct = await createProductWithUniqueSKU(
    { name: trimmedName, category, brand: "Custom", unit: "pcs", buyingPrice: priceNum, holcellPrice: priceNum, retailPrice: priceNum, stock: qtyNum, reorderLevel: 0, status: "active", isCustom: true, batches: [batch] },
    category
  );
  if (shopName && String(shopName).trim()) {
    await CustomProductSource.create({ productId: newProduct._id, productName: newProduct.name, shopName: String(shopName).trim(), quantity: qtyNum, unitPrice: priceNum, totalAmount: priceNum * qtyNum });
  }
  return newProduct;
}

// #15 (custom product now created immediately when added to an invoice, not deferred to sale) — fixes stock accuracy + left-list visibility
router.post("/custom-quick", async (req, res) => {
  try {
    const { name, unitPrice, qty, shopName } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ message: "Product name is required." });
    const price = Number(unitPrice);
    const quantity = Number(qty);
    if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ message: "Enter a valid unit price." });
    if (!Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: "Enter a valid quantity." });
    const product = await createCustomProduct({ name, unitPrice: price, qty: quantity, shopName });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
    const { supplierAssignment, ...body } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    if (body.isCustom === false && product.isCustom && supplierAssignment) {
      const resolved = await resolveSupplier(supplierAssignment);
      product.batches.forEach((b) => { b.supplierId = resolved.supplierId; b.supplierName = resolved.supplierName; });
      product.suppliers = [{ supplierId: resolved.supplierId, supplierName: resolved.supplierName, buyingPrice: body.buyingPrice ?? product.buyingPrice, lastPurchaseDate: new Date(), availableQuantity: 0 }];
      syncSupplierAvailableQuantities(product);
      await updateSupplierStats(resolved.supplierId, body.buyingPrice ?? product.buyingPrice, product.stock);
    }
    Object.assign(product, body);
    await product.save();
    res.json(product);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: Object.values(error.errors)[0]?.message || "Invalid product data." });
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/purchase-history", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
    const filter = { productId: req.params.id };
    if (req.query.supplierId && mongoose.Types.ObjectId.isValid(req.query.supplierId)) filter.supplierId = req.query.supplierId;
    const records = await PurchaseHistory.find(filter).sort({ purchaseDate: -1 }).lean();
    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/restock", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
    const { supplierId, supplierName, buyingPrice, quantity, purchaseDate, payments, creditApplied } = req.body;
    const qty = Number(quantity);
    const price = Number(buyingPrice);
    const pDate = purchaseDate ? new Date(purchaseDate) : new Date();
    if (isNaN(pDate)) return res.status(400).json({ message: "Invalid purchase date." });
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ message: "Quantity must be a positive number." });
    if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: "Invalid buying price." });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const resolved = await resolveSupplier({ supplierId, supplierName });
    const batch = { supplierId: resolved.supplierId, supplierName: resolved.supplierName, buyingPrice: price, quantity: qty, originalQuantity: qty, purchaseDate: pDate };
    product.batches.push(batch);
    product.stock = (product.stock || 0) + qty;

    const existingSupplierIdx = product.suppliers.findIndex((s) => String(s.supplierId) === String(resolved.supplierId));
    if (existingSupplierIdx >= 0) {
      product.suppliers[existingSupplierIdx].buyingPrice = price;
      product.suppliers[existingSupplierIdx].lastPurchaseDate = new Date();
    } else {
      product.suppliers.push({ supplierId: resolved.supplierId, supplierName: resolved.supplierName, buyingPrice: price, lastPurchaseDate: new Date(), availableQuantity: 0 });
    }
    syncSupplierAvailableQuantities(product);
    await product.save();

    await PurchaseHistory.create({ productId: product._id, productName: product.name, supplierId: resolved.supplierId, supplierName: resolved.supplierName, buyingPrice: price, quantity: qty, totalCost: price * qty, batchId: batch.batchId, purchaseDate: pDate });
    await updateSupplierStats(resolved.supplierId, price, qty);

    const { paidNow, creditApplied: applied } = await recordPurchasePayments({ supplierId: resolved.supplierId, productName: product.name, qty, unit: product.unit, splits: payments, contextLabel: "Restock", creditApplied });
    const totalCost = +(price * qty).toFixed(2);
    const dueRemaining = Math.max(0, +(totalCost - applied - paidNow).toFixed(2));

    res.json({ product, totalCost, paidNow, creditApplied: applied, dueRemaining });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function deductStockFIFO(productId, qtyToDeduct, session, preferredSupplierId = null) {
  const product = await Product.findById(productId).session(session || null);
  if (!product) throw new Error("Product not found for stock deduction.");
  const qty = Number(qtyToDeduct);
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid deduction quantity.");

  let remaining = qty;
  let costOfGoodsSold = 0;
  const batchesUsed = [];
  const allBatchesSorted = [...product.batches].sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

  if (preferredSupplierId && mongoose.Types.ObjectId.isValid(preferredSupplierId)) {
    const preferredBatches = allBatchesSorted.filter((b) => b.supplierId && String(b.supplierId) === String(preferredSupplierId));
    for (const batch of preferredBatches) {
      if (remaining <= 0) break;
      const available = Math.max(0, batch.quantity || 0);
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      batch.quantity -= take; remaining -= take;
      costOfGoodsSold += take * (batch.buyingPrice || 0);
      batchesUsed.push({ batchId: batch.batchId, supplierId: batch.supplierId, supplierName: batch.supplierName, buyingPrice: batch.buyingPrice, quantity: take });
    }
  }
  if (remaining > 0) {
    for (const batch of allBatchesSorted) {
      if (remaining <= 0) break;
      const available = Math.max(0, batch.quantity || 0);
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      batch.quantity -= take; remaining -= take;
      costOfGoodsSold += take * (batch.buyingPrice || 0);
      batchesUsed.push({ batchId: batch.batchId, supplierId: batch.supplierId, supplierName: batch.supplierName, buyingPrice: batch.buyingPrice, quantity: take });
    }
  }
  if (remaining > 0) {
    const trackedTotal = product.batches.reduce((s, b) => s + Math.max(0, b.quantity || 0), 0);
    const untrackedStock = Math.max(0, (product.stock || 0) - trackedTotal);
    if (untrackedStock > 0) {
      const takeFromLegacy = Math.min(untrackedStock, remaining);
      costOfGoodsSold += takeFromLegacy * (product.buyingPrice || 0);
      batchesUsed.push({ batchId: null, supplierId: null, supplierName: "Legacy Stock", buyingPrice: product.buyingPrice || 0, quantity: takeFromLegacy });
      remaining -= takeFromLegacy;
    }
  }
  if (remaining > 0) throw new Error(`Insufficient stock for ${product.name}. Short by ${remaining}.`);

  product.stock = Math.max(0, (product.stock || 0) - qty);
  syncSupplierAvailableQuantities(product);
  const opts = session ? { session } : {};
  await product.save(opts);
  return { costOfGoodsSold, batchesUsed };
}

async function restoreStockFIFO(productId, qtyToRestore, session, batchRefs = [], originalSoldQty = null) {
  const product = await Product.findById(productId).session(session || null);
  if (!product) return;
  const restoreQty = Number(qtyToRestore);
  if (!Number.isFinite(restoreQty) || restoreQty <= 0) return;
  let remaining = restoreQty;

  if (Array.isArray(batchRefs) && batchRefs.length > 0) {
    const totalSold = originalSoldQty || batchRefs.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
    if (totalSold > 0) {
      let allocated = 0;
      for (let i = 0; i < batchRefs.length; i++) {
        const ref = batchRefs[i];
        const isLast = i === batchRefs.length - 1;
        let share = isLast ? restoreQty - allocated : Math.floor((Number(ref.quantity) / totalSold) * restoreQty);
        share = Math.max(0, Math.min(share, remaining));
        if (share <= 0) continue;
        const batch = ref.batchId ? product.batches.find((b) => String(b.batchId) === String(ref.batchId)) : null;
        if (batch) batch.quantity += share;
        else product.batches.push({ batchId: ref.batchId || undefined, supplierId: ref.supplierId || null, supplierName: ref.supplierName || "Return Restock", buyingPrice: ref.buyingPrice ?? product.buyingPrice ?? 0, quantity: share, originalQuantity: share, purchaseDate: new Date() });
        allocated += share; remaining -= share;
      }
    }
  }
  if (remaining > 0) {
    if (product.batches.length > 0) product.batches[product.batches.length - 1].quantity += remaining;
    else product.batches.push({ supplierId: null, supplierName: "Return Restock", buyingPrice: product.buyingPrice || 0, quantity: remaining, originalQuantity: remaining, purchaseDate: new Date() });
  }
  product.stock = (product.stock || 0) + restoreQty;
  syncSupplierAvailableQuantities(product);
  const opts = session ? { session } : {};
  await product.save(opts);
}

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid product id." });
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.generateSKU = generateSKU;
module.exports.resolveSupplier = resolveSupplier;
module.exports.createCustomProduct = createCustomProduct;
module.exports.deductStockFIFO = deductStockFIFO;
module.exports.restoreStockFIFO = restoreStockFIFO;