import type { Object3D, WebGLRenderer } from "three";
import { Color, OrthographicCamera, Scene } from "three";
import type { UIElement } from "../elements/UIElement";
import { UIAnchorMode } from "../miscellaneous/UIAnchorMode";

const tempColor = new Color();

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
    const originalRenderTarget = renderer.getRenderTarget();
    const originalClearColor = renderer.getClearColor(tempColor);
    const originalClearAlpha = renderer.getClearAlpha();
    const originalAutoClear = renderer.autoClear;
    const originalAutoClearColor = renderer.autoClearColor;
    const originalAutoClearDepth = renderer.autoClearDepth;
    const originalAutoClearStencil = renderer.autoClearStencil;

    renderer.autoClear = false;
    renderer.autoClearColor = false;
    renderer.autoClearDepth = false;
    renderer.autoClearStencil = false;
    renderer.setClearColor(0x000000, 1);

    for (const [element, object] of this.elements) {
      const micro = element.micro;

      const width = element.width * micro.scaleX;
      const height = element.height * micro.scaleY;

      const anchorOffsetX = micro.anchorX * width;
      const anchorOffsetY = micro.anchorY * height;

      const cos = Math.cos(micro.rotation);
      const sin = Math.sin(micro.rotation);

      const rotatedAnchorX = anchorOffsetX * cos - anchorOffsetY * sin;
      const rotatedAnchorY = anchorOffsetX * sin + anchorOffsetY * cos;

      if (micro.anchorMode === UIAnchorMode.POSITION_ROTATION_SCALE) {
        object.position.x = element.x + micro.x - rotatedAnchorX;
        object.position.y = element.y + micro.y - rotatedAnchorY;
      } else {
        const rawAnchorOffsetX = micro.anchorX * element.width;
        const rawAnchorOffsetY = micro.anchorY * element.height;
        object.position.x =
          element.x + rawAnchorOffsetX - rotatedAnchorX + micro.x;
        object.position.y =
          element.y + rawAnchorOffsetY - rotatedAnchorY + micro.y;
      }

      object.scale.x = width;
      object.scale.y = height;
      object.rotation.z = micro.rotation;

      element["onBeforeRenderInternal"](renderer, deltaTime);
    }

    renderer.clear(false, true, true);
    renderer.render(this.scene, this.camera);

    renderer.setRenderTarget(originalRenderTarget);
    renderer.setClearColor(originalClearColor);
    renderer.setClearAlpha(originalClearAlpha);
    renderer.autoClear = originalAutoClear;
    renderer.autoClearColor = originalAutoClearColor;
    renderer.autoClearDepth = originalAutoClearDepth;
    renderer.autoClearStencil = originalAutoClearStencil;
  }
}
