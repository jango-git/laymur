/**
 * element-picker.js
 *
 * Modal element picker with search filter.
 * Items can show a texture thumbnail (for UIImage elements) or a placeholder.
 *
 * Usage:
 *   const id = await openElementPicker(items, currentId, excludeId);
 *
 * Each item: { id: string, name: string, type: string|null, fieldValues?: object }
 * Special item: { id: "layer", name: "Layer", type: null }
 */

import { state } from "./state.js";

let _resolve = null;
let _modal = null;
let _items = [];
let _currentId = null;
let _excludeId = null;

function _ensureModal() {
  if (_modal) return;

  _modal = document.createElement("div");
  _modal.id = "element-picker-modal";
  _modal.innerHTML = `
    <div class="ep-backdrop"></div>
    <div class="ep-popup">
      <div class="ep-header">
        <input type="text" class="param-input ep-search" placeholder="Search…" />
        <button class="button-icon button-danger ep-close">✕</button>
      </div>
      <div class="ep-list"></div>
    </div>
  `;
  document.body.appendChild(_modal);

  _modal.querySelector(".ep-backdrop").addEventListener("click", () => _close(null));
  _modal.querySelector(".ep-close").addEventListener("click", () => _close(null));
  _modal.querySelector(".ep-search").addEventListener("input", (e) => {
    _renderList(e.target.value.toLowerCase());
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

function _buildThumb(item) {
  if (item.type === "UIImage") {
    const assetId = item.fieldValues?.assetId;
    const meta = state.assets[assetId];
    if (meta?.url) {
      const img = document.createElement("img");
      img.src = meta.url;
      img.className = "ep-item-thumb";
      return img;
    }
  }
  const ph = document.createElement("div");
  ph.className = "ep-item-thumb ep-item-thumb-ph";
  ph.textContent = item.id === "layer" ? "⬡" : "□";
  return ph;
}

function _renderList(filter) {
  const list = _modal.querySelector(".ep-list");
  list.innerHTML = "";

  const filtered = _items.filter(
    (item) => item.id !== _excludeId && (!filter || item.name.toLowerCase().includes(filter)),
  );

  if (filtered.length === 0) {
    const p = document.createElement("p");
    p.className = "placeholder-text";
    p.style.padding = "20px 16px";
    p.textContent = filter ? "No matches." : "No items.";
    list.appendChild(p);
    return;
  }

  for (const item of filtered) {
    const row = document.createElement("div");
    row.className = "ep-item" + (item.id === _currentId ? " ep-item-selected" : "");
    row.appendChild(_buildThumb(item));

    const info = document.createElement("div");
    info.className = "ep-item-info";

    const name = document.createElement("span");
    name.className = "ep-item-name";
    name.textContent = item.name;
    info.appendChild(name);

    if (item.type) {
      const typeSpan = document.createElement("span");
      typeSpan.className = "ep-item-type";
      typeSpan.textContent = item.type;
      info.appendChild(typeSpan);
    }

    row.appendChild(info);
    row.addEventListener("click", () => _close(item.id));
    list.appendChild(row);
  }
}

/**
 * Opens the element picker popup.
 * @param {Array<{id:string, name:string, type:string|null, fieldValues?:object}>} items
 * @param {string|null} currentId - currently selected id (highlighted)
 * @param {string|null} excludeId - id to exclude from the list
 * @returns {Promise<string|null>} resolves with selected id, or null if cancelled
 */
export function openElementPicker(items, currentId, excludeId = null) {
  _ensureModal();
  _items = items;
  _currentId = currentId;
  _excludeId = excludeId;
  _modal.querySelector(".ep-search").value = "";
  _renderList("");
  _modal.style.display = "flex";
  return new Promise((resolve) => {
    _resolve = resolve;
  });
}
