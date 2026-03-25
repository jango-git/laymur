/**
 * elements.js
 *
 * Elements tab: dynamic add form + element list + preview sync.
 */

import { state, generateId, activeLayer, isNameTaken } from "./state.js";
import { ELEMENT_REGISTRY, ELEMENT_REGISTRY_MAP } from "./element-registry.js";
import { removeConstraintsForElement, renderConstraintsTab } from "./constraints.js";
import { makeSortable } from "./sortable.js";
import { openTexturePicker } from "./texture-picker.js";

/** @type {HTMLIFrameElement | null} */
let previewFrame = null;
let onElementsChangeCallback = () => {};

// ─── Setup ───────────────────────────────────────────────────────────────────

export function setupElementsTab({ frame, onElementsChange }) {
  previewFrame = frame;
  onElementsChangeCallback = onElementsChange;

  const typeSelect = document.getElementById("element-type-select");
  const nameInput = document.getElementById("element-name-input");

  // Populate type dropdown from registry
  for (const descriptor of ELEMENT_REGISTRY) {
    const option = document.createElement("option");
    option.value = descriptor.type;
    option.textContent = descriptor.type;
    typeSelect.appendChild(option);
  }

  // Re-render fields and re-validate whenever type changes
  typeSelect.addEventListener("change", () => {
    renderAddFields(typeSelect.value);
  });

  // Re-validate add button when name changes
  nameInput.addEventListener("input", () => {
    syncAddButton(ELEMENT_REGISTRY_MAP.get(typeSelect.value));
  });

  // Add button
  document.getElementById("add-element-button").addEventListener("click", () => {
    const type = typeSelect.value;
    const descriptor = ELEMENT_REGISTRY_MAP.get(type);
    if (!descriptor) return;

    const name = nameInput.value.trim();
    if (!name || isNameTaken(name, activeLayer())) return;

    const values = collectFieldValues(type);
    if (!validateFields(descriptor, values)) return;

    const id = generateId();
    const layer = activeLayer();
    layer.elements.push({ id, type, name, fieldValues: values });

    const message = descriptor.buildMessage(id, values, state.assets);
    previewFrame.contentWindow.postMessage({ ...message, layerId: layer.id }, "*");

    nameInput.value = "";
    renderElementsTab();
    syncAddButton(descriptor);
    onElementsChangeCallback();
  });

  // Initial field render for the first type in registry
  renderAddFields(typeSelect.value);
}

// ─── Dynamic add form ────────────────────────────────────────────────────────

export function renderAddFields(elementType) {
  const container = document.getElementById("add-element-fields");
  if (!container) return;

  container.innerHTML = "";

  const descriptor = ELEMENT_REGISTRY_MAP.get(elementType);
  if (!descriptor || descriptor.fields.length === 0) {
    syncAddButton(descriptor);
    return;
  }

  for (const field of descriptor.fields) {
    container.appendChild(buildFieldWidget(field));
  }

  syncAddButton(descriptor);
}

function buildFieldWidget(field) {
  const row = document.createElement("div");
  row.className = "add-field-row";

  const label = document.createElement("span");
  label.className = "add-field-label";
  label.textContent = field.label;

  const widget = createWidget(field);

  row.appendChild(label);
  row.appendChild(widget);
  return row;
}

function createWidget(field) {
  if (field.fieldType === "asset") {
    const btn = document.createElement("div");
    btn.className = "picker-btn";

    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.dataset.field = field.key;
    hidden.value = "";
    btn.appendChild(hidden);

    const display = document.createElement("div");
    display.className = "picker-btn-display";
    btn.appendChild(display);

    const updateDisplay = (assetId) => {
      display.innerHTML = "";
      const meta = assetId ? state.assets[assetId] : null;
      if (meta?.url) {
        const img = document.createElement("img");
        img.src = meta.url;
        img.className = "picker-btn-thumb";
        display.appendChild(img);
        const nameSp = document.createElement("span");
        nameSp.className = "picker-btn-name";
        nameSp.textContent = meta.name;
        display.appendChild(nameSp);
      } else {
        const ph = document.createElement("span");
        ph.className = "picker-btn-placeholder";
        ph.textContent = "Click to select texture…";
        display.appendChild(ph);
      }
    };

    updateDisplay(null);

    btn.addEventListener("click", async () => {
      if (Object.keys(state.assets).length === 0) return;
      const newId = await openTexturePicker(state.assets, hidden.value || null);
      if (!newId) return;
      hidden.value = newId;
      updateDisplay(newId);
      const descriptor = ELEMENT_REGISTRY_MAP.get(
        document.getElementById("element-type-select")?.value,
      );
      syncAddButton(descriptor);
    });

    hidden._updateDisplay = () => updateDisplay(hidden.value || null);

    return btn;
  }

  if (field.fieldType === "text") {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "param-input";
    input.dataset.field = field.key;
    if (field.default !== undefined) input.value = field.default;
    return input;
  }

  if (field.fieldType === "number") {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "param-input";
    input.dataset.field = field.key;
    if (field.default !== undefined) input.value = field.default;
    return input;
  }

  const span = document.createElement("span");
  span.className = "add-field-label";
  span.textContent = `[unknown field type: ${field.fieldType}]`;
  return span;
}

function syncAddButton(descriptor) {
  const button = document.getElementById("add-element-button");
  const nameInput = document.getElementById("element-name-input");

  if (!descriptor) {
    button.disabled = true;
    return;
  }

  const name = nameInput?.value.trim() ?? "";
  if (!name || isNameTaken(name, activeLayer())) {
    button.disabled = true;
    return;
  }

  const requiredAssetFields = descriptor.fields.filter((f) => f.fieldType === "asset" && f.required);
  if (requiredAssetFields.length === 0) {
    button.disabled = false;
    return;
  }
  const container = document.getElementById("add-element-fields");
  const allFilled = requiredAssetFields.every((f) => {
    const input = container?.querySelector(`[data-field="${f.key}"]`);
    return Boolean(input?.value);
  });
  button.disabled = !allFilled;
}

// ─── Field value helpers ──────────────────────────────────────────────────────

function collectFieldValues(elementType) {
  const descriptor = ELEMENT_REGISTRY_MAP.get(elementType);
  if (!descriptor) return {};

  const values = {};
  const container = document.getElementById("add-element-fields");

  for (const field of descriptor.fields) {
    const widget = container.querySelector(`[data-field="${field.key}"]`);
    values[field.key] = widget?.value ?? "";
  }

  return values;
}

function validateFields(descriptor, values) {
  for (const field of descriptor.fields) {
    if (field.required && !values[field.key]) return false;
  }
  return true;
}

export function refreshAddFields() {
  const typeSelect = document.getElementById("element-type-select");
  if (!typeSelect) return;

  const previousValues = collectFieldValues(typeSelect.value);
  renderAddFields(typeSelect.value);

  const container = document.getElementById("add-element-fields");
  for (const [key, value] of Object.entries(previousValues)) {
    const widget = container.querySelector(`[data-field="${key}"]`);
    if (widget && value) {
      widget.value = value;
      widget._updateDisplay?.();
    }
  }
}

// ─── Element list ─────────────────────────────────────────────────────────────

export function renderElementsTab() {
  const list = document.getElementById("elements-list");
  list.innerHTML = "";

  const elements = activeLayer().elements;

  if (elements.length === 0) {
    const p = document.createElement("p");
    p.className = "placeholder-text";
    p.textContent = "No elements. Add one below.";
    list.appendChild(p);
    return;
  }

  for (const element of elements) {
    list.appendChild(buildElementCard(element));
  }

  makeSortable(list, (fromIndex, toIndex) => {
    const layer = activeLayer();
    const [moved] = layer.elements.splice(fromIndex, 1);
    layer.elements.splice(toIndex, 0, moved);
    // Send ordered IDs so preview can update zIndices
    previewFrame.contentWindow.postMessage(
      {
        type: "REORDER_ELEMENTS",
        layerId: layer.id,
        orderedIds: layer.elements.map((e) => e.id),
      },
      "*",
    );
    renderElementsTab();
    onElementsChangeCallback();
  });
}

function buildElementCard(el) {
  const card = document.createElement("div");
  card.className = "element-card";
  card.draggable = true;

  // ── Header: drag handle + type badge + delete ─────────────────────────────
  const header = document.createElement("div");
  header.className = "element-card-header";

  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⠿";
  dragHandle.addEventListener("mousedown", (e) => e.stopPropagation());

  const typeSpan = document.createElement("span");
  typeSpan.className = "element-card-type";
  typeSpan.textContent = el.type;

  const deleteButton = document.createElement("button");
  deleteButton.className = "button-icon button-danger";
  deleteButton.textContent = "✕";
  deleteButton.title = "Remove element";
  deleteButton.addEventListener("click", (e) => {
    e.stopPropagation();
    removeConstraintsForElement(el.id);
    const layer = activeLayer();
    layer.elements = layer.elements.filter((e) => e.id !== el.id);
    previewFrame.contentWindow.postMessage(
      { type: "REMOVE_ELEMENT", id: el.id, layerId: layer.id },
      "*",
    );
    renderElementsTab();
    renderConstraintsTab();
    onElementsChangeCallback();
  });

  header.appendChild(dragHandle);
  header.appendChild(typeSpan);
  header.appendChild(deleteButton);
  card.appendChild(header);

  // ── Fields: label/value rows ──────────────────────────────────────────────
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
  nameInput.className = "param-input";
  nameInput.value = el.name;
  nameInput.addEventListener("change", (e) => {
    const newName = e.target.value.trim();
    if (!newName) { e.target.value = el.name; return; }
    if (newName === el.name) return;
    if (isNameTaken(newName, activeLayer(), { excludeElementId: el.id })) {
      e.target.value = el.name;
      return;
    }
    el.name = newName;
  });
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  fields.appendChild(nameRow);

  // Type-specific field rows
  if (el.type === "UIImage") {
    fields.appendChild(buildTextureFieldRow(el));
  }

  card.appendChild(fields);
  return card;
}

function buildTextureFieldRow(el) {
  const assetId = el.fieldValues.assetId;
  const meta = state.assets[assetId];

  const row = document.createElement("div");
  row.className = "layer-field-row";

  const label = document.createElement("span");
  label.className = "add-field-label";
  label.textContent = "Texture";

  const picker = document.createElement("div");
  picker.className = "element-texture-row";
  picker.title = "Click to change texture";

  const thumb = document.createElement("img");
  thumb.className = "element-texture-thumb";
  thumb.src = meta?.url ?? "";

  const nameSp = document.createElement("span");
  nameSp.className = "element-texture-name";
  nameSp.textContent = meta?.name ?? "(none)";

  picker.appendChild(thumb);
  picker.appendChild(nameSp);

  picker.addEventListener("click", async (e) => {
    e.stopPropagation();
    const newId = await openTexturePicker(state.assets, el.fieldValues.assetId);
    if (!newId || newId === el.fieldValues.assetId) return;
    el.fieldValues.assetId = newId;
    const newMeta = state.assets[newId];
    thumb.src = newMeta?.url ?? "";
    nameSp.textContent = newMeta?.name ?? "(none)";
    previewFrame.contentWindow.postMessage(
      {
        type: "SET_ELEMENT_TEXTURE",
        id: el.id,
        layerId: activeLayer().id,
        dataURL: newMeta.dataURL,
      },
      "*",
    );
  });

  row.appendChild(label);
  row.appendChild(picker);
  return row;
}
