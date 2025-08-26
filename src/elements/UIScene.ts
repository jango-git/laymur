import type { Camera, WebGLRenderer } from "three";
import {
  LinearFilter,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";
import { type UILayer } from "../layers/UILayer";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import source from "../shaders/UIDefaultShader.glsl";
import { UIElement } from "./UIElement";

/**
 * Update modes for controlling when the 3D scene should be re-rendered.
 *
 * @public
 */
export enum UISceneUpdateMode {
  /** Re-render the scene every frame. */
  EACH_FRAME = 1,
  /** Re-render the scene every second frame for performance. */
  EACH_SECOND_FRAME = 2,
  /** Re-render the scene only when properties change. */
  PROPERTY_CHANGED = 3,
  /** Re-render the scene only when manually requested. */
  MANUAL = 4,
}

/** Default resolution factor for render target sizing. */
const DEFAULT_RESOLUTION_FACTOR = 0.5;
/** Minimum allowed resolution factor to prevent performance issues. */
const MIN_RESOLUTION_FACTOR = 0.1;
/** Maximum allowed resolution factor to prevent memory issues. */
const MAX_RESOLUTION_FACTOR = 2;
/** Default width for the scene render target in pixels. */
const DEFAULT_WIDTH = 512;
/** Default height for the scene render target in pixels. */
const DEFAULT_HEIGHT = 512;
/** Default field of view for the perspective camera in degrees. */
const DEFAULT_CAMERA_FOV = 75;
/** Default near clipping plane distance for the camera. */
const DEFAULT_CAMERA_NEAR = 0.1;
/** Default far clipping plane distance for the camera. */
const DEFAULT_CAMERA_FAR = 100;
/** Default update mode for scene rendering. */
const DEFAULT_UPDATE_MODE = UISceneUpdateMode.PROPERTY_CHANGED;
/** Default clear color for the render target. */
const DEFAULT_CLEAR_COLOR = 0x000000;
/** Default clear alpha for the render target. */
const DEFAULT_CLEAR_ALPHA = 0;
/** Default depth buffer usage setting. */
const DEFAULT_USE_DEPTH = true;

/**
 * Configuration options for UIScene element creation.
 *
 * @public
 */
export interface UISceneOptions {
  /** Initial x-coordinate position. */
  x: number;
  /** Initial y-coordinate position. */
  y: number;
  /** Width of the scene render target in pixels. */
  width: number;
  /** Height of the scene render target in pixels. */
  height: number;
  /** Color tint applied to the scene texture. */
  color: UIColor;
  /** Three.js scene to render. */
  scene: Scene;
  /** Camera to use for rendering the scene. */
  camera: Camera;
  /** Update mode controlling when the scene is re-rendered. */
  updateMode: UISceneUpdateMode;
  /** Resolution factor for render target sizing (0.1 to 2.0). */
  resolutionFactor: number;
  /** Clear color for the render target background. */
  clearColor: number;
  /** Clear alpha for the render target background. */
  clearAlpha: number;
  /** Whether to enable depth buffer for the render target. */
  enableDepthBuffer: boolean;
}

/**
 * UI element that renders 3D scenes to texture.
 *
 * Renders a Three.js scene to a WebGL render target and displays it as a texture.
 * Provides basic control over rendering frequency and resolution to help with
 * performance when embedding 3D content in 2D UI layouts.
 *
 * @public
 */
export class UIScene extends UIElement {
  /** @internal */
  private readonly renderTarget: WebGLRenderTarget;

  /** @internal */
  private readonly colorInternal: UIColor;
  /** @internal */
  private sceneInternal: Scene;
  /** @internal */
  private cameraInternal: Camera;
  /** @internal */
  private updateModeInternal: UISceneUpdateMode;
  /** @internal */
  private resolutionFactorInternal: number;
  /** @internal */
  private clearColorInternal: number;
  /** @internal */
  private clearAlphaInternal: number;

  /** @internal */
  private frameBoolean = true;
  /** @internal */
  private propertyChanged = false;
  /** @internal */
  private renderRequired = false;

  /**
   * Creates a UIScene element.
   *
   * Creates a WebGL render target for off-screen rendering and displays the result
   * as a texture. Creates a default perspective camera if none is provided.
   *
   * @param layer - UI layer to contain this element
   * @param options - Configuration options
   * @throws Error when resolution factor is outside valid range (0.1-2.0)
   */
  constructor(layer: UILayer, options: Partial<UISceneOptions> = {}) {
    const resolutionFactor =
      options.resolutionFactor ?? DEFAULT_RESOLUTION_FACTOR;

    if (
      resolutionFactor < MIN_RESOLUTION_FACTOR ||
      resolutionFactor > MAX_RESOLUTION_FACTOR
    ) {
      throw new Error(
        `Invalid resolution factor: ${resolutionFactor}. Must be between ${MIN_RESOLUTION_FACTOR} and ${MAX_RESOLUTION_FACTOR}.`,
      );
    }

    const w = options.width ?? DEFAULT_WIDTH;
    const h = options.height ?? DEFAULT_HEIGHT;

    const renderTarget = new WebGLRenderTarget(
      w * resolutionFactor,
      h * resolutionFactor,
      {
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        type: UnsignedByteType,
        depthBuffer: options.enableDepthBuffer ?? DEFAULT_USE_DEPTH,
        stencilBuffer: false,
      },
    );

    const color = options.color ?? new UIColor();

    super(layer, 0, 0, w, h, source, {
      map: renderTarget.texture,
      color,
    });

    this.renderTarget = renderTarget;
    this.colorInternal = color;

    this.sceneInternal = options.scene ?? new Scene();
    this.cameraInternal =
      options.camera ??
      new PerspectiveCamera(
        DEFAULT_CAMERA_FOV,
        w / h,
        DEFAULT_CAMERA_NEAR,
        DEFAULT_CAMERA_FAR,
      );

    this.resolutionFactorInternal = resolutionFactor;
    this.updateModeInternal = options.updateMode ?? DEFAULT_UPDATE_MODE;

    this.clearColorInternal = options.clearColor ?? DEFAULT_CLEAR_COLOR;
    this.clearAlphaInternal = options.clearAlpha ?? DEFAULT_CLEAR_ALPHA;

    if (options.updateMode === UISceneUpdateMode.PROPERTY_CHANGED) {
      this.renderRequired = true;
    }

    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);
  }

  /**
   * Gets the color tint.
   *
   * @returns Color tint
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Gets the Three.js scene.
   *
   * @returns Current scene
   */
  public get scene(): Scene {
    return this.sceneInternal;
  }

  /**
   * Gets the camera.
   *
   * @returns Current camera
   */
  public get camera(): Camera {
    return this.cameraInternal;
  }

  /**
   * Gets the update mode.
   *
   * @returns Current update mode
   */
  public get updateMode(): UISceneUpdateMode {
    return this.updateModeInternal;
  }

  /**
   * Gets the resolution factor.
   *
   * @returns Resolution factor between 0.1 and 2.0
   */
  public get resolutionFactor(): number {
    return this.resolutionFactorInternal;
  }

  /**
   * Gets the clear color.
   *
   * @returns Clear color as a number
   */
  public get clearColor(): number {
    return this.clearColorInternal;
  }

  /**
   * Gets the clear alpha.
   *
   * @returns Clear alpha value between 0.0 and 1.0
   */
  public get clearAlpha(): number {
    return this.clearAlphaInternal;
  }

  /**
   * Sets the color tint.
   *
   * @param value - Color tint
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Sets the Three.js scene and marks for re-render.
   *
   * @param value - New scene
   */
  public set scene(value: Scene) {
    if (this.sceneInternal !== value) {
      this.sceneInternal = value;
      this.propertyChanged = true;
    }
  }

  /**
   * Sets the camera and marks for re-render.
   *
   * @param value - New camera
   */
  public set camera(value: Camera) {
    if (this.cameraInternal !== value) {
      this.cameraInternal = value;
      this.propertyChanged = true;
    }
  }

  /**
   * Sets the update mode and marks for re-render.
   *
   * @param value - New update mode
   */
  public set updateMode(value: UISceneUpdateMode) {
    if (this.updateModeInternal !== value) {
      this.updateModeInternal = value;
      this.propertyChanged = true;
    }
  }

  /**
   * Sets the resolution factor and resizes the render target.
   *
   * @param value - New resolution factor between 0.1 and 2.0
   */
  public set resolutionFactor(value: number) {
    if (this.resolutionFactorInternal !== value) {
      this.resolutionFactorInternal = value;
      this.renderTarget.setSize(
        this.width * this.resolutionFactorInternal,
        this.height * this.resolutionFactorInternal,
      );
      this.propertyChanged = true;
    }
  }

  /**
   * Sets the clear color and marks for re-render.
   *
   * @param value - New clear color as a number
   */
  public set clearColor(value: number) {
    if (this.clearColorInternal !== value) {
      this.clearColorInternal = value;
      this.propertyChanged = true;
    }
  }

  /**
   * Sets the clear alpha and marks for re-render.
   *
   * @param value - New clear alpha value between 0.0 and 1.0
   */
  public set clearAlpha(value: number) {
    if (this.clearAlphaInternal !== value) {
      this.clearAlphaInternal = value;
      this.propertyChanged = true;
    }
  }

  /**
   * Destroys the element and cleans up resources.
   */
  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    this.renderTarget.dispose();
    super.destroy();
  }

  /**
   * Manually requests a re-render.
   *
   * Useful when update mode is MANUAL and you want to trigger a re-render
   * without changing properties.
   */
  public requestRender(): void {
    this.renderRequired = true;
  }

  /**
   * Updates 3D scene rendering before each frame.
   *
   * @param renderer - WebGL renderer
   * @internal
   */
  protected override onWillRender(renderer: WebGLRenderer): void {
    if (
      this.updateModeInternal === UISceneUpdateMode.EACH_FRAME ||
      (this.updateModeInternal === UISceneUpdateMode.EACH_SECOND_FRAME &&
        this.frameBoolean) ||
      (this.updateModeInternal === UISceneUpdateMode.PROPERTY_CHANGED &&
        this.propertyChanged) ||
      (this.updateModeInternal === UISceneUpdateMode.MANUAL &&
        this.renderRequired)
    ) {
      this.renderRequired = false;
      this.propertyChanged = false;
      this.frameBoolean = !this.frameBoolean;

      this.renderTarget.setSize(
        this.width * this.resolutionFactorInternal,
        this.height * this.resolutionFactorInternal,
      );
      renderer.setClearColor(this.clearColorInternal, this.clearAlpha);
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear(true, true, false);
      renderer.render(this.sceneInternal, this.cameraInternal);
    }
  }

  /** @internal */
  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };
}
