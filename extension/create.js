const CUSTOM_PREFIX = "__custom__:";
const REPO = "https://github.com/NikAgs/ChessSkins";
const CODES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"];
const CLASSIC = { light: "#f0d9b5", dark: "#b58863" };

// full 8x8 board: black back rank + pawns, 4 empty ranks, white pawns + back rank
const BACK = ["R", "N", "B", "Q", "K", "B", "N", "R"];
const FULL_RANKS = [
  BACK.map((p) => "b" + p),
  Array(8).fill("bP"),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill("wP"),
  BACK.map((p) => "w" + p),
];

function fullBoardHTML(imgFor) {
  let html = "";
  FULL_RANKS.forEach((rank, r) => {
    rank.forEach((code, c) => {
      const sq = (r + c) % 2 === 0 ? "l" : "d";
      const img = code ? `<img loading="lazy" src="${imgFor(code)}" alt="">` : "";
      html += `<div class="sq ${sq}">${img}</div>`;
    });
  });
  return html;
}

/* ---- one-time migration: single csCustomSkin slot -> csCustomSkins map ---- */

async function migrateLegacyCustom() {
  const { csCustomSkin } = await chrome.storage.local.get("csCustomSkin");
  if (!csCustomSkin) return;
  const id = csCustomSkin.id || "my-skin";
  const { csCustomSkins = {} } = await chrome.storage.local.get("csCustomSkins");
  if (!csCustomSkins[id]) {
    csCustomSkins[id] = csCustomSkin;
    await chrome.storage.local.set({ csCustomSkins });
  }
  await chrome.storage.local.remove("csCustomSkin");
  const { csSkin } = await chrome.storage.sync.get("csSkin");
  if (csSkin === "__custom__") {
    await chrome.storage.sync.set({ csSkin: CUSTOM_PREFIX + id });
  }
}

/* ---- preview squares honor the selected board theme via --sq-l/--sq-d ---- */

let boards = [];
let customBoards = {};
let currentBoard = "default";

function boardColors(id) {
  if (id && id.startsWith(CUSTOM_PREFIX)) {
    const b = customBoards[id.slice(CUSTOM_PREFIX.length)];
    return (b && b.colors && b.colors.light && b.colors.dark) ? b.colors : CLASSIC;
  }
  const b = boards.find((x) => x.id === id);
  return (b && b.colors && b.colors.light && b.colors.dark) ? b.colors : CLASSIC;
}

function applyBoardColors() {
  const c = boardColors(currentBoard);
  document.documentElement.style.setProperty("--sq-l", c.light);
  document.documentElement.style.setProperty("--sq-d", c.dark);
}

async function initBoardColors() {
  const [bidx, stored, local] = await Promise.all([
    fetch(chrome.runtime.getURL("boards/index.json")).then((r) => r.json()).catch(() => []),
    chrome.storage.sync.get({ csBoard: "default" }),
    chrome.storage.local.get({ csCustomBoards: {} }),
  ]);
  boards = bidx;
  customBoards = local.csCustomBoards || {};
  currentBoard = stored.csBoard;
  applyBoardColors();
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === "sync" && ch.csBoard) {
      currentBoard = ch.csBoard.newValue;
      applyBoardColors();
    }
    if (area === "local" && ch.csCustomBoards) {
      customBoards = ch.csCustomBoards.newValue || {};
      applyBoardColors();
    }
  });
}

/* ---------------- AI prompts ---------------- */

const PIECES_PROMPT = (theme) => `You are a professional icon designer creating a complete chess piece skin for the open-source ChessSkins browser extension (${REPO}).

THEME: ${theme || "(designer's choice — pick something fun and cohesive)"}

Design all 12 pieces: white king/queen/rook/bishop/knight/pawn and black king/queen/rook/bishop/knight/pawn.

HARD REQUIREMENTS for every SVG:
- viewBox="0 0 100 100"; artwork fills ~86-96 units of height; bottom of the piece near y=92.
- Fully self-contained: NO <script>, <image>, <text>, <style>, <foreignObject>, CSS classes, external references, or event attributes. Presentation attributes only (fill, stroke, stroke-width, opacity...). Inline gradients with unique ids are allowed.
- Under 10KB each.

READABILITY RULES (this is a playable chess set, not just art):
1. Six distinct silhouettes — king, queen, rook, bishop, knight, pawn must each be identifiable at a glance. Keep classic cues even in costume: king tallest/crowned, queen elegant with her own tiara (clearly different from the king), rook sturdy/structural, bishop tall/pointed, knight = the animal/mount in side profile, pawn smallest and simplest.
2. Side identity: the white army must be predominantly LIGHT-bodied, the black army predominantly DARK-bodied. Themed accent colors are welcome, but at 45 pixels nobody should hesitate about whose piece it is.
3. Both armies must stay readable on light (#f0d9b5) AND dark (#b58863) board squares. Proven recipe: dark outline around light pieces, light outline around dark pieces.
4. Consistent stroke weight and detail level across all 12 pieces; the black set is the same design recolored, not a different design. Avoid fine detail that vanishes at small sizes.

OUTPUT FORMAT — reply with EXACTLY ONE json code block and nothing else:

\`\`\`json
{
  "id": "kebab-case-id",
  "name": "Display Name",
  "tagline": "One fun sentence about the set.",
  "style": "one-or-two-word style tag",
  "pieces": {
    "wK": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\">...</svg>",
    "wQ": "...", "wR": "...", "wB": "...", "wN": "...", "wP": "...",
    "bK": "...", "bQ": "...", "bR": "...", "bB": "...", "bN": "...", "bP": "..."
  }
}
\`\`\``;

const BOARD_PROMPT = (theme) => `You are a professional visual designer creating a chess board theme for the open-source ChessSkins browser extension (${REPO}). The board is the 8x8 artwork the pieces stand on, shown on lichess and chess.com.

THEME: ${theme || "(designer's choice — pick something tasteful and cohesive)"}

HARD REQUIREMENTS:
- One SVG with viewBox="0 0 800 800": an 8x8 grid of 100x100 squares, exact coverage, no margins, nothing outside the viewBox.
- Convention: the top-left square (a8) is a LIGHT square.
- Fully self-contained: NO <script>, <image>, <text>, <style>, <foreignObject>, external references, or event attributes. Presentation attributes only. Inline gradients/patterns with unique ids are allowed — prefer <defs> + <use> or <pattern> over 64 hand-drawn texture copies.
- Under 60KB.

PLAYABILITY RULES (pieces live on top of this):
1. Two clearly distinct square tones — light vs dark must be obvious at a glance and at small board sizes.
2. Pieces stay readable: avoid extreme values (near-white lights or near-black darks kill piece contrast), highly saturated mid-tones, and busy high-frequency texture. Texture must be subtle — visible at full size, invisible noise at 45 pixels.
3. Consistency: all 32 light squares identical (or near-identical), likewise the dark squares. Decorative flourishes only if they stay quiet (e.g. faint grain, soft vignette per square).

OUTPUT FORMAT — reply with EXACTLY ONE json code block and nothing else:

\`\`\`json
{
  "id": "kebab-case-id",
  "name": "Display Name",
  "tagline": "One fun sentence about the theme.",
  "colors": { "light": "#f0d9b5", "dark": "#b58863" },
  "board": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 800 800\\">...</svg>"
}
\`\`\`
(colors = representative hex values of your light and dark squares)`;

/* ---------------- validation ---------------- */

const FORBIDDEN = ["<script", "<image", "<text", "<style", "<foreignobject",
  'href="http', "url(http", "xlink:href", "javascript:", "onload=", "onerror=", "onclick="];

function validateSkin(obj) {
  const errs = [];
  if (!obj || typeof obj !== "object") return ["Not a JSON object."];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(obj.id || "")) errs.push("id must be kebab-case (e.g. sushi-set).");
  if (!obj.name) errs.push("Missing name.");
  if (!obj.pieces) return errs.concat(["Missing pieces map."]);
  for (const code of CODES) {
    const svg = obj.pieces[code];
    if (!svg) { errs.push(`Missing piece ${code}.`); continue; }
    const low = svg.toLowerCase();
    if (!low.includes("<svg")) errs.push(`${code}: not an <svg> element.`);
    if (!low.includes("viewbox")) errs.push(`${code}: missing viewBox.`);
    if (svg.length > 12000) errs.push(`${code}: too large (${svg.length} chars, max ~12000).`);
    for (const bad of FORBIDDEN) if (low.includes(bad)) errs.push(`${code}: forbidden content "${bad}".`);
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (doc.querySelector("parsererror")) errs.push(`${code}: invalid SVG/XML.`);
  }
  return errs;
}

function validateBoard(obj) {
  const errs = [];
  if (!obj || typeof obj !== "object") return ["Not a JSON object."];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(obj.id || "")) errs.push("id must be kebab-case (e.g. cherry-wood).");
  if (!obj.name) errs.push("Missing name.");
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  if (!obj.colors || !hex.test(obj.colors.light || "")) errs.push("colors.light must be a hex color like #f0d9b5.");
  if (!obj.colors || !hex.test(obj.colors.dark || "")) errs.push("colors.dark must be a hex color like #b58863.");
  const svg = obj.board;
  if (!svg) return errs.concat(["Missing board svg."]);
  const low = svg.toLowerCase();
  if (!low.includes("<svg")) errs.push("board: not an <svg> element.");
  if (!/viewbox\s*=\s*["']0 0 800 800["']/.test(low)) errs.push('board: viewBox must be exactly "0 0 800 800".');
  if (svg.length > 80000) errs.push(`board: too large (${svg.length} chars, max ~80000).`);
  for (const bad of FORBIDDEN) if (low.includes(bad)) errs.push(`board: forbidden content "${bad}".`);
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror")) errs.push("board: invalid SVG/XML.");
  return errs;
}

function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in the pasted text.");
  return JSON.parse(raw.slice(start, end + 1));
}

/* ---------------- creator ---------------- */

const MODES = {
  pieces: {
    prompt: PIECES_PROMPT,
    validate: validateSkin,
    themePh: () => t("themePh", "e.g. sushi pieces - the knight is a shrimp nigiri"),
  },
  board: {
    prompt: BOARD_PROMPT,
    validate: validateBoard,
    themePh: () => t("themePhBoard", "e.g. worn tournament wood - soft grain, warm tones"),
  },
};

let mode = "pieces";
let loadedItem = null; // validated skin or board object, per current mode

function initCreator() {
  const copyStatus = document.getElementById("copyStatus");
  const loadStatus = document.getElementById("loadStatus");
  const themeDesc = document.getElementById("themeDesc");
  const previewWrap = document.getElementById("previewWrap");
  const previewBoard = document.getElementById("previewBoard");
  const previewBoardImg = document.getElementById("previewBoardImg");

  function resetPreview() {
    loadedItem = null;
    loadStatus.textContent = "";
    previewWrap.style.display = "none";
  }

  function setMode(next) {
    mode = next;
    document.getElementById("modePieces").classList.toggle("active", mode === "pieces");
    document.getElementById("modeBoard").classList.toggle("active", mode === "board");
    themeDesc.placeholder = MODES[mode].themePh();
    resetPreview();
  }
  document.getElementById("modePieces").addEventListener("click", () => setMode("pieces"));
  document.getElementById("modeBoard").addEventListener("click", () => setMode("board"));

  const buildPrompt = () => MODES[mode].prompt(themeDesc.value.trim());

  document.getElementById("openChatGPT").addEventListener("click", () =>
    window.open("https://chatgpt.com/?q=" + encodeURIComponent(buildPrompt()), "_blank")
  );
  document.getElementById("openClaude").addEventListener("click", () =>
    window.open("https://claude.ai/new?q=" + encodeURIComponent(buildPrompt()), "_blank")
  );
  document.getElementById("copyPrompt").addEventListener("click", async () => {
    await navigator.clipboard.writeText(buildPrompt());
    copyStatus.className = "ok";
    copyStatus.textContent = t("copiedMsg", "Copied the full prompt!");
  });

  function showPreview(obj) {
    // name/tagline are AI/user-supplied — textContent only
    document.getElementById("previewName").textContent = obj.name;
    document.getElementById("previewTag").textContent = obj.tagline || "";
    if (mode === "pieces") {
      previewBoard.innerHTML =
        fullBoardHTML((c) => "data:image/svg+xml," + encodeURIComponent(obj.pieces[c]));
      previewBoard.style.display = "grid";
      previewBoardImg.style.display = "none";
    } else {
      previewBoardImg.src = "data:image/svg+xml," + encodeURIComponent(obj.board);
      previewBoardImg.style.display = "block";
      previewBoard.style.display = "none";
    }
    previewWrap.style.display = "block";
  }

  function loadFromText(text) {
    resetPreview();
    let obj;
    try { obj = extractJSON(text); }
    catch (e) { loadStatus.className = "err"; loadStatus.textContent = e.message; return; }
    const errs = MODES[mode].validate(obj);
    if (errs.length) {
      loadStatus.className = "err";
      loadStatus.textContent =
        t("errIntro", "Almost! Fix these (you can ask the AI to correct them):") + "\n• " + errs.join("\n• ");
      return;
    }
    loadedItem = obj;
    loadStatus.className = "ok";
    loadStatus.textContent = t("loadedMsg", "Success!");
    showPreview(obj);
  }

  document.getElementById("loadSkin").addEventListener("click", () =>
    loadFromText(document.getElementById("pasteBox").value)
  );
  document.getElementById("importFile").addEventListener("click", () =>
    document.getElementById("fileInput").click()
  );
  document.getElementById("fileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) loadFromText(await file.text());
    e.target.value = "";
  });

  document.getElementById("applyCustom").addEventListener("click", async () => {
    if (!loadedItem) return;
    if (mode === "pieces") {
      const { csCustomSkins = {} } = await chrome.storage.local.get("csCustomSkins");
      csCustomSkins[loadedItem.id] = loadedItem;
      await chrome.storage.local.set({ csCustomSkins });
      await chrome.storage.sync.set({ csSkin: CUSTOM_PREFIX + loadedItem.id, csEnabled: true });
    } else {
      const { csCustomBoards = {} } = await chrome.storage.local.get("csCustomBoards");
      csCustomBoards[loadedItem.id] = loadedItem;
      await chrome.storage.local.set({ csCustomBoards });
      await chrome.storage.sync.set({ csBoard: CUSTOM_PREFIX + loadedItem.id, csEnabled: true });
    }
    document.getElementById("applyCustom").textContent = t("appliedBtn", "✓ Applied — go play!");
    setTimeout(() => (document.getElementById("applyCustom").textContent = t("btnApply", "Apply as my skin")), 2500);
  });

  document.getElementById("downloadCustom").addEventListener("click", () => {
    if (!loadedItem) return;
    const blob = new Blob([JSON.stringify(loadedItem, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${loadedItem.id}.${mode === "pieces" ? "skin" : "board"}.json`;
    a.click();
  });

  document.getElementById("submitCustom").addEventListener("click", () => {
    if (!loadedItem) return;
    const json = JSON.stringify(loadedItem, null, 2);
    // the clipboard always carries the JSON; the URL only when it fits —
    // GitHub prefills issue-form fields from query params matching the field
    // id, but full skins usually blow past URL length limits
    navigator.clipboard.writeText(json).catch(() => {});
    const [template, tag, field] = mode === "pieces"
      ? ["new-skin.yml", "skin", "skin-json"]
      : ["new-board.yml", "board", "board-json"];
    let url = `${REPO}/issues/new?template=${template}&title=${encodeURIComponent(`[${tag}] ${loadedItem.name}`)}`;
    const enc = encodeURIComponent(json);
    if (enc.length < 6000) url += `&${field}=${enc}`;
    window.open(url, "_blank");
  });

  themeDesc.focus();

  // entrance is one-time: drop the scope class once the panel slap is done
  requestAnimationFrame(() => setTimeout(() => document.body.classList.remove("entering"), 900));
}

migrateLegacyCustom().then(initBoardColors);
initCreator();
