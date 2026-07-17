const DEFAULTS = {
  csEnabled: true,
  csSkin: "goofball",
  csBoard: "default",
  csSiteLichess: true,
  csSiteChess: true,
  csFavorites: [],
  csRecents: [],
  csBoardFavorites: [],
  csBoardRecents: [],
};
const CUSTOM_PREFIX = "__custom__:";
const CLASSIC = { light: "#f0d9b5", dark: "#b58863" };

const grid = document.getElementById("grid");
const boardsEl = document.getElementById("boards");

let state = { ...DEFAULTS };
let skins = [];
let boards = [];
let customSkins = {};   // { id: skinObj } from chrome.storage.local
let customBoards = {};  // { id: boardObj } from chrome.storage.local
let favorites = [], recents = [];
let boardFavorites = [], boardRecents = [];

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

/* ---- ordering: favorites (by recency, then curated), recents, rest curated ---- */

function orderItems(list, favs, recs) {
  const recIdx = (id) => {
    const i = recs.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  return list
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const fa = favs.includes(a.item.id), fb = favs.includes(b.item.id);
      if (fa !== fb) return fa ? -1 : 1;
      const ra = recIdx(a.item.id), rb = recIdx(b.item.id);
      if (ra !== rb) return ra - rb;
      return a.i - b.i;
    })
    .map((x) => x.item);
}

function makeStar(id, isFaved, onToggle) {
  const star = document.createElement("span");
  star.className = "star" + (isFaved(id) ? " faved" : "");
  star.textContent = "★";
  star.title = t("starTitle", "Favorite");
  star.addEventListener("click", (e) => {
    e.stopPropagation();
    onToggle(id);
    star.classList.toggle("faved", isFaved(id));
  });
  return star;
}

/* ---- board colors drive the duo squares via --sq-l / --sq-d ---- */

function boardColors(id) {
  const b = (id && id.startsWith(CUSTOM_PREFIX))
    ? customBoards[id.slice(CUSTOM_PREFIX.length)]
    : boards.find((x) => x.id === id);
  return (b && b.colors && b.colors.light && b.colors.dark) ? b.colors : CLASSIC;
}

function applyBoardColors() {
  const c = boardColors(state.csBoard);
  document.documentElement.style.setProperty("--sq-l", c.light);
  document.documentElement.style.setProperty("--sq-d", c.dark);
}

function renderSelection() {
  for (const card of grid.children) {
    card.classList.toggle("selected", card.dataset.id === state.csSkin);
  }
}

function renderBoardSelection() {
  for (const tile of boardsEl.children) {
    tile.classList.toggle("selected", tile.dataset.id === (state.csBoard || "default"));
  }
}

function select(id) {
  state.csSkin = id;
  state.csEnabled = true;
  chrome.storage.sync.set({ csSkin: id, csEnabled: true });
  if (!id.startsWith(CUSTOM_PREFIX)) {
    // catalog recents only — custom skins are pinned at the top anyway
    recents = [id, ...recents.filter((r) => r !== id)].slice(0, 6);
    chrome.storage.sync.set({ csRecents: recents });
  }
  renderSelection();
}

function makeCard({ id, name, tagline, imgFor, badge, starrable = true }) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = id;
  card.title = tagline;
  card.innerHTML = `
    <div class="duo">
      <div class="sq"><img src="${imgFor("wN")}" alt=""></div>
      <div class="sq"><img src="${imgFor("bQ")}" alt=""></div>
    </div>
    <div class="name"></div>`;
  const nameEl = card.querySelector(".name");
  nameEl.textContent = name; // textContent only — name can be user-supplied JSON
  if (badge) {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = badge;
    nameEl.append(" ", b);
  }
  if (starrable) {
    card.prepend(
      makeStar(id, (i) => favorites.includes(i), (i) => {
        favorites = favorites.includes(i)
          ? favorites.filter((f) => f !== i)
          : [...favorites, i];
        chrome.storage.sync.set({ csFavorites: favorites });
      })
    );
  }
  card.addEventListener("click", () => select(id));
  return card;
}

function renderGrid() {
  grid.innerHTML = "";
  // custom skins pinned to the very top, regardless of favorites/recents
  for (const [cid, skin] of Object.entries(customSkins)) {
    if (!skin || !skin.pieces) continue;
    grid.appendChild(
      makeCard({
        id: CUSTOM_PREFIX + cid,
        name: skin.name || t("customName", "My Custom Skin"),
        tagline: skin.tagline || t("customTag", "Made by you, with a little AI help."),
        badge: t("badgeYours", "YOURS"),
        imgFor: (c) => "data:image/svg+xml," + encodeURIComponent(skin.pieces[c]),
        starrable: false,
      })
    );
  }
  for (const s of orderItems(skins, favorites, recents)) {
    grid.appendChild(makeCard({ ...s, imgFor: (c) => `skins/${s.id}/${c}.svg` }));
  }
  renderSelection();
}

function renderBoards() {
  boardsEl.innerHTML = "";
  const defaultTile = {
    id: "default",
    name: t("boardDefaultName", "Site Default"),
    tagline: t("boardDefaultTag", "Whatever the site says."),
    _none: true,
  };
  // "Site Default" pinned first, then custom boards, then the ordered catalog
  const customEntries = Object.entries(customBoards)
    .filter(([, b]) => b && b.board)
    .map(([cid, b]) => ({
      id: CUSTOM_PREFIX + cid,
      name: b.name || t("customName", "My Custom Skin"),
      tagline: b.tagline || "",
      _customSvg: b.board,
    }));
  const entries = [defaultTile, ...customEntries, ...orderItems(boards, boardFavorites, boardRecents)];
  for (const b of entries) {
    const tile = document.createElement("div");
    tile.className = "btile";
    tile.dataset.id = b.id;
    tile.title = b.tagline ? `${b.name} — ${b.tagline}` : b.name;
    const prev = document.createElement("div");
    prev.className = "bprev";
    // corner crop of the board art; the default tile is a classic checkerboard
    prev.style.background = b._none
      ? `repeating-conic-gradient(${CLASSIC.light} 0% 25%, ${CLASSIC.dark} 0% 50%) 0 0 / 38px 38px`
      : b._customSvg
        ? `url("data:image/svg+xml,${encodeURIComponent(b._customSvg)}") top left / 200% auto`
        : `url('boards/${b.id}/board.svg') top left / 200% auto`;
    const nameEl = document.createElement("div");
    nameEl.className = "bname";
    nameEl.textContent = b.name;
    tile.append(prev, nameEl);
    if (!b._none && !b._customSvg) {
      tile.prepend(
        makeStar(b.id, (i) => boardFavorites.includes(i), (i) => {
          boardFavorites = boardFavorites.includes(i)
            ? boardFavorites.filter((f) => f !== i)
            : [...boardFavorites, i];
          chrome.storage.sync.set({ csBoardFavorites: boardFavorites });
        })
      );
    }
    tile.addEventListener("click", () => {
      state.csBoard = b.id;
      state.csEnabled = true;
      const patch = { csBoard: b.id, csEnabled: true };
      if (b.id !== "default" && !b.id.startsWith(CUSTOM_PREFIX)) {
        boardRecents = [b.id, ...boardRecents.filter((r) => r !== b.id)].slice(0, 6);
        patch.csBoardRecents = boardRecents;
      }
      chrome.storage.sync.set(patch);
      renderBoardSelection();
      applyBoardColors();
    });
    boardsEl.appendChild(tile);
  }
  renderBoardSelection();
}

async function init() {
  await migrateLegacyCustom();
  const [idx, bidx, stored, local] = await Promise.all([
    fetch(chrome.runtime.getURL("skins/index.json")).then((r) => r.json()),
    fetch(chrome.runtime.getURL("boards/index.json")).then((r) => r.json()).catch(() => []),
    chrome.storage.sync.get(DEFAULTS),
    chrome.storage.local.get({ csCustomSkins: {}, csCustomBoards: {} }),
  ]);
  skins = idx;
  boards = bidx;
  state = stored;
  customSkins = local.csCustomSkins || {};
  customBoards = local.csCustomBoards || {};
  favorites = stored.csFavorites;
  recents = stored.csRecents;
  boardFavorites = stored.csBoardFavorites;
  boardRecents = stored.csBoardRecents;

  for (const [id, key] of [["siteLichess", "csSiteLichess"], ["siteChess", "csSiteChess"]]) {
    const box = document.getElementById(id);
    box.checked = state[key];
    box.addEventListener("change", () => {
      state[key] = box.checked;
      const patch = { [key]: box.checked };
      // turning a site on must never leave the user stranded on a dead master flag
      if (box.checked) {
        patch.csEnabled = true;
        state.csEnabled = true;
      }
      chrome.storage.sync.set(patch);
    });
  }

  document.getElementById("openGallery").addEventListener("click", () =>
    chrome.tabs.create({ url: chrome.runtime.getURL("gallery.html") })
  );
  document.getElementById("openCreate").addEventListener("click", () =>
    chrome.tabs.create({ url: chrome.runtime.getURL("create.html") })
  );

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
    if (ch.csSkin) {
      state.csSkin = ch.csSkin.newValue;
      renderSelection();
    }
    if (ch.csBoard) {
      state.csBoard = ch.csBoard.newValue;
      renderBoardSelection();
      applyBoardColors();
    }
    // favorites re-sort live (covers gallery changes and our own star clicks);
    // recency changes only update state — re-sorting on every select would
    // yank the just-clicked card out from under the cursor.
    if (ch.csRecents) recents = ch.csRecents.newValue || [];
    if (ch.csBoardRecents) boardRecents = ch.csBoardRecents.newValue || [];
    if (ch.csFavorites) {
      favorites = ch.csFavorites.newValue || [];
      renderGrid();
    }
    if (ch.csBoardFavorites) {
      boardFavorites = ch.csBoardFavorites.newValue || [];
      renderBoards();
    }
  });
}

init();
