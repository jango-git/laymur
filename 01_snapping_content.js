import {
  UIFullscreenLayer,
  UIResizePolicyFixedHeight,
  UIImage,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
} from "https://esm.sh/laymur@0.17.1?deps=three@0.157";
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
  layer = new UIFullscreenLayer({
    resizePolicy: new UIResizePolicyFixedHeight(1920, 1920),
  });

  {
    const logotype = new UIImage(layer, baseScene.loadedTextures["T_Logotype"]);

    new UIHorizontalDistanceConstraint(layer, logotype, {
      anchorA: 0,
      anchorB: 0,
      distance: 50,
    });

    new UIVerticalDistanceConstraint(layer, logotype, {
      anchorA: 1,
      anchorB: 1,
      distance: -50,
    });
  }

  {
    const download = new UIImage(layer, baseScene.loadedTextures["T_Download"]);

    new UIHorizontalDistanceConstraint(layer, download, {
      anchorA: 1,
      anchorB: 1,
      distance: -50,
    });

    new UIVerticalDistanceConstraint(layer, download, {
      anchorA: 0,
      anchorB: 0,
      distance: 50,
    });
  }

  animate();
}

let lastTime = 0;
let accumulator = 0;
const targetFPS = 60;
const fixedTimeStep = 1000 / targetFPS;

function animate(currentTime = 0) {
  requestAnimationFrame(animate);

  if (lastTime === 0) {
    lastTime = currentTime;
    return;
  }

  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  accumulator += deltaTime;

  while (accumulator >= fixedTimeStep) {
    baseScene.updateCameraSway();
    baseScene.render();

    if (layer && baseScene.renderer) {
      layer.render(baseScene.renderer, fixedTimeStep / 1000);
    }

    accumulator -= fixedTimeStep;
  }
}

window.addEventListener("load", buildScene);
