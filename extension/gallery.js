const DEFAULTS = { csEnabled: true, csSkin: "goofball" };
const CUSTOM_ID = "__custom__";
const REPO = "https://github.com/NikAgs/ChessSkins";
const CODES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"];

// two-rank board layout per side: back rank + pawns (white bottom, black top)
const BACK = ["R", "N", "B", "Q", "K", "B", "N", "R"];

const grid = document.getElementById("grid");
const chipsEl = document.getElementById("chips");
const search = document.getElementById("search");

let skins = [], state = { ...DEFAULTS }, activeCat = "All";

/* ---------------- catalog ---------------- */

function boardHTML(imgFor) {
  // 4 ranks: black back, black pawns, white pawns, white back (compact + readable)
  const ranks = [
    BACK.map((p) => "b" + p),
    Array(8).fill("bP"),
    Array(8).fill("wP"),
    BACK.map((p) => "w" + p),
  ];
  let html = "";
  ranks.forEach((rank, r) => {
    rank.forEach((code, c) => {
      const sq = (r + c) % 2 === 0 ? "l" : "d";
      html += `<div class="sq ${sq}"><img loading="lazy" src="${imgFor(code)}" alt=""></div>`;
    });
  });
  return html;
}

function renderSelection() {
  for (const card of grid.children) {
    card.classList.toggle("selected", card.dataset.id === state.csSkin);
  }
}

function renderGrid() {
  const q = search.value.trim().toLowerCase();
  grid.innerHTML = "";
  for (const s of skins) {
    if (activeCat !== "All" && s.category !== activeCat) continue;
    if (q && !(s.name + s.tagline + s.category).toLowerCase().includes(q)) continue;
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = s.id;
    card.innerHTML = `
      <div class="board">${boardHTML((c) => `skins/${s.id}/${c}.svg`)}</div>
      <div class="meta"><span class="name"></span><span class="cat"></span></div>
      <div class="tag"></div>
      <div class="applied">✓ Applied — go play!</div>`;
    card.querySelector(".name").textContent = s.name;
    card.querySelector(".cat").textContent = s.category;
    card.querySelector(".tag").textContent = s.tagline;
    card.addEventListener("click", () => {
      state.csSkin = s.id;
      chrome.storage.sync.set({ csSkin: s.id, csEnabled: true });
      renderSelection();
    });
    grid.appendChild(card);
  }
  renderSelection();
}

function renderChips() {
  const cats = ["All", ...new Set(skins.map((s) => s.category))];
  chipsEl.innerHTML = "";
  for (const c of cats) {
    const b = document.createElement("button");
    b.className = "chip" + (c === activeCat ? " active" : "");
    b.textContent = c;
    b.addEventListener("click", () => { activeCat = c; renderChips(); renderGrid(); });
    chipsEl.appendChild(b);
  }
}

/* ---------------- creator ---------------- */

const AI_PROMPT = (theme) => `You are a professional icon designer creating a complete chess piece skin for the open-source ChessSkins browser extension (${REPO}).

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

function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in the pasted text.");
  return JSON.parse(raw.slice(start, end + 1));
}

let loadedSkin = null;

function initCreator() {
  const copyStatus = document.getElementById("copyStatus");
  const loadStatus = document.getElementById("loadStatus");

  document.getElementById("copyPrompt").addEventListener("click", async () => {
    const theme = document.getElementById("themeDesc").value.trim();
    await navigator.clipboard.writeText(AI_PROMPT(theme));
    copyStatus.className = "ok";
    copyStatus.textContent = "Copied! Paste it into Claude or ChatGPT, then bring back the JSON it returns.";
  });

  document.getElementById("loadSkin").addEventListener("click", () => {
    loadStatus.textContent = "";
    document.getElementById("previewWrap").style.display = "none";
    let obj;
    try { obj = extractJSON(document.getElementById("pasteBox").value); }
    catch (e) { loadStatus.className = "err"; loadStatus.textContent = e.message; return; }
    const errs = validateSkin(obj);
    if (errs.length) {
      loadStatus.className = "err";
      loadStatus.textContent = "Almost! Fix these (you can ask the AI to correct them):\n• " + errs.join("\n• ");
      return;
    }
    loadedSkin = obj;
    loadStatus.className = "ok";
    loadStatus.textContent = `"${obj.name}" loaded — looking good!`;
    document.getElementById("previewBoard").innerHTML =
      boardHTML((c) => "data:image/svg+xml," + encodeURIComponent(obj.pieces[c]));
    document.getElementById("previewWrap").style.display = "block";
  });

  document.getElementById("applyCustom").addEventListener("click", async () => {
    await chrome.storage.local.set({ csCustomSkin: loadedSkin });
    await chrome.storage.sync.set({ csSkin: CUSTOM_ID, csEnabled: true });
    state.csSkin = CUSTOM_ID;
    renderSelection();
    document.getElementById("applyCustom").textContent = "✓ Applied — go play!";
    setTimeout(() => (document.getElementById("applyCustom").textContent = "Apply as my skin"), 2500);
  });

  document.getElementById("downloadCustom").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(loadedSkin, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${loadedSkin.id}.skin.json`;
    a.click();
  });

  document.getElementById("submitCustom").addEventListener("click", () => {
    const title = encodeURIComponent(`[skin] ${loadedSkin.name}`);
    window.open(`${REPO}/issues/new?template=new-skin.yml&title=${title}`, "_blank");
  });

  if (location.hash === "#create") {
    document.getElementById("create").scrollIntoView();
    document.getElementById("themeDesc").focus();
  }
}

/* ---------------- init ---------------- */

async function init() {
  const [idx, stored] = await Promise.all([
    fetch(chrome.runtime.getURL("skins/index.json")).then((r) => r.json()),
    chrome.storage.sync.get(DEFAULTS),
  ]);
  skins = idx;
  state = stored;
  search.addEventListener("input", renderGrid);
  renderChips();
  renderGrid();
  initCreator();
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === "sync" && ch.csSkin) { state.csSkin = ch.csSkin.newValue; renderSelection(); }
  });
}

init();
