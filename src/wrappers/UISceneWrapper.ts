import type { Matrix4, Object3D, WebGLRenderer } from "three";
import { Color, OrthographicCamera, Scene } from "three";
import type { UIPropertyType } from "../miscellaneous/generic-plane/shared";
import { UIPlaneRegistry } from "../miscellaneous/generic-plane/UIGenericPlaneRegistry";
import type { UITransparencyMode } from "../miscellaneous/UITransparencyMode";

let originalClearColor: Color = new Color();
let originalClearAlpha = 0;
let originalAutoClear = false;
let originalAutoClearColor = false;
let originalAutoClearDepth = false;
let originalAutoClearStencil = false;

/**
 * Manages a UI scene with automatic plane batching.
 *
 * Provides a simple interface for creating and manipulating UI planes
 * while automatically optimizing rendering through instanced batching.
 */
export class UISceneWrapper {
  private readonly scene = new Scene();
  private readonly camera: OrthographicCamera;
  private readonly registry = new UIPlaneRegistry(this.scene);

  constructor(width: number, height: number) {
    this.camera = new OrthographicCamera(0, width, height, 0, -1024, 1024);
  }

  /**
   * Creates a new plane with the given shader and properties.
   *
   * @param source - GLSL fragment shader source (must define vec4 draw() function)
   * @param properties - Map of property names to values
   * @param transparency - Transparency rendering mode
   * @param forceSingleInstance - If true, always creates UIGenericPlane (for render targets, etc.)
   * @returns Handler for managing the plane
   */
  public createPlane(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
    forceSingleInstance: boolean,
  ): number {
    return this.registry.create(
      source,
      properties,
      transparency,
      forceSingleInstance,
    );
  }

  /**
   * Destroys a plane and releases its resources.
   *
   * @param handler - Handler returned from createPlane
   */
  public destroyPlane(handler: number): void {
    this.registry.destroy(handler);
  }

  /**
   * Updates transform matrix for a plane.
   *
   * @param handler - Handler returned from createPlane
   * @param transform - Matrix4 transform to apply
   */
  public setTransform(handler: number, transform: Matrix4): void {
    this.registry.setTransform(handler, transform);
  }

  /**
   * Updates properties for a plane.
   *
   * @param handler - Handler returned from createPlane
   * @param properties - Properties to update
   */
  public setProperties(
    handler: number,
    properties: Record<string, UIPropertyType>,
  ): void {
    this.registry.setProperties(handler, properties);
  }

  /**
   * Updates visibility for a plane.
   *
   * @param handler - Handler returned from createPlane
   * @param visible - Whether the plane should be visible
   */
  public setVisibility(handler: number, visible: boolean): void {
    this.registry.setVisibility(handler, visible);
  }

  /**
   * Updates transparency mode for a plane.
   *
   * @param handler - Handler returned from createPlane
   * @param transparency - New transparency mode
   */
  public setTransparency(
    handler: number,
    transparency: UITransparencyMode,
  ): void {
    this.registry.setTransparency(handler, transparency);
  }

  /**
   * Adds a custom Three.js object to the scene.
   *
   * @param object - Object3D to add
   */
  public insertCustomObject(object: Object3D): this {
    this.scene.add(object);
    return this;
  }

  /**
   * Removes a custom Three.js object from the scene.
   *
   * @param object - Object3D to remove
   */
  public removeCustomObject(object: Object3D): this {
    this.scene.remove(object);
    return this;
  }

  /**
   * Updates camera dimensions.
   *
   * @param width - New width
   * @param height - New height
   */
  public resize(width: number, height: number): this {
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();
    return this;
  }

  /**
   * Renders the scene.
   *
   * @param renderer - WebGLRenderer to use
   */
  public render(renderer: WebGLRenderer): this {
    originalClearColor = renderer.getClearColor(originalClearColor);
    originalClearAlpha = renderer.getClearAlpha();
    originalAutoClear = renderer.autoClear;
    originalAutoClearColor = renderer.autoClearColor;
    originalAutoClearDepth = renderer.autoClearDepth;
    originalAutoClearStencil = renderer.autoClearStencil;

    renderer.autoClear = false;
    renderer.autoClearColor = false;
    renderer.autoClearDepth = false;
    renderer.autoClearStencil = false;
    renderer.setClearColor(0x000000, 1);

    renderer.clear(false, true, true);
    renderer.render(this.scene, this.camera);

    renderer.setClearColor(originalClearColor);
    renderer.setClearAlpha(originalClearAlpha);
    renderer.autoClear = originalAutoClear;
    renderer.autoClearColor = originalAutoClearColor;
    renderer.autoClearDepth = originalAutoClearDepth;
    renderer.autoClearStencil = originalAutoClearStencil;

    return this;
  }
}
