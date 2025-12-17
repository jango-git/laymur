import {
  UIFullscreenLayer,
  UIResizePolicyFixedHeight,
  UIImage,
  UIText,
  UINineSlice,
  UIProgress,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
  UIAspectConstraint,
  UIHorizontalProportionConstraint,
  UIVerticalProportionConstraint,
  UIRelation,
  UIOrientation,
  UIMode,
  UIInputEvent,
  UIConstraint2DBuilder,
  UICoverConstraintBuilder,
  UIProgressMaskFunctionDirectional,
  UIColor,
} from "https://esm.sh/laymur@latest?deps=three@0.175&min";
import { gsap } from "https://esm.sh/gsap@3.12.2&min";
import {
  UIAppearAnimator,
  UIClickAnimator,
  UIJumpCallAnimator,
} from "https://esm.sh/laymur-animations@latest?deps=laymur@latest,gsap@3.13.0&min";
import { BaseScene } from "./base-scene.js";

let baseScene;
let layer;

async function buildScene() {
  await document.fonts.load('16px "Chewy"');
  baseScene = new BaseScene();

  // Load textures specific to this example
  await baseScene.loadTextures([
    "assets/T_Battle.webp",
    "assets/T_Bubble.webp",
    "assets/T_Character.webp",
    "assets/T_Download.webp",
    "assets/T_Logotype.webp",
    "assets/T_Vignette.webp",
    "assets/T_Progress_Background.webp",
    "assets/T_Progress_Foreground.webp",
  ]);

  await baseScene.initScene();
  baseScene.initRenderer();

  layer = new UIFullscreenLayer(
    new UIResizePolicyFixedHeight(1920, 1920),
    UIMode.INTERACTIVE,
  );

  // ========== CHARACTER ==========
  const character = new UIImage(layer, baseScene.loadedTextures["T_Character"]);

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

  // ========== BUBBLE ==========
  const bubble = new UIImage(layer, baseScene.loadedTextures["T_Bubble"]);

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
    distance: 150,
    orientation: UIOrientation.VERTICAL,
  });

  new UIHorizontalProportionConstraint(layer, bubble, {
    proportion: 0.95,
    relation: UIRelation.LESS_THAN,
    orientation: UIOrientation.VERTICAL,
  });

  // ========== TEXT ==========
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
      strokeThickness: 12,
    },
  });
  UIConstraint2DBuilder.distance(bubble, text, {
    anchorA: { h: 0.5, v: 0.525 },
    anchorB: { h: 0.5, v: 0.5 },
    distance: { h: 0, v: 0 },
  });

  new UIHorizontalProportionConstraint(bubble, text, {
    proportion: text.width / bubble.width,
  });

  // ========== LOGOTYPE ==========
  const logotype = new UIImage(layer, baseScene.loadedTextures["T_Logotype"], {
    mode: UIMode.INTERACTIVE,
  });

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

  logotype.on(UIInputEvent.PRESSED, () => {
    gsap
      .timeline()
      .to(logotype.micro, {
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 0.125,
        ease: "power1.inOut",
      })
      .to(logotype.micro, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.5,
        ease: "power1.inOut",
      });
  });

  // ========== DOWNLOAD BUTTON ==========
  const download = new UIImage(layer, baseScene.loadedTextures["T_Download"], {
    mode: UIMode.INTERACTIVE,
  });

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

  download.on(UIInputEvent.PRESSED, () => {
    gsap
      .timeline()
      .to(download.micro, {
        scaleX: 0.75,
        scaleY: 0.75,
        duration: 0.125,
        ease: "power1.out",
      })
      .to(download.micro, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.25,
        ease: "power1.out",
      });
  });

  // ========== BATTLE BUTTON ==========
  const battle = new UIImage(layer, baseScene.loadedTextures["T_Battle"], {
    mode: UIMode.INTERACTIVE,
  });

  new UIAspectConstraint(battle);

  UIConstraint2DBuilder.distance(layer, battle, {
    anchorA: { h: 1, v: 0 },
    anchorB: { h: 1, v: 0 },
    distance: { h: -50, v: 50 },
  });

  new UIHorizontalProportionConstraint(layer, battle, {
    proportion: 0.4,
    relation: UIRelation.LESS_THAN,
    orientation: UIOrientation.VERTICAL,
  });

  new UIVerticalProportionConstraint(layer, battle, {
    proportion: 0.15,
    relation: UIRelation.LESS_THAN,
    orientation: UIOrientation.HORIZONTAL,
  });

  battle.on(UIInputEvent.PRESSED, () => UIClickAnimator.click(battle));

  // ========== VIGNETTE OVERLAY ==========
  const vignette = new UINineSlice(
    layer,
    baseScene.loadedTextures["T_Vignette"],
    { sliceBorders: 0.2, sliceRegions: 100 },
  );

  vignette.color.setHexRGB(0xffa500, 0.75);

  UICoverConstraintBuilder.build(layer, vignette);

  // ========== HEALTH BAR ==========
  const backgroundColor = new UIColor();
  backgroundColor.lightness = 0.95;

  const barBackground = new UIImage(
    layer,
    baseScene.loadedTextures["T_Progress_Background"],
    { color: backgroundColor },
  );

  const bar = new UIProgress(
    layer,
    baseScene.loadedTextures["T_Progress_Foreground"],
    {
      color: UIColor.orange,
      progress: 0,
      maskFunction: new UIProgressMaskFunctionDirectional({ x: 1, y: 0.5 }),
    },
  );

  new UIAspectConstraint(barBackground);
  new UIAspectConstraint(bar);

  UIConstraint2DBuilder.distance(barBackground, bar);
  new UIHorizontalProportionConstraint(barBackground, bar, {
    proportion: bar.width / barBackground.width,
  });

  UIConstraint2DBuilder.distance(character, barBackground, {
    anchorA: { h: 0.6, v: 1.025 },
    anchorB: { h: 0.5, v: 0 },
    distance: { h: 0, v: 0 },
  });

  new UIHorizontalProportionConstraint(character, barBackground, {
    proportion: 0.5,
  });

  // ========== ANIMATIONS ==========
  UIAppearAnimator.appear(logotype, {
    xFrom: -100,
    yFrom: 100,
    delay: 0.25,
    duration: 0.5,
  });

  UIAppearAnimator.appear(download, {
    xFrom: 100,
    yFrom: 100,
    delay: 0.25 * 2,
    duration: 0.5,
  }).then(() => UIJumpCallAnimator.jump(download));

  UIAppearAnimator.appear([bar, character], {
    xFrom: -100,
    scaleFrom: 1,
    delay: 0.25 * 3,
    duration: 0.5,
  }).then(() => {
    gsap.to(bar, {
      progress: 0.8,
      duration: 2,
      ease: "power2.inOut",
    });
  });

  UIAppearAnimator.appear([text, bubble], {
    xFrom: -100,
    yFrom: -50,
    delay: 0.25 * 4,
    duration: 0.5,
  });

  UIAppearAnimator.appear(battle, {
    xFrom: 100,
    yFrom: -100,
    delay: 0.25 * 5,
    duration: 0.5,
  });

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
