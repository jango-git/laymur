import {
  UIFullscreenLayer,
  UIResizePolicyFixedHeight,
  UIImage,
  UIText,
  UINineSlice,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
  UIAspectConstraint,
  UIHorizontalProportionConstraint,
  UIVerticalProportionConstraint,
  UIRelation,
  UIOrientation,
  UIMode,
  UIConstraint2DBuilder,
  UICoverConstraintBuilder,
} from "https://esm.sh/laymur@0.17.1?deps=three@0.157";
import { gsap } from "https://esm.sh/gsap@3.12.2&min";
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
  ]);

  // Initialize scene and renderer
  await baseScene.initScene();
  baseScene.initRenderer();

  // Create UI layer
  layer = new UIFullscreenLayer({
    resizePolicy: new UIResizePolicyFixedHeight(1920, 1920),
    mode: UIMode.INTERACTIVE,
  });

  {
    // Create nine-slice vignette overlay
    const vignette = new UINineSlice(
      layer,
      baseScene.loadedTextures["T_Vignette"],
      { sliceBorders: 0.2, sliceRegions: 100 },
    );

    // Configure appearance
    vignette.color.setHexRGB(0xffa500, 0.75);

    // Use cover constraints to fill the entire layer
    UICoverConstraintBuilder.build(layer, vignette, {
      keepActiveAspect: false,
    });
  }

  let character;
  {
    character = new UIImage(layer, baseScene.loadedTextures["T_Character"]);

    new UIAspectConstraint(character);

    UIConstraint2DBuilder.distance(layer, character, {
      anchorA: [0, 0],
      anchorB: [0, 0],
      distance: [25, 0],
    });

    UIConstraint2DBuilder.proportion(layer, character, {
      proportion: [0.45, 0.75],
      relation: [UIRelation.LESS_THAN, UIRelation.LESS_THAN],
      orientation: [UIOrientation.VERTICAL, UIOrientation.HORIZONTAL],
    });
  }

  let bubble;
  {
    bubble = new UIImage(layer, baseScene.loadedTextures["T_Bubble"]);

    new UIAspectConstraint(bubble);

    UIConstraint2DBuilder.distance(character, bubble, {
      anchorA: [1, 0.45],
      anchorB: [0, 0],
      distance: [0, 0],
      orientation: [UIOrientation.HORIZONTAL, UIOrientation.HORIZONTAL],
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
        strokeThickness: 12,
      },
    });

    UIConstraint2DBuilder.distance(bubble, text, {
      anchorA: [0.5, 0.525],
      anchorB: [0.5, 0.5],
      distance: [0, 0],
    });

    new UIHorizontalProportionConstraint(bubble, text, {
      proportion: text.width / bubble.width,
    });
  }

  {
    const logotype = new UIImage(layer, baseScene.loadedTextures["T_Logotype"]);

    new UIAspectConstraint(logotype);

    UIConstraint2DBuilder.distance(layer, logotype, {
      anchorA: [0, 1],
      anchorB: [0, 1],
      distance: [50, -50],
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

    logotype.signalPointerReleased.on(() => {
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
  }

  {
    const download = new UIImage(
      layer,
      baseScene.loadedTextures["T_Download"],
      { mode: UIMode.INTERACTIVE },
    );

    new UIAspectConstraint(download);

    UIConstraint2DBuilder.distance(layer, download, {
      anchorA: [1, 1],
      anchorB: [1, 1],
      distance: [-50, -50],
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

    // Add click animation
    download.signalPointerPressed.on(() => {
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
  }

  {
    const battle = new UIImage(layer, baseScene.loadedTextures["T_Battle"], {
      mode: UIMode.INTERACTIVE,
    });

    new UIAspectConstraint(battle);

    UIConstraint2DBuilder.distance(layer, battle, {
      anchorA: [1, 0],
      anchorB: [1, 0],
      distance: [-50, 50],
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

    // Add click animation
    battle.signalPointerPressed.on(() => {
      gsap
        .timeline()
        .to(battle.micro, {
          y: -35,
          scaleX: 0.85,
          duration: 0.125,
          ease: "power1.out",
        })
        .to(battle.micro, {
          y: 0,
          scaleX: 1,
          duration: 0.25,
          ease: "back.out",
        });
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
