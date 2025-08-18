import {
  UIFullscreenLayer,
  UIImage,
  UIText,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
  UIAspectConstraint,
  UIHorizontalProportionConstraint,
  UIVerticalProportionConstraint,
  UIRelation,
  UIOrientation,
  UIConstraint2DBuilder,
} from "https://esm.sh/laymur@0.2.12?deps=three@0.175&min";
import { BaseScene } from "./base-scene.js";

let baseScene;
let layer;

async function buildScene() {
  await document.fonts.load('16px "Chewy"');
  baseScene = new BaseScene();

  // Load textures specific to this example
  await baseScene.loadTextures([
    "assets/T_Bubble.webp",
    "assets/T_Character.webp",
    "assets/T_Download.webp",
    "assets/T_Logotype.webp",
  ]);

  // Initialize scene and renderer
  await baseScene.initScene();
  baseScene.initRenderer();

  // Create UI layer
  layer = new UIFullscreenLayer(1920, 1920);

  let character;
  {
    character = new UIImage(layer, baseScene.loadedTextures["T_Character"]);

    new UIAspectConstraint(character);

    UIConstraint2DBuilder.distance(layer, character, {
      anchorA: { h: 0, v: 0 },
      anchorB: { h: 0, v: 0 },
      distance: { h: 25, v: 0 },
    });

    UIConstraint2DBuilder.proportion(layer, character, {
      proportion: { h: 0.45, v: 0.75 },
      relation: { h: UIRelation.LESS_THAN, v: UIRelation.LESS_THAN },
      orientation: { h: UIOrientation.VERTICAL, v: UIOrientation.HORIZONTAL },
    });
  }

  let bubble;
  {
    bubble = new UIImage(layer, baseScene.loadedTextures["T_Bubble"]);

    new UIAspectConstraint(bubble);

    UIConstraint2DBuilder.distance(character, bubble, {
      anchorA: { h: 1, v: 0.45 },
      anchorB: { h: 0, v: 0 },
      distance: { h: 0, v: 0 },
      orientation: { h: UIOrientation.HORIZONTAL, v: UIOrientation.HORIZONTAL },
    });

    new UIHorizontalDistanceConstraint(layer, bubble, {
      anchorA: 0.5,
      anchorB: 0.5,
      distance: 0,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalDistanceConstraint(character, bubble, {
      anchorA: 1,
      anchorB: 0,
      distance: 50,
      orientation: UIOrientation.VERTICAL,
    });

    new UIHorizontalProportionConstraint(layer, bubble, {
      proportion: 0.95,
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.VERTICAL,
    });
  }

  {
    const text = new UIText(layer, "Hello!", {
      padding: { left: 20, right: 20, top: 20, bottom: 20 },
      commonStyle: {
        color: "#ffffff",
        fontFamily: "Chewy",
        fontSize: 256,

        enableShadow: true,
        shadowOffsetX: 8,
        shadowOffsetY: 8,
        shadowBlur: 4,
        shadowColor: "#050505",

        enableStroke: true,
        strokeColor: "#101010",
        strokeWidth: 12,
      },
    });

    text.transparency = true;

    UIConstraint2DBuilder.distance(bubble, text, {
      anchorA: { h: 0.5, v: 0.525 },
      anchorB: { h: 0.5, v: 0.5 },
      distance: { h: 0, v: 0 },
    });

    new UIHorizontalProportionConstraint(bubble, text, {
      proportion: text.width / bubble.width,
    });
  }

  {
    const logotype = new UIImage(layer, baseScene.loadedTextures["T_Logotype"]);

    new UIAspectConstraint(logotype);

    UIConstraint2DBuilder.distance(layer, logotype, {
      anchorA: { h: 0, v: 1 },
      anchorB: { h: 0, v: 1 },
      distance: { h: 50, v: -50 },
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

    UIConstraint2DBuilder.distance(layer, download, {
      anchorA: { h: 1, v: 1 },
      anchorB: { h: 1, v: 1 },
      distance: { h: -50, v: -50 },
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
