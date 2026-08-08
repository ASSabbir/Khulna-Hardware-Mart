// FILE: src/Print/printUtils.js (NEW)
export function openPrintWindow(html) {
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}