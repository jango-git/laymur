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
} from "https://esm.sh/laymur@0.2.10?deps=three@0.175&min";
import { BaseScene } from "./base-scene.js";

let baseScene;
let layer;

async function buildScene() {
  await document.fonts.ready;
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
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, character, {
      proportion: 0.75,
      relation: UIRelation.LESS_THAN,
      orientation: UIOrientation.HORIZONTAL,
    });
  }

  let bubble;
  {
    bubble = new UIImage(layer, baseScene.loadedTextures["T_Bubble"]);

    new UIAspectConstraint(bubble);

    new UIHorizontalDistanceConstraint(character, bubble, {
      anchorA: 1,
      anchorB: 0,
      distance: 0,
      orientation: UIOrientation.HORIZONTAL,
    });

    new UIVerticalDistanceConstraint(character, bubble, {
      anchorA: 0.45,
      anchorB: 0,
      distance: 0,
      orientation: UIOrientation.HORIZONTAL,
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

    new UIHorizontalDistanceConstraint(bubble, text, {
      anchorA: 0.5,
      anchorB: 0.5,
      distance: 0,
    });

    new UIVerticalDistanceConstraint(bubble, text, {
      anchorA: 0.525,
      anchorB: 0.5,
      distance: 0,
    });

    new UIHorizontalProportionConstraint(bubble, text, {
      proportion: text.width / bubble.width,
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
