// FILE: src/Print/invoiceReceiptTemplate.js (FULL REPLACEMENT) — single unified design, used by every print button site-wide.
// Return section and Due Collection History section only render when the invoice actually has that data —
// so a brand-new "just completed sale" invoice prints clean, while a returned/partially-collected invoice
// automatically grows the extra sections without any separate template.

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d || "—"; } };
const fmtDateTime = (d) => { try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; } };

const methodLabel = (p) => {
  if (!p) return "—";
  if (p.method === "mobile") return `Mobile Banking (${p.provider || "—"})`;
  if (p.method === "bank") return `Bank Transfer${p.bankName ? ` (${p.bankName})` : ""}`;
  return "Cash";
};

export function buildInvoiceReceiptHTML(inv = {}) {
  const items = inv.items || [];
  const returnedItems = inv.returnedItems || [];
  const collectionHistory = inv.collectionHistory || [];
  const payments = inv.payments || [];
  const hasReturns = returnedItems.length > 0;
  const hasCollections = collectionHistory.length > 0;

  const itemRows = items.map((it, idx) => `
    <tr>
      <td class="tc">${idx + 1}</td>
      <td><strong>${it.name || "—"}</strong>${it.returnedQty ? ` <span style="color:#EF4444;font-size:9px;">(Returned: ${it.returnedQty})</span>` : ""}</td>
      <td>${it.company || "—"}</td>
      <td class="tc">${it.unit || "pcs"}</td>
      <td class="tc">${it.qty}</td>
      <td class="tr">${fmt(it.price)}</td>
      <td class="tr bold">${fmt(it.total)}</td>
    </tr>`).join("");

  const paymentBreakdownRows = payments.map((p) => `
    <tr><td>${methodLabel(p)}</td><td class="tr">${fmt(p.amount)}</td></tr>`).join("");

  const returnRows = returnedItems.map((r, idx) => `
    <tr>
      <td class="tc">${String(idx + 1).padStart(2, "0")}</td>
      <td>${r.name}</td>
      <td class="tc">${r.returnedQty}</td>
      <td class="tr">${fmt(r.returnAmount)}</td>
      <td>${r.reason || "—"}</td>
      <td>${fmtDate(r.returnDateBST)}</td>
    </tr>`).join("");

  const totalCollected = collectionHistory.reduce((s, c) => s + (c.amount || 0), 0);

  // Chronological, running-due timeline: every due-collection and every return event, in the
  // order they actually happened — "5 bar due collect korle 5 bar-i dekhabe" — each with the
  // exact due balance immediately after that specific operation (dueAfter, stored at write time).
  const timelineEvents = [
    ...collectionHistory.map((c) => ({ kind: "collect", at: c.collectedAtBST, amount: c.amount, label: `Due Collected — ${methodLabel(c)}`, dueAfter: c.dueAfter })),
    ...returnedItems.map((r) => ({ kind: "return", at: r.returnDateBST, amount: r.returnAmount, label: `Product Returned — ${r.name} × ${r.returnedQty}`, dueAfter: r.dueAfter })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  const timelineRows = timelineEvents.map((e, idx) => `
    <tr>
      <td class="tc">${idx + 1}</td>
      <td>${fmtDateTime(e.at)}</td>
      <td>${e.label}</td>
      <td class="tr" style="color:${e.kind === "collect" ? "#16A34A" : "#C2410C"};">${e.kind === "collect" ? "+" : "-"}${fmt(e.amount)}</td>
      <td class="tr">${e.dueAfter != null ? fmt(e.dueAfter) : "—"}</td>
    </tr>`).join("");

  const paymentStatus = inv.paymentStatus === "paid" ? "Complete" : "Due";
  const paymentStatusColor = inv.paymentStatus === "paid" ? "#16A34A" : "#EF4444";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sales Invoice - ${inv.invoiceNumber || ""}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 12mm 16mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; margin: 0; padding: 0; background: #FFFFFF; color: #1E293B; font-size: 10.5px; }
    .tc { text-align: center; } .tr { text-align: right; } .bold { font-weight: bold; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }

    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .brand-logo-container { display: flex; align-items: center; gap: 10px; }
    .logo-box { width: 42px; height: 42px; background: #1E3A8A; color: #F97316; font-size: 24px; font-weight: 900; display: flex; align-items: center; justify-content: center; border-radius: 4px; box-shadow: inset 0 0 0 2px #F97316; }
    .company-title { font-size: 18px; font-weight: 900; color: #1E3A8A; letter-spacing: -0.5px; }
    .company-sub { font-size: 9px; font-weight: 700; color: #475569; }
    .company-info { font-size: 9px; color: #64748B; line-height: 1.3; }

    .invoice-badge-box { background: #1E3A8A; color: #FFF; padding: 6px 14px; font-size: 13px; font-weight: 800; border-radius: 20px 0 0 20px; text-transform: uppercase; text-align: center; margin-bottom: 6px; }
    .meta-table { font-size: 9.5px; width: 100%; }
    .meta-table td { padding: 1px 4px; }
    .meta-lbl { color: #64748B; font-weight: 600; text-align: right; }
    .meta-val { color: #0F172A; font-weight: 700; text-align: right; }

    .section-header { background: #FFF; border-bottom: 2px solid #F97316; font-size: 11px; font-weight: 800; color: #1E3A8A; padding-bottom: 2px; margin-bottom: 6px; margin-top: 16px; }
    .customer-card-grid { display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .cust-info-box { border: 1px solid #E2E8F0; padding: 6px 8px; border-radius: 4px; background: #F8FAFC; font-size: 9.5px; }
    .cust-info-box div { margin-bottom: 2px; }
    .status-card { border: 1px solid #E2E8F0; border-radius: 8px; background: #F8FAFC; text-align: center; padding: 6px 2px; }
    .status-card .title { font-size: 8px; color: #64748B; font-weight: 700; text-transform: uppercase; }
    .status-card .val { font-size: 9.5px; font-weight: 800; color: #1E3A8A; margin-top: 2px; }

    .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .invoice-table th { background: #1E3A8A; color: #FFF; padding: 5px; font-size: 9px; text-transform: uppercase; border: 1px solid #1E3A8A; }
    .invoice-table th.orange { background: #C2410C; border-color: #C2410C; }
    .invoice-table td { padding: 4.5px 5px; border: 1px solid #CBD5E1; font-size: 9.5px; }
    .invoice-table tbody tr:nth-child(even) { background-color: #F8FAFC; }

    .summary-table { width: 100%; border-collapse: collapse; }
    .summary-table td { padding: 3px 6px; border: 1px solid #CBD5E1; font-size: 9px; }
    .grand-total-row { background: #1E3A8A; color: #FFF; font-weight: 800; font-size: 10px; }

    .statement-box { border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 4px; padding: 6px; margin-top: 10px; margin-bottom: 8px; }
    .stat-cards-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 4px; }
    .stat-card { background: #FFF; border: 1px solid #E2E8F0; padding: 4px; text-align: center; border-radius: 3px; }
    .stat-card .lbl { font-size: 7.5px; color: #64748B; font-weight: 700; text-transform: uppercase; }
    .stat-card .val { font-size: 9.5px; font-weight: 800; color: #0F172A; }

    .signature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 30px; text-align: center; }
    .sig-line { border-top: 1px solid #64748B; margin-bottom: 3px; }
    .sig-title { font-size: 8.5px; font-weight: 700; color: #334155; }

    .footer-container { border-top: 1px solid #CBD5E1; padding-top: 6px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #64748B; }
  </style>
</head>
<body>

  <table class="header-table">
    <tr>
      <td style="width: 60%;">
        <div class="brand-logo-container">
          <div class="logo-box">KH</div>
          <div>
            <div class="company-title">KHULNA HARDWARE MART</div>
            <div class="company-sub">Hardware and Construction Materials Company</div>
          </div>
        </div>
        <div class="company-info" style="margin-top: 4px;">
          280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna<br/>
          Phone: 02477-721990, +880 1931-272839, +880 1679-123205
        </div>
      </td>
      <td style="width: 40%; vertical-align: top;">
        <div class="invoice-badge-box">SALES INVOICE</div>
        <table class="meta-table">
          <tr><td class="meta-lbl">Invoice Number :</td><td class="meta-val">${inv.invoiceNumber || "—"}</td></tr>
          <tr><td class="meta-lbl">Invoice Date :</td><td class="meta-val">${fmtDate(inv.invoiceDate)}</td></tr>
          ${inv.preparedBy ? `<tr><td class="meta-lbl">Prepared By :</td><td class="meta-val">${inv.preparedBy}</td></tr>` : ""}
        </table>
      </td>
    </tr>
  </table>

  <div class="section-header" style="margin-top:0;">Customer Section</div>
  <div class="customer-card-grid">
    <div class="cust-info-box">
      <div><strong>Customer Name :</strong> ${inv.customer?.name || "—"}</div>
      <div><strong>Phone Number :</strong> ${inv.customer?.phone || "—"}</div>
      <div><strong>Address :</strong> ${inv.customer?.address || "—"}</div>
    </div>
    <div class="status-card">
      <div class="title">Payment Status</div>
      <div class="val" style="color:${paymentStatusColor};">${paymentStatus}</div>
    </div>
    <div class="status-card">
      <div class="title">Priced As</div>
      <div class="val">${inv.priceType === "holcell" ? "Wholesale" : "Retail"}</div>
    </div>
    <div class="status-card">
      <div class="title">Prepared By</div>
      <div class="val">${inv.preparedBy || "—"}</div>
    </div>
  </div>

  <table class="invoice-table">
    <thead>
      <tr>
        <th style="width:4%;">SL</th>
        <th style="width:28%;">Product Name</th>
        <th style="width:16%;">Brand</th>
        <th style="width:8%;">Unit</th>
        <th style="width:8%;">Qty</th>
        <th style="width:14%;">Unit Price</th>
        <th style="width:16%;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="flex-between" style="align-items: flex-start;">
    <div style="width: 55%;">
      ${paymentBreakdownRows ? `
      <p style="font-size:9px;font-weight:800;text-transform:uppercase;color:#64748B;margin:6px 0 4px;">Payment Breakdown</p>
      <table class="summary-table"><tbody>${paymentBreakdownRows}</tbody></table>
      ` : ""}
    </div>
    <div style="width: 42%;">
      <table class="summary-table">
        <tr><td>Subtotal</td><td class="tr bold">${fmt(inv.subtotal)}</td></tr>
        ${inv.discount > 0 ? `<tr><td>Discount</td><td class="tr" style="color:#16A34A;">-${fmt(inv.discount)}</td></tr>` : ""}
        ${inv.vat > 0 ? `<tr><td>VAT</td><td class="tr">${fmt(inv.vat)}</td></tr>` : ""}
        ${inv.transportCost > 0 ? `<tr><td>Transport Cost</td><td class="tr">${fmt(inv.transportCost)}</td></tr>` : ""}
        <tr class="grand-total-row"><td>Grand Total</td><td class="tr">${fmt(inv.grandTotal)}</td></tr>
        <tr><td>Paid</td><td class="tr" style="color:#16A34A;font-weight:700;">${fmt(inv.paidAmount)}</td></tr>
        ${inv.dueAmount > 0 ? `<tr style="background:#FEF2F2;font-weight:bold;color:#B91C1C;"><td>Due Amount</td><td class="tr">${fmt(inv.dueAmount)}</td></tr>` : ""}
      </table>
    </div>
  </div>

  ${(hasReturns || hasCollections) ? `
  <div class="section-header">Transaction Timeline (Grand Total &rarr; every collection &amp; return, in order)</div>
  <table class="invoice-table" style="margin-bottom:6px;">
    <thead>
      <tr><th style="width:5%;">SL</th><th style="width:20%;">Date</th><th style="width:40%;">Event</th><th style="width:17%;">Amount</th><th style="width:18%;">Due Balance After</th></tr>
    </thead>
    <tbody>
      <tr style="background:#EFF3FF;"><td class="tc">-</td><td>${fmtDate(inv.invoiceDate)}</td><td><strong>Invoice Generated</strong></td><td class="tr bold">${fmt(inv.grandTotal)}</td><td class="tr">${fmt(inv.grandTotal - (inv.paidAmount || 0) + (collectionHistory.reduce((s, c) => s + c.amount, 0)))}</td></tr>
      ${timelineRows}
    </tbody>
  </table>
  <div class="flex-between" style="font-size:9px;font-weight:bold;margin-bottom:8px;">
    <div>Total Returned: <span style="color:#C2410C;">${fmt(inv.totalReturnedAmount || 0)}</span> &nbsp;|&nbsp; Total Collected: <span style="color:#16A34A;">${fmt(totalCollected)}</span></div>
    <div style="background:${inv.dueAmount > 0 ? "#EF4444" : "#16A34A"};color:#FFF;padding:2px 8px;border-radius:3px;">
      ${inv.dueAmount > 0 ? `Remaining Due: ${fmt(inv.dueAmount)}` : "Fully Settled"}
    </div>
  </div>
  ` : ""}

  ${(hasReturns || hasCollections) ? `
  <div class="statement-box">
    <div class="bold tc" style="font-size:9px;color:#1E3A8A;">ACCOUNT STATEMENT</div>
    <div class="stat-cards-grid">
      <div class="stat-card"><div class="lbl">Invoice Total</div><div class="val">${fmt(inv.grandTotal)}</div></div>
      <div class="stat-card"><div class="lbl">Paid Amount</div><div class="val" style="color:#16A34A;">${fmt(inv.paidAmount)}</div></div>
      <div class="stat-card"><div class="lbl">Returned</div><div class="val" style="color:#C2410C;">${fmt(inv.totalReturnedAmount || 0)}</div></div>
      <div class="stat-card"><div class="lbl">Net Amount</div><div class="val">${fmt(inv.netSaleAmount ?? inv.grandTotal)}</div></div>
      <div class="stat-card"><div class="lbl">Outstanding Due</div><div class="val" style="color:#DC2626;">${fmt(inv.dueAmount || 0)}</div></div>
    </div>
  </div>
  ` : ""}

  <div class="signature-grid">
    <div><div class="sig-line"></div><div class="sig-title">Prepared By</div></div>
    <div><div class="sig-line"></div><div class="sig-title">Accounts Manager</div></div>
    <div><div class="sig-line"></div><div class="sig-title">Authorized Signature</div></div>
    <div><div class="sig-line"></div><div class="sig-title">Customer Signature</div></div>
  </div>

  <div class="footer-container">
    <div>Thank you for shopping at Khulna Hardware Mart · Centenary Est. 1924</div>
    <div class="bold">Generated on ${fmtDate(new Date())}</div>
  </div>

</body>
</html>`;
}