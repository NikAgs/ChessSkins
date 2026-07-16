// ChessSkins — applies the selected piece skin on lichess and chess.com
// by injecting CSS. Catalog skins ship as skins/<id>/skin.css (12+ rules with
// data-URI SVG images); a user-made custom skin lives in chrome.storage.local.

const STYLE_ID = "chessskins-style";
const BOARD_STYLE_ID = "chessskins-board-style";
const CUSTOM_ID = "__custom__";
const DEFAULTS = {
  csEnabled: true,
  csSkin: "goofball",
  csBoard: "default",
  csSiteLichess: true,
  csSiteChess: true,
};

// which site is this page? (content script only runs on these hosts)
const SITE = /(^|\.)chess\.com$/.test(location.hostname) ? "chess" : "lichess";

// piece-code -> selectors for both sites (lichess uses <piece class="white pawn">,
// chess.com uses <div class="piece wp"> and promotion windows use the same codes)
const SITE_SELECTORS = (code) => {
  const color = code[0] === "w" ? "white" : "black";
  const type = { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight", P: "pawn" }[code[1]];
  const cc = code.toLowerCase(); // wp, bn, ...
  return `piece.${color}.${type}, .piece.${cc}, .promotion-piece.${cc}`;
};

let currentKey = null;
let currentBoardKey = null;

function cssFromPieces(pieces) {
  return Object.entries(pieces)
    .map(([code, svg]) => {
      const uri = "data:image/svg+xml," + encodeURIComponent(svg);
      return `${SITE_SELECTORS(code)}{background-image:url("${uri}") !important;}`;
    })
    .join("\n");
}

function setStyle(css, id = STYLE_ID) {
  let el = document.getElementById(id);
  if (css == null) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = css;
}

async function applyBoard(enabled, board) {
  const key = `${enabled}:${board}`;
  if (key === currentBoardKey) return;
  currentBoardKey = key;
  if (!enabled || !board || board === "default") return setStyle(null, BOARD_STYLE_ID);
  try {
    const url = chrome.runtime.getURL(`boards/${board}/board.css`);
    const css = await (await fetch(url)).text();
    if (currentBoardKey !== key) return;
    setStyle(css, BOARD_STYLE_ID);
  } catch (e) {
    setStyle(null, BOARD_STYLE_ID); // unknown board id — fall back to site default
  }
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
  chrome.storage.sync.get(DEFAULTS, (v) => {
    const siteOn = SITE === "chess" ? v.csSiteChess : v.csSiteLichess;
    const on = v.csEnabled && siteOn;
    apply(on, v.csSkin);
    applyBoard(on, v.csBoard);
  });
}

sync(); // document_start — skin lands before the board first paints
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" &&
      (changes.csEnabled || changes.csSkin || changes.csBoard ||
       changes.csSiteLichess || changes.csSiteChess)) sync();
  if (area === "local" && changes.csCustomSkin) {
    currentKey = null; // force re-render of the custom skin
    sync();
  }
});
