// FILE: src/Print/reportTemplate.js (NEW)
const STYLE = `
@page{size:A4 portrait;margin:12mm 10mm 12mm 10mm}
*,*::before,*::after{box-sizing:border-box}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2c3e50;margin:0;padding:0;font-size:10pt;background-color:#f1f5f9}
@media print{body{background-color:#fff}.page{box-shadow:none!important;margin:0!important}}
.page{width:210mm;min-height:297mm;padding:12mm 10mm;margin:10px auto;background-color:#fff;box-shadow:0 4px 10px rgba(0,0,0,.1);position:relative;box-sizing:border-box}
.page-break{page-break-before:always}
.header-table{width:100%;border-collapse:collapse;margin-bottom:15px}
.header-left{vertical-align:top}
.company-title{font-size:20pt;font-weight:800;color:#0b2545;letter-spacing:.5px;margin:0 0 4px 0;text-transform:uppercase}
.company-address,.company-contact{font-size:8.5pt;color:#555;margin-bottom:2px}
.header-right{vertical-align:top;text-align:right;width:210px}
.meta-box{background-color:#f0f4f8;border-left:4px solid #0b2545;padding:8px 10px;border-radius:4px;text-align:left;font-size:8pt}
.meta-box table{width:100%;border-collapse:collapse}
.meta-box td{padding:2px 0}
.meta-label{font-weight:bold;color:#475569}
.meta-val{text-align:right;font-weight:600;color:#0f172a}
.doc-title-bar{background:linear-gradient(90deg,#0b2545 0%,#1e3a8a 70%,#d97706 100%);color:#fff;padding:8px 12px;border-radius:4px;margin-bottom:15px}
.doc-title-bar h1{margin:0;font-size:14pt;text-transform:uppercase;letter-spacing:1px}
.doc-title-bar p{margin:2px 0 0 0;font-size:8.5pt;opacity:.9}
.section-title{font-size:10.5pt;font-weight:700;color:#0b2545;text-transform:uppercase;border-bottom:2px solid #cbd5e1;padding-bottom:4px;margin-top:12px;margin-bottom:10px;letter-spacing:.5px}
.period-box{background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;margin-bottom:15px}
.period-table{width:100%;border-collapse:collapse;font-size:8.5pt}
.period-table td{padding:3px 6px}
.cards-table{width:100%;border-collapse:separate;border-spacing:8px 0;margin-left:-8px;margin-right:-8px;margin-bottom:15px}
.card{border-radius:6px;padding:10px 8px;text-align:center;color:#fff}
.card-navy{background-color:#0f172a}.card-green{background-color:#16a34a}.card-red{background-color:#dc2626}.card-emerald{background-color:#059669}
.card-label{font-size:7.5pt;text-transform:uppercase;font-weight:700;letter-spacing:.5px;opacity:.9;margin-bottom:4px}
.card-value{font-size:13pt;font-weight:800}
.breakdown-table{width:100%;border-collapse:separate;border-spacing:8px 0;margin-left:-8px;margin-right:-8px;margin-bottom:15px}
.breakdown-card{background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;font-size:8.5pt}
.breakdown-card-title{font-weight:700;color:#1e293b;border-bottom:1px solid #cbd5e1;padding-bottom:4px;margin-bottom:6px;font-size:9pt}
.sub-row{width:100%;border-collapse:collapse}
.sub-row td{padding:2px 0;font-size:8pt}
.text-green{color:#16a34a;font-weight:700}.text-red{color:#dc2626;font-weight:700}.text-bold{font-weight:700}
.grid-2col{width:100%;border-collapse:collapse;margin-bottom:15px}
.grid-2col>tbody>tr>td{width:50%;vertical-align:top}
.grid-2col>tbody>tr>td:first-child{padding-right:6px}.grid-2col>tbody>tr>td:last-child{padding-left:6px}
.account-item-table{width:100%;border-collapse:separate;border-spacing:6px}
.account-item{background-color:#f1f5f9;border:1px solid #cbd5e1;border-radius:5px;padding:6px 8px}
.account-item-name{font-size:7.5pt;font-weight:700;color:#334155}
.account-item-val{font-size:9.5pt;font-weight:800;color:#0f172a}
.data-table{width:100%;border-collapse:collapse;font-size:8pt;margin-bottom:15px}
.data-table th{background-color:#0b2545;color:#fff;font-weight:700;text-transform:uppercase;padding:6px 6px;font-size:7.5pt;text-align:left;border:1px solid #0b2545}
.data-table td{padding:5px 6px;border:1px solid #e2e8f0;vertical-align:middle}
.data-table tr{page-break-inside:avoid}
.data-table tr:nth-child(even){background-color:#f8fafc}
.progress-bg{background-color:#e2e8f0;border-radius:3px;height:8px;width:100%;overflow:hidden}
.progress-fill{height:100%;border-radius:3px}
.badge-income{background-color:#dcfce7;color:#15803d;padding:2px 6px;border-radius:4px;font-weight:700;font-size:7pt}
.badge-expense{background-color:#fee2e2;color:#b91c1c;padding:2px 6px;border-radius:4px;font-weight:700;font-size:7pt}
.page-footer{position:absolute;bottom:10mm;left:10mm;right:10mm;border-top:1px solid #cbd5e1;padding-top:6px;font-size:7.5pt;color:#64748b}
.footer-table{width:100%;border-collapse:collapse}
`;

export function generateReportHTML(data) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${data.company.name} - Financial Report</title>
<style>${STYLE}</style></head><body>

<div class="page">
  <table class="header-table"><tr>
    <td class="header-left">
      <div class="company-title">${data.company.name}</div>
      <div class="company-address">${data.company.address}</div>
      <div class="company-contact">${data.company.phone}</div>
    </td>
    <td class="header-right"><div class="meta-box"><table>
      <tr><td class="meta-label">Report Date:</td><td class="meta-val">${data.company.reportDate}</td></tr>
      <tr><td class="meta-label">Report Period:</td><td class="meta-val">${data.company.reportPeriod}</td></tr>
      <tr><td class="meta-label">Generated Date:</td><td class="meta-val">${data.company.genDate}</td></tr>
      <tr><td class="meta-label">Generated By:</td><td class="meta-val">${data.company.genBy}</td></tr>
    </table></div></td>
  </tr></table>

  <div class="doc-title-bar"><h1>ACCOUNT OVERVIEW</h1><p>Financial History &amp; Transaction Report</p></div>

  <div class="section-title">REPORT PERIOD</div>
  <div class="period-box"><table class="period-table"><tr>
    <td><strong>Reporting Period:</strong> ${data.periodLabel}</td>
    <td><strong>Report Type:</strong> Monthly Financial Report</td>
    <td><strong>Status:</strong> <span style="color:#16a34a;font-weight:bold;">Official Account Statement</span></td>
  </tr></table></div>

  <div class="section-title">EXECUTIVE FINANCIAL SUMMARY</div>
  <table class="cards-table"><tr>
    <td width="25%"><div class="card card-navy"><div class="card-label">CURRENT BALANCE</div><div class="card-value">${fmt(data, data.summary.currentBalance)}</div></div></td>
    <td width="25%"><div class="card card-green"><div class="card-label">TOTAL INCOME</div><div class="card-value">${fmt(data, data.summary.totalIncome)}</div></div></td>
    <td width="25%"><div class="card card-red"><div class="card-label">TOTAL EXPENSE</div><div class="card-value">${fmt(data, data.summary.totalExpense)}</div></div></td>
    <td width="25%"><div class="card card-emerald"><div class="card-label">NET PROFIT</div><div class="card-value">${fmt(data, data.summary.netProfit)}</div></div></td>
  </tr></table>

  <div class="section-title">ACCOUNT BREAKDOWN</div>
  <table class="breakdown-table"><tr>
    ${breakdownCard(data, "💵 CASH", data.methodBreakdown.cash)}
    ${breakdownCard(data, "📱 MOBILE BANKING", data.methodBreakdown.mobile)}
    ${breakdownCard(data, "🏦 BANK ACCOUNT", data.methodBreakdown.bank)}
  </tr></table>

  <div class="section-title">BANK &amp; MOBILE BREAKDOWN</div>
  <table class="grid-2col"><tr>
    <td><div style="font-size:8.5pt;font-weight:700;color:#334155;margin-bottom:4px;text-transform:uppercase;">BANK ACCOUNTS</div>
      <table class="account-item-table">${accountGrid(data, data.banks)}</table></td>
    <td><div style="font-size:8.5pt;font-weight:700;color:#334155;margin-bottom:4px;text-transform:uppercase;">MOBILE BANKING</div>
      <table class="account-item-table">${accountGrid(data, data.mobileBanking)}</table></td>
  </tr></table>

  <div class="page-footer"><table class="footer-table"><tr>
    <td style="font-weight:bold;color:#0b2545;">${data.company.name}</td>
    <td style="text-align:center;">Financial Health Indicator</td>
    <td style="text-align:right;">Account Overview | Page 1 of 3</td>
  </tr></table></div>
</div>

<div class="page page-break">
  <table class="header-table"><tr>
    <td class="header-left">
      <div class="company-title">${data.company.name}</div>
      <div style="font-size:10pt;font-weight:700;color:#475569;">ACCOUNT OVERVIEW – FINANCIAL ANALYTICS</div>
    </td>
    <td class="header-right"><div class="meta-box"><table>
      <tr><td class="meta-label">Report Period:</td><td class="meta-val">${data.company.reportPeriod}</td></tr>
      <tr><td class="meta-label">Generated Date:</td><td class="meta-val">${data.company.genDate}</td></tr>
      <tr><td class="meta-label">Generated By:</td><td class="meta-val">${data.company.genBy}</td></tr>
    </table></div></td>
  </tr></table>

  <div class="section-title">CATEGORY ANALYTICS</div>
  <table class="grid-2col"><tr>
    <td><div style="background-color:#f1f5f9;padding:6px 10px;font-weight:700;color:#0b2545;font-size:8.5pt;border-radius:4px 4px 0 0;border:1px solid #cbd5e1;">TOP INCOME SOURCES</div>
      <table class="data-table"><thead><tr><th>Category</th><th style="text-align:right;">Amount</th><th style="width:35%;">Percentage</th></tr></thead>
      <tbody>${categoryRows(data, data.incomeSources, "#16a34a")}</tbody></table></td>
    <td><div style="background-color:#f1f5f9;padding:6px 10px;font-weight:700;color:#0b2545;font-size:8.5pt;border-radius:4px 4px 0 0;border:1px solid #cbd5e1;">TOP EXPENSE CATEGORIES</div>
      <table class="data-table"><thead><tr><th>Category</th><th style="text-align:right;">Amount</th><th style="width:35%;">Percentage</th></tr></thead>
      <tbody>${categoryRows(data, data.expenseCategories, "#dc2626")}</tbody></table></td>
  </tr></table>

  <div class="page-footer"><table class="footer-table"><tr>
    <td style="font-weight:bold;color:#0b2545;">${data.company.name}</td>
    <td style="text-align:center;">Account Overview • Financial History Generated from ERP System</td>
    <td style="text-align:right;">Page 2 of 3</td>
  </tr></table></div>
</div>

<div class="page page-break">
  <table class="header-table" style="margin-bottom:8px;"><tr>
    <td class="header-left">
      <div class="company-title">${data.company.name}</div>
      <div style="font-size:9.5pt;font-weight:700;color:#475569;">ACCOUNT OVERVIEW</div>
      <div style="font-size:13pt;font-weight:800;color:#0b2545;text-transform:uppercase;">TRANSACTION HISTORY</div>
      <div style="font-size:8pt;color:#64748b;margin-top:2px;">Complete account transaction record</div>
    </td>
    <td class="header-right" style="vertical-align:bottom;">
      <div style="font-size:8.5pt;font-weight:700;color:#0b2545;background:#f1f5f9;padding:6px 10px;border-radius:4px;border:1px solid #cbd5e1;display:inline-block;">
        Report Period: ${data.periodLabel}
      </div>
    </td>
  </tr></table>

  <table class="data-table" style="font-size:7.5pt;"><thead><tr>
    <th style="width:25px;text-align:center;">SL</th><th style="width:65px;">Date</th><th style="width:50px;">Type</th>
    <th style="width:60px;">Category</th><th style="width:75px;">Payment Method</th><th>Description</th>
    <th style="width:50px;">Added By</th><th style="width:65px;text-align:right;">Amount</th>
  </tr></thead><tbody>${transactionRows(data)}</tbody></table>

  <div class="page-footer"><table class="footer-table"><tr>
    <td style="font-weight:bold;color:#0b2545;">${data.company.name}</td>
    <td style="text-align:center;">Account Overview • Financial History Generated from ERP System</td>
    <td style="text-align:right;">Page 3 of 3</td>
  </tr></table></div>
</div>

</body></html>`;
}

function fmt(data, val) {
  const sym = data.company.currency;
  const formatted = Math.abs(val).toLocaleString("en-IN");
  return val < 0 ? `-${sym}${formatted}` : `${sym}${formatted}`;
}

function breakdownCard(data, title, m) {
  const balance = m.income - m.expense;
  return `<td width="33.33%"><div class="breakdown-card">
    <div class="breakdown-card-title">${title}</div>
    <table class="sub-row">
      <tr><td>Balance:</td><td class="text-bold" style="text-align:right;">${fmt(data, balance)}</td></tr>
      <tr><td>Money In:</td><td class="text-green" style="text-align:right;">${fmt(data, m.income)}</td></tr>
      <tr><td>Money Out:</td><td class="text-red" style="text-align:right;">${fmt(data, m.expense)}</td></tr>
    </table></div></td>`;
}

function accountGrid(data, items) {
  if (!items.length) return `<tr><td><div class="account-item"><div class="account-item-name">No data</div></div></td></tr>`;
  let rows = "";
  for (let i = 0; i < items.length; i += 2) {
    const a = items[i], b = items[i + 1];
    rows += `<tr>
      <td width="50%"><div class="account-item"><div class="account-item-name">${a.name}</div><div class="account-item-val">${fmt(data, a.balance)}</div></div></td>
      ${b ? `<td width="50%"><div class="account-item"><div class="account-item-name">${b.name}</div><div class="account-item-val">${fmt(data, b.balance)}</div></div></td>` : "<td></td>"}
    </tr>`;
  }
  return rows;
}

function categoryRows(data, items, color) {
  if (!items.length) return `<tr><td colspan="3" style="text-align:center;color:#94a3b8;">No data</td></tr>`;
  return items.map((item) => `<tr>
    <td>${item.category}</td>
    <td style="text-align:right;font-weight:bold;">${fmt(data, item.amount)}</td>
    <td><div class="progress-bg"><div class="progress-fill" style="width:${item.percentage}%;background-color:${color};"></div></div></td>
  </tr>`).join("");
}

function transactionRows(data) {
  if (!data.transactions.length) return `<tr><td colspan="8" style="text-align:center;color:#94a3b8;">No transactions</td></tr>`;
  return data.transactions.map((item) => `<tr>
    <td style="text-align:center;">${item.sl}</td>
    <td>${item.date}</td>
    <td><span class="${item.type === "Income" ? "badge-income" : "badge-expense"}">${item.type}</span></td>
    <td>${item.category}</td>
    <td>${item.method}</td>
    <td>${item.desc}</td>
    <td>${item.user}</td>
    <td style="text-align:right;font-weight:bold;color:${item.amount < 0 ? "#dc2626" : "#16a34a"};">
      ${item.amount > 0 ? "+" : ""}${Math.abs(item.amount).toLocaleString()}
    </td>
  </tr>`).join("");
}