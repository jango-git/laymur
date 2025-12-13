import type { Camera, WebGLRenderer } from "three";
import {
  LinearFilter,
  Matrix3,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";
import { type UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import type { UIElementCommonOptions } from "../miscellaneous/UIElementCommonOptions";
import source from "../shaders/UIImage.glsl";
import { UIElement } from "./UIElement";

/**
 * Update modes for controlling when the 3D scene should be re-rendered.
 */
export enum UISceneUpdateMode {
  /** Re-render the scene every frame. */
  EACH_FRAME = 1,
  /** Re-render the scene every second frame for performance. */
  EACH_SECOND_FRAME = 2,
  EACH_THIRD_FRAME = 3,
  /** Re-render the scene only when properties change. */
  PROPERTY_CHANGED = 4,
  /** Re-render the scene only when manually requested. */
  MANUAL = 5,
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
const DEFAULT_CLEAR_COLOR = new UIColor(0x000000, 1);
/** Default depth buffer usage setting. */
const DEFAULT_USE_DEPTH = true;

/**
 * Configuration options for UIScene element creation.
 */
export interface UISceneOptions extends UIElementCommonOptions {
  /** Three.js scene to render. */
  scene: Scene;
  /** Camera to use for rendering the scene. */
  camera: Camera;
  /** Update mode controlling when the scene is re-rendered. */
  updateMode: UISceneUpdateMode;
  /** Resolution factor for render target sizing (0.1 to 2.0). */
  resolutionFactor: number;
  /** Clear color for the render target background. */
  clearColor: UIColor;
  /** Whether to enable depth buffer for the render target. */
  enableDepthBuffer: boolean;
}

/**
 * UI element for rendering 3D scenes to texture within the UI system.
 *
 * UIScene is a concrete implementation of UIElement that renders a Three.js
 * scene to a WebGL render target and displays it as a texture. It provides
 * control over rendering frequency, resolution, and visual properties. This
 * allows embedding complex 3D content within the 2D UI layout system with
 * performance optimizations through configurable update modes.
 *
 * @see {@link UIElement} - Base class providing UI element functionality
 * @see {@link UISceneUpdateMode} - Update mode configuration
 * @see {@link Scene} - Three.js scene for 3D content
 * @see {@link Camera} - Three.js camera for scene rendering
 */
export class UIScene extends UIElement {
  public readonly color: UIColor;
  public readonly clearColor: UIColor;

  /** The WebGL render target for off-screen scene rendering. */
  private readonly renderTarget: WebGLRenderTarget;
  /** Internal storage for the current Three.js scene. */
  private sceneInternal: Scene;
  /** Internal storage for the current camera. */
  private cameraInternal: Camera;
  /** Internal storage for the current update mode. */
  private updateModeInternal: UISceneUpdateMode;
  /** Internal storage for the current resolution factor. */
  private resolutionFactorInternal: number;
  /** Frame alternation boolean for EACH_SECOND_FRAME update mode. */
  private frameIndex = 0;
  /** Flag indicating if properties have changed requiring a re-render. */
  private dirty = false;
  private renderRequired = false;

  /**
   * Creates a new UIScene instance with 3D scene rendering capabilities.
   *
   * The scene element creates a WebGL render target for off-screen rendering
   * and displays the result as a texture. A default perspective camera is
   * created if none is provided.
   *
   * @param layer - The UI layer that contains this scene element
   * @param options - Configuration options for scene rendering
   * @throws Will throw an error if resolution factor is outside valid range (0.1-2.0)
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

    const color = new UIColor(options.color);

    super(layer, 0, 0, w, h, source, {
      texture: renderTarget.texture,
      textureTransform: new Matrix3(),
      color,
    });

    this.color = color;
    this.clearColor = new UIColor(options.clearColor ?? DEFAULT_CLEAR_COLOR);

    this.renderTarget = renderTarget;
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

    this.dirty = options.updateMode === UISceneUpdateMode.PROPERTY_CHANGED;
    this.mode = options.mode ?? this.mode;
  }

  /**
   * Gets the Three.js scene being rendered.
   * @returns The current Three.js scene
   */
  public get scene(): Scene {
    return this.sceneInternal;
  }

  /**
   * Gets the camera used for rendering the scene.
   * @returns The current Three.js camera
   */
  public get camera(): Camera {
    return this.cameraInternal;
  }

  /**
   * Gets the current update mode controlling render frequency.
   * @returns The current update mode
   */
  public get updateMode(): UISceneUpdateMode {
    return this.updateModeInternal;
  }

  /**
   * Gets the resolution factor for render target sizing.
   * @returns The resolution factor between 0.1 and 2.0
   */
  public get resolutionFactor(): number {
    return this.resolutionFactorInternal;
  }

  /**
   * Sets a new Three.js scene to render and marks for re-render.
   * @param value - The new Three.js scene
   */
  public set scene(value: Scene) {
    if (this.sceneInternal !== value) {
      this.sceneInternal = value;
      this.dirty = true;
    }
  }

  /**
   * Sets a new camera for rendering and marks for re-render.
   * @param value - The new Three.js camera
   */
  public set camera(value: Camera) {
    if (this.cameraInternal !== value) {
      this.cameraInternal = value;
      this.dirty = true;
    }
  }

  /**
   * Sets the update mode controlling render frequency and marks for re-render.
   * @param value - The new update mode
   */
  public set updateMode(value: UISceneUpdateMode) {
    if (this.updateModeInternal !== value) {
      this.updateModeInternal = value;
      this.dirty = true;
    }
  }

  /**
   * Sets the resolution factor and resizes the render target accordingly.
   * @param value - The new resolution factor between 0.1 and 2.0
   */
  public set resolutionFactor(value: number) {
    if (this.resolutionFactorInternal !== value) {
      this.resolutionFactorInternal = value;
      this.renderTarget.setSize(
        this.width * this.resolutionFactorInternal,
        this.height * this.resolutionFactorInternal,
      );
      this.dirty = true;
    }
  }

  /**
   * Destroys the scene element by cleaning up all associated resources.
   *
   * This method disposes of the material and render target resources,
   * and calls the parent destroy method to clean up the underlying UI element.
   * After calling this method, the scene element should not be used anymore.
   */
  public override destroy(): void {
    this.renderTarget.dispose();
    super.destroy();
  }

  /**
   * Manually requests a re-render of the scene.
   *
   * This method is useful when the update mode is set to MANUAL and you
   * want to trigger a scene re-render without changing any properties.
   */
  public requestRender(): void {
    this.renderRequired = true;
  }

  /**
   * Called before each render frame to update the 3D scene rendering.
   * Handles different update modes and renders the 3D scene to the render target
   * based on the current update mode and property change state.
   * @param renderer - The WebGL renderer used for scene rendering
   */
  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    this.frameIndex += 1;

    if (
      this.updateModeInternal === UISceneUpdateMode.EACH_FRAME ||
      (this.updateModeInternal === UISceneUpdateMode.EACH_SECOND_FRAME &&
        this.frameIndex % 2 === 0) ||
      (this.updateModeInternal === UISceneUpdateMode.EACH_THIRD_FRAME &&
        this.frameIndex % 3 === 0) ||
      (this.updateModeInternal === UISceneUpdateMode.PROPERTY_CHANGED &&
        this.dirty) ||
      (this.updateModeInternal === UISceneUpdateMode.MANUAL &&
        this.renderRequired)
    ) {
      this.dirty = false;
      this.renderRequired = false;

      if (this.solverWrapper.dirty) {
        this.renderTarget.setSize(
          this.width * this.resolutionFactorInternal,
          this.height * this.resolutionFactorInternal,
        );
      }
      renderer.setClearColor(this.clearColor.getHexRGB(), this.clearColor.a);
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear(true, true, false);
      renderer.render(this.sceneInternal, this.cameraInternal);
    }
    super.onWillRender(renderer, deltaTime);
  }
}
