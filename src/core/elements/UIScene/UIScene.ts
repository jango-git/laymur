import type { Camera, WebGLRenderer } from "three";
import {
  Color,
  LinearFilter,
  MathUtils,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";

import type { UILayerCompilation } from "../../layers/UILayer/UILayer.Internal.js";
import type { UILayer } from "../../layers/UILayer/UILayer.js";
import {
  assertNotDestroyed,
  assertValidNonNegativeInteger,
  assertValidPositiveNumber,
} from "../../miscellaneous/asserts.js";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import { UIColor } from "../../miscellaneous/color/UIColor.js";
import { UIAffineMatrix3 } from "../../miscellaneous/UIAffineMatrix3.js";
import source from "../../shaders/UIImage.js";
import { DUMMY_DEFAULT_HEIGHT, DUMMY_DEFAULT_WIDTH } from "../UIDummy/UIDummy.Internal.js";
import { UIElement } from "../UIElement/UIElement.js";
import type { UISceneOptions } from "./UIScene.Internal.js";
import {
  SCENE_DEFAULT_CAMERA_FAR,
  SCENE_DEFAULT_CAMERA_FOV,
  SCENE_DEFAULT_CAMERA_NEAR,
  SCENE_DEFAULT_CLEAR_COLOR,
  SCENE_DEFAULT_RESOLUTION_FACTOR,
  SCENE_DEFAULT_SAMPLES,
  SCENE_DEFAULT_UPDATE_MODE,
  SCENE_DEFAULT_USE_DEPTH,
  SCENE_MAX_RESOLUTION_FACTOR,
  SCENE_MIN_RESOLUTION_FACTOR,
  UISceneUpdateMode,
} from "./UIScene.Internal.js";

let previousClearColor = new Color();
let previousClearAlpha = 0;

/** Renders Three.js scene to texture */
export class UIScene extends UIElement {
  private readonly colorInternal: UIColor;
  private readonly clearColorInternal: UIColor;
  private readonly renderTarget: WebGLRenderTarget;
  private sceneInternal: Scene;
  private cameraInternal: Camera;
  private updateModeInternal: UISceneUpdateMode;
  private resolutionFactorInternal: number;
  private evenFrame = true;

  private updateRequired = false;
  private propertyDirty = false;

  /**
   * Creates a new UIScene instance.
   *
   * @param layer - Layer containing this element
   * @param options - Configuration options
   * @throws If resolutionFactor outside range 0.1 to 2.0
   */
  constructor(layer: UILayer, options: Partial<UISceneOptions> = {}) {
    if (process.env.NODE_ENV !== "production" && options.resolutionFactor !== undefined) {
      assertValidPositiveNumber(options.resolutionFactor, "UIScene.constructor.resolutionFactor");
    }

    const resolutionFactor = MathUtils.clamp(
      options.resolutionFactor ?? SCENE_DEFAULT_RESOLUTION_FACTOR,
      SCENE_MIN_RESOLUTION_FACTOR,
      SCENE_MAX_RESOLUTION_FACTOR,
    );

    const samples = options.samples ?? SCENE_DEFAULT_SAMPLES;
    assertValidNonNegativeInteger(samples, "UIScene.constructor.options.samples");

    const w = options.width ?? DUMMY_DEFAULT_WIDTH;
    const h = options.height ?? DUMMY_DEFAULT_HEIGHT;

    const renderTarget = new WebGLRenderTarget(w * resolutionFactor, h * resolutionFactor, {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      type: UnsignedByteType,
      depthBuffer: options.enableDepthBuffer ?? SCENE_DEFAULT_USE_DEPTH,
      stencilBuffer: false,
      samples,
    });

    const color = new UIColor(options.color);

    super(
      layer,
      source,
      {
        texture: renderTarget.texture,
        textureTransform: new UIAffineMatrix3(),
        color,
      },
      options,
    );

    this.colorInternal = color;
    this.clearColorInternal = new UIColor(options.clearColor ?? SCENE_DEFAULT_CLEAR_COLOR);

    this.renderTarget = renderTarget;
    this.sceneInternal = options.scene ?? new Scene();

    this.cameraInternal =
      options.camera ??
      new PerspectiveCamera(
        SCENE_DEFAULT_CAMERA_FOV,
        w / h,
        SCENE_DEFAULT_CAMERA_NEAR,
        SCENE_DEFAULT_CAMERA_FAR,
      );

    this.resolutionFactorInternal = resolutionFactor;
    this.updateModeInternal = options.updateMode ?? SCENE_DEFAULT_UPDATE_MODE;
    this.propertyDirty = options.updateMode !== UISceneUpdateMode.MANUAL;

    this.layer.signalContextRestored.on(this.onContextRestored);
    this.layer.signalCompiling.on(this.onCompiling);
  }

  /** Camera used for rendering */
  public get camera(): Camera {
    return this.cameraInternal;
  }

  /** Background color for render target */
  public get clearColor(): UIColor {
    return this.clearColorInternal;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Render target resolution multiplier over the pixel density of the layer, so 1 renders as
   * many pixels as the element covers on the screen. Range 0.1 to 2.0.
   */
  public get resolutionFactor(): number {
    return this.resolutionFactorInternal;
  }

  /** Multisample antialiasing samples of the render target, 0 for none. WebGL1 ignores it. */
  public get samples(): number {
    return this.renderTarget.samples;
  }

  /** Three.js scene to render */
  public get scene(): Scene {
    return this.sceneInternal;
  }

  /** Controls when scene re-renders */
  public get updateMode(): UISceneUpdateMode {
    return this.updateModeInternal;
  }

  /** Camera used for rendering */
  public set camera(value: Camera) {
    if (this.cameraInternal !== value) {
      this.cameraInternal = value;
      this.propertyDirty = true;
    }
  }

  /** Background color for render target */
  public set clearColor(value: UIColorConfig) {
    this.clearColorInternal.set(value);
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public set color(value: UIColorConfig) {
    this.colorInternal.set(value);
  }

  /** Render target resolution multiplier. Range 0.1 to 2.0. */
  public set resolutionFactor(value: number) {
    assertValidPositiveNumber(value, "UIScene.resolutionFactor");
    value = MathUtils.clamp(value, SCENE_MIN_RESOLUTION_FACTOR, SCENE_MAX_RESOLUTION_FACTOR);
    if (this.resolutionFactorInternal !== value) {
      this.resolutionFactorInternal = value;
    }
  }

  /**
   * Multisample antialiasing samples of the render target, 0 for none. WebGL1 ignores it. A change
   * frees the render target, which is allocated again and rendered on the next frame.
   */
  public set samples(value: number) {
    assertNotDestroyed(this, "element", "UIScene.samples");
    assertValidNonNegativeInteger(value, "UIScene.samples");
    if (this.renderTarget.samples !== value) {
      this.renderTarget.samples = value;
      this.renderTarget.dispose();
      this.updateRequired = true;
    }
  }

  /** Three.js scene to render */
  public set scene(value: Scene) {
    if (this.sceneInternal !== value) {
      this.sceneInternal = value;
      this.propertyDirty = true;
    }
  }

  /** Controls when scene re-renders */
  public set updateMode(value: UISceneUpdateMode) {
    if (this.updateModeInternal !== value) {
      this.updateModeInternal = value;
      this.propertyDirty = true;
    }
  }

  /** Triggers re-render on next frame. Useful in MANUAL mode. */
  public requestUpdate(): void {
    this.updateRequired = true;
  }

  /** Frees resources of the scene */
  protected override destroyInternal(): void {
    this.layer.signalContextRestored.off(this.onContextRestored);
    this.layer.signalCompiling.off(this.onCompiling);
    this.renderTarget.dispose();
    super.destroyInternal();
  }

  protected override onWillRender(renderer: WebGLRenderer, deltaTime: number): void {
    this.evenFrame = !this.evenFrame;

    // Compared every frame rather than on layout changes, so a size change is kept until a frame
    // that renders the scene applies it
    const pixelsPerUnit = this.layer.pixelDensity * this.resolutionFactorInternal;
    const targetWidth = Math.max(Math.round(this.width * pixelsPerUnit), 1);
    const targetHeight = Math.max(Math.round(this.height * pixelsPerUnit), 1);
    const isSizeDirty =
      this.renderTarget.width !== targetWidth || this.renderTarget.height !== targetHeight;

    const isFramebufferDirty =
      this.updateRequired ||
      this.updateModeInternal === UISceneUpdateMode.EVERY_FRAME ||
      (this.updateModeInternal === UISceneUpdateMode.EVERY_SECOND_FRAME && this.evenFrame) ||
      (this.updateModeInternal === UISceneUpdateMode.ON_PROPERTIES_CHANGE && this.propertyDirty) ||
      this.colorInternal.dirty ||
      this.clearColorInternal.dirty ||
      (this.updateModeInternal === UISceneUpdateMode.ON_DIMENSIONS_CHANGE && isSizeDirty);

    if (isFramebufferDirty) {
      if (isSizeDirty) {
        this.renderTarget.setSize(targetWidth, targetHeight);
      }

      if (this.colorInternal.dirty) {
        this.sceneWrapper.setProperties(this.planeHandler, {
          color: this.colorInternal,
        });
        this.colorInternal.setDirtyFalse();
      }

      const previousRenderTarget = renderer.getRenderTarget();
      previousClearColor = renderer.getClearColor(previousClearColor);
      previousClearAlpha = renderer.getClearAlpha();

      renderer.setClearColor(this.clearColorInternal.getHexRGB(), this.clearColorInternal.a);
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear(true, true, false);
      renderer.render(this.sceneInternal, this.cameraInternal);

      renderer.setRenderTarget(previousRenderTarget);
      renderer.setClearColor(previousClearColor, previousClearAlpha);

      this.clearColorInternal.setDirtyFalse();
      this.propertyDirty = false;
      this.updateRequired = false;
    }
    super.onWillRender(renderer, deltaTime);
  }

  /** Render target contents live on the GPU only and are gone after a context loss */
  private readonly onContextRestored = (): void => {
    this.requestUpdate();
  };

  private readonly onCompiling = (compilation: UILayerCompilation): void => {
    compilation.compileScene(this.sceneInternal, this.cameraInternal, this.renderTarget);
  };
}
