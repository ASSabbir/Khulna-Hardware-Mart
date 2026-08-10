// FILE: src/Print/returnTemplate.js (FULL REPLACEMENT) — now built on the same base template
import { buildInvoiceReceiptHTML } from "./invoiceReceiptTemplate";

const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function buildReturnHTML(invoice) {
  const returnRows = (invoice.returnedItems || []).map((r, idx) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${r.name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;text-align:center;">${r.returnedQty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;text-align:right;color:#ef4444;">-${fmt(r.returnAmount)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${r.reason || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #fecaca;">${fmtDate(r.returnDateBST)}</td>
    </tr>`).join("");

  const refundRows = (invoice.lastReturnRefundPayments || []).map((p) => `${p.method === "mobile" ? p.provider : p.method}: ${fmt(p.amount)}`).join(" · ");

  const extraHTML = returnRows ? `
    <p style="margin-top:28px;font-size:14px;font-weight:bold;color:#ef4444;text-transform:uppercase;letter-spacing:0.05em;border-top:2px dashed #cbd5e1;padding-top:16px;">Return Section</p>
    <table><thead><tr><th>#</th><th>Product</th><th>Qty Returned</th><th>Return Amount</th><th>Reason</th><th>Return Date</th></tr></thead>
    <tbody>${returnRows}</tbody></table>
    <p style="text-align:right;margin-top:12px;">
      Total Returned: <span style="color:#ef4444;">-${fmt(invoice.totalReturnedAmount)}</span><br/>
      <strong style="font-size:16px;">Net Sale: ${fmt(invoice.netSaleAmount ?? invoice.grandTotal)}</strong>
    </p>
    ${refundRows ? `<p style="color:#64748b;font-size:13px;">Refund via: ${refundRows}</p>` : ""}
  ` : "";

  return buildInvoiceReceiptHTML(invoice, { extraHTML });
}