// ChessSkins i18n helper — swaps marked DOM text via chrome.i18n, with the
// English already in the HTML acting as fallback. Load before popup.js/gallery.js.

function t(key, fallback = "") {
  try {
    const m = chrome.i18n.getMessage(key);
    return m || fallback;
  } catch (e) {
    return fallback;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const m = t(el.dataset.i18n);
    if (m) el.textContent = m;
  }
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
    const m = t(el.dataset.i18nPlaceholder);
    if (m) el.placeholder = m;
  }
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    const m = t(el.dataset.i18nTitle);
    if (m) el.title = m;
  }
});
