// FILE: src/Print/history/historyReportTemplate.js (NEW)
const STYLE = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:#1e293b;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
.a4-page{width:210mm;min-height:297mm;background:#fff;position:relative;padding:16mm 16mm 18mm 16mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always}
.a4-page:last-child{page-break-after:auto}
@page{size:A4 portrait;margin:0}
.page-header{position:relative;margin-bottom:12px}
.header-top{display:flex;justify-content:space-between;align-items:flex-start}
.company-info h1{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.02em;text-transform:uppercase}
.company-info .address,.company-info .contact-line{font-size:11px;color:#475569;margin-top:3px}
.report-meta-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;font-size:11px;min-width:190px}
.meta-row{display:flex;justify-content:space-between;margin-bottom:3px}
.meta-row:last-child{margin-bottom:0}
.meta-label{color:#64748b;font-weight:500}
.meta-val{color:#0f172a;font-weight:700}
.doc-title-bar{margin-top:10px;border-bottom:2px solid #0f172a;padding-bottom:6px;display:flex;justify-content:space-between;align-items:flex-end}
.doc-title-bar h2{font-size:18px;font-weight:800;color:#0f172a;text-transform:uppercase}
.doc-title-bar p{font-size:11px;color:#64748b;font-weight:500}
.report-period-banner{background:#f1f5f9;border-left:4px solid #1e3a8a;border-radius:0 6px 6px 0;padding:8px 14px;margin:12px 0;display:flex;justify-content:space-between;font-size:11px}
.banner-item span.label{color:#64748b;font-weight:500}
.banner-item span.val{color:#0f172a;font-weight:700;margin-left:4px}
.section-label{font-size:12px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;margin-top:12px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.kpi-card{border-radius:6px;padding:12px;color:#fff}
.kpi-card.navy{background:#0f172a}.kpi-card.green{background:#10b981}.kpi-card.red{background:#ef4444}.kpi-card.emerald{background:#059669}
.kpi-title{font-size:10px;font-weight:700;text-transform:uppercase;opacity:.9}
.kpi-value{font-size:18px;font-weight:800;margin-top:6px}
.methods-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.method-column{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px}
.method-column h4{font-size:11px;font-weight:700;color:#0f172a;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px dashed #cbd5e1}
.method-item{display:flex;justify-content:space-between;font-size:11px;padding:4px 0}
.method-item .amt{font-weight:700;color:#0f172a}
.analytics-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:14px}
.analytics-box{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:10px}
.analytics-table{width:100%;border-collapse:collapse;font-size:10.5px;margin-top:6px}
.analytics-table th{text-align:left;padding:5px 6px;background:#f1f5f9;color:#475569;font-weight:700;border-bottom:1px solid #cbd5e1}
.analytics-table td{padding:5px 6px;border-bottom:1px solid #f1f5f9;color:#1e293b}
.progress-bar-bg{height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;width:100%}
.progress-fill-green{height:100%;background:#10b981}
.progress-fill-red{height:100%;background:#ef4444}
.cashflow-box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px}
.cashflow-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:11px}
.cashflow-row:last-child{border-bottom:none;padding-top:8px;font-weight:800;font-size:12px;color:#0f172a}
.tx-meta-bar{background:#f1f5f9;border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:#334155;margin-bottom:12px}
.tx-table{width:100%;border-collapse:collapse;font-size:10px}
.tx-table th{background:#0f172a;color:#fff;text-align:left;padding:6px 8px;font-weight:700;text-transform:uppercase}
.tx-table td{padding:6px 8px;border-bottom:1px solid #e2e8f0;color:#334155}
.tx-table tr:nth-child(even){background:#f8fafc}
.tx-table tr{page-break-inside:avoid}
.badge-type{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;text-transform:uppercase}
.badge-type.income{background:#d1fae5;color:#047857}
.badge-type.expense{background:#fee2e2;color:#b91c1c}
.amount-col{font-weight:700;text-align:right}
.amount-col.income{color:#059669}
.amount-col.expense{color:#dc2626}
.page-footer{border-top:1px solid #cbd5e1;padding-top:8px;display:flex;justify-content:space-between;font-size:9.5px;color:#64748b}
.footer-left span{font-weight:700;color:#0f172a}
`;

const fmt = (data, v) => {
  const sym = data.company.currency;
  const s = Math.abs(v).toLocaleString("en-IN");
  return v < 0 ? `-${sym}${s}` : `${sym}${s}`;
};

const ROWS_PAGE1 = 12;
const ROWS_OTHER = 20;

function chunkTransactions(list) {
  const chunks = [];
  let i = 0;
  chunks.push(list.slice(i, i + ROWS_PAGE1));
  i += ROWS_PAGE1;
  while (i < list.length) {
    chunks.push(list.slice(i, i + ROWS_OTHER));
    i += ROWS_OTHER;
  }
  return chunks.length ? chunks : [[]];
}

function txRows(data, list) {
  if (!list.length) return `<tr><td colspan="8" style="text-align:center;color:#94a3b8;">No transactions</td></tr>`;
  return list.map((t) => `<tr>
    <td>${t.sl}</td><td>${t.date}</td>
    <td><span class="badge-type ${t.type === "Income" ? "income" : "expense"}">${t.type}</span></td>
    <td>${t.category}</td><td>${t.method}</td><td>${t.desc}</td><td>${t.user}</td>
    <td class="amount-col ${t.amount < 0 ? "expense" : "income"}">${t.amount > 0 ? "+" : ""}${fmt(data, t.amount)}</td>
  </tr>`).join("");
}

function categoryRows(items, colorClass) {
  if (!items.length) return `<tr><td colspan="3" style="text-align:center;color:#94a3b8;">No data</td></tr>`;
  return items.map((it) => `<tr>
    <td>${it.category}</td><td>৳${it.amount.toLocaleString("en-IN")}</td>
    <td><div class="progress-bar-bg"><div class="${colorClass}" style="width:${it.percentage}%;"></div></div></td>
  </tr>`).join("");
}

function headerBlock(data, title, sub) {
  return `<div class="page-header"><div class="header-top">
    <div class="company-info"><h1>${data.company.name}</h1><div class="address">${sub}</div></div>
    <div class="report-meta-box">
      <div class="meta-row"><span class="meta-label">Report Period:</span><span class="meta-val">${data.company.periodLabel}</span></div>
      <div class="meta-row"><span class="meta-label">Generated Date:</span><span class="meta-val">${data.company.genDate}</span></div>
      <div class="meta-row"><span class="meta-label">Generated By:</span><span class="meta-val">${data.company.genBy}</span></div>
    </div></div>
    <div class="doc-title-bar"><h2>${title}</h2></div></div>`;
}

function footerBlock(data, pageNum, totalPages) {
  return `<div class="page-footer"><div class="footer-left"><span>${data.company.name}</span> • Money & Expense History</div>
  <div>Page ${pageNum} of ${totalPages}</div></div>`;
}

export function generateHistoryReportHTML(data) {
  const txChunks = chunkTransactions(data.transactions);
  const totalPages = 2 + txChunks.length;

  const page1 = `<div class="a4-page">
    <div>
      ${headerBlock(data, "Money & Expense History", "Account Overview — Financial History Report")}
      <div class="report-period-banner">
        <div class="banner-item"><span class="label">Reporting Period:</span><span class="val">${data.company.periodLabel}</span></div>
        <div class="banner-item"><span class="label">Status:</span><span class="val" style="color:#059669;">Official Verified</span></div>
      </div>
      <div class="section-label">Executive Financial Summary</div>
      <div class="kpi-grid">
        <div class="kpi-card navy"><div class="kpi-title">Net Cash Flow</div><div class="kpi-value">${fmt(data, data.summary.net)}</div></div>
        <div class="kpi-card green"><div class="kpi-title">Total Income</div><div class="kpi-value">${fmt(data, data.summary.income)}</div></div>
        <div class="kpi-card red"><div class="kpi-title">Total Expense</div><div class="kpi-value">${fmt(data, data.summary.expense)}</div></div>
        <div class="kpi-card emerald"><div class="kpi-title">Transactions</div><div class="kpi-value">${data.transactions.length}</div></div>
      </div>
      <div class="section-label">Payment Method Breakdown</div>
      <div class="methods-grid">
        <div class="method-column"><h4>Cash</h4><div class="method-item"><span>Net Total</span><span class="amt">${fmt(data, data.methodTotals.cash)}</span></div></div>
        <div class="method-column"><h4>Mobile Banking</h4><div class="method-item"><span>Net Total</span><span class="amt">${fmt(data, data.methodTotals.mobile)}</span></div></div>
        <div class="method-column"><h4>Bank Account</h4><div class="method-item"><span>Net Total</span><span class="amt">${fmt(data, data.methodTotals.bank)}</span></div></div>
      </div>
      <div class="section-label">Transaction History</div>
      <table class="tx-table"><thead><tr>
        <th style="width:5%;">SL</th><th style="width:12%;">Date</th><th style="width:10%;">Type</th>
        <th style="width:12%;">Category</th><th style="width:15%;">Method</th><th>Description</th>
        <th style="width:10%;">Added By</th><th style="width:13%;text-align:right;">Amount</th>
      </tr></thead><tbody>${txRows(data, txChunks[0])}</tbody></table>
    </div>
    ${footerBlock(data, 1, totalPages)}
  </div>`;

  const page2 = `<div class="a4-page">
    <div>
      ${headerBlock(data, "Financial Analytics", "Account Overview — Income, Expense & Category Analysis")}
      <div class="analytics-grid">
        <div class="analytics-box">
          <div style="font-size:11px;font-weight:700;color:#0f172a;">Top Income Sources</div>
          <table class="analytics-table"><thead><tr><th>Category</th><th>Amount</th><th style="width:35%;">Share</th></tr></thead>
          <tbody>${categoryRows(data.topIncome, "progress-fill-green")}</tbody></table>
        </div>
        <div class="analytics-box">
          <div style="font-size:11px;font-weight:700;color:#0f172a;">Top Expense Categories</div>
          <table class="analytics-table"><thead><tr><th>Category</th><th>Amount</th><th style="width:35%;">Share</th></tr></thead>
          <tbody>${categoryRows(data.topExpense, "progress-fill-red")}</tbody></table>
        </div>
      </div>
      <div class="section-label">Cash Flow Summary</div>
      <div class="cashflow-box">
        <div class="cashflow-row"><span>Total Income</span><span style="font-weight:700;color:#10b981;">+${fmt(data, data.summary.income)}</span></div>
        <div class="cashflow-row"><span>Total Expense</span><span style="font-weight:700;color:#ef4444;">-${fmt(data, data.summary.expense)}</span></div>
        <div class="cashflow-row"><span>Net Cash Flow</span><span>${data.summary.net >= 0 ? "+" : ""}${fmt(data, data.summary.net)}</span></div>
      </div>
    </div>
    ${footerBlock(data, 2, totalPages)}
  </div>`;

  const txPages = txChunks.slice(1).map((chunk, idx) => `<div class="a4-page">
    <div>
      ${headerBlock(data, "Transaction History", `Account Overview — Continued (Page ${idx + 2})`)}
      <div class="tx-meta-bar"><span>Account: <strong>${data.company.name}</strong></span><span>Report Period: <strong>${data.company.periodLabel}</strong></span></div>
      <table class="tx-table"><thead><tr>
        <th style="width:5%;">SL</th><th style="width:12%;">Date</th><th style="width:10%;">Type</th>
        <th style="width:12%;">Category</th><th style="width:15%;">Method</th><th>Description</th>
        <th style="width:10%;">Added By</th><th style="width:13%;text-align:right;">Amount</th>
      </tr></thead><tbody>${txRows(data, chunk)}</tbody></table>
    </div>
    ${footerBlock(data, idx + 3, totalPages)}
  </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${data.company.name} - Money & Expense History</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>${STYLE}</style></head><body>${page1}${page2}${txPages}</body></html>`;
}