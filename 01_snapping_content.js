import {
  UIFullscreenLayer,
  UIImage,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
} from "https://esm.sh/laymur@0.2.10?deps=three@0.175&min";
import { BaseScene } from "./base-scene.js";

let baseScene;
let layer;

async function buildScene() {
  baseScene = new BaseScene();

  // Load textures specific to this example
  await baseScene.loadTextures([
    "assets/T_Download.webp",
    "assets/T_Logotype.webp",
  ]);

  // Initialize scene and renderer
  await baseScene.initScene();
  baseScene.initRenderer();

  // Create UI layer
  layer = new UIFullscreenLayer(1920, 1920);

  {
    const logotype = new UIImage(layer, baseScene.loadedTextures["T_Logotype"]);

    new UIHorizontalDistanceConstraint(layer, logotype, {
      anchorA: 0,
      anchorB: 0,
      distance: 50,
    });

    new UIVerticalDistanceConstraint(logotype, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });
  }

  {
    const download = new UIImage(layer, baseScene.loadedTextures["T_Download"]);

    new UIHorizontalDistanceConstraint(download, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });

    new UIVerticalDistanceConstraint(layer, download, {
      anchorA: 0,
      anchorB: 0,
      distance: 50,
    });
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
