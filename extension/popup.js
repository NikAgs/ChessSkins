const DEFAULTS = { liskinsEnabled: true, liskinsSkin: "goofball" };
const grid = document.getElementById("grid");
const master = document.getElementById("master");

let state = { ...DEFAULTS };

function renderSelection() {
  document.body.classList.toggle("off", !state.liskinsEnabled);
  for (const card of grid.children) {
    card.classList.toggle("selected", card.dataset.id === state.liskinsSkin);
  }
}

async function init() {
  const [skins, stored] = await Promise.all([
    fetch(chrome.runtime.getURL("skins/index.json")).then((r) => r.json()),
    chrome.storage.sync.get(DEFAULTS),
  ]);
  state = stored;

  for (const s of skins) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = s.id;
    card.title = s.tagline;
    card.innerHTML = `
      <div class="duo">
        <div class="sq"><img src="skins/${s.id}/wN.svg" alt=""></div>
        <div class="sq"><img src="skins/${s.id}/bQ.svg" alt=""></div>
      </div>
      <div class="name"></div>
      <div class="tag"></div>`;
    card.querySelector(".name").textContent = s.name;
    card.querySelector(".tag").textContent = s.tagline;
    card.addEventListener("click", () => {
      state.liskinsSkin = s.id;
      chrome.storage.sync.set({ liskinsSkin: s.id });
      renderSelection();
    });
    grid.appendChild(card);
  }

  master.checked = state.liskinsEnabled;
  master.addEventListener("change", () => {
    state.liskinsEnabled = master.checked;
    chrome.storage.sync.set({ liskinsEnabled: master.checked });
    renderSelection();
  });

  renderSelection();
}

init();
