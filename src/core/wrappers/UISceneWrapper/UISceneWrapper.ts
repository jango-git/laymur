import type { Matrix4, Object3D, WebGLRenderer } from "three";
import { Color, OrthographicCamera, Scene } from "three";
import type { HSLAdjustment, UIProperty } from "../../miscellaneous/generic-plane/shared.js";
import { UIPlaneRegistry } from "../../miscellaneous/generic-plane/UIGenericPlaneRegistry/UIGenericPlaneRegistry.js";
import type { UITransparencyMode } from "../../miscellaneous/UITransparencyMode.js";
import type { UISceneWrapperView } from "./UISceneWrapper.Internal.js";

let originalClearColor = new Color();
let originalClearAlpha = 0;
let originalAutoClear = false;
let originalAutoClearColor = false;
let originalAutoClearDepth = false;
let originalAutoClearStencil = false;

export class UISceneWrapper implements UISceneWrapperView {
  private readonly scene = new Scene();
  private readonly camera: OrthographicCamera;
  private readonly planeRegistry = new UIPlaneRegistry(this.scene);

  constructor(width: number, height: number) {
    this.camera = new OrthographicCamera(0, width, height, 0, -1024, 1024);
    this.camera.matrixAutoUpdate = false;
    this.camera.matrixWorldAutoUpdate = false;
  }

  public createPlane(
    source: string,
    properties: Record<string, UIProperty>,
    transform: Matrix4,
    visibility: boolean,
    transparency: UITransparencyMode,
    blend: number,
    hsl: HSLAdjustment,
  ): number {
    return this.planeRegistry.createPlane(
      source,
      properties,
      transform,
      visibility,
      transparency,
      blend,
      hsl,
    );
  }

  public destroyPlane(handler: number): void {
    this.planeRegistry.destroyPlane(handler);
  }

  public setTransform(handler: number, transform: Matrix4): void {
    this.planeRegistry.setTransform(handler, transform);
  }

  public setProperties(handler: number, properties: Record<string, UIProperty>): void {
    this.planeRegistry.setProperties(handler, properties);
  }

  public setVisibility(handler: number, visible: boolean): void {
    this.planeRegistry.setVisibility(handler, visible);
  }

  public setTransparency(handler: number, transparency: UITransparencyMode): void {
    this.planeRegistry.setTransparency(handler, transparency);
  }

  public setBlend(handler: number, blend: number): void {
    this.planeRegistry.setBlend(handler, blend);
  }

  public setHSL(handler: number, hsl: HSLAdjustment): void {
    this.planeRegistry.setHSL(handler, hsl);
  }

  /** Adds an object drawn between planes by depth, on the same scale as plane zIndex */
  public insertOrderedObject(object: Object3D, depth: number): this {
    this.planeRegistry.insertOrderedObject(object, depth);
    return this;
  }

  /** Moves an ordered object to the given depth */
  public setOrderedObjectDepth(object: Object3D, depth: number): this {
    this.planeRegistry.setOrderedObjectDepth(object, depth);
    return this;
  }

  /** Removes an ordered object */
  public removeOrderedObject(object: Object3D): this {
    this.planeRegistry.removeOrderedObject(object);
    return this;
  }

  public insertCustomObject(object: Object3D): this {
    this.scene.add(object);
    return this;
  }

  public removeCustomObject(object: Object3D): this {
    this.scene.remove(object);
    return this;
  }

  /** Frees the GPU resources of all planes; custom and ordered objects are left to their owners */
  public destroy(): void {
    this.planeRegistry.destroy();
  }

  public resize(width: number, height: number): this {
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();
    return this;
  }

  public render(renderer: WebGLRenderer): this {
    this.planeRegistry.flush();

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
