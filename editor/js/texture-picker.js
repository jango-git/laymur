/**
 * texture-picker.js
 *
 * Modal texture picker with search filter.
 * Usage: const id = await openTexturePicker(state.assets, currentAssetId);
 */

let _resolve = null;
let _modal = null;
let _assets = {};
let _currentId = null;

function _ensureModal() {
  if (_modal) return;

  _modal = document.createElement("div");
  _modal.id = "texture-picker-modal";
  _modal.innerHTML = `
    <div class="tp-backdrop"></div>
    <div class="tp-popup">
      <div class="tp-header">
        <input type="text" class="param-input tp-search" placeholder="Search textures…" />
        <button class="button-icon button-danger tp-close">✕</button>
      </div>
      <div class="tp-grid" id="tp-grid"></div>
    </div>
  `;
  document.body.appendChild(_modal);

  _modal.querySelector(".tp-backdrop").addEventListener("click", () => _close(null));
  _modal.querySelector(".tp-close").addEventListener("click", () => _close(null));
  _modal.querySelector(".tp-search").addEventListener("input", (e) => {
    _renderGrid(e.target.value.toLowerCase());
  });
}

function _close(id) {
  if (!_modal) return;
  _modal.style.display = "none";
  if (_resolve) {
    _resolve(id);
    _resolve = null;
  }
}

function _renderGrid(filter) {
  const grid = _modal.querySelector(".tp-grid");
  grid.innerHTML = "";

  const entries = Object.entries(_assets).filter(
    ([, meta]) => !filter || meta.name.toLowerCase().includes(filter),
  );

  if (entries.length === 0) {
    const p = document.createElement("p");
    p.className = "placeholder-text";
    p.textContent = filter ? "No matching textures." : "No textures.";
    grid.appendChild(p);
    return;
  }

  for (const [id, meta] of entries) {
    const item = document.createElement("div");
    item.className = "tp-item" + (id === _currentId ? " tp-item-selected" : "");

    const img = document.createElement("img");
    img.src = meta.url;
    img.loading = "lazy";

    const name = document.createElement("span");
    name.textContent = meta.name;

    item.appendChild(img);
    item.appendChild(name);
    item.addEventListener("click", () => _close(id));
    grid.appendChild(item);
  }
}

/**
 * Opens the texture picker popup.
 * @param {object} assets - state.assets map
 * @param {string|null} currentId - currently selected asset id (highlighted)
 * @returns {Promise<string|null>} resolves with selected asset id, or null if cancelled
 */
export function openTexturePicker(assets, currentId) {
  _ensureModal();
  _assets = assets;
  _currentId = currentId;

  _modal.querySelector(".tp-search").value = "";
  _renderGrid("");
  _modal.style.display = "flex";

  return new Promise((resolve) => {
    _resolve = resolve;
  });
}
