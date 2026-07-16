const DEFAULTS = {
  csEnabled: true,
  csSkin: "goofball",
  csSiteLichess: true,
  csSiteChess: true,
};
const CUSTOM_ID = "__custom__";
const STRIP = ["wK", "wQ", "wR", "wB", "wN", "wP"];

const grid = document.getElementById("grid");
const chipsEl = document.getElementById("chips");
const master = document.getElementById("master");

let state = { ...DEFAULTS };
let activeCat = "All";
let skins = [];
let customSkin = null;

function renderSelection() {
  document.body.classList.toggle("off", !state.csEnabled);
  for (const card of grid.children) {
    card.classList.toggle("selected", card.dataset.id === state.csSkin);
  }
}

function select(id) {
  state.csSkin = id;
  chrome.storage.sync.set({ csSkin: id });
  if (id !== CUSTOM_ID) {
    // keep the gallery's "Recent" row in sync
    chrome.storage.sync.get({ csRecents: [] }, ({ csRecents }) => {
      chrome.storage.sync.set({ csRecents: [id, ...csRecents.filter((r) => r !== id)].slice(0, 6) });
    });
  }
  renderSelection();
}

function makeCard({ id, name, tagline, imgFor, badge }) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = id;
  card.title = tagline;
  const duo = `
    <div class="duo">
      <div class="sq"><img src="${imgFor("wN")}" alt=""></div>
      <div class="sq"><img src="${imgFor("bQ")}" alt=""></div>
    </div>
    <div class="strip">${STRIP.map((c) => `<div class="sq"><img src="${imgFor(c)}" alt=""></div>`).join("")}</div>`;
  card.innerHTML = `${duo}<div class="name"></div><div class="tag"></div>`;
  card.querySelector(".name").innerHTML = badge ? `${name} <span class="badge">${badge}</span>` : "";
  if (!badge) card.querySelector(".name").textContent = name;
  card.querySelector(".tag").textContent = tagline;
  card.addEventListener("click", () => select(id));
  return card;
}

function renderGrid() {
  grid.innerHTML = "";
  if (customSkin && (activeCat === "All" || activeCat === "Yours")) {
    grid.appendChild(
      makeCard({
        id: CUSTOM_ID,
        name: customSkin.name || "My Custom Skin",
        tagline: customSkin.tagline || "Made by you, with a little AI help.",
        badge: "YOURS",
        imgFor: (c) => "data:image/svg+xml," + encodeURIComponent(customSkin.pieces[c]),
      })
    );
  }
  for (const s of skins) {
    if (activeCat !== "All" && activeCat !== "Yours" && s.category !== activeCat) continue;
    if (activeCat === "Yours") continue;
    grid.appendChild(
      makeCard({ ...s, imgFor: (c) => `skins/${s.id}/${c}.svg` })
    );
  }
  renderSelection();
}

function renderChips() {
  const cats = ["All", ...new Set(skins.map((s) => s.category))];
  if (customSkin) cats.splice(1, 0, "Yours");
  chipsEl.innerHTML = "";
  for (const c of cats) {
    const b = document.createElement("button");
    b.className = "chip" + (c === activeCat ? " active" : "");
    b.textContent = c;
    b.addEventListener("click", () => {
      activeCat = c;
      renderChips();
      renderGrid();
    });
    chipsEl.appendChild(b);
  }
}

async function init() {
  const [idx, stored, local] = await Promise.all([
    fetch(chrome.runtime.getURL("skins/index.json")).then((r) => r.json()),
    chrome.storage.sync.get(DEFAULTS),
    chrome.storage.local.get("csCustomSkin"),
  ]);
  skins = idx;
  state = stored;
  customSkin = local.csCustomSkin || null;

  master.checked = state.csEnabled;
  master.addEventListener("change", () => {
    state.csEnabled = master.checked;
    chrome.storage.sync.set({ csEnabled: master.checked });
    renderSelection();
  });

  for (const [id, key] of [["siteLichess", "csSiteLichess"], ["siteChess", "csSiteChess"]]) {
    const box = document.getElementById(id);
    box.checked = state[key];
    box.addEventListener("change", () => {
      state[key] = box.checked;
      chrome.storage.sync.set({ [key]: box.checked });
    });
  }

  document.getElementById("openGallery").addEventListener("click", () =>
    chrome.tabs.create({ url: chrome.runtime.getURL("gallery.html") })
  );
  document.getElementById("openCreate").addEventListener("click", () =>
    chrome.tabs.create({ url: chrome.runtime.getURL("gallery.html#create") })
  );

  renderChips();
  renderGrid();
}

init();
