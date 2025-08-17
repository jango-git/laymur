import {
  UIFullscreenLayer,
  UIImage,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
  UIAspectConstraint,
  UIHorizontalProportionConstraint,
  UIVerticalProportionConstraint,
  UIRelation,
  UIOrientation,
} from "https://esm.sh/laymur@0.2.2?deps=three@0.175&min";
import { BaseScene } from "./base_scene.js";

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
  layer = new UIFullscreenLayer(1920, 1920);

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

    new UIVerticalDistanceConstraint(character, layer, {
      anchorA: 0,
      anchorB: 0,
      distance: 0,
    });

    new UIHorizontalProportionConstraint(layer, character, {
      proportion: 0.45,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, character, {
      proportion: 0.75,
      relation: UIRelation.GREATER_THAN,
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

    new UIVerticalDistanceConstraint(logotype, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });

    new UIHorizontalProportionConstraint(layer, logotype, {
      proportion: 0.25,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, logotype, {
      proportion: 0.15,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.HORIZONTAL,
    });
  }

  {
    const download = new UIImage(layer, baseScene.loadedTextures["T_Download"]);

    new UIAspectConstraint(download);

    new UIHorizontalDistanceConstraint(download, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });

    new UIVerticalDistanceConstraint(download, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });

    new UIHorizontalProportionConstraint(layer, download, {
      proportion: 0.4,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, download, {
      proportion: 0.15,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.HORIZONTAL,
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
