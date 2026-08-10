// FILE: src/Print/supplierHistoryTemplate.js (NEW)
const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function buildSupplierHistoryHTML({ companyName, purchases = [], payments = [], balance }) {
  const purchaseRows = purchases.map((p, i) => `
    <tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${p.productName}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${p.quantity}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(p.buyingPrice)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(p.totalCost)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${fmtDate(p.purchaseDate)}</td></tr>`).join("");
  const paymentRows = payments.map((p, i) => `
    <tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${i + 1}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${p.method === "mobile" ? p.provider : p.method}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(p.amount)}</td>
    <td style="padding:6px 8px;border-bottom:1px solid #eee;">${fmtDate(p.date)}</td></tr>`).join("");

  return `<html><head><title>${companyName} — Purchase &amp; Payment History</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
    </head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Supplier History — ${companyName}</p>
    <p style="text-align:right;">
      ${balance?.payableAmount > 0 ? `<strong style="color:#ef4444;">Due to Supplier: ${fmt(balance.payableAmount)}</strong>` : ""}
      ${balance?.receivableAmount > 0 ? `<strong style="color:#16a34a;">Receivable: ${fmt(balance.receivableAmount)}</strong>` : ""}
    </p>
    <p style="font-weight:700;font-size:13px;text-transform:uppercase;color:#64748b;margin-top:20px;">Purchase History</p>
    <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th>Date</th></tr></thead>
    <tbody>${purchaseRows || `<tr><td colspan="6" style="padding:8px;color:#94a3b8;">No purchases recorded.</td></tr>`}</tbody></table>
    <p style="font-weight:700;font-size:13px;text-transform:uppercase;color:#64748b;margin-top:20px;">Payment History</p>
    <table><thead><tr><th>#</th><th>Method</th><th>Amount</th><th>Date</th></tr></thead>
    <tbody>${paymentRows || `<tr><td colspan="4" style="padding:8px;color:#94a3b8;">No payments recorded.</td></tr>`}</tbody></table>
    </body></html>`;
}