/**
 * constraints.js
 *
 * Constraints tab: add form + constraint list + preview sync.
 * Form fields are driven entirely by constraint-registry.js - no per-type branching here.
 *
 * Paired fields: fields sharing the same `group` key are rendered as a single H:/V: row.
 * Slider fields: fields with `slider: true` render as range slider + number input.
 */

import { state, generateConstraintId, activeLayer, isNameTaken } from "./state.js";
import { CONSTRAINT_REGISTRY, CONSTRAINT_REGISTRY_MAP } from "./constraint-registry.js";
import { makeSortable } from "./sortable.js";
import { openElementPicker } from "./element-picker.js";

/** @type {HTMLIFrameElement | null} */
let previewFrame = null;

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupConstraintsTab({ frame }) {
  previewFrame = frame;

  const typeSelect = document.getElementById("constraint-type-select");

  for (const descriptor of CONSTRAINT_REGISTRY) {
    const opt = document.createElement("option");
    opt.value = descriptor.type;
    opt.textContent = descriptor.label;
    typeSelect.appendChild(opt);
  }

  typeSelect.addEventListener("change", () => {
    _renderAddFields(typeSelect.value);
    _syncConstraintAddButton();
  });

  _renderAddFields(typeSelect.value);
  _syncConstraintAddButton();

  document
    .getElementById("constraint-name-input")
    ?.addEventListener("input", _syncConstraintAddButton);

  document.getElementById("add-constraint-button").addEventListener("click", () => {
    const constraintType = typeSelect.value;
    const descriptor = CONSTRAINT_REGISTRY_MAP.get(constraintType);
    if (!descriptor) return;

    const values = _collectFieldValues();

    for (const field of descriptor.fields) {
      if (field.required && !values[field.key]) return;
    }

    const firstEl = descriptor.fields.find((f) => f.fieldType === "element");
    const secondEl = descriptor.fields.filter((f) => f.fieldType === "element")[1];
    if (firstEl && secondEl && values[firstEl.key] === values[secondEl.key]) return;

    const nameRaw = document.getElementById("constraint-name-input")?.value.trim() ?? "";
    const name = nameRaw || undefined;
    if (name && isNameTaken(name, activeLayer())) return;

    const id = generateConstraintId();
    const layer = activeLayer();
    layer.constraints.push({ id, constraintType, name, fieldValues: values });
    previewFrame.contentWindow.postMessage(
      { ...descriptor.buildAddMessage(id, values), layerId: layer.id },
      "*",
    );

    const nameInput = document.getElementById("constraint-name-input");
    if (nameInput) nameInput.value = "";

    renderConstraintsTab();
    _syncConstraintAddButton();
  });
}

function _syncConstraintAddButton() {
  const btn = document.getElementById("add-constraint-button");
  if (!btn) return;

  const typeSelect = document.getElementById("constraint-type-select");
  const descriptor = CONSTRAINT_REGISTRY_MAP.get(typeSelect?.value);
  if (!descriptor) {
    btn.disabled = true;
    return;
  }

  const values = _collectFieldValues();

  for (const field of descriptor.fields) {
    if (field.required && !values[field.key]) {
      btn.disabled = true;
      return;
    }
  }

  const firstEl = descriptor.fields.find((f) => f.fieldType === "element");
  const secondEl = descriptor.fields.filter((f) => f.fieldType === "element")[1];
  if (firstEl && secondEl && values[firstEl.key] === values[secondEl.key]) {
    btn.disabled = true;
    return;
  }

  const nameRaw = document.getElementById("constraint-name-input")?.value.trim() ?? "";
  if (nameRaw && isNameTaken(nameRaw, activeLayer())) {
    btn.disabled = true;
    return;
  }

  btn.disabled = false;
}

export function refreshConstraintAddForm() {
  const type = document.getElementById("constraint-type-select")?.value;
  if (!type) return;
  const prevValues = _collectFieldValues();
  _renderAddFields(type);
  const container = document.getElementById("add-constraint-fields");
  for (const [key, value] of Object.entries(prevValues)) {
    const input = container?.querySelector(`[data-field="${key}"]`);
    if (input && value !== undefined && value !== "") {
      input.value = value;
      input._updateDisplay?.();
    }
  }
  _syncConstraintAddButton();
}

// ─── Add-form field rendering ──────────────────────────────────────────────

function _renderAddFields(type) {
  const container = document.getElementById("add-constraint-fields");
  if (!container) return;

  const prevValues = _collectFieldValues();
  container.innerHTML = "";

  const descriptor = CONSTRAINT_REGISTRY_MAP.get(type);
  if (!descriptor) return;

  let firstElementHidden = null;
  const renderedGroups = new Set();

  for (const field of descriptor.fields) {
    if (field.fieldType === "element") {
      const row = document.createElement("div");
      row.className = "add-field-row";
      const label = document.createElement("span");
      label.className = "add-field-label";
      label.textContent = field.label;

      const { widget, hidden } = _buildElementPickerWidget(
        field,
        prevValues[field.key] ?? "",
        field.excludeSelf ? () => firstElementHidden?.value ?? null : null,
      );
      if (!firstElementHidden) firstElementHidden = hidden;

      row.appendChild(label);
      row.appendChild(widget);
      container.appendChild(row);
    } else if (field.fieldType === "number") {
      if (field.group) {
        if (renderedGroups.has(field.group)) continue;
        renderedGroups.add(field.group);
        // Collect both fields for this group
        const groupFields = descriptor.fields.filter(
          (f) => f.fieldType === "number" && f.group === field.group,
        );
        container.appendChild(_buildAddPairedRow(groupFields, prevValues));
      } else {
        container.appendChild(_buildAddNumberRow(field, prevValues[field.key]));
      }
    }
  }
}

function _buildAddNumberRow(field, prevValue) {
  const row = document.createElement("div");
  row.className = "add-field-row";

  const label = document.createElement("span");
  label.className = "add-field-label";
  label.textContent = field.label;

  const input = _makeNumberInput(field, prevValue ?? field.default ?? 0);
  row.appendChild(label);
  row.appendChild(input);
  return row;
}

function _buildAddPairedRow(groupFields, prevValues) {
  const row = document.createElement("div");
  row.className = "add-paired-row";

  const groupLabel = _groupLabel(groupFields[0].group);
  const label = document.createElement("span");
  label.className = "add-field-label";
  label.textContent = groupLabel;
  row.appendChild(label);

  for (const field of groupFields) {
    const cell = document.createElement("div");
    cell.className = "constraint-paired-cell";

    const roleLabel = document.createElement("span");
    roleLabel.className = "paired-role-label";
    roleLabel.textContent = field.groupRole === "h" ? "H:" : "V:";
    cell.appendChild(roleLabel);

    cell.appendChild(_makeNumberInput(field, prevValues[field.key] ?? field.default ?? 0));
    row.appendChild(cell);
  }

  return row;
}

function _makeNumberInput(field, value) {
  const input = document.createElement("input");
  input.type = "number";
  input.className = "param-input";
  input.dataset.field = field.key;
  input.value = value;
  input.step = field.step ?? 1;
  if (field.min !== undefined) input.min = field.min;
  if (field.max !== undefined) input.max = field.max;
  return input;
}

function _makeSliderPair(field, value) {
  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "param-slider";
  slider.min = field.min ?? 0;
  slider.max = field.max ?? 1;
  slider.step = field.step ?? 0.05;
  slider.value = value;

  const numInput = document.createElement("input");
  numInput.type = "number";
  numInput.className = "param-input param-input-narrow";
  numInput.dataset.field = field.key;
  numInput.min = field.min ?? 0;
  numInput.max = field.max ?? 1;
  numInput.step = field.step ?? 0.05;
  numInput.value = value;

  slider.addEventListener("input", () => {
    numInput.value = slider.value;
  });
  numInput.addEventListener("input", () => {
    slider.value = numInput.value;
  });

  return { slider, numInput };
}

function _groupLabel(groupKey) {
  return groupKey.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function _buildPickerItems(field) {
  const items = [];
  if (!field.noLayer) {
    items.push({ id: "layer", name: "Layer", type: null });
  }
  for (const el of activeLayer().elements) {
    items.push({ id: el.id, name: el.name, type: el.type, fieldValues: el.fieldValues });
  }
  return items;
}

function _updateElementPickerDisplay(display, id) {
  display.innerHTML = "";

  if (!id) {
    const ph = document.createElement("span");
    ph.className = "picker-btn-placeholder";
    ph.textContent = "Click to select…";
    display.appendChild(ph);
    return;
  }

  if (id === "layer") {
    const ph = document.createElement("div");
    ph.className = "picker-btn-thumb picker-btn-thumb-ph";
    ph.textContent = "⬡";
    display.appendChild(ph);
    const name = document.createElement("span");
    name.className = "picker-btn-name";
    name.textContent = "Layer";
    display.appendChild(name);
    return;
  }

  const el = activeLayer().elements.find((e) => e.id === id);
  if (!el) {
    const ph = document.createElement("span");
    ph.className = "picker-btn-placeholder";
    ph.textContent = "Unknown";
    display.appendChild(ph);
    return;
  }

  if (el.type === "UIImage") {
    const assetId = el.fieldValues?.assetId;
    const meta = state.assets[assetId];
    if (meta?.url) {
      const img = document.createElement("img");
      img.src = meta.url;
      img.className = "picker-btn-thumb";
      display.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "picker-btn-thumb picker-btn-thumb-ph";
      ph.textContent = "□";
      display.appendChild(ph);
    }
  } else {
    const ph = document.createElement("div");
    ph.className = "picker-btn-thumb picker-btn-thumb-ph";
    ph.textContent = "□";
    display.appendChild(ph);
  }

  const name = document.createElement("span");
  name.className = "picker-btn-name";
  name.textContent = el.name;
  display.appendChild(name);
}

function _buildElementPickerWidget(field, initialValue, getExcludeId) {
  const widget = document.createElement("div");
  widget.className = "picker-btn";

  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.dataset.field = field.key;
  hidden.value = initialValue || "";
  widget.appendChild(hidden);

  const display = document.createElement("div");
  display.className = "picker-btn-display";
  widget.appendChild(display);

  _updateElementPickerDisplay(display, hidden.value || null);

  widget.addEventListener("click", async () => {
    const items = _buildPickerItems(field);
    const excludeId = getExcludeId ? getExcludeId() : null;
    const newId = await openElementPicker(items, hidden.value || null, excludeId);
    if (newId === null) return;
    hidden.value = newId;
    _updateElementPickerDisplay(display, newId);
    _syncConstraintAddButton();
  });

  hidden._updateDisplay = () => _updateElementPickerDisplay(display, hidden.value || null);

  return { widget, hidden };
}

function _collectFieldValues() {
  const container = document.getElementById("add-constraint-fields");
  if (!container) return {};
  const values = {};
  for (const el of container.querySelectorAll("[data-field]")) {
    const key = el.dataset.field;
    if (el.tagName === "SELECT" || el.type === "hidden") {
      values[key] = el.value;
    } else {
      values[key] = parseFloat(el.value);
    }
  }
  return values;
}

// ─── Constraint list ──────────────────────────────────────────────────────────

export function renderConstraintsTab() {
  const list = document.getElementById("constraints-list");
  if (!list) return;
  list.innerHTML = "";

  const constraints = activeLayer().constraints;

  if (constraints.length === 0) {
    const p = document.createElement("p");
    p.className = "placeholder-text";
    p.textContent = "No constraints.";
    list.appendChild(p);
    return;
  }

  for (const c of constraints) {
    list.appendChild(_buildConstraintCard(c));
  }

  makeSortable(list, (fromIndex, toIndex) => {
    const layer = activeLayer();
    const [moved] = layer.constraints.splice(fromIndex, 1);
    layer.constraints.splice(toIndex, 0, moved);
    renderConstraintsTab();
  });
}

function _buildConstraintCard(c) {
  const descriptor = CONSTRAINT_REGISTRY_MAP.get(c.constraintType);
  const card = document.createElement("div");
  card.className = "constraint-card";
  card.draggable = true;

  // ── Header ────────────────────────────────────────────────────────────────
  const header = document.createElement("div");
  header.className = "constraint-card-header";

  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⠿";

  const info = document.createElement("div");
  info.className = "element-card-info";

  const typeSpan = document.createElement("span");
  typeSpan.className = "element-card-type";
  typeSpan.textContent = descriptor?.label ?? c.constraintType;

  const detailSpan = document.createElement("span");
  detailSpan.className = "element-card-asset";
  detailSpan.textContent = descriptor?.cardDetail(c, _elementLabel) ?? "";

  info.appendChild(typeSpan);
  info.appendChild(detailSpan);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "button-icon button-danger";
  deleteBtn.textContent = "✕";
  deleteBtn.title = "Remove constraint";
  deleteBtn.addEventListener("click", () => _removeConstraint(c.id));

  header.appendChild(dragHandle);
  header.appendChild(info);
  header.appendChild(deleteBtn);

  // ── Editable fields ───────────────────────────────────────────────────────
  const fields = document.createElement("div");
  fields.className = "constraint-fields";

  // Optional name field
  const nameRow = document.createElement("div");
  nameRow.className = "constraint-field-row";
  const nameLabel = document.createElement("span");
  nameLabel.className = "add-field-label";
  nameLabel.textContent = "Name";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "param-input";
  nameInput.placeholder = "optional";
  nameInput.value = c.name ?? "";
  nameInput.addEventListener("change", (e) => {
    const newName = e.target.value.trim();
    if (newName === (c.name ?? "")) return;
    if (newName === "") {
      c.name = undefined;
      return;
    }
    if (isNameTaken(newName, activeLayer(), { excludeConstraintId: c.id })) {
      e.target.value = c.name ?? "";
      return;
    }
    c.name = newName;
  });
  nameRow.appendChild(nameLabel);
  nameRow.appendChild(nameInput);
  fields.appendChild(nameRow);

  // Number fields - grouped or individual
  const renderedGroups = new Set();
  for (const field of descriptor?.fields ?? []) {
    if (field.fieldType !== "number") continue;
    if (field.group) {
      if (renderedGroups.has(field.group)) continue;
      renderedGroups.add(field.group);
      const groupFields = descriptor.fields.filter(
        (f) => f.fieldType === "number" && f.group === field.group,
      );
      fields.appendChild(_buildCardPairedRow(groupFields, c));
    } else {
      fields.appendChild(
        _inlineNumberField(
          field.label,
          c.fieldValues[field.key],
          (val) => {
            c.fieldValues[field.key] = val;
            _postUpdate(c);
          },
          { min: field.min, max: field.max, step: field.step, slider: field.slider },
        ),
      );
    }
  }

  card.appendChild(header);
  card.appendChild(fields);
  return card;
}

function _buildCardPairedRow(groupFields, c) {
  const row = document.createElement("div");
  row.className = "constraint-paired-row";

  const label = document.createElement("span");
  label.className = "add-field-label";
  label.textContent = _groupLabel(groupFields[0].group);
  row.appendChild(label);

  for (const field of groupFields) {
    const cell = document.createElement("div");
    cell.className = "constraint-paired-cell";

    const roleLabel = document.createElement("span");
    roleLabel.className = "paired-role-label";
    roleLabel.textContent = field.groupRole === "h" ? "H:" : "V:";
    cell.appendChild(roleLabel);

    const input = document.createElement("input");
    input.type = "number";
    input.className = "param-input";
    input.value = c.fieldValues[field.key];
    input.step = field.step ?? 1;
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    input.addEventListener("change", () => {
      const val = parseFloat(input.value);
      if (!isNaN(val)) {
        c.fieldValues[field.key] = val;
        _postUpdate(c);
      }
    });
    cell.appendChild(input);

    row.appendChild(cell);
  }

  return row;
}

function _makeCardSlider(field, value, onChange) {
  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "param-slider";
  slider.min = field.min ?? 0;
  slider.max = field.max ?? 1;
  slider.step = field.step ?? 0.05;
  slider.value = value;

  const numInput = document.createElement("input");
  numInput.type = "number";
  numInput.className = "param-input param-input-narrow";
  numInput.min = field.min ?? 0;
  numInput.max = field.max ?? 1;
  numInput.step = field.step ?? 0.05;
  numInput.value = value;

  slider.addEventListener("input", () => {
    numInput.value = slider.value;
    const val = parseFloat(slider.value);
    if (!isNaN(val)) onChange(val);
  });
  numInput.addEventListener("change", () => {
    slider.value = numInput.value;
    const val = parseFloat(numInput.value);
    if (!isNaN(val)) onChange(val);
  });

  return { slider, numInput };
}

function _inlineNumberField(label, value, onChange, { min, max, step = 1 } = {}) {
  const row = document.createElement("div");
  row.className = "constraint-field-row";

  const labelEl = document.createElement("span");
  labelEl.className = "add-field-label";
  labelEl.textContent = label;
  row.appendChild(labelEl);

  const input = document.createElement("input");
  input.type = "number";
  input.className = "param-input";
  input.value = value;
  input.step = step;
  if (min !== undefined) input.min = min;
  if (max !== undefined) input.max = max;
  input.addEventListener("change", () => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) onChange(val);
  });
  row.appendChild(input);

  return row;
}

function _postUpdate(c) {
  const descriptor = CONSTRAINT_REGISTRY_MAP.get(c.constraintType);
  if (!descriptor) return;
  previewFrame.contentWindow.postMessage(
    { ...descriptor.buildUpdateMessage(c.id, c.fieldValues), layerId: activeLayer().id },
    "*",
  );
}

function _elementLabel(idOrLayer) {
  if (idOrLayer === "layer") return "Layer";
  const el = activeLayer().elements.find((e) => e.id === idOrLayer);
  return el ? el.name : idOrLayer;
}

function _removeConstraint(id) {
  const layer = activeLayer();
  layer.constraints = layer.constraints.filter((c) => c.id !== id);
  previewFrame.contentWindow.postMessage({ type: "REMOVE_CONSTRAINT", id, layerId: layer.id }, "*");
  renderConstraintsTab();
}

export function removeConstraintsForElement(elementId) {
  const toRemove = activeLayer().constraints.filter(
    (c) => c.fieldValues.elementA === elementId || c.fieldValues.elementB === elementId,
  );
  for (const c of toRemove) {
    _removeConstraint(c.id);
  }
}
