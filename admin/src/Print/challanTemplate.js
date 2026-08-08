// FILE: src/Print/challanTemplate.js (NEW)
export function buildChallanHTML({ invoiceNum, customer, items }) {
  const rows = items.map((it, idx) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${idx + 1}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${it.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${it.qty} ${it.unit || "pcs"}</td>
    </tr>`).join("");
  return `<html><head><title>Challan - ${invoiceNum}</title>
    <style>
      body{font-family:sans-serif;padding:28px;color:#1E293B;}
      table{width:100%;border-collapse:collapse;margin-top:16px;}
      th{text-align:left;padding:8px;border-bottom:2px solid #1E3A8A;font-size:12px;text-transform:uppercase;color:#64748b;}
      .cust{font-weight:bold;font-size:16px;margin-top:4px;}
    </style></head><body>
    <h2 style="color:#1E3A8A;margin-bottom:0;">Khulna Hardware Mart</h2>
    <p style="color:#94a3b8;margin-top:4px;">Delivery Challan — ${invoiceNum}</p>
    <p style="margin-top:16px;">
      <span class="cust">Customer: ${customer.name || "—"}</span><br/>
      <span class="cust">Phone: ${customer.phone || "—"}</span><br/>
      <span class="cust">Address: ${customer.address || "—"}</span>
    </p>
    <table><thead><tr><th>#</th><th>Product</th><th>Quantity</th></tr></thead>
    <tbody>${rows}</tbody></table>
    </body></html>`;
}