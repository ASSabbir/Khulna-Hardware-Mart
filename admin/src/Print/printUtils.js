// FILE: src/Print/printUtils.js (FULL REPLACEMENT) — unique window name forces a fresh tab every time.
// print() is now triggered EXACTLY ONCE (a printed flag guards against onload + fallback both
// firing) — previously both fired, so cancelling the first dialog immediately re-opened a
// second one from the fallback timer, making Cancel look broken.
export function openPrintWindow(html) {
  const w = window.open("", "print_" + Date.now() + "_" + Math.random().toString(36).slice(2));
  if (!w) {
    alert("Popup blocked — please allow popups for this site to print.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    w.focus();
    w.print();
  };

  w.onload = triggerPrint;
  // fallback only in case onload never fires (some browsers with document.write) —
  // the `printed` guard above ensures this never double-fires alongside onload.
  setTimeout(triggerPrint, 300);
}