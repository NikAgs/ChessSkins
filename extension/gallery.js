const DEFAULTS = { csEnabled: true, csSkin: "goofball" };
const CUSTOM_PREFIX = "__custom__:";
const CODES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"];
const CLASSIC = { light: "#f0d9b5", dark: "#b58863" };

// 2x5 card preview: black pieces on top, white below (R N B K Q)
const PREVIEW_RANKS = [
  ["bR", "bN", "bB", "bK", "bQ"],
  ["wR", "wN", "wB", "wK", "wQ"],
];

const grid = document.getElementById("grid");
const search = document.getElementById("search");

let skins = [], state = { ...DEFAULTS };
let customSkins = {}, customBoards = {}; // { id: obj } from chrome.storage.local
let favorites = [], recents = [], boardRecents = [];
let activeFilter = "recent"; // recent | favorites | name
let activeCategory = "all";  // "all" | a category string from the skins index

function trackRecent(id) {
  recents = [id, ...recents.filter((r) => r !== id)].slice(0, 6);
  chrome.storage.sync.set({ csRecents: recents });
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

/* ---------------- catalog ---------------- */

function boardEl(imgFor) {
  const ranks = PREVIEW_RANKS;
  const board = document.createElement("div");
  board.className = "board";
  ranks.forEach((rank, r) => {
    rank.forEach((code, c) => {
      const sq = document.createElement("div");
      sq.className = `sq ${(r + c) % 2 === 0 ? "l" : "d"}`;
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = imgFor(code);
      img.alt = "";
      sq.appendChild(img);
      board.appendChild(sq);
    });
  });
  return board;
}

function renderSelection() {
  for (const card of grid.children) {
    card.classList.toggle("selected", card.dataset.id === state.csSkin);
  }
}

// peel/stamp feedback plays only on real clicks: tag the clicked element with
// .just-picked (renderSelection alone never animates). Removed on animationend
// — after the late applied stamp when there is one, else after the peel itself.
function pick(el) {
  const prev = el.parentElement.querySelector(".just-picked");
  if (prev && prev !== el) prev.classList.remove("just-picked");
  el.classList.remove("just-picked");
  void el.offsetWidth; // restart cleanly when re-clicking the same element
  el.classList.add("just-picked");
  el.addEventListener("animationend", function done(e) {
    const last = el.querySelector(".badge, .applied") ? e.animationName === "stamp"
                                                      : e.target === el;
    if (last) {
      el.classList.remove("just-picked");
      el.removeEventListener("animationend", done);
    }
  });
}

// _idx (curated order) is the universal tie-breaker
const SORTS = {
  recent: (a, b) =>
    (b.added || "").localeCompare(a.added || "") || a._idx - b._idx,
  name: (a, b) => a.name.localeCompare(b.name) || a._idx - b._idx,
  favorites: (a, b) => a._idx - b._idx, // favorites-only pool, curated order
};

function renderGrid() {
  const q = search.value.trim().toLowerCase();
  grid.innerHTML = "";

  // custom skins pinned at the front (searchable, YOURS badge, no favorite
  // star) — they have no catalog category and can't be favorited, so they
  // only appear on the "All" category with the Recent/Name chips
  const showCustoms = activeCategory === "all" && activeFilter !== "favorites";
  if (showCustoms) for (const [cid, skin] of Object.entries(customSkins)) {
    if (!skin || !skin.pieces) continue;
    const name = skin.name || t("customName", "My Custom Skin");
    const tagline = skin.tagline || "";
    if (q && !(name + tagline).toLowerCase().includes(q)) continue;
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = CUSTOM_PREFIX + cid;
    card.innerHTML = `
      <div class="meta"><span class="name"></span><span class="cat yours"></span></div>
      <div class="tag"></div>
      <div class="applied"></div>`;
    card.prepend(boardEl((c) => "data:image/svg+xml," + encodeURIComponent(skin.pieces[c])));
    card.querySelector(".applied").textContent = t("appliedCard", "✓ Applied — go play!");
    card.querySelector(".name").textContent = name; // user/AI-supplied — textContent only
    card.querySelector(".cat").textContent = t("badgeYours", "YOURS");
    card.querySelector(".tag").textContent = tagline;
    card.addEventListener("click", () => {
      pick(card);
      state.csSkin = card.dataset.id;
      chrome.storage.sync.set({ csSkin: card.dataset.id, csEnabled: true });
      renderSelection();
    });
    grid.appendChild(card);
  }

  // the category dropdown ANDs with the chip: it narrows the pool, the
  // chip then filters (Favorites) or orders (Recent / Name) within it
  let list = skins.filter((s) => activeCategory === "all" || s.category === activeCategory);
  if (activeFilter === "favorites") list = list.filter((s) => favorites.includes(s.id));
  list = [...list].sort(SORTS[activeFilter] || SORTS.recent);

  for (const s of list) {
    if (q && !(s.name + s.tagline + s.category).toLowerCase().includes(q)) continue;
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = s.id;
    card.innerHTML = `
      <span class="star">★</span>
      <div class="meta"><span class="name"></span><span class="cat"></span></div>
      <div class="tag"></div>
      <div class="applied"></div>`;
    card.querySelector(".star").after(boardEl((c) => `skins/${s.id}/${c}.svg`));
    card.querySelector(".applied").textContent = t("appliedCard", "✓ Applied — go play!");
    card.querySelector(".name").textContent = s.name;
    card.querySelector(".cat").textContent =
      (s.likes ? `♥ ${s.likes} · ` : "") + s.category;
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
      // on the Favorites chip an unstarred card leaves the pool immediately
      if (activeFilter === "favorites") renderGrid();
    });
    card.addEventListener("click", () => {
      pick(card);
      state.csSkin = s.id;
      chrome.storage.sync.set({ csSkin: s.id, csEnabled: true });
      trackRecent(s.id);
      renderSelection();
    });
    grid.appendChild(card);
  }
  // stagger index for the one-time slap entrance (see body.entering in the CSS)
  [...grid.children].forEach((el, i) => el.style.setProperty("--i", Math.min(i, 10)));
  renderSelection();
}

function initChips() {
  const chips = document.querySelectorAll("#chips .chip");
  for (const chip of chips) {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      for (const c of chips) c.classList.toggle("active", c === chip);
      renderGrid();
    });
  }
}

// category dropdown: All + the unique categories of the index, curated order.
// Sticker Club listbox — chip-styled #catSel trigger + #catMenu popover.
// Focus stays on the trigger; arrows move the active option (combobox-style).
function initCategorySelect() {
  const btn = document.getElementById("catSel");
  const menu = document.getElementById("catMenu");
  const cats = ["all", ...new Set(skins.map((s) => s.category).filter(Boolean))];
  const labelFor = (c) => (c === "all" ? t("catAll", "All") : c); // categories shown as-is (English)
  let open = false;
  let active = 0;

  cats.forEach((cat, i) => {
    const opt = document.createElement("div");
    opt.className = "opt";
    opt.id = "catOpt" + i;
    opt.setAttribute("role", "option");
    opt.textContent = labelFor(cat);
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      choose(i);
    });
    menu.appendChild(opt);
  });

  function paint() {
    [...menu.children].forEach((el, i) => {
      el.setAttribute("aria-selected", String(cats[i] === activeCategory));
      el.classList.toggle("active-opt", i === active);
    });
    btn.setAttribute("aria-activedescendant", open ? "catOpt" + active : "");
  }

  function setOpen(next) {
    open = next;
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    if (open) {
      active = Math.max(0, cats.indexOf(activeCategory));
      paint();
    }
  }

  function choose(i) {
    activeCategory = cats[i];
    btn.textContent = labelFor(cats[i]);
    setOpen(false);
    renderGrid();
    btn.focus();
  }

  btn.textContent = labelFor("all");
  btn.addEventListener("click", () => setOpen(!open));
  // options aren't focusable: keep focus on the trigger while clicking them,
  // so the blur below only fires on a genuine tab/click-away
  menu.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("blur", () => setOpen(false));
  btn.addEventListener("keydown", (e) => {
    if (!open) {
      // Enter/Space fall through to the native button click
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, cats.length - 1); paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); paint(); }
    else if (e.key === "Home") { e.preventDefault(); active = 0; paint(); }
    else if (e.key === "End") { e.preventDefault(); active = cats.length - 1; paint(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
  });
  document.addEventListener("click", (e) => {
    if (open && !e.target.closest("#catWrap")) setOpen(false);
  });
}

/* ---------------- board themes ---------------- */

const boardGrid = document.getElementById("boardGrid");
let boards = [];

function boardColors(id) {
  const b = (id && id.startsWith(CUSTOM_PREFIX))
    ? customBoards[id.slice(CUSTOM_PREFIX.length)]
    : boards.find((x) => x.id === id);
  return (b && b.colors && b.colors.light && b.colors.dark) ? b.colors : CLASSIC;
}

// the skin-card previews use --sq-l/--sq-d, so tinting the root retints them all
function applyBoardColors() {
  const c = boardColors(state.csBoard);
  document.documentElement.style.setProperty("--sq-l", c.light);
  document.documentElement.style.setProperty("--sq-d", c.dark);
}

function renderBoardSelection() {
  for (const card of boardGrid.children) {
    card.classList.toggle("selected", card.dataset.id === (state.csBoard || "default"));
  }
}

function renderBoards() {
  boardGrid.innerHTML = "";
  // Site Default pinned first, then custom boards, then the catalog
  const customEntries = Object.entries(customBoards)
    .filter(([, b]) => b && b.board)
    .map(([cid, b]) => ({
      id: CUSTOM_PREFIX + cid,
      name: b.name || t("customName", "My Custom Skin"),
      tagline: b.tagline || "",
      _customSvg: b.board,
    }));
  const entries = [
    { id: "default", name: t("boardDefaultName", "Site Default"), tagline: t("boardDefaultTag", "Whatever the site says."), _none: true },
    ...customEntries,
    ...boards,
  ];
  for (const b of entries) {
    const card = document.createElement("div");
    card.className = "bcard";
    card.dataset.id = b.id;
    card.title = b.tagline || ""; // tooltip = tagline only; labels show name + tagline
    card.innerHTML = `<div class="bpreview"></div><div class="bname"></div><div class="btag"></div>`;
    card.querySelector(".bname").textContent = b.name; // may be user-supplied
    card.querySelector(".btag").textContent = b.tagline || "\u00a0"; // nbsp keeps tile heights even
    // 2x3 whole-square crop from a8 — CSS sets size (800%/3) + top-left origin.
    // Set via the style property: the svg data-URI would break an inline attribute.
    const prev = card.querySelector(".bpreview");
    if (b._none) {
      prev.classList.add("bdefault"); // diagonal lichess/chess.com split, drawn in CSS
    } else if (b._customSvg) {
      prev.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(b._customSvg)}")`;
    } else {
      prev.style.backgroundImage = `url('boards/${b.id}/board.svg')`;
    }
    card.addEventListener("click", () => {
      pick(card);
      state.csBoard = b.id;
      const patch = { csBoard: b.id, csEnabled: true };
      if (b.id !== "default" && !b.id.startsWith(CUSTOM_PREFIX)) {
        boardRecents = [b.id, ...boardRecents.filter((r) => r !== b.id)].slice(0, 6);
        patch.csBoardRecents = boardRecents;
      }
      chrome.storage.sync.set(patch);
      renderBoardSelection();
      applyBoardColors();
    });
    boardGrid.appendChild(card);
  }
  // stagger index for the one-time slap entrance (see body.entering in the CSS)
  [...boardGrid.children].forEach((el, i) => el.style.setProperty("--i", Math.min(i, 10)));
  renderBoardSelection();
}

/* ---------------- init ---------------- */

async function init() {
  await migrateLegacyCustom();
  const [idx, bidx, stored, local] = await Promise.all([
    fetch(chrome.runtime.getURL("skins/index.json")).then((r) => r.json()),
    fetch(chrome.runtime.getURL("boards/index.json")).then((r) => r.json()).catch(() => []),
    chrome.storage.sync.get({ ...DEFAULTS, csBoard: "default", csFavorites: [], csRecents: [], csBoardRecents: [] }),
    chrome.storage.local.get({ csCustomSkins: {}, csCustomBoards: {} }),
  ]);
  skins = idx.map((s, i) => ({ ...s, _idx: i }));
  boards = bidx;
  state = stored;
  customSkins = local.csCustomSkins || {};
  customBoards = local.csCustomBoards || {};
  favorites = stored.csFavorites;
  recents = stored.csRecents;
  boardRecents = stored.csBoardRecents;
  search.addEventListener("input", renderGrid);
  initChips();
  initCategorySelect();
  applyBoardColors();
  renderGrid();
  renderBoards();
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === "local") {
      if (ch.csCustomSkins) {
        customSkins = ch.csCustomSkins.newValue || {};
        renderGrid();
      }
      if (ch.csCustomBoards) {
        customBoards = ch.csCustomBoards.newValue || {};
        renderBoards();
        applyBoardColors();
      }
      return;
    }
    if (area !== "sync") return;
    if (ch.csSkin) { state.csSkin = ch.csSkin.newValue; renderSelection(); }
    if (ch.csBoard) {
      state.csBoard = ch.csBoard.newValue;
      renderBoardSelection();
      applyBoardColors();
    }
    // favorites toggled elsewhere (e.g. the popup): flip star colors in
    // place — cards must not shift — except on the Favorites chip, where
    // the pool itself changes and a re-render is the point
    if (ch.csFavorites) {
      favorites = ch.csFavorites.newValue || [];
      if (activeFilter === "favorites") {
        renderGrid();
      } else {
        for (const card of grid.children) {
          const star = card.querySelector(".star");
          if (star) star.classList.toggle("faved", favorites.includes(card.dataset.id));
        }
      }
    }
  });

  // entrance is one-time: drop the scope class once the slap stagger is done
  requestAnimationFrame(() => setTimeout(() => document.body.classList.remove("entering"), 900));
}

init();
