// ChessSkins — applies the selected piece skin on lichess and chess.com
// by injecting CSS. Catalog skins ship as skins/<id>/skin.css (12+ rules with
// data-URI SVG images); a user-made custom skin lives in chrome.storage.local.

const STYLE_ID = "chessskins-style";
const CUSTOM_ID = "__custom__";
const DEFAULTS = { csEnabled: true, csSkin: "goofball" };

// piece-code -> selectors for both sites (lichess uses <piece class="white pawn">,
// chess.com uses <div class="piece wp"> and promotion windows use the same codes)
const SITE_SELECTORS = (code) => {
  const color = code[0] === "w" ? "white" : "black";
  const type = { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight", P: "pawn" }[code[1]];
  const cc = code.toLowerCase(); // wp, bn, ...
  return `piece.${color}.${type}, .piece.${cc}, .promotion-piece.${cc}`;
};

let currentKey = null;

function cssFromPieces(pieces) {
  return Object.entries(pieces)
    .map(([code, svg]) => {
      const uri = "data:image/svg+xml," + encodeURIComponent(svg);
      return `${SITE_SELECTORS(code)}{background-image:url("${uri}") !important;}`;
    })
    .join("\n");
}

function setStyle(css) {
  let el = document.getElementById(STYLE_ID);
  if (css == null) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = css;
}

async function apply(enabled, skin) {
  const key = `${enabled}:${skin}`;
  if (key === currentKey) return;
  currentKey = key;

  if (!enabled) return setStyle(null);

  try {
    if (skin === CUSTOM_ID) {
      const { csCustomSkin } = await chrome.storage.local.get("csCustomSkin");
      if (!csCustomSkin || !csCustomSkin.pieces) throw new Error("no custom skin");
      if (currentKey !== key) return;
      return setStyle(cssFromPieces(csCustomSkin.pieces));
    }
    const url = chrome.runtime.getURL(`skins/${skin}/skin.css`);
    const css = await (await fetch(url)).text();
    if (currentKey !== key) return; // superseded while fetching
    setStyle(css);
  } catch (e) {
    // unknown skin id / missing file — fall back to the default skin once
    if (skin !== DEFAULTS.csSkin) {
      currentKey = null;
      apply(enabled, DEFAULTS.csSkin);
    }
  }
}

function sync() {
  chrome.storage.sync.get(DEFAULTS, (v) => apply(v.csEnabled, v.csSkin));
}

sync(); // document_start — skin lands before the board first paints
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.csEnabled || changes.csSkin)) sync();
  if (area === "local" && changes.csCustomSkin) {
    currentKey = null; // force re-render of the custom skin
    sync();
  }
});
