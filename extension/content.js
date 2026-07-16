// LiSkins — applies the selected piece skin on lichess by injecting CSS.
// Each skin ships as skins/<id>/skin.css (12 rules with data-URI SVG images).

const STYLE_ID = "liskins-style";
const DEFAULTS = { liskinsEnabled: true, liskinsSkin: "goofball" };

let currentKey = null; // `${enabled}:${skin}` currently applied

async function apply(enabled, skin) {
  const key = `${enabled}:${skin}`;
  if (key === currentKey) return;
  currentKey = key;

  let el = document.getElementById(STYLE_ID);
  if (!enabled) {
    if (el) el.remove();
    return;
  }
  try {
    const url = chrome.runtime.getURL(`skins/${skin}/skin.css`);
    const css = await (await fetch(url)).text();
    if (currentKey !== key) return; // a newer selection superseded this fetch
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = css;
  } catch (e) {
    // unknown skin id / missing file — fall back to the default skin once
    if (skin !== DEFAULTS.liskinsSkin) {
      currentKey = null;
      apply(enabled, DEFAULTS.liskinsSkin);
    }
  }
}

function sync() {
  chrome.storage.sync.get(DEFAULTS, (v) => apply(v.liskinsEnabled, v.liskinsSkin));
}

sync(); // document_start — skin lands before the board first paints
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.liskinsEnabled || changes.liskinsSkin)) sync();
});
