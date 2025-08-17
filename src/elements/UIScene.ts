import type { Camera, WebGLRenderer } from "three";
import {
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";
import type { UILayer } from "../layers/UILayer";
import { UIMaterial } from "../materials/UIMaterial";
import { geometry } from "../miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

/**
 * Update modes for controlling when the 3D scene should be re-rendered.
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
export class UIScene extends UIElement<Mesh> {
  /** The material used for rendering the scene texture. */
  private readonly material: UIMaterial;

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
  /** Internal storage for the current clear color. */
  private clearColorInternal: number;
  /** Internal storage for the current clear alpha. */
  private clearAlphaInternal: number;

  /** Frame alternation boolean for EACH_SECOND_FRAME update mode. */
  private frameBoolean = true;
  /** Flag indicating if properties have changed requiring a re-render. */
  private propertyChanged = false;
  /** Flag indicating if a manual render has been requested. */
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

    const width = options.width ?? DEFAULT_WIDTH;
    const height = options.height ?? DEFAULT_HEIGHT;

    const renderTarget = new WebGLRenderTarget(
      width * resolutionFactor,
      height * resolutionFactor,
      {
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        type: UnsignedByteType,
        depthBuffer: options.enableDepthBuffer ?? DEFAULT_USE_DEPTH,
        stencilBuffer: false,
      },
    );

    const material = new UIMaterial(renderTarget.texture);
    const object = new Mesh(geometry, material);

    super(layer, 0, 0, width, height, object);

    this.material = material;
    this.renderTarget = renderTarget;

    this.sceneInternal = options.scene ?? new Scene();
    this.cameraInternal =
      options.camera ??
      new PerspectiveCamera(
        DEFAULT_CAMERA_FOV,
        width / height,
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
  }

  /**
   * Gets the current color tint applied to the scene texture.
   * @returns The color value as a number (e.g., 0xFFFFFF for white)
   */
  public get color(): number {
    return this.material.getColor();
  }

  /**
   * Gets the current opacity level of the scene texture.
   * @returns The opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public get opacity(): number {
    return this.material.getOpacity();
  }

  /**
   * Gets whether transparency is enabled for the scene texture.
   * @returns True if transparency is enabled, false otherwise
   */
  public get transparency(): boolean {
    return this.material.getTransparency();
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
   * Gets the clear color used for the render target background.
   * @returns The clear color as a number
   */
  public get clearColor(): number {
    return this.clearColorInternal;
  }

  /**
   * Gets the clear alpha used for the render target background.
   * @returns The clear alpha value between 0.0 and 1.0
   */
  public get clearAlpha(): number {
    return this.clearAlphaInternal;
  }

  /**
   * Sets the color tint applied to the scene texture.
   * @param value - The color value as a number (e.g., 0xFFFFFF for white)
   */
  public set color(value: number) {
    this.material.setColor(value);
  }

  /**
   * Sets the opacity level of the scene texture.
   * @param value - The opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public set opacity(value: number) {
    this.material.setOpacity(value);
  }

  /**
   * Sets whether transparency is enabled for the scene texture.
   * @param value - True to enable transparency, false to disable
   */
  public set transparency(value: boolean) {
    this.material.setTransparency(value);
  }

  /**
   * Sets a new Three.js scene to render and marks for re-render.
   * @param value - The new Three.js scene
   */
  public set scene(value: Scene) {
    if (this.sceneInternal !== value) {
      this.sceneInternal = value;
      this.propertyChanged = true;
    }
  }

  /**
   * Sets a new camera for rendering and marks for re-render.
   * @param value - The new Three.js camera
   */
  public set camera(value: Camera) {
    if (this.cameraInternal !== value) {
      this.cameraInternal = value;
      this.propertyChanged = true;
    }
  }

  /**
   * Sets the update mode controlling render frequency and marks for re-render.
   * @param value - The new update mode
   */
  public set updateMode(value: UISceneUpdateMode) {
    if (this.updateModeInternal !== value) {
      this.updateModeInternal = value;
      this.propertyChanged = true;
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
      this.propertyChanged = true;
    }
  }

  /**
   * Sets the clear color for the render target background and marks for re-render.
   * @param value - The new clear color as a number
   */
  public set clearColor(value: number) {
    if (this.clearColorInternal !== value) {
      this.clearColorInternal = value;
      this.propertyChanged = true;
    }
  }

  /**
   * Sets the clear alpha for the render target background and marks for re-render.
   * @param value - The new clear alpha value between 0.0 and 1.0
   */
  public set clearAlpha(value: number) {
    if (this.clearAlphaInternal !== value) {
      this.clearAlphaInternal = value;
      this.propertyChanged = true;
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
    this.material.dispose();
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
   * Internal method called before rendering each frame.
   *
   * This method handles the conditional rendering of the 3D scene based on
   * the current update mode. It manages frame counting, property change detection,
   * and manual render requests to optimize performance.
   *
   * @param renderer - The WebGL renderer instance
   * @internal
   */
  protected override ["onBeforeRenderInternal"](renderer: WebGLRenderer): void {
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
}
