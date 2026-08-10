// FILE: src/Print/invoiceReceiptTemplate.js (NEW) — edit this file to change all "Print" popup designs
const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function buildInvoiceReceiptHTML(inv, opts = {}) {
  const { extraHTML = "" } = opts;
  const rows = (inv.items || []).map((it, idx) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.price)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.total)}</td>
    </tr>`).join("");
  const payments = (inv.payments || []).map((p) => `${p.method === "mobile" ? p.provider : p.method}: ${fmt(p.amount)}`).join(" · ");
  const collections = (inv.collectionHistory || []).map((c) =>
    `<div style="display:flex;justify-content:space-between;font-size:13px;"><span>${c.method}${c.provider ? ` (${c.provider})` : ""} — ${new Date(c.collectedAtBST).toLocaleString("en-GB")}</span><span style="font-weight:600;color:#16a34a;">${fmt(c.amount)}</span></div>`
  ).join("");

  return `<html><head><title>${inv.invoiceNumber}</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1E293B;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}</style>
    </head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Sales Memo — ${inv.invoiceNumber}</p>
    <p><strong>Date:</strong> ${fmtDate(inv.invoiceDate)}<br/>
    <strong>Customer:</strong> ${inv.customer?.name || "Unknown"} ${inv.customer?.phone ? "· " + inv.customer.phone : ""}</p>
    ${inv.preparedBy ? `<p style="color:#64748b;font-size:13px;">Prepared by: ${inv.preparedBy}</p>` : ""}
    <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="text-align:right;margin-top:12px;">
      Subtotal: ${fmt(inv.subtotal)}<br/>
      ${inv.discount > 0 ? `Discount: -${fmt(inv.discount)}<br/>` : ""}
      ${inv.vat > 0 ? `VAT: +${fmt(inv.vat)}<br/>` : ""}
      ${inv.transportCost > 0 ? `Transport: +${fmt(inv.transportCost)}<br/>` : ""}
      <strong style="font-size:18px;color:#F97316;">Grand Total: ${fmt(inv.grandTotal)}</strong><br/>
      Paid: ${fmt(inv.paidAmount)}<br/>
      ${inv.dueAmount > 0 ? `<strong style="font-size:18px;color:#ef4444;">Due: ${fmt(inv.dueAmount)}</strong>` : `<strong style="font-size:16px;color:#16a34a;">Fully Paid</strong>`}
    </p>
    <p style="color:#64748b;font-size:13px;">Payment: ${payments}</p>
    ${collections ? `<div style="margin-top:12px;padding-top:8px;border-top:1px dashed #cbd5e1;"><p style="font-weight:700;font-size:12px;text-transform:uppercase;color:#64748b;">Due Collection History</p>${collections}</div>` : ""}
    ${extraHTML}
    </body></html>`;
}