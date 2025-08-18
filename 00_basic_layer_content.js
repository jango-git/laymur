import {
  UIFullscreenLayer,
  UIImage,
} from "https://esm.sh/laymur@0.2.12?deps=three@0.175&min";
import { BaseScene } from "./base-scene.js";

let baseScene;
let layer;

async function buildScene() {
  baseScene = new BaseScene();

  // Load only the character texture for this basic example
  await baseScene.loadTextures(["assets/T_Download.webp"]);

  // Initialize scene and renderer
  await baseScene.initScene();
  baseScene.initRenderer();

  // Create UI layer
  layer = new UIFullscreenLayer(1920, 1920);

  // Add a single image without any constraints
  {
    new UIImage(layer, baseScene.loadedTextures["T_Download"]);
  }

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  // Update camera sway
  baseScene.updateCameraSway();

  // Render scene
  baseScene.render();

  // Render UI layer
  if (layer && baseScene.renderer) {
    const deltaTime = baseScene.getDeltaTime();
    layer.render(baseScene.renderer, deltaTime);
  }
}

window.addEventListener("load", buildScene);
