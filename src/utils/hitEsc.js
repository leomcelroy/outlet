export function hitEsc() {
  const escEvent = new KeyboardEvent("keydown", {
    key: "Escape",
    code: "Escape",
    keyCode: 27,
    which: 27,
    bubbles: true,
    cancelable: true,
  });

  document.dispatchEvent(escEvent);
}
