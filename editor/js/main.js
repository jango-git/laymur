/**
 * main.js
 *
 * Entry point. Wires assets, elements, and UI together.
 */

import { loadAssetsIntoState, setupAssetsTab, renderAssetsTab } from "./assets.js";
import { setupElementsTab, renderElementsTab, refreshAddFields } from "./elements.js";
import { setupLayerTab, renderLayerTab, renderAddLayerForm } from "./layer.js";
import {
  setupConstraintsTab,
  renderConstraintsTab,
  refreshConstraintAddForm,
} from "./constraints.js";
import { setupExportTab, renderExportTab } from "./export.js";
import { setupTabs } from "./ui.js";

const previewFrame = document.getElementById("preview-frame");
const previewWrapper = document.getElementById("preview-iframe-wrapper");
const previewStage = document.getElementById("preview-stage");
const previewSizeLabel = document.getElementById("preview-size-label");
const presetBtns = document.querySelectorAll(".preset-btn");
const resizeHandle = document.getElementById("preview-resize-handle");

// --- Preset buttons ---
presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    presetBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const w = parseInt(btn.dataset.w, 10);
    const h = parseInt(btn.dataset.h, 10);
    if (w === 0 && h === 0) {
      // Fill mode
      previewWrapper.classList.remove("framed");
      previewWrapper.style.width = "";
      previewWrapper.style.height = "";
      previewSizeLabel.textContent = "";
    } else {
      const wPx = parseInt(previewWrapper.style.width, 10);
      const hPx = parseInt(previewWrapper.style.height, 10);

      if (w === wPx && h === hPx) {
        applySize(h, w);
      } else {
        applySize(w, h);
      }
    }
  });

  if (btn.classList.contains("active")) {
    requestAnimationFrame(() => btn.dispatchEvent(new MouseEvent("click")));
  }
});

function applySize(w, h) {
  const stageRect = previewStage.getBoundingClientRect();
  const maxW = stageRect.width - 4;
  const maxH = stageRect.height - 4;

  if (maxW > 0 && maxH > 0 && (w > maxW || h > maxH)) {
    const scale = Math.min(maxW / w, maxH / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  previewWrapper.classList.add("framed");
  previewWrapper.style.width = w + "px";
  previewWrapper.style.height = h + "px";
  previewSizeLabel.textContent = w + " × " + h;
}

// --- Corner resize drag ---
let resizing = false;
let resizeStart = null;

resizeHandle.addEventListener("mousedown", (e) => {
  e.preventDefault();
  resizing = true;
  resizeStart = {
    x: e.clientX,
    y: e.clientY,
    w: previewWrapper.offsetWidth,
    h: previewWrapper.offsetHeight,
  };
  document.body.style.cursor = "se-resize";
  document.body.style.userSelect = "none";
  // Overlay iframe to capture mouse events during drag
  previewFrame.style.pointerEvents = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!resizing) return;
  const dx = e.clientX - resizeStart.x;
  const dy = e.clientY - resizeStart.y;
  const stageRect = previewStage.getBoundingClientRect();
  const newW = Math.max(160, Math.min(resizeStart.w + dx * 2, stageRect.width - 4));
  const newH = Math.max(120, Math.min(resizeStart.h + dy * 2, stageRect.height - 4));
  previewWrapper.style.width = newW + "px";
  previewWrapper.style.height = newH + "px";
  previewSizeLabel.textContent = Math.round(newW) + " × " + Math.round(newH);
});

document.addEventListener("mouseup", () => {
  if (!resizing) return;
  resizing = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  previewFrame.style.pointerEvents = "";
});

setupTabs();

// Layer tab
setupLayerTab({
  frame: previewFrame,
  onLayerChange() {
    renderElementsTab();
    renderConstraintsTab();
    refreshConstraintAddForm();
  },
});
renderLayerTab();
renderAddLayerForm();

// Elements tab (type dropdown + dynamic fields + list)
setupElementsTab({
  frame: previewFrame,
  onElementsChange() {
    refreshConstraintAddForm();
  },
});
renderElementsTab();

// Constraints tab
setupConstraintsTab({ frame: previewFrame });
renderConstraintsTab();

// Export tab
setupExportTab({
  frame: previewFrame,
  onSceneLoad() {
    renderLayerTab();
    renderAddLayerForm();
    renderElementsTab();
    renderConstraintsTab();
    refreshConstraintAddForm();
    renderAssetsTab();
    refreshAddFields();
  },
});
renderExportTab();

// Assets tab setup
setupAssetsTab({
  onAssetsChange() {
    refreshAddFields(); // re-render dynamic fields when assets change
  },
});
renderAssetsTab(); // show placeholder immediately while IndexedDB loads

// Load persisted assets from IndexedDB
loadAssetsIntoState().then(() => {
  renderAssetsTab();
  refreshAddFields();
});
