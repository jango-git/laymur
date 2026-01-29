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
  UIConstraint2DBuilder,
  UICoverConstraintBuilder,
  UIProgressMaskFunctionDirectional,
  UIColor,
} from "https://esm.sh/laymur@0.17.1?deps=three@0.157";
import {
  UIEmitter,
  UISpawnRectangle,
  UISpawnRandomRotation,
  UISpawnRandomTorque,
  UISpawnRandomScale,
  UISpawnRandomLifetime,
  UIBehaviorDirectionalGravity,
  UIBehaviorVelocityNoise,
  UIBehaviorVelocityDamping,
  UIBehaviorTorqueNoise,
  UIBehaviorTorqueDamping,
  UITextureRenderingModule,
  UIRenderingColorOverLife,
} from "https://esm.sh/laymur@0.17.1/particles?deps=three@0.157";
import { BaseScene } from "./base-scene.js";

let baseScene;
let layer;

async function buildScene() {
  await document.fonts.load('16px "Chewy"');
  baseScene = new BaseScene();

  await baseScene.loadTextures([
    "assets/T_Battle.webp",
    "assets/T_Bubble.webp",
    "assets/T_Character.webp",
    "assets/T_Download.webp",
    "assets/T_Logotype.webp",
    "assets/T_Dust.webp",
    "assets/T_Vignette.webp",
    "assets/T_Progress_Background.webp",
    "assets/T_Progress_Foreground.webp",
  ]);

  await baseScene.initScene();
  baseScene.initRenderer();

  layer = new UIFullscreenLayer({
    resizePolicy: new UIResizePolicyFixedHeight(1920, 1920),
    mode: UIMode.INTERACTIVE,
  });

  {
    const emitter = new UIEmitter(
      layer,
      [
        new UISpawnRectangle([-960, 0], [960, 0]),
        new UISpawnRandomRotation([-Math.PI, Math.PI]),
        new UISpawnRandomTorque([-Math.PI, Math.PI]),
        new UISpawnRandomScale([5, 20]),
        new UISpawnRandomLifetime([10, 20]),
      ],
      [
        new UIBehaviorDirectionalGravity({ x: 0, y: 50 }),
        new UIBehaviorVelocityNoise(1, 200),
        new UIBehaviorVelocityDamping({ min: 0.25, max: 0.75 }),
        new UIBehaviorTorqueNoise(1, 100),
        new UIBehaviorTorqueDamping(0.25),
      ],
      [
        new UITextureRenderingModule(baseScene.loadedTextures["T_Dust"]),
        new UIRenderingColorOverLife([
          new UIColor(0x8031a7, 1),
          new UIColor(0x24d2f4, 0),
        ]),
      ],
      { expectedCapacity: 1024 },
    );

    UIConstraint2DBuilder.distance(layer, emitter, {
      anchorA: [0.5, 0],
      anchorB: [0.5, 0.5],
    });

    emitter.play(16);
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
  }

  {
    const vignette = new UINineSlice(
      layer,
      baseScene.loadedTextures["T_Vignette"],
      { sliceBorders: 0.2, sliceRegions: 100 },
    );

    vignette.color.setHexRGB(0xffa500, 0.75);

    UICoverConstraintBuilder.build(layer, vignette, {
      keepActiveAspect: false,
    });
  }

  {
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
        progress: 0.8,
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
      anchorA: [0.6, 1.025],
      anchorB: [0.5, 0],
      distance: [0, 0],
    });

    new UIHorizontalProportionConstraint(character, barBackground, {
      proportion: 0.5,
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
