// FILE: src/Print/challanTemplate.js (FULL REPLACEMENT) — real data wired into the provided design.
export function buildChallanHTML({ invoiceNum, customer = {}, items = [], deliveryInfo = {} }) {
  const challanNum = `DC-${String(invoiceNum || "").replace(/[^0-9]/g, "").slice(-8) || Date.now().toString().slice(-8)}`;
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const mainTableRows = items.map((it, idx) => `
    <tr>
      <td class="tc" style="font-weight:600; color:#475569;">${String(idx + 1).padStart(2, "0")}</td>
      <td>
        <div style="font-weight:700; color:#0F172A;">${it.name || "—"}</div>
        ${it.company ? `<div style="font-size:10px; color:#64748B;">${it.company}</div>` : ""}
      </td>
      <td class="tc">${it.unit || "pcs"}</td>
      <td class="tc" style="font-weight:700; color:#1E3A8A;">${it.qty ?? "—"}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Delivery Challan - ${challanNum}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #1E293B; background: #FFFFFF; font-size: 11px; line-height: 1.4; }
    .tc { text-align: center; } .tr { text-align: right; } .bold { font-weight: bold; }
    .top-accent-bar { height: 5px; background: linear-gradient(90deg, #1E3A8A 70%, #F97316 30%); margin-bottom: 15px; }
    .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 14px; margin-bottom: 16px; }
    .brand-logo-area { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 44px; height: 44px; background: #1E3A8A; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #F97316; font-size: 26px; font-weight: 900; box-shadow: inset 0 0 0 2px #F97316; }
    .company-title { font-size: 20px; font-weight: 900; color: #1E3A8A; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.1; }
    .company-subtitle { font-size: 10px; font-weight: 700; color: #F97316; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
    .company-details { font-size: 10px; color: #64748B; line-height: 1.35; }
    .doc-badge-container { text-align: right; }
    .doc-badge { display: inline-block; background: #1E3A8A; color: #FFFFFF; font-size: 14px; font-weight: 800; padding: 6px 16px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; border-right: 4px solid #F97316; }
    .meta-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .meta-table td { padding: 3px 6px; font-size: 11px; }
    .meta-label { color: #64748B; font-weight: 600; text-align: right; }
    .meta-val { color: #0F172A; font-weight: 700; text-align: right; }
    .section-title-bar { background: #1E3A8A; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 6px 10px; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between; }
    .info-card { border: 1px solid #CBD5E1; border-top: none; background: #F8FAFC; padding: 12px; border-radius: 0 0 4px 4px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-block { line-height: 1.6; }
    .info-line { display: flex; margin-bottom: 3px; }
    .info-lbl { width: 110px; color: #475569; font-weight: 600; }
    .info-val { color: #0F172A; font-weight: 700; flex: 1; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .data-table th { background: #1E3A8A; color: #FFFFFF; padding: 8px 10px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #1E3A8A; }
    .data-table th.orange-header { background: #F97316; border-color: #F97316; }
    .data-table td { padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 11px; }
    .data-table tbody tr:nth-child(even) { background-color: #F8FAFC; }
    .bottom-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-bottom: 40px; }
    .confirmation-box { border: 1px solid #CBD5E1; border-radius: 4px; padding: 12px; background: #FAFAFA; }
    .signature-row { display: flex; justify-content: space-around; margin-top: 50px; padding: 0 20px; }
    .sig-col { text-align: center; width: 25%; }
    .sig-line { border-top: 1.5px dashed #64748B; margin-bottom: 6px; }
    .sig-title { font-size: 10px; font-weight: 700; color: #334155; text-transform: uppercase; }
    .footer-bar { border-top: 2px solid #E2E8F0; padding-top: 10px; margin-top: 30px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #64748B; }
  </style>
</head>
<body>

  <div class="top-accent-bar"></div>

  <div class="header-container">
    <div class="brand-logo-area">
      <div class="brand-icon">K</div>
      <div>
        <div class="company-title">Khulna Hardware Mart</div>
        <div class="company-subtitle">Corporate Hardware &amp; Construction Materials Supplier</div>
        <div class="company-details">
          280-Khanjahan Ali Road (Rahmania Madrasha Complex), Khulna, Bangladesh<br/>
          Phone: 02477-721990, +880 1931-272839, +880 1679-123205
        </div>
      </div>
    </div>

    <div class="doc-badge-container">
      <div class="doc-badge">Delivery Challan</div>
      <table class="meta-table">
        <tr><td class="meta-label">Challan No:</td><td class="meta-val">${challanNum}</td></tr>
        <tr><td class="meta-label">Invoice Ref:</td><td class="meta-val">${invoiceNum || "—"}</td></tr>
        <tr><td class="meta-label">Date:</td><td class="meta-val">${date}</td></tr>
      </table>
    </div>
  </div>

  <div class="section-title-bar">
    <span>Customer &amp; Dispatch Details</span>
    <span style="font-weight: normal; font-size: 9px; opacity: 0.9;">ERP Ref: ${challanNum}</span>
  </div>
  <div class="info-card">
    <div class="info-block">
      <div class="info-line"><span class="info-lbl">Customer Name:</span><span class="info-val">${customer.name || "—"}</span></div>
      <div class="info-line"><span class="info-lbl">Contact Phone:</span><span class="info-val">${customer.phone || "—"}</span></div>
      <div class="info-line"><span class="info-lbl">Billing Address:</span><span class="info-val">${customer.address || "—"}</span></div>
    </div>
    <div class="info-block" style="border-left: 1px dashed #CBD5E1; padding-left: 16px;">
      <div class="info-line"><span class="info-lbl" style="color:#F97316;">Delivery Location:</span><span class="info-val" style="color:#1E3A8A;">${deliveryInfo.location || customer.address || "—"}</span></div>
      <div class="info-line"><span class="info-lbl">Receiver Phone:</span><span class="info-val">${deliveryInfo.contactPhone || customer.phone || "—"}</span></div>
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 6%;">SL</th>
        <th style="width: 54%; text-align: left;">Product Name &amp; Description</th>
        <th style="width: 20%;" class="orange-header">Unit</th>
        <th style="width: 20%;" class="orange-header">Quantity Delivered</th>
      </tr>
    </thead>
    <tbody>${mainTableRows}</tbody>
  </table>

  <div class="bottom-grid">
    <div class="confirmation-box">
      <div style="font-weight: 800; color: #1E3A8A; text-transform: uppercase; margin-bottom: 8px; font-size: 10.5px;">Receiving Confirmation</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 10.5px;">
        <div>Received By: ___________________</div>
        <div>Designation: ___________________</div>
        <div>Phone No: ______________________</div>
        <div>Receiving Date: ____ / ____ / ${new Date().getFullYear()}</div>
      </div>
    </div>
    <div style="border: 1px dashed #94A3B8; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 10.5px; font-weight: bold; background: #FAFAFA;">
      Company Seal Area
    </div>
  </div>

  <div class="signature-row">
    <div class="sig-col"><div class="sig-line"></div><div class="sig-title">Prepared By</div></div>
    <div class="sig-col"><div class="sig-line"></div><div class="sig-title">Store Manager</div></div>
    <div class="sig-col"><div class="sig-line"></div><div class="sig-title">Receiver Signature</div></div>
  </div>

  <div class="footer-bar">
    <div><span style="font-weight: 700; color: #1E3A8A;">Thank you for your business!</span> — Khulna Hardware Mart</div>
    <div style="font-weight: 700;">Page 1 of 1</div>
  </div>

</body>
</html>`;
}