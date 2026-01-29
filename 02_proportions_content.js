import {
  UIFullscreenLayer,
  UIResizePolicyFixedHeight,
  UIImage,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
  UIAspectConstraint,
  UIHorizontalProportionConstraint,
  UIVerticalProportionConstraint,
  UIRelation,
  UIOrientation,
} from "https://esm.sh/laymur@0.17.1?deps=three@0.157";
import { BaseScene } from "./base-scene.js";

let baseScene;
let layer;

async function buildScene() {
  baseScene = new BaseScene();

  // Load textures specific to this example
  await baseScene.loadTextures([
    "assets/T_Character.webp",
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
    const character = new UIImage(
      layer,
      baseScene.loadedTextures["T_Character"],
    );

    new UIAspectConstraint(character);

    new UIHorizontalDistanceConstraint(layer, character, {
      anchorA: 0,
      anchorB: 0,
      distance: 25,
    });

    new UIVerticalDistanceConstraint(layer, character, {
      anchorA: 0,
      anchorB: 0,
      distance: 0,
    });

    new UIHorizontalProportionConstraint(layer, character, {
      proportion: 0.45,
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, character, {
      proportion: 0.75,
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.HORIZONTAL,
    });
  }

  {
    const logotype = new UIImage(layer, baseScene.loadedTextures["T_Logotype"]);

    new UIAspectConstraint(logotype);

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

    new UIHorizontalProportionConstraint(layer, logotype, {
      proportion: 0.25,
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, logotype, {
      proportion: 0.15,
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.HORIZONTAL,
    });
  }

  {
    const download = new UIImage(layer, baseScene.loadedTextures["T_Download"]);

    new UIAspectConstraint(download);

    new UIHorizontalDistanceConstraint(layer, download, {
      anchorA: 1,
      anchorB: 1,
      distance: -50,
    });

    new UIVerticalDistanceConstraint(layer, download, {
      anchorA: 1,
      anchorB: 1,
      distance: -50,
    });

    new UIHorizontalProportionConstraint(layer, download, {
      proportion: 0.4,
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, download, {
      proportion: 0.15,
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.HORIZONTAL,
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
