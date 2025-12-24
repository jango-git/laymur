import type { Matrix4, Object3D, WebGLRenderer } from "three";
import { Color, OrthographicCamera, Scene } from "three";
import type { UIProperty } from "../miscellaneous/generic-plane/shared";
import { UIPlaneRegistry } from "../miscellaneous/generic-plane/UIGenericPlaneRegistry/UIGenericPlaneRegistry";
import type { UITransparencyMode } from "../miscellaneous/UITransparencyMode";
import type { UISceneWrapperInterface } from "./UISceneWrapper.Internal";

let originalClearColor = new Color();
let originalClearAlpha = 0;
let originalAutoClear = false;
let originalAutoClearColor = false;
let originalAutoClearDepth = false;
let originalAutoClearStencil = false;

export class UISceneWrapper implements UISceneWrapperInterface {
  private readonly scene = new Scene();
  private readonly camera: OrthographicCamera;
  private readonly planeRegistry = new UIPlaneRegistry(this.scene);

  constructor(width: number, height: number) {
    this.camera = new OrthographicCamera(0, width, height, 0, -1024, 1024);
  }

  public createPlane(
    source: string,
    properties: Record<string, UIProperty>,
    transform: Matrix4,
    visibility: boolean,
    transparency: UITransparencyMode,
  ): number {
    return this.planeRegistry.createPlane(
      source,
      properties,
      transform,
      visibility,
      transparency,
    );
  }

  public destroyPlane(handler: number): void {
    this.planeRegistry.destroyPlane(handler);
  }

  public setTransform(handler: number, transform: Matrix4): void {
    this.planeRegistry.setTransform(handler, transform);
  }

  public setProperties(
    handler: number,
    properties: Record<string, UIProperty>,
  ): void {
    this.planeRegistry.setProperties(handler, properties);
  }

  public setVisibility(handler: number, visible: boolean): void {
    this.planeRegistry.setVisibility(handler, visible);
  }

  public setTransparency(
    handler: number,
    transparency: UITransparencyMode,
  ): void {
    this.planeRegistry.setTransparency(handler, transparency);
  }

  public insertCustomObject(object: Object3D): this {
    this.scene.add(object);
    return this;
  }

  public removeCustomObject(object: Object3D): this {
    this.scene.remove(object);
    return this;
  }

  public resize(width: number, height: number): this {
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();
    return this;
  }

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
