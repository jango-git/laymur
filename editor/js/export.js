/**
 * export.js
 *
 * Export tab: Save/Load scene as JSON, Export layer(s) as TypeScript.
 */

import { state, activeLayer, resetState } from "./state.js";
import { addAssetFromDataURL, renderAssetsTab } from "./assets.js";
import { initializePreview } from "./layer.js";
import { ELEMENT_REGISTRY_MAP } from "./element-registry.js";
import { CONSTRAINT_REGISTRY_MAP } from "./constraint-registry.js";

const SCENE_VERSION = 1;

/** @type {HTMLIFrameElement | null} */
let frameRef = null;
let onSceneLoadCallback = () => {};

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupExportTab({ frame, onSceneLoad }) {
  frameRef = frame;
  onSceneLoadCallback = onSceneLoad ?? (() => {});
}

export function renderExportTab() {
  const container = document.getElementById("export-content");
  if (!container) return;
  container.innerHTML = "";

  // Save / Load side by side
  const sceneRow = document.createElement("div");
  sceneRow.className = "button-row";

  const saveBtn = document.createElement("button");
  saveBtn.className = "button-primary";
  saveBtn.textContent = "Save Scene";
  saveBtn.addEventListener("click", _saveScene);

  const loadBtn = document.createElement("button");
  loadBtn.className = "button-secondary";
  loadBtn.textContent = "Load Scene";
  loadBtn.addEventListener("click", () => loadInput.click());

  const loadInput = document.createElement("input");
  loadInput.type = "file";
  loadInput.accept = ".json";
  loadInput.hidden = true;
  loadInput.addEventListener("change", async () => {
    const file = loadInput.files[0];
    if (!file) return;
    loadInput.value = "";
    const text = await file.text();
    try {
      await _loadScene(JSON.parse(text));
    } catch (err) {
      console.error("[export] Failed to load scene:", err);
    }
  });

  sceneRow.appendChild(saveBtn);
  sceneRow.appendChild(loadBtn);
  container.appendChild(sceneRow);
  container.appendChild(loadInput);

  const divider = document.createElement("hr");
  divider.className = "export-divider";
  container.appendChild(divider);

  // Export TS: Active Layer / All Layers side by side
  const tsRow = document.createElement("div");
  tsRow.className = "button-row";

  const tsActiveBtn = document.createElement("button");
  tsActiveBtn.className = "button-success";
  tsActiveBtn.textContent = "Export Active Layer";
  tsActiveBtn.addEventListener("click", _exportActiveLayerTs);

  const tsAllBtn = document.createElement("button");
  tsAllBtn.className = "button-success-dim";
  tsAllBtn.textContent = "Export All Layers";
  tsAllBtn.addEventListener("click", _exportAllLayersTs);

  tsRow.appendChild(tsActiveBtn);
  tsRow.appendChild(tsAllBtn);
  container.appendChild(tsRow);
}

// ─── Save scene ───────────────────────────────────────────────────────────────

function _saveScene() {
  const usedAssetIds = _collectUsedAssetIds();

  const assets = {};
  for (const id of usedAssetIds) {
    const meta = state.assets[id];
    if (meta) assets[id] = { name: meta.name, dataURL: meta.dataURL };
  }

  const json = {
    version: SCENE_VERSION,
    activeLayerId: state.activeLayerId,
    layers: state.layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      policyType: layer.policyType,
      policyParams: { ...layer.policyParams },
      elements: layer.elements.map((el) => ({
        id: el.id,
        type: el.type,
        name: el.name,
        fieldValues: { ...el.fieldValues },
      })),
      constraints: layer.constraints.map((c) => ({
        id: c.id,
        constraintType: c.constraintType,
        ...(c.name !== undefined ? { name: c.name } : {}),
        fieldValues: { ...c.fieldValues },
      })),
    })),
    assets,
  };

  _downloadFile(JSON.stringify(json, null, 2), "scene.json", "application/json");
}

function _collectUsedAssetIds() {
  const ids = new Set();
  for (const layer of state.layers) {
    for (const el of layer.elements) {
      const descriptor = ELEMENT_REGISTRY_MAP.get(el.type);
      if (!descriptor) continue;
      for (const field of descriptor.fields) {
        if (field.fieldType === "asset" && el.fieldValues[field.key]) {
          ids.add(el.fieldValues[field.key]);
        }
      }
    }
  }
  return ids;
}

// ─── Load scene ───────────────────────────────────────────────────────────────

async function _loadScene(json) {
  if (!json || json.version !== SCENE_VERSION) {
    console.error("[export] Unsupported scene version:", json?.version);
    return;
  }

  for (const [id, assetData] of Object.entries(json.assets ?? {})) {
    await addAssetFromDataURL(id, assetData.name, assetData.dataURL);
  }

  resetState(json.layers, json.activeLayerId);

  frameRef.contentWindow.postMessage({ type: "RESET_SCENE" }, "*");
  initializePreview();

  for (const layer of state.layers) {
    for (const el of layer.elements) {
      const descriptor = ELEMENT_REGISTRY_MAP.get(el.type);
      if (!descriptor) continue;
      const msg = descriptor.buildMessage(el.id, el.fieldValues, state.assets);
      frameRef.contentWindow.postMessage({ ...msg, layerId: layer.id }, "*");
    }
    for (const c of layer.constraints) {
      const descriptor = CONSTRAINT_REGISTRY_MAP.get(c.constraintType);
      if (!descriptor) continue;
      frameRef.contentWindow.postMessage(
        { ...descriptor.buildAddMessage(c.id, c.fieldValues), layerId: layer.id },
        "*",
      );
    }
  }

  onSceneLoadCallback();
}

// ─── TypeScript export ────────────────────────────────────────────────────────

function _exportActiveLayerTs() {
  const layer = activeLayer();
  _downloadFile(_generateTs(layer), `${layer.name}.ts`, "text/plain");
}

function _exportAllLayersTs() {
  for (const layer of state.layers) {
    _downloadFile(_generateTs(layer), `${layer.name}.ts`, "text/plain");
  }
}

function _generateTs(layer) {
  const elementIdToName = new Map(layer.elements.map((e) => [e.id, e.name]));
  const resolveEl = (id) => (id === "layer" ? "this" : `this.${elementIdToName.get(id)}Element`);

  // ── Collect imports ─────────────────────────────────────────────────────
  const laymurImports = new Set(["UIFullscreenLayer"]);
  const threeTypeImports = new Set();

  const policyClass = _policyTsClassName(layer.policyType);
  laymurImports.add(policyClass);

  for (const el of layer.elements) {
    laymurImports.add(el.type);
    if (el.type === "UIImage") threeTypeImports.add("Texture");
  }

  for (const c of layer.constraints) {
    for (const cls of _constraintTsClasses(c.constraintType)) {
      laymurImports.add(cls);
    }
  }

  // ── Build lines ─────────────────────────────────────────────────────────
  const lines = [];

  if (threeTypeImports.size > 0) {
    lines.push(`import type { ${[...threeTypeImports].sort().join(", ")} } from "three";`);
  }
  lines.push(`import {\n  ${[...laymurImports].sort().join(",\n  ")},\n} from "laymur";`);
  lines.push("");

  lines.push(`export class ${layer.name} extends UIFullscreenLayer {`);

  // Element fields
  for (const el of layer.elements) {
    lines.push(`  public readonly ${el.name}Element: ${el.type};`);
  }

  // Named constraint fields
  const namedConstraints = layer.constraints.filter((c) => c.name);
  for (const c of namedConstraints) {
    const classes = _constraintTsClasses(c.constraintType);
    const fieldType = classes.length === 1 ? classes[0] : `[${classes.join(", ")}]`;
    lines.push(`  public readonly ${c.name}Constraint: ${fieldType};`);
  }

  if (layer.elements.length > 0 || namedConstraints.length > 0) lines.push("");

  lines.push(`  constructor() {`);
  lines.push(
    `    super({ name: ${JSON.stringify(layer.name)}, resizePolicy: ${_policyTsConstructor(layer.policyType, layer.policyParams)} });`,
  );

  if (layer.elements.length > 0) lines.push("");

  // Element instantiation
  for (const el of layer.elements) {
    lines.push(`    this.${el.name}Element = ${_elementTsConstructor(el)};`);
  }

  if (layer.constraints.length > 0) lines.push("");

  // Constraint instantiation
  for (const c of layer.constraints) {
    const stmts = _constraintTsStatements(c, resolveEl);
    if (c.name) {
      if (stmts.length === 1) {
        lines.push(`    this.${c.name}Constraint = ${stmts[0]};`);
      } else {
        lines.push(`    this.${c.name}Constraint = [`);
        for (let i = 0; i < stmts.length; i++) {
          lines.push(`      ${stmts[i]},`);
        }
        lines.push(`    ];`);
      }
    } else {
      for (const stmt of stmts) {
        lines.push(`    ${stmt};`);
      }
    }
  }

  lines.push(`  }`);
  lines.push(`}`);

  return lines.join("\n") + "\n";
}

// ─── TS helpers ───────────────────────────────────────────────────────────────

function _policyTsClassName(policyType) {
  const map = {
    none: "UIResizePolicyNone",
    cover: "UIResizePolicyCover",
    fit: "UIResizePolicyFit",
    cross: "UIResizePolicyCross",
    crossInverted: "UIResizePolicyCrossInverted",
    fixedWidth: "UIResizePolicyFixedWidth",
    fixedHeight: "UIResizePolicyFixedHeight",
  };
  return map[policyType] ?? "UIResizePolicyNone";
}

function _policyTsConstructor(policyType, p) {
  switch (policyType) {
    case "cover":
      return `new UIResizePolicyCover(${p.rectWidth}, ${p.rectHeight})`;
    case "fit":
      return `new UIResizePolicyFit(${p.rectWidth}, ${p.rectHeight})`;
    case "cross":
      return `new UIResizePolicyCross()`;
    case "crossInverted":
      return `new UIResizePolicyCrossInverted()`;
    case "fixedWidth":
      return `new UIResizePolicyFixedWidth(${p.fixedWidthLandscape}, ${p.fixedWidthPortrait})`;
    case "fixedHeight":
      return `new UIResizePolicyFixedHeight(${p.fixedHeightLandscape}, ${p.fixedHeightPortrait})`;
    case "none":
    default:
      return `new UIResizePolicyNone()`;
  }
}

function _elementTsConstructor(el) {
  if (el.type === "UIImage") {
    const assetId = el.fieldValues.assetId ?? "texture";
    return `new UIImage(this, /* TODO: place texture ${assetId} */)`;
  }
  return `new ${el.type}(this /* TODO */)`;
}

function _constraintTsClasses(constraintType) {
  const map = {
    horizontal: ["UIHorizontalDistanceConstraint"],
    vertical: ["UIVerticalDistanceConstraint"],
    aspect: ["UIAspectConstraint"],
    width: ["UIWidthConstraint"],
    height: ["UIHeightConstraint"],
    horizontalProportion: ["UIHorizontalProportionConstraint"],
    verticalProportion: ["UIVerticalProportionConstraint"],
    size2d: ["UIWidthConstraint", "UIHeightConstraint"],
    distance2d: ["UIHorizontalDistanceConstraint", "UIVerticalDistanceConstraint"],
    proportion2d: ["UIHorizontalProportionConstraint", "UIVerticalProportionConstraint"],
  };
  return map[constraintType] ?? [];
}

function _constraintTsStatements(c, resolveEl) {
  const fv = c.fieldValues;
  const a = resolveEl(fv.elementA);
  const b = fv.elementB !== undefined ? resolveEl(fv.elementB) : null;

  switch (c.constraintType) {
    case "horizontal":
      return [
        `new UIHorizontalDistanceConstraint(${a}, ${b}, { distance: ${fv.distance}, anchorA: ${fv.anchorA}, anchorB: ${fv.anchorB} })`,
      ];
    case "vertical":
      return [
        `new UIVerticalDistanceConstraint(${a}, ${b}, { distance: ${fv.distance}, anchorA: ${fv.anchorA}, anchorB: ${fv.anchorB} })`,
      ];
    case "aspect":
      return [`new UIAspectConstraint(${a}, { aspect: ${fv.value} })`];
    case "width":
      return [`new UIWidthConstraint(${a}, { width: ${fv.value} })`];
    case "height":
      return [`new UIHeightConstraint(${a}, { height: ${fv.value} })`];
    case "horizontalProportion":
      return [`new UIHorizontalProportionConstraint(${a}, ${b}, { proportion: ${fv.value} })`];
    case "verticalProportion":
      return [`new UIVerticalProportionConstraint(${a}, ${b}, { proportion: ${fv.value} })`];
    case "size2d":
      return [
        `new UIWidthConstraint(${a}, { width: ${fv.width} })`,
        `new UIHeightConstraint(${a}, { height: ${fv.height} })`,
      ];
    case "distance2d":
      return [
        `new UIHorizontalDistanceConstraint(${a}, ${b}, { distance: ${fv.hDistance}, anchorA: ${fv.hAnchorA}, anchorB: ${fv.hAnchorB} })`,
        `new UIVerticalDistanceConstraint(${a}, ${b}, { distance: ${fv.vDistance}, anchorA: ${fv.vAnchorA}, anchorB: ${fv.vAnchorB} })`,
      ];
    case "proportion2d":
      return [
        `new UIHorizontalProportionConstraint(${a}, ${b}, { proportion: ${fv.hProportion} })`,
        `new UIVerticalProportionConstraint(${a}, ${b}, { proportion: ${fv.vProportion} })`,
      ];
    default:
      return [`/* unknown constraint: ${c.constraintType} */`];
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function _downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
