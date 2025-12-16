import type { Matrix4, Object3D, WebGLRenderer } from "three";
import { Color, OrthographicCamera, Scene } from "three";
import type { UIPropertyType } from "../miscellaneous/generic-plane/shared";
import { UIPlaneRegistry } from "../miscellaneous/generic-plane/UIGenericPlaneRegistry";
import type { UITransparencyMode } from "../miscellaneous/UITransparencyMode";

let originalClearColor = new Color();
let originalClearAlpha = 0;
let originalAutoClear = false;
let originalAutoClearColor = false;
let originalAutoClearDepth = false;
let originalAutoClearStencil = false;

export class UISceneWrapper {
  private readonly scene = new Scene();
  private readonly camera: OrthographicCamera;
  private readonly registry = new UIPlaneRegistry(this.scene);

  constructor(width: number, height: number) {
    this.camera = new OrthographicCamera(0, width, height, 0, -1024, 1024);
  }

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

  public destroyPlane(handler: number): void {
    this.registry.destroy(handler);
  }

  public setTransform(handler: number, transform: Matrix4): void {
    this.registry.setTransform(handler, transform);
  }

  public setProperties(
    handler: number,
    properties: Record<string, UIPropertyType>,
  ): void {
    this.registry.setProperties(handler, properties);
  }

  public setVisibility(handler: number, visible: boolean): void {
    this.registry.setVisibility(handler, visible);
  }

  public setTransparency(
    handler: number,
    transparency: UITransparencyMode,
  ): void {
    this.registry.setTransparency(handler, transparency);
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
