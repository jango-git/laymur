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
import source from "../shaders/UIImage.glsl";
import { DUMMY_DEFAULT_HEIGHT, DUMMY_DEFAULT_WIDTH } from "./UIDummy.Internal";
import { UIElement } from "./UIElement";
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
      options.resolutionFactor ?? SCENE_DEFAULT_RESOLUTION_FACTOR;

    if (
      resolutionFactor < SCENE_MIN_RESOLUTION_FACTOR ||
      resolutionFactor > SCENE_MAX_RESOLUTION_FACTOR
    ) {
      throw new Error(
        `UIScene.constructor.resolutionFactor: must be between ${SCENE_MIN_RESOLUTION_FACTOR} and ${SCENE_MAX_RESOLUTION_FACTOR}.`,
      );
    }

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

    this.color = color;
    this.clearColor = new UIColor(
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
      this.propertyDirty = true;
    }
  }

  /**
   * Sets a new camera for rendering and marks for re-render.
   * @param value - The new Three.js camera
   */
  public set camera(value: Camera) {
    if (this.cameraInternal !== value) {
      this.cameraInternal = value;
      this.propertyDirty = true;
    }
  }

  /**
   * Sets the update mode controlling render frequency and marks for re-render.
   * @param value - The new update mode
   */
  public set updateMode(value: UISceneUpdateMode) {
    if (this.updateModeInternal !== value) {
      this.updateModeInternal = value;
      this.propertyDirty = true;
    }
  }

  /**
   * Sets the resolution factor and resizes the render target accordingly.
   * @param value - The new resolution factor between 0.1 and 2.0
   */
  public set resolutionFactor(value: number) {
    if (this.resolutionFactorInternal !== value) {
      this.resolutionFactorInternal = value;
      this.resolutionFactorDirty = true;
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
  public requestUpdate(): void {
    this.updateRequired = true;
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
    this.evenFrame = !this.evenFrame;

    if (
      this.updateRequired ||
      this.updateModeInternal === UISceneUpdateMode.EACH_FRAME ||
      (this.updateModeInternal === UISceneUpdateMode.EVERY_SECOND_FRAME &&
        this.evenFrame) ||
      (this.updateModeInternal === UISceneUpdateMode.ON_PROPERTIES_CHANGE &&
        this.propertyDirty) ||
      this.color.dirty ||
      this.clearColor.dirty ||
      (this.updateModeInternal === UISceneUpdateMode.ON_DIMENSIONS_CHANGE &&
        (this.resolutionFactorDirty || this.solverWrapper.dirty))
    ) {
      if (this.resolutionFactorDirty || this.solverWrapper.dirty) {
        this.renderTarget.setSize(
          this.width * this.resolutionFactorInternal,
          this.height * this.resolutionFactorInternal,
        );
        this.resolutionFactorDirty = false;
      }

      if (this.color.dirty) {
        this.sceneWrapper.setProperties(this.planeHandler, {
          color: this.color,
        });
        this.color.setDirtyFalse();
      }

      renderer.setClearColor(this.clearColor.getHexRGB(), this.clearColor.a);
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear(true, true, false);
      renderer.render(this.sceneInternal, this.cameraInternal);

      this.propertyDirty = false;
      this.updateRequired = false;
    }
    super.onWillRender(renderer, deltaTime);
  }
}
