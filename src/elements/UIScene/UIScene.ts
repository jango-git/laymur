import type { Camera, WebGLRenderer } from "three";
import {
  LinearFilter,
  MathUtils,
  Matrix3,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import { assertValidPositiveNumber } from "../../miscellaneous/asserts";
import { UIColor } from "../../miscellaneous/color/UIColor";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import source from "../../shaders/UIImage.glsl";
import { UIElement } from "../UIElement/UIElement";
import {
  DUMMY_DEFAULT_HEIGHT,
  DUMMY_DEFAULT_WIDTH,
} from "../UIInputDummy/UIInputDummy.Internal";
import type { UISceneOptions } from "./UIScene.Internal";
import {
  SCENE_DEFAULT_CAMERA_FAR,
  SCENE_DEFAULT_CAMERA_FOV,
  SCENE_DEFAULT_CAMERA_NEAR,
  SCENE_DEFAULT_CLEAR_COLOR,
  SCENE_DEFAULT_RESOLUTION_FACTOR,
  SCENE_DEFAULT_UPDATE_MODE,
  SCENE_DEFAULT_USE_DEPTH,
  SCENE_MAX_RESOLUTION_FACTOR,
  SCENE_MIN_RESOLUTION_FACTOR,
  UISceneUpdateMode,
} from "./UIScene.Internal";

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
  private resolutionFactorDirty = false;
  private propertyDirty = false;

  /**
   * Creates a new UIScene instance.
   *
   * @param layer - Layer containing this element
   * @param options - Configuration options
   * @throws If resolutionFactor outside range 0.1 to 2.0
   */
  constructor(layer: UILayer, options: Partial<UISceneOptions> = {}) {
    if (options.resolutionFactor !== undefined) {
      assertValidPositiveNumber(
        options.resolutionFactor,
        "UIScene.constructor.resolutionFactor",
      );
    }

    const resolutionFactor = MathUtils.clamp(
      options.resolutionFactor ?? SCENE_DEFAULT_RESOLUTION_FACTOR,
      SCENE_MIN_RESOLUTION_FACTOR,
      SCENE_MAX_RESOLUTION_FACTOR,
    );

    const w = options.width ?? DUMMY_DEFAULT_WIDTH;
    const h = options.height ?? DUMMY_DEFAULT_HEIGHT;

    const renderTarget = new WebGLRenderTarget(
      w * resolutionFactor,
      h * resolutionFactor,
      {
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        type: UnsignedByteType,
        depthBuffer: options.enableDepthBuffer ?? SCENE_DEFAULT_USE_DEPTH,
        stencilBuffer: false,
      },
    );

    const color = new UIColor(options.color);

    super(
      layer,
      source,
      {
        texture: renderTarget.texture,
        textureTransform: new Matrix3(),
        color,
      },
      options,
    );

    this.colorInternal = color;
    this.clearColorInternal = new UIColor(
      options.clearColor ?? SCENE_DEFAULT_CLEAR_COLOR,
    );

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

  /** Render target resolution multiplier. Range 0.1 to 2.0. */
  public get resolutionFactor(): number {
    return this.resolutionFactorInternal;
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
    value = MathUtils.clamp(
      value,
      SCENE_MIN_RESOLUTION_FACTOR,
      SCENE_MAX_RESOLUTION_FACTOR,
    );
    if (this.resolutionFactorInternal !== value) {
      this.resolutionFactorInternal = value;
      this.resolutionFactorDirty = true;
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

  /** Removes element and frees resources */
  public override destroy(): void {
    this.renderTarget.dispose();
    super.destroy();
  }

  /** Triggers re-render on next frame. Useful in MANUAL mode. */
  public requestUpdate(): void {
    this.updateRequired = true;
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    this.evenFrame = !this.evenFrame;

    const isFramebufferDirty =
      this.updateRequired ||
      this.updateModeInternal === UISceneUpdateMode.EVERY_FRAME ||
      (this.updateModeInternal === UISceneUpdateMode.EVERY_SECOND_FRAME &&
        this.evenFrame) ||
      (this.updateModeInternal === UISceneUpdateMode.ON_PROPERTIES_CHANGE &&
        this.propertyDirty) ||
      this.colorInternal.dirty ||
      this.clearColorInternal.dirty ||
      (this.updateModeInternal === UISceneUpdateMode.ON_DIMENSIONS_CHANGE &&
        (this.resolutionFactorDirty || this.solverWrapper.dirty));

    if (isFramebufferDirty) {
      if (this.resolutionFactorDirty || this.solverWrapper.dirty) {
        this.renderTarget.setSize(
          this.width * this.resolutionFactorInternal,
          this.height * this.resolutionFactorInternal,
        );
        this.resolutionFactorDirty = false;
      }

      if (this.colorInternal.dirty) {
        this.sceneWrapper.setProperties(this.planeHandler, {
          color: this.colorInternal,
        });
        this.colorInternal.setDirtyFalse();
      }

      renderer.setClearColor(
        this.clearColorInternal.getHexRGB(),
        this.clearColorInternal.a,
      );
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear(true, true, false);
      renderer.render(this.sceneInternal, this.cameraInternal);

      this.propertyDirty = false;
      this.updateRequired = false;
    }
    super.onWillRender(renderer, deltaTime);
  }
}
