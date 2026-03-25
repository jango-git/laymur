/**
 * assets.js
 *
 * Asset management: IndexedDB persistence, Assets tab UI.
 */

import { state } from "./state.js";
import { ELEMENT_REGISTRY_MAP } from "./element-registry.js";

function isAssetUsed(assetId) {
  for (const layer of state.layers) {
    for (const el of layer.elements) {
      const descriptor = ELEMENT_REGISTRY_MAP.get(el.type);
      if (!descriptor) continue;
      for (const field of descriptor.fields) {
        if (field.fieldType === "asset" && el.fieldValues[field.key] === assetId) return true;
      }
    }
  }
  return false;
}

// IndexedDB helpers

const DB_NAME = "laymur-assets";
const DB_VERSION = 1;
const STORE_NAME = "textures";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function databasePut(record) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function databaseGetAll() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function databaseDelete(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Blob helpers

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// State helpers

async function registerAsset(id, name, blob) {
  if (state.assets[id]?.url) {
    URL.revokeObjectURL(state.assets[id].url);
  }
  const url = URL.createObjectURL(blob);
  const dataURL = await blobToDataURL(blob);
  state.assets[id] = { name, url, dataURL };
}

function unregisterAsset(id) {
  if (state.assets[id]?.url) {
    URL.revokeObjectURL(state.assets[id].url);
  }
  delete state.assets[id];
}

// Public: load all persisted assets into state on startup

/**
 * Adds an asset from a data URL (used when loading a scene from JSON).
 * Merges into state.assets and persists to IndexedDB (replaces if id already exists).
 */
export async function addAssetFromDataURL(id, name, dataURL) {
  try {
    const response = await fetch(dataURL);
    const blob = await response.blob();
    await databasePut({ id, name, blob });
    await registerAsset(id, name, blob);
  } catch (error) {
    console.warn(`[assets] Failed to add asset "${id}" from dataURL:`, error);
  }
}

export async function loadAssetsIntoState() {
  try {
    const records = await databaseGetAll();
    for (const { id, name, blob } of records) {
      await registerAsset(id, name, blob);
    }
  } catch (error) {
    console.warn("[assets] Failed to load from IndexedDB:", error);
  }
}

// Assets tab UI

let onAssetsChangeCallback = () => {};
let assetsTabGrid = null;

export function setupAssetsTab({ onAssetsChange }) {
  onAssetsChangeCallback = onAssetsChange;
  assetsTabGrid = document.getElementById("assets-grid");

  document.getElementById("button-add-asset").addEventListener("click", () => {
    document.getElementById("input-asset-file").click();
  });

  document.getElementById("input-asset-file").addEventListener("change", async (event) => {
    const files = Array.from(event.target.files);
    event.target.value = "";
    for (const file of files) {
      await addAssetFromFile(file);
    }
    renderAssetsTab();
    onAssetsChangeCallback();
  });
}

async function addAssetFromFile(file, overrideId) {
  const defaultId = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const assetId = overrideId ?? defaultId;
  try {
    await databasePut({ id: assetId, name: file.name, blob: file });
    await registerAsset(assetId, file.name, file);
  } catch (error) {
    console.warn(`[assets] Failed to add asset "${assetId}":`, error);
  }
}

export function renderAssetsTab() {
  if (!assetsTabGrid) return;
  assetsTabGrid.innerHTML = "";

  const entries = Object.entries(state.assets);
  if (entries.length === 0) {
    const p = document.createElement("p");
    p.className = "placeholder-text";
    p.textContent = "No assets. Click + Add Texture to import images.";
    assetsTabGrid.appendChild(p);
    return;
  }

  for (const [id, meta] of entries) {
    assetsTabGrid.appendChild(buildAssetCard(id, meta));
  }
}

function buildAssetCard(id, meta) {
  const card = document.createElement("div");
  card.className = "asset-card";

  const thumbnail = document.createElement("img");
  thumbnail.src = meta.url;
  thumbnail.className = "asset-card-thumb";
  thumbnail.title = "Click to replace";
  thumbnail.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      await addAssetFromFile(file, id);
      renderAssetsTab();
      onAssetsChangeCallback();
    });
    fileInput.click();
  });

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = meta.name;
  nameInput.className = "asset-card-name";
  nameInput.title = `Asset ID: ${id}`;
  nameInput.readOnly = true;

  const deleteButton = document.createElement("button");
  deleteButton.className = "button-icon button-danger asset-card-delete";
  deleteButton.textContent = "✕";
  deleteButton.title = "Remove asset";
  deleteButton.addEventListener("click", async () => {
    if (isAssetUsed(id)) {
      deleteButton.style.color = "var(--danger)";
      deleteButton.title = "In use - remove element first";
      setTimeout(() => {
        deleteButton.style.color = "";
        deleteButton.title = "Remove asset";
      }, 2000);
      return;
    }
    await databaseDelete(id);
    unregisterAsset(id);
    renderAssetsTab();
    onAssetsChangeCallback();
  });

  card.appendChild(thumbnail);
  card.appendChild(nameInput);
  card.appendChild(deleteButton);
  return card;
}

async function renameAsset(oldId, newId) {
  const records = await databaseGetAll();
  const record = records.find((entry) => entry.id === oldId);
  if (!record) return;
  await databasePut({ ...record, id: newId });
  await databaseDelete(oldId);
  state.assets[newId] = state.assets[oldId];
  delete state.assets[oldId];
}
