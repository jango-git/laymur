/**
 * state.js
 *
 * Shared editor state.
 */

export const state = {
  /** @type {Record<string, { name: string, url: string, dataURL: string }>} */
  assets: {},
  /**
   * @type {Array<{
   *   id: string,
   *   name: string,
   *   policyType: string,
   *   policyParams: object,
   *   elements: Array<{ id: string, type: string, name: string, fieldValues: object }>,
   *   constraints: Array<{ id: string, constraintType: string, name?: string, fieldValues: Record<string, string|number> }>
   * }>}
   */
  layers: [
    {
      id: "layer_1",
      name: "UIGameplayLayer",
      policyType: "fixedHeight",
      policyParams: { fixedHeightLandscape: 1080, fixedHeightPortrait: 1920 },
      elements: [],
      constraints: [],
    },
  ],
  /** @type {string} */
  activeLayerId: "layer_1",
};

let nextId = 1;
let nextConstraintId = 1;
let nextLayerId = 2;

export function generateId() {
  return `el_${nextId++}`;
}

export function generateConstraintId() {
  return `cst_${nextConstraintId++}`;
}

export function generateLayerId() {
  return `layer_${nextLayerId++}`;
}

/** Returns the currently active layer object. */
export function activeLayer() {
  return state.layers.find((l) => l.id === state.activeLayerId) ?? state.layers[0];
}

/**
 * Returns true if the given name is already taken by any element or constraint in the layer.
 * Optionally exclude one element or constraint by ID (for rename validation).
 */
export function isNameTaken(name, layer, { excludeElementId = null, excludeConstraintId = null } = {}) {
  if (!name) return false;
  return (
    layer.elements.some((e) => e.name === name && e.id !== excludeElementId) ||
    layer.constraints.some((c) => c.name === name && c.id !== excludeConstraintId)
  );
}

/**
 * Replaces the full scene state and updates ID counters to avoid collisions.
 */
export function resetState(layers, activeLayerId) {
  state.layers = layers;
  state.activeLayerId = activeLayerId;

  let maxEl = 0;
  let maxCst = 0;
  let maxLayer = 1;
  for (const layer of layers) {
    const ln = parseInt(layer.id.replace("layer_", ""), 10);
    if (!isNaN(ln) && ln > maxLayer) maxLayer = ln;
    for (const el of layer.elements) {
      const n = parseInt(el.id.replace("el_", ""), 10);
      if (!isNaN(n) && n > maxEl) maxEl = n;
    }
    for (const c of layer.constraints) {
      const n = parseInt(c.id.replace("cst_", ""), 10);
      if (!isNaN(n) && n > maxCst) maxCst = n;
    }
  }
  nextId = maxEl + 1;
  nextConstraintId = maxCst + 1;
  nextLayerId = maxLayer + 1;
}
