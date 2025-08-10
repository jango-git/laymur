import type { Object3D, WebGLRenderer } from "three";
import { OrthographicCamera, Scene } from "three";
import type { UIElement } from "../elements/UIElement";

export class UISceneWrapper {
  private readonly scene = new Scene();
  private readonly camera: OrthographicCamera;
  private readonly elements = new Map<UIElement, Object3D>();

  constructor(w: number, h: number) {
    this.camera = new OrthographicCamera(0, w, h, 0, -1, 1);
  }

  public insertObject(element: UIElement, object: Object3D): void {
    if (this.elements.has(element)) {
      throw new Error("Element already exists");
    }
    this.elements.set(element, object);
    this.scene.add(object);
  }

  public replaceObject(element: UIElement, object: Object3D): void {
    const oldObject = this.elements.get(element);
    if (oldObject === undefined) {
      throw new Error("Element not found");
    }

    this.scene.remove(oldObject);
    this.scene.add(object);
    this.elements.set(element, object);
  }

  public removeObject(element: UIElement): void {
    const object = this.elements.get(element);
    if (object === undefined) {
      throw new Error("Element not found");
    }

    this.scene.remove(object);
    this.elements.delete(element);
  }

  public resize(w: number, h: number): void {
    this.camera.right = w;
    this.camera.top = h;
    this.camera.updateProjectionMatrix();
  }

  public getVisibility(element: UIElement): boolean {
    const object = this.elements.get(element);
    if (object === undefined) {
      throw new Error("Element not found");
    }

    return object.visible;
  }

  public getZIndex(element: UIElement): number {
    const object = this.elements.get(element);
    if (object === undefined) {
      throw new Error("Element not found");
    }

    return object.renderOrder;
  }

  public setZIndex(element: UIElement, zIndex: number): void {
    const object = this.elements.get(element);
    if (object === undefined) {
      throw new Error("Element not found");
    }

    object.renderOrder = zIndex;
  }

  public setVisibility(element: UIElement, visible: boolean): void {
    const object = this.elements.get(element);
    if (object === undefined) {
      throw new Error("Element not found");
    }

    object.visible = visible;
  }

  public getSortedVisibleElements(): UIElement[] {
    return Array.from(this.elements.keys()).sort(
      (a, b) => this.getZIndex(a) - this.getZIndex(b),
    );
  }

  public render(renderer: WebGLRenderer, deltaTime: number): void {
    for (const [element, object] of this.elements) {
      object.position.x = element.x;
      object.position.y = element.y;
      object.scale.x = element.width;
      object.scale.y = element.height;
      element["onBeforeRenderInternal"](renderer, deltaTime);
    }
    renderer.render(this.scene, this.camera);
  }
}
