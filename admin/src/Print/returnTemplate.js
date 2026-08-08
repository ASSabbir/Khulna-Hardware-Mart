// FILE: src/Print/returnTemplate.js (NEW)
const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function buildReturnHTML(invoice) {
  const itemRows = (invoice.items || []).map((it, idx) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.name}${it.returnedQty ? ` <span style="color:#ef4444;font-size:11px;">(Returned: ${it.returnedQty})</span>` : ""}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.price)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(it.total)}</td>
    </tr>`).join("");
  const payments = (invoice.payments || []).map((p) => `${p.method === "mobile" ? p.provider : p.method}: ${fmt(p.amount)}`).join(" · ");
  const returnRows = (invoice.returnedItems || []).map((r, idx) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${r.name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;text-align:center;">${r.returnedQty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;text-align:right;color:#ef4444;">-${fmt(r.returnAmount)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${r.reason || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${fmtDate(r.returnDateBST)}</td>
    </tr>`).join("");

  return `<html><head><title>${invoice.invoiceNumber}</title>
    <style>
      body{font-family:sans-serif;padding:24px;color:#1E293B;}
      table{width:100%;border-collapse:collapse;margin-top:12px;}
      th{text-align:left;padding:6px 8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}
      .section-title{margin-top:28px;font-size:14px;font-weight:bold;color:#ef4444;text-transform:uppercase;letter-spacing:0.05em;border-top:2px dashed #cbd5e1;padding-top:16px;}
    </style></head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Sales Memo — ${invoice.invoiceNumber}</p>
    <p><strong>Date:</strong> ${fmtDate(invoice.invoiceDate)}<br/>
    <strong>Customer:</strong> ${invoice.customer?.name || "Unknown"} ${invoice.customer?.phone ? "· " + invoice.customer.phone : ""}</p>
    <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${itemRows}</tbody></table>
    <p style="text-align:right;margin-top:12px;">Subtotal: ${fmt(invoice.subtotal)}<br/>
    ${invoice.discount > 0 ? `Discount: -${fmt(invoice.discount)}<br/>` : ""}
    ${invoice.vat > 0 ? `VAT: +${fmt(invoice.vat)}<br/>` : ""}
    <strong style="font-size:18px;color:#F97316;">Grand Total: ${fmt(invoice.grandTotal)}</strong></p>
    <p style="color:#64748b;font-size:13px;">Payment: ${payments}</p>
    ${returnRows ? `
      <p class="section-title">Return Section</p>
      <table><thead><tr><th>#</th><th>Product</th><th>Qty Returned</th><th>Return Amount</th><th>Reason</th><th>Return Date</th></tr></thead>
      <tbody>${returnRows}</tbody></table>
      <p style="text-align:right;margin-top:12px;">
        Total Returned: <span style="color:#ef4444;">-${fmt(invoice.totalReturnedAmount)}</span><br/>
        <strong style="font-size:16px;">Net Sale: ${fmt(invoice.netSaleAmount ?? invoice.grandTotal)}</strong>
      </p>` : ""}
    </body></html>`;
}