import { DeviceViewport, renderDevice, renderer } from "./device.js";
import { createInterface } from "./interface.js";
import { createHudScene } from "./scenes/hud.js";
import { createInputScene } from "./scenes/input.js";
import { createLayoutScene } from "./scenes/layout.js";
import { createParticlesScene } from "./scenes/particles.js";
import { createTextScene } from "./scenes/text.js";
import { COLORS, hex } from "./style.js";

const isPortrait = window.innerHeight > window.innerWidth;
const viewport = new DeviceViewport(isPortrait ? 390 : 1280, isPortrait ? 844 : 720);
const scenes = [
  createHudScene,
  createLayoutScene,
  createTextScene,
  createInputScene,
  createParticlesScene,
].map((create) => create(viewport));
const ui = createInterface(scenes, viewport);

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const deltaTime = Math.min(Math.max(now - last, 0) / 1000, 0.1);
  last = now;
  ui.update();
  ui.scene.update?.(deltaTime);
  renderer.setClearColor(hex(COLORS.stage));
  renderer.clear();
  renderDevice(viewport, ui.scene.layer, deltaTime);
  ui.render(renderer, deltaTime);
});
