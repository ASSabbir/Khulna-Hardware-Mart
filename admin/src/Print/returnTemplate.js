// FILE: src/Print/returnTemplate.js (FULL REPLACEMENT) — kept only for backward compatibility with existing imports.
// buildInvoiceReceiptHTML now already renders the Return section and Due Collection History section
// conditionally based on real invoice data, so this is a thin pass-through — same design everywhere.
import { buildInvoiceReceiptHTML } from "./invoiceReceiptTemplate";

export function buildReturnHTML(invoice) {
  return buildInvoiceReceiptHTML(invoice);
}