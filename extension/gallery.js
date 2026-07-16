const DEFAULTS = { csEnabled: true, csSkin: "goofball" };
const CUSTOM_ID = "__custom__";
const REPO = "https://github.com/NikAgs/ChessSkins";
const CODES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"];

// two-rank board layout per side: back rank + pawns (white bottom, black top)
const BACK = ["R", "N", "B", "Q", "K", "B", "N", "R"];

const grid = document.getElementById("grid");
const chipsEl = document.getElementById("chips");
const search = document.getElementById("search");

// Chip labels double as filter values; translated once at startup, never
// persisted (storage only holds skin ids), so comparisons stay consistent.
const ALL_CAT = t("catAll", "All");
const FAV_CAT = t("catFav", "★ Favorites");
const RECENT_CAT = t("catRecent", "Recent");

let skins = [], state = { ...DEFAULTS }, activeCat = ALL_CAT;
let favorites = [], recents = [];

function trackRecent(id) {
  recents = [id, ...recents.filter((r) => r !== id)].slice(0, 6);
  chrome.storage.sync.set({ csRecents: recents });
}

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
  let list = skins;
  if (activeCat === FAV_CAT) list = skins.filter((s) => favorites.includes(s.id));
  else if (activeCat === RECENT_CAT)
    list = recents.map((id) => skins.find((s) => s.id === id)).filter(Boolean);
  else if (activeCat !== ALL_CAT) list = skins.filter((s) => s.category === activeCat);

  const sortBy = document.getElementById("sort").value;
  if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "likes")
    list = [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0));

  for (const s of list) {
    if (q && !(s.name + s.tagline + s.category).toLowerCase().includes(q)) continue;
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = s.id;
    card.innerHTML = `
      <span class="star">★</span>
      <div class="board">${boardHTML((c) => `skins/${s.id}/${c}.svg`)}</div>
      <div class="meta"><span class="name"></span><span class="cat"></span></div>
      <div class="tag"></div>
      <div class="applied"></div>`;
    card.querySelector(".applied").textContent = t("appliedCard", "✓ Applied — go play!");
    card.querySelector(".name").textContent = s.name;
    card.querySelector(".cat").textContent =
      (s.likes ? `👍 ${s.likes} · ` : "") + s.category;
    card.querySelector(".tag").textContent = s.tagline;
    const star = card.querySelector(".star");
    star.title = t("starTitle", "Favorite");
    star.classList.toggle("faved", favorites.includes(s.id));
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      favorites = favorites.includes(s.id)
        ? favorites.filter((f) => f !== s.id)
        : [...favorites, s.id];
      chrome.storage.sync.set({ csFavorites: favorites });
      star.classList.toggle("faved", favorites.includes(s.id));
      renderChips();
      if (activeCat === FAV_CAT) renderGrid();
    });
    card.addEventListener("click", () => {
      state.csSkin = s.id;
      chrome.storage.sync.set({ csSkin: s.id, csEnabled: true });
      trackRecent(s.id);
      renderSelection();
      renderChips();
    });
    grid.appendChild(card);
  }
  renderSelection();
}

function renderChips() {
  const cats = [ALL_CAT, ...new Set(skins.map((s) => s.category))];
  if (recents.length) cats.splice(1, 0, RECENT_CAT);
  if (favorites.length) cats.splice(1, 0, FAV_CAT);
  chipsEl.innerHTML = "";
  for (const c of cats) {
    const b = document.createElement("button");
    b.className = "chip" + (c === activeCat ? " active" : "");
    b.textContent = c;
    b.addEventListener("click", () => { activeCat = c; renderChips(); renderGrid(); });
    chipsEl.appendChild(b);
  }
}

/* ---------------- board themes ---------------- */

const boardGrid = document.getElementById("boardGrid");
let boards = [];

function renderBoardSelection() {
  for (const card of boardGrid.children) {
    card.classList.toggle("selected", card.dataset.id === (state.csBoard || "default"));
  }
}

function renderBoards() {
  boardGrid.innerHTML = "";
  const entries = [
    { id: "default", name: t("boardDefaultName", "Site Default"), tagline: t("boardDefaultTag", "Whatever the site says."), _none: true },
    ...boards,
  ];
  for (const b of entries) {
    const card = document.createElement("div");
    card.className = "bcard";
    card.dataset.id = b.id;
    // top-left 4x2 corner of the board, with a few goofball pieces on it
    const bg = b._none
      ? "background:repeating-conic-gradient(var(--sq-l) 0% 25%, var(--sq-d) 0% 50%) 0 0 / 25% 50%"
      : `background-image:url('boards/${b.id}/board.svg')`;
    const pieces = ["bR", "bN", "bB", "bQ"]
      .map((c, i) => `<img src="skins/goofball/${c}.svg" style="left:${i * 12.5}%;top:0">`)
      .join("");
    card.innerHTML = `
      <div class="bpreview" style="${bg}">${pieces}</div>
      <div class="name"></div><div class="tag"></div>`;
    card.querySelector(".name").textContent = b.name;
    card.querySelector(".tag").textContent = b.tagline;
    card.addEventListener("click", () => {
      state.csBoard = b.id;
      chrome.storage.sync.set({ csBoard: b.id, csEnabled: true });
      renderBoardSelection();
    });
    boardGrid.appendChild(card);
  }
  renderBoardSelection();
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
    copyStatus.textContent = t("copiedMsg", "Copied! Paste it into Claude or ChatGPT, then bring back the JSON it returns.");
  });

  function loadFromText(text) {
    loadStatus.textContent = "";
    document.getElementById("previewWrap").style.display = "none";
    let obj;
    try { obj = extractJSON(text); }
    catch (e) { loadStatus.className = "err"; loadStatus.textContent = e.message; return; }
    const errs = validateSkin(obj);
    if (errs.length) {
      loadStatus.className = "err";
      loadStatus.textContent =
        t("errIntro", "Almost! Fix these (you can ask the AI to correct them):") + "\n• " + errs.join("\n• ");
      return;
    }
    loadedSkin = obj;
    loadStatus.className = "ok";
    loadStatus.textContent = `"${obj.name}" ` + t("loadedMsg", "loaded — looking good!");
    document.getElementById("previewBoard").innerHTML =
      boardHTML((c) => "data:image/svg+xml," + encodeURIComponent(obj.pieces[c]));
    document.getElementById("previewWrap").style.display = "block";
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
    await chrome.storage.local.set({ csCustomSkin: loadedSkin });
    await chrome.storage.sync.set({ csSkin: CUSTOM_ID, csEnabled: true });
    state.csSkin = CUSTOM_ID;
    renderSelection();
    document.getElementById("applyCustom").textContent = t("appliedBtn", "✓ Applied — go play!");
    setTimeout(() => (document.getElementById("applyCustom").textContent = t("btnApply", "Apply as my skin")), 2500);
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
  const [idx, bidx, stored] = await Promise.all([
    fetch(chrome.runtime.getURL("skins/index.json")).then((r) => r.json()),
    fetch(chrome.runtime.getURL("boards/index.json")).then((r) => r.json()).catch(() => []),
    chrome.storage.sync.get({ ...DEFAULTS, csBoard: "default", csFavorites: [], csRecents: [] }),
  ]);
  skins = idx;
  boards = bidx;
  state = stored;
  favorites = stored.csFavorites;
  recents = stored.csRecents;
  search.addEventListener("input", renderGrid);
  document.getElementById("sort").addEventListener("change", renderGrid);
  renderChips();
  renderGrid();
  renderBoards();
  initCreator();
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== "sync") return;
    if (ch.csSkin) { state.csSkin = ch.csSkin.newValue; renderSelection(); }
    if (ch.csBoard) { state.csBoard = ch.csBoard.newValue; renderBoardSelection(); }
  });
}

init();
