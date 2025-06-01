import type { Vector2Like, WebGLRenderer } from "three";
import {
  Camera,
  LinearFilter,
  Mesh,
  RGBAFormat,
  Scene,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
} from "three";
import type { UILayer } from "../Layers/UILayer";
import { UIMaterial } from "../Materials/UIMaterial";
import { assertSize } from "../Miscellaneous/asserts";
import { renderSymbol } from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

const DEFAULT_RESOLUTION = 512;

export interface UISceneOptions {
  scene: Scene;
  camera: Camera;
  resolution: Vector2Like | number;
  renderedByDefault: boolean;
}

export class UIScene extends UIElement {
  private readonly material: UIMaterial;
  private readonly renderTarget: WebGLRenderTarget;

  private needsRenderInternal = false;

  private resolutionX: number;
  private resolutionY: number;

  private sceneInternal: Scene;
  private cameraInternal: Camera;

  constructor(layer: UILayer, options: Partial<UISceneOptions> = {}) {
    const { resolution = DEFAULT_RESOLUTION } = options;

    const resolutionX =
      typeof resolution === "number" ? resolution : resolution.x;
    const resolutionY =
      typeof resolution === "number" ? resolution : resolution.y;

    assertSize(
      resolutionX,
      resolutionY,
      `Invalid resolution dimensions: width (${resolutionX}) and height (${resolutionY}) must both be greater than 0.`,
    );

    const renderTarget = new WebGLRenderTarget(resolutionX, resolutionY, {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    });

    const material = new UIMaterial(renderTarget.texture);
    const object = new Mesh(geometry, material);

    super(layer, object, 0, 0, resolutionX, resolutionY);

    this.sceneInternal = options.scene ?? new Scene();
    this.cameraInternal = options.camera ?? new Camera();

    if (options.renderedByDefault) {
      this.needsRenderInternal = true;
    }

    this.resolutionX = resolutionX;
    this.resolutionY = resolutionY;

    this.renderTarget = renderTarget;
    this.material = material;

    this.flushTransform();
  }

  public get needsRender(): boolean {
    return this.needsRenderInternal;
  }

  public get color(): number {
    return this.material.getColor();
  }

  public get opacity(): number {
    return this.material.getOpacity();
  }

  public get scene(): Scene {
    return this.sceneInternal;
  }

  public get camera(): Camera {
    return this.cameraInternal;
  }

  public get resolution(): Vector2 {
    return new Vector2(this.resolutionX, this.resolutionY);
  }

  public set color(value: number) {
    this.material.setColor(value);
    this.composer.requestUpdate();
  }

  public set opacity(value: number) {
    this.material.setOpacity(value);
    this.composer.requestUpdate();
  }

  public set scene(value: Scene) {
    this.sceneInternal = value;
  }

  public set camera(camera: Camera) {
    this.cameraInternal = camera;
  }

  public set resolution(value: Vector2Like | number) {
    const newResolutionX = typeof value === "number" ? value : value.x;
    const newResolutionY = typeof value === "number" ? value : value.y;
    if (
      this.renderTarget.width !== newResolutionX ||
      this.renderTarget.height !== newResolutionY
    ) {
      this.resolutionX = newResolutionX;
      this.resolutionY = newResolutionY;
      this.renderTarget.setSize(newResolutionX, newResolutionY);
    }
  }

  public override destroy(): void {
    this.material.dispose();
    this.renderTarget.dispose();
    super.destroy();
  }

  public requestRender(): void {
    this.needsRenderInternal = true;
    this.composer.requestUpdate();
  }

  public [renderSymbol](renderer: WebGLRenderer): void {
    if (this.needsRenderInternal) {
      renderer.setClearColor(0x000000, 1);
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear(true, true, false);
      renderer.render(this.sceneInternal, this.cameraInternal);
    }

    (this.object as Mesh).material = this.composer.compose(
      renderer,
      this.resolutionX,
      this.resolutionY,
      this.material,
    );
    this.flushTransform();
  }
}
