/**
 * layer.js
 *
 * Layers tab: manage multiple UIFullscreenLayer instances.
 * Each layer has its own name, resize policy, elements, and constraints.
 * Only one layer is active (rendered) at a time.
 */

import { state, generateLayerId, activeLayer } from "./state.js";
import { makeSortable } from "./sortable.js";

const POLICY_REGISTRY = {
  none: { label: "None", params: [] },
  cover: {
    label: "Cover",
    params: [
      { key: "rectWidth", label: "Rect Width", default: 1920 },
      { key: "rectHeight", label: "Rect Height", default: 1080 },
    ],
  },
  fit: {
    label: "Fit",
    params: [
      { key: "rectWidth", label: "Rect Width", default: 1920 },
      { key: "rectHeight", label: "Rect Height", default: 1080 },
    ],
  },
  cross: { label: "Cross", params: [] },
  crossInverted: { label: "Cross Inverted", params: [] },
  fixedWidth: {
    label: "Fixed Width",
    params: [
      { key: "fixedWidthLandscape", label: "Landscape W", default: 1920 },
      { key: "fixedWidthPortrait", label: "Portrait W", default: 1080 },
    ],
  },
  fixedHeight: {
    label: "Fixed Height",
    params: [
      { key: "fixedHeightLandscape", label: "Landscape H", default: 1080 },
      { key: "fixedHeightPortrait", label: "Portrait H", default: 1920 },
    ],
  },
};

function defaultParams(policyType) {
  return Object.fromEntries(POLICY_REGISTRY[policyType].params.map((p) => [p.key, p.default]));
}

/** @type {HTMLIFrameElement | null} */
let frameRef = null;
let onLayerChangeCallback = () => {};

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupLayerTab({ frame, onLayerChange }) {
  frameRef = frame;
  onLayerChangeCallback = onLayerChange ?? (() => {});

  if (frame.contentDocument?.readyState === "complete") {
    _initializePreview();
  } else {
    frame.addEventListener("load", () => _initializePreview(), { once: true });
  }
}

function _initializePreview() {
  for (const layer of state.layers) {
    _postAddLayer(layer);
  }
  _postSetActiveLayer(state.activeLayerId);
}

/** Public: re-sends ADD_LAYER + SET_ACTIVE_LAYER for all current state layers. */
export function initializePreview() {
  _initializePreview();
}

// ─── Preview messages ─────────────────────────────────────────────────────────

function _postAddLayer(layer) {
  if (!frameRef) return;
  frameRef.contentWindow.postMessage(
    {
      type: "ADD_LAYER",
      layerId: layer.id,
      name: layer.name,
      policyType: layer.policyType,
      policyParams: { ...layer.policyParams },
    },
    "*",
  );
}

function _postSetActiveLayer(layerId) {
  if (!frameRef) return;
  frameRef.contentWindow.postMessage({ type: "SET_ACTIVE_LAYER", layerId }, "*");
}

function _postLayerConfig(layer) {
  if (!frameRef) return;
  frameRef.contentWindow.postMessage(
    {
      type: "SET_LAYER_CONFIG",
      layerId: layer.id,
      name: layer.name,
      policyType: layer.policyType,
      policyParams: { ...layer.policyParams },
    },
    "*",
  );
}

function _postRemoveLayer(layerId) {
  if (!frameRef) return;
  frameRef.contentWindow.postMessage({ type: "REMOVE_LAYER", layerId }, "*");
}

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderLayerTab() {
  const container = document.getElementById("layers-list");
  if (!container) return;
  container.innerHTML = "";

  for (const layer of state.layers) {
    container.appendChild(_buildLayerCard(layer));
  }

  if (state.layers.length > 1) {
    makeSortable(container, (fromIndex, toIndex) => {
      const [moved] = state.layers.splice(fromIndex, 1);
      state.layers.splice(toIndex, 0, moved);
      renderLayerTab();
    });
  }
}

function _buildLayerCard(layer) {
  const isActive = layer.id === state.activeLayerId;

  const card = document.createElement("div");
  card.className = "layer-card" + (isActive ? " layer-card-active" : "");
  card.draggable = true;

  // ── Header: activate button + delete button ───────────────────────────────
  const header = document.createElement("div");
  header.className = "layer-card-header";

  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⠿";

  const activateBtn = document.createElement("button");
  activateBtn.className = "layer-activate-btn" + (isActive ? " is-active" : "");
  activateBtn.title = isActive ? "Active layer" : "Set as active layer";
  activateBtn.disabled = isActive;
  activateBtn.addEventListener("click", () => {
    state.activeLayerId = layer.id;
    _postSetActiveLayer(layer.id);
    renderLayerTab();
    onLayerChangeCallback();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "button-icon button-danger";
  deleteBtn.textContent = "✕";
  deleteBtn.title = "Remove layer";
  deleteBtn.disabled = state.layers.length <= 1;
  deleteBtn.addEventListener("click", () => {
    const idx = state.layers.indexOf(layer);
    state.layers.splice(idx, 1);
    if (state.activeLayerId === layer.id) {
      const next = state.layers[Math.max(0, idx - 1)];
      state.activeLayerId = next.id;
      _postSetActiveLayer(next.id);
    }
    _postRemoveLayer(layer.id);
    renderLayerTab();
    onLayerChangeCallback();
  });

  header.appendChild(dragHandle);
  header.appendChild(activateBtn);
  header.appendChild(deleteBtn);
  card.appendChild(header);

  // ── Fields ────────────────────────────────────────────────────────────────
  const fields = document.createElement("div");
  fields.className = "layer-card-fields";

  // Name row
  const nameRow = document.createElement("div");
  nameRow.className = "layer-field-row";
  const nameLabel = document.createElement("span");
  nameLabel.className = "add-field-label";
  nameLabel.textContent = "Name";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "param-input layer-name-input";
  nameInput.value = layer.name;
  nameInput.addEventListener("change", (e) => {
    const newName = e.target.value.trim();
    if (!newName) {
      e.target.value = layer.name;
      return;
    }
    if (state.layers.some((l) => l.id !== layer.id && l.name === newName)) {
      e.target.value = layer.name;
      return;
    }
    layer.name = newName;
    _postLayerConfig(layer);
  });
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  fields.appendChild(nameRow);

  // Policy row
  const policyRow = document.createElement("div");
  policyRow.className = "layer-field-row";
  const policyLabel = document.createElement("span");
  policyLabel.className = "add-field-label";
  policyLabel.textContent = "Resize Policy";
  const policySelect = document.createElement("select");
  policySelect.className = "param-select";
  for (const [key, def] of Object.entries(POLICY_REGISTRY)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = def.label;
    if (key === layer.policyType) opt.selected = true;
    policySelect.appendChild(opt);
  }
  policyRow.appendChild(policyLabel);
  policyRow.appendChild(policySelect);
  fields.appendChild(policyRow);

  // Policy params
  const paramsSection = document.createElement("div");
  paramsSection.className = "layer-policy-params";
  _renderPolicyParams(paramsSection, layer, POLICY_REGISTRY[layer.policyType]);
  fields.appendChild(paramsSection);

  policySelect.addEventListener("change", (e) => {
    layer.policyType = e.target.value;
    layer.policyParams = defaultParams(layer.policyType);
    _renderPolicyParams(paramsSection, layer, POLICY_REGISTRY[layer.policyType]);
    _postLayerConfig(layer);
  });

  card.appendChild(fields);
  return card;
}

function _renderPolicyParams(container, layer, policy) {
  container.innerHTML = "";
  for (const paramDef of policy.params) {
    if (!(paramDef.key in layer.policyParams)) {
      layer.policyParams[paramDef.key] = paramDef.default;
    }
    const row = document.createElement("div");
    row.className = "layer-field-row";
    const label = document.createElement("span");
    label.className = "add-field-label";
    label.textContent = paramDef.label;
    const input = document.createElement("input");
    input.type = "number";
    input.className = "param-input";
    input.value = layer.policyParams[paramDef.key];
    input.dataset.key = paramDef.key;
    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);

    input.addEventListener("change", (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val > 0) {
        layer.policyParams[paramDef.key] = val;
        _postLayerConfig(layer);
      }
    });
  }
}

// ─── Add-layer form ───────────────────────────────────────────────────────────

export function renderAddLayerForm() {
  const container = document.getElementById("add-layer-row");
  if (!container) return;
  container.innerHTML = "";

  // Name input
  const nameRow = document.createElement("div");
  nameRow.className = "layer-field-row";
  const nameLabel = document.createElement("span");
  nameLabel.className = "add-field-label";
  nameLabel.textContent = "Name";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "param-input";
  nameInput.placeholder = "Layer name";
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  container.appendChild(nameRow);

  // Policy select
  const policyRow = document.createElement("div");
  policyRow.className = "layer-field-row";
  const policyLabel = document.createElement("span");
  policyLabel.className = "add-field-label";
  policyLabel.textContent = "Resize Policy";
  const policySelect = document.createElement("select");
  policySelect.className = "param-select";
  for (const [key, def] of Object.entries(POLICY_REGISTRY)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = def.label;
    policySelect.appendChild(opt);
  }
  policyRow.appendChild(policyLabel);
  policyRow.appendChild(policySelect);
  container.appendChild(policyRow);

  // Policy params (dynamic)
  const paramsSection = document.createElement("div");
  paramsSection.className = "layer-policy-params";
  let addParams = defaultParams(policySelect.value);
  _renderAddFormParams(paramsSection, policySelect.value, addParams);
  container.appendChild(paramsSection);

  policySelect.addEventListener("change", () => {
    addParams = defaultParams(policySelect.value);
    _renderAddFormParams(paramsSection, policySelect.value, addParams);
    _syncAddButton(addBtn, nameInput);
  });

  // Add button
  const addBtn = document.createElement("button");
  addBtn.className = "button-primary button-full";
  addBtn.textContent = "+ Add Layer";
  addBtn.disabled = true;

  nameInput.addEventListener("input", () => _syncAddButton(addBtn, nameInput));

  addBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name || state.layers.some((l) => l.name === name)) return;

    // Collect current param values from inputs
    const policyParams = { ...addParams };
    for (const input of paramsSection.querySelectorAll("input[data-key]")) {
      const val = parseFloat(input.value);
      if (!isNaN(val) && val > 0) policyParams[input.dataset.key] = val;
    }

    const id = generateLayerId();
    const newLayer = {
      id,
      name,
      policyType: policySelect.value,
      policyParams,
      elements: [],
      constraints: [],
    };

    state.layers.push(newLayer);
    state.activeLayerId = id;

    _postAddLayer(newLayer);
    _postSetActiveLayer(id);

    renderLayerTab();
    renderAddLayerForm();
    onLayerChangeCallback();
  });

  container.appendChild(addBtn);
}

function _renderAddFormParams(container, policyType, params) {
  container.innerHTML = "";
  for (const paramDef of POLICY_REGISTRY[policyType].params) {
    if (!(paramDef.key in params)) params[paramDef.key] = paramDef.default;
    const row = document.createElement("div");
    row.className = "layer-field-row";
    const label = document.createElement("span");
    label.className = "add-field-label";
    label.textContent = paramDef.label;
    const input = document.createElement("input");
    input.type = "number";
    input.className = "param-input";
    input.value = params[paramDef.key];
    input.dataset.key = paramDef.key;
    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
    input.addEventListener("change", (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val > 0) params[paramDef.key] = val;
    });
  }
}

function _syncAddButton(btn, nameInput) {
  const name = nameInput.value.trim();
  const duplicate = state.layers.some((l) => l.name === name);
  btn.disabled = !name || duplicate;
}
