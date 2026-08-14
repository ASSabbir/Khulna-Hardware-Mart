// FILE: server/routes/backup.js (NEW)
const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const { auth } = require("../middleware/auth");

const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");
const Return = require("../models/Return");
const Ledger = require("../models/Ledger");
const Partner = require("../models/Partner");
const SupplierPayment = require("../models/SupplierPayment");
const PurchaseHistory = require("../models/PurchaseHistory");
const CustomProductSource = require("../models/CustomProductSource");
const DynamicOption = require("../models/DynamicOption");
const Counter = require("../models/Counter");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/json" || file.originalname.toLowerCase().endsWith(".json")) cb(null, true);
    else cb(new Error("Only .json backup files are allowed."));
  },
});

const COLLECTIONS = {
  products: Product,
  suppliers: Supplier,
  customers: Customer,
  invoices: Invoice,
  returns: Return,
  ledger: Ledger,
  partners: Partner,
  supplierPayments: SupplierPayment,
  purchaseHistory: PurchaseHistory,
  customProductSources: CustomProductSource,
  dynamicOptions: DynamicOption,
  counters: Counter,
};

router.use(auth);

function buildDateFilter(from, to) {
  const filter = {};
  if (from) {
    const f = new Date(from);
    if (!isNaN(f)) filter.$gte = f;
  }
  if (to) {
    const t = new Date(to);
    if (!isNaN(t)) { t.setHours(23, 59, 59, 999); filter.$lte = t; }
  }
  return Object.keys(filter).length ? { createdAt: filter } : {};
}

function computeProductValue(p) {
  const batches = (p.batches || []).filter((b) => (b.quantity || 0) > 0);
  const trackedQty = batches.reduce((s, b) => s + (b.quantity || 0), 0);
  const batchValue = batches.reduce((s, b) => s + (b.quantity || 0) * (b.buyingPrice || 0), 0);
  const untrackedQty = Math.max(0, (p.stock || 0) - trackedQty);
  return batchValue + untrackedQty * (p.buyingPrice || 0);
}

// GET /api/backup/summary
router.get("/summary", async (req, res) => {
  try {
    const entries = await Promise.all(
      Object.entries(COLLECTIONS).map(async ([key, Model]) => [key, await Model.countDocuments()])
    );
    res.json({ counts: Object.fromEntries(entries) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/backup/export/json?from=&to=
router.get("/export/json", async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = buildDateFilter(from, to);
    const data = {};
    for (const [key, Model] of Object.entries(COLLECTIONS)) {
      data[key] = await Model.find(dateFilter).lean();
    }
    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        from: from || null,
        to: to || null,
        source: "Khulna Hardware Mart",
        version: 1,
      },
      data,
    };
    const filename = `khm-database-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/backup/export/excel?from=&to=
router.get("/export/excel", async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = buildDateFilter(from, to);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Khulna Hardware Mart";
    workbook.created = new Date();

    const addSheet = (name, columns, rows) => {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = columns;
      const header = sheet.getRow(1);
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };
      header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
      rows.forEach((r) => sheet.addRow(r));
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
      return sheet;
    };

    // Products + Stock Valuation
    const products = await Product.find(dateFilter).lean();
    addSheet(
      "Products",
      [
        { header: "Name", key: "name", width: 30 },
        { header: "SKU", key: "sku", width: 16 },
        { header: "Category", key: "category", width: 20 },
        { header: "Brand", key: "brand", width: 18 },
        { header: "Buying Price", key: "buyingPrice", width: 14 },
        { header: "Wholesale Price", key: "holcellPrice", width: 16 },
        { header: "Retail Price", key: "retailPrice", width: 14 },
        { header: "Stock", key: "stock", width: 10 },
        { header: "Unit", key: "unit", width: 10 },
        { header: "Stock Value", key: "stockValue", width: 14 },
        { header: "Status", key: "status", width: 12 },
        { header: "Location", key: "location", width: 16 },
        { header: "Custom Product", key: "isCustom", width: 14 },
        { header: "Created At", key: "createdAt", width: 20 },
      ],
      products.map((p) => ({
        name: p.name, sku: p.sku, category: p.category, brand: p.brand,
        buyingPrice: p.buyingPrice, holcellPrice: p.holcellPrice, retailPrice: p.retailPrice,
        stock: p.stock, unit: p.unit, stockValue: +computeProductValue(p).toFixed(2),
        status: p.status, location: p.location, isCustom: p.isCustom ? "Yes" : "No",
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleString("en-GB") : "",
      }))
    );

    // Customers
    const customers = await Customer.find(dateFilter).lean();
    addSheet(
      "Customers",
      [
        { header: "Name", key: "name", width: 24 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Email", key: "email", width: 22 },
        { header: "Address", key: "address", width: 28 },
        { header: "Type", key: "customerType", width: 12 },
        { header: "Total Spent", key: "totalSpent", width: 14 },
        { header: "Total Orders", key: "totalOrders", width: 14 },
        { header: "Total Due", key: "totalDue", width: 14 },
        { header: "Status", key: "status", width: 12 },
        { header: "Created At", key: "createdAt", width: 20 },
      ],
      customers.map((c) => ({
        name: c.name, phone: c.phone, email: c.email, address: c.address,
        customerType: c.customerType === 2 ? "Wholesale" : "Retail",
        totalSpent: c.totalSpent, totalOrders: c.totalOrders, totalDue: c.totalDue,
        status: c.status, createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString("en-GB") : "",
      }))
    );

    // Suppliers
    const suppliers = await Supplier.find(dateFilter).lean();
    addSheet(
      "Suppliers",
      [
        { header: "Company Name", key: "companyName", width: 26 },
        { header: "Contact Person", key: "contactPerson", width: 20 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Email", key: "email", width: 22 },
        { header: "Category", key: "category", width: 18 },
        { header: "Total Purchase Amount", key: "totalPurchaseAmount", width: 18 },
        { header: "Total Purchase Count", key: "totalPurchaseCount", width: 16 },
        { header: "Status", key: "status", width: 12 },
        { header: "Created At", key: "createdAt", width: 20 },
      ],
      suppliers.map((s) => ({
        companyName: s.companyName || s.name, contactPerson: s.contactPerson, phone: s.phone,
        email: s.email, category: s.category, totalPurchaseAmount: s.totalPurchaseAmount,
        totalPurchaseCount: s.totalPurchaseCount, status: s.status,
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleString("en-GB") : "",
      }))
    );

    // Invoices (Paid + Due, separate sheets)
    const invoiceCols = [
      { header: "Invoice #", key: "invoiceNumber", width: 16 },
      { header: "Date", key: "invoiceDate", width: 14 },
      { header: "Customer", key: "customerName", width: 22 },
      { header: "Phone", key: "customerPhone", width: 16 },
      { header: "Items", key: "itemCount", width: 10 },
      { header: "Subtotal", key: "subtotal", width: 12 },
      { header: "Discount", key: "discount", width: 12 },
      { header: "VAT", key: "vat", width: 10 },
      { header: "Grand Total", key: "grandTotal", width: 14 },
      { header: "Paid Amount", key: "paidAmount", width: 14 },
      { header: "Due Amount", key: "dueAmount", width: 14 },
      { header: "Prepared By", key: "preparedBy", width: 16 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];
    const mapInvoiceRow = (inv) => ({
      invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate,
      customerName: inv.customer?.name, customerPhone: inv.customer?.phone,
      itemCount: (inv.items || []).length, subtotal: inv.subtotal, discount: inv.discount,
      vat: inv.vat, grandTotal: inv.grandTotal, paidAmount: inv.paidAmount, dueAmount: inv.dueAmount,
      preparedBy: inv.preparedBy, createdAt: inv.createdAt ? new Date(inv.createdAt).toLocaleString("en-GB") : "",
    });
    const paidInvoices = await Invoice.find({ ...dateFilter, paymentStatus: "paid" }).lean();
    addSheet("Paid Invoices", invoiceCols, paidInvoices.map(mapInvoiceRow));
    const dueInvoices = await Invoice.find({ ...dateFilter, paymentStatus: "due" }).lean();
    addSheet("Due Invoices", invoiceCols, dueInvoices.map(mapInvoiceRow));

    // Returns (one row per returned item)
    const returns = await Return.find(dateFilter).lean();
    const returnRows = [];
    returns.forEach((r) => {
      (r.items || []).forEach((it) => {
        returnRows.push({
          invoiceNumber: r.invoiceNumber, productName: it.name, returnedQty: it.returnedQty,
          returnAmount: it.returnAmount, reason: it.reason,
          returnDate: r.returnDateBST ? new Date(r.returnDateBST).toLocaleString("en-GB") : "",
        });
      });
    });
    addSheet(
      "Returns",
      [
        { header: "Invoice #", key: "invoiceNumber", width: 16 },
        { header: "Product", key: "productName", width: 26 },
        { header: "Returned Qty", key: "returnedQty", width: 14 },
        { header: "Return Amount", key: "returnAmount", width: 16 },
        { header: "Reason", key: "reason", width: 26 },
        { header: "Return Date", key: "returnDate", width: 20 },
      ],
      returnRows
    );

    // Accounts / Ledger
    const ledgerEntries = await Ledger.find(dateFilter).lean();
    addSheet(
      "Accounts",
      [
        { header: "Type", key: "type", width: 12 },
        { header: "Category", key: "category", width: 18 },
        { header: "Amount", key: "amount", width: 14 },
        { header: "Description", key: "description", width: 34 },
        { header: "Date", key: "date", width: 14 },
        { header: "Method", key: "method", width: 12 },
        { header: "Provider/Bank", key: "providerBank", width: 20 },
        { header: "Added By", key: "addedBy", width: 16 },
        { header: "Created At", key: "createdAt", width: 20 },
      ],
      ledgerEntries.map((l) => ({
        type: l.type, category: l.category, amount: l.amount, description: l.description,
        date: l.date, method: l.method, providerBank: l.provider || l.bankName || "",
        addedBy: l.addedBy, createdAt: l.createdAt ? new Date(l.createdAt).toLocaleString("en-GB") : "",
      }))
    );

    // Purchase History
    const purchases = await PurchaseHistory.find(dateFilter).lean();
    addSheet(
      "Purchase History",
      [
        { header: "Product", key: "productName", width: 26 },
        { header: "Supplier", key: "supplierName", width: 22 },
        { header: "Buying Price", key: "buyingPrice", width: 14 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Total Cost", key: "totalCost", width: 14 },
        { header: "Purchase Date", key: "purchaseDate", width: 18 },
      ],
      purchases.map((p) => ({
        productName: p.productName, supplierName: p.supplierName, buyingPrice: p.buyingPrice,
        quantity: p.quantity, totalCost: p.totalCost,
        purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString("en-GB") : "",
      }))
    );

    // Supplier Payments
    const supplierPayments = await SupplierPayment.find(dateFilter).populate("supplierId", "companyName name").lean();
    addSheet(
      "Supplier Payments",
      [
        { header: "Supplier", key: "supplierName", width: 22 },
        { header: "Type", key: "type", width: 12 },
        { header: "Amount", key: "amount", width: 14 },
        { header: "Method", key: "method", width: 12 },
        { header: "Provider", key: "provider", width: 14 },
        { header: "Date", key: "date", width: 14 },
        { header: "Note", key: "note", width: 26 },
      ],
      supplierPayments.map((p) => ({
        supplierName: p.supplierId?.companyName || p.supplierId?.name || "—",
        type: p.type, amount: p.amount, method: p.method, provider: p.provider || "", date: p.date, note: p.note,
      }))
    );

    // Partners
    const partners = await Partner.find(dateFilter).lean();
    addSheet(
      "Partners",
      [
        { header: "Company Name", key: "companyName", width: 24 },
        { header: "Contact Person", key: "contactPerson", width: 20 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Category", key: "category", width: 16 },
        { header: "Rating", key: "rating", width: 10 },
        { header: "Total Business Amount", key: "totalBusinessAmount", width: 18 },
        { header: "Status", key: "status", width: 12 },
      ],
      partners.map((p) => ({
        companyName: p.companyName, contactPerson: p.contactPerson, phone: p.phone,
        category: p.category, rating: p.rating, totalBusinessAmount: p.totalBusinessAmount, status: p.status,
      }))
    );

    const filename = `khm-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/backup/restore (multipart file upload)
router.post("/restore", upload.single("backupFile"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No backup file uploaded." });
    const mode = req.body.mode === "replace" ? "replace" : "merge";

    let parsed;
    try {
      parsed = JSON.parse(req.file.buffer.toString("utf-8"));
    } catch {
      return res.status(400).json({ message: "Invalid JSON backup file." });
    }

    const data = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
    if (!data || typeof data !== "object") {
      return res.status(400).json({ message: "Backup file has no restorable data." });
    }

    const results = {};
    for (const [key, Model] of Object.entries(COLLECTIONS)) {
      const docs = Array.isArray(data[key]) ? data[key] : [];
      try {
        if (mode === "replace") {
          await Model.deleteMany({});
        }
        if (docs.length > 0) {
          const ops = docs
            .filter((d) => d && d._id)
            .map((d) => ({
              replaceOne: {
                filter: { _id: new mongoose.Types.ObjectId(d._id) },
                replacement: d,
                upsert: true,
              },
            }));
          if (ops.length > 0) await Model.bulkWrite(ops, { ordered: false });
          results[key] = { restored: ops.length, skipped: docs.length - ops.length };
        } else {
          results[key] = { restored: 0, skipped: 0 };
        }
      } catch (err) {
        results[key] = { error: err.message };
      }
    }

    res.json({ message: "Restore completed.", mode, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;