// FILE: src/Print/printUtils.js (FULL REPLACEMENT) — unique window name forces a fresh tab every time,
// instead of browsers silently reusing a previously-opened "_blank" print tab with old content.
export function openPrintWindow(html) {
  const w = window.open("", "print_" + Date.now() + "_" + Math.random().toString(36).slice(2));
  if (!w) {
    alert("Popup blocked — please allow popups for this site to print.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
  };
  // fallback in case onload doesn't fire (some browsers with document.write)
  setTimeout(() => {
    try { w.focus(); w.print(); } catch (e) {}
  }, 300);
}