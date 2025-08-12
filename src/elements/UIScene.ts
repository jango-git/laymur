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

export enum UISceneUpdateMode {
  EACH_FRAME = 1,
  EACH_SECOND_FRAME = 2,
  PROPERTY_CHANGED = 3,
  MANUAL = 4,
}

const DEFAULT_RESOLUTION_FACTOR = 0.5;
const MIN_RESOLUTION_FACTOR = 0.1;
const MAX_RESOLUTION_FACTOR = 2;
const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 512;
const DEFAULT_CAMERA_FOV = 75;
const DEFAULT_CAMERA_NEAR = 0.1;
const DEFAULT_CAMERA_FAR = 100;
const DEFAULT_UPDATE_MODE = UISceneUpdateMode.PROPERTY_CHANGED;
const DEFAULT_CLEAR_COLOR = 0x000000;
const DEFAULT_CLEAR_ALPHA = 0;
const DEFAULT_USE_DEPTH = true;

export interface UISceneOptions {
  x: number;
  y: number;
  width: number;
  height: number;

  scene: Scene;
  camera: Camera;
  updateMode: UISceneUpdateMode;
  resolutionFactor: number;
  clearColor: number;
  clearAlpha: number;
  enableDepthBuffer: boolean;
}

export class UIScene extends UIElement<Mesh> {
  private readonly material: UIMaterial;
  private readonly renderTarget: WebGLRenderTarget;

  private sceneInternal: Scene;
  private cameraInternal: Camera;
  private updateModeInternal: UISceneUpdateMode;
  private resolutionFactorInternal: number;
  private clearColorInternal: number;
  private clearAlphaInternal: number;

  private frameBoolean = true;
  private propertyChanged = false;
  private renderRequired = false;

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

  public get color(): number {
    return this.material.getColor();
  }

  public get opacity(): number {
    return this.material.getOpacity();
  }

  public get transparency(): boolean {
    return this.material.getTransparency();
  }

  public get scene(): Scene {
    return this.sceneInternal;
  }

  public get camera(): Camera {
    return this.cameraInternal;
  }

  public get updateMode(): UISceneUpdateMode {
    return this.updateModeInternal;
  }

  public get resolutionFactor(): number {
    return this.resolutionFactorInternal;
  }

  public get clearColor(): number {
    return this.clearColorInternal;
  }

  public get clearAlpha(): number {
    return this.clearAlphaInternal;
  }

  public set color(value: number) {
    this.material.setColor(value);
  }

  public set opacity(value: number) {
    this.material.setOpacity(value);
  }

  public set transparency(value: boolean) {
    this.material.setTransparency(value);
  }

  public set scene(value: Scene) {
    if (this.sceneInternal !== value) {
      this.sceneInternal = value;
      this.propertyChanged = true;
    }
  }

  public set camera(value: Camera) {
    if (this.cameraInternal !== value) {
      this.cameraInternal = value;
      this.propertyChanged = true;
    }
  }

  public set updateMode(value: UISceneUpdateMode) {
    if (this.updateModeInternal !== value) {
      this.updateModeInternal = value;
      this.propertyChanged = true;
    }
  }

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

  public set clearColor(value: number) {
    if (this.clearColorInternal !== value) {
      this.clearColorInternal = value;
      this.propertyChanged = true;
    }
  }

  public set clearAlpha(value: number) {
    if (this.clearAlphaInternal !== value) {
      this.clearAlphaInternal = value;
      this.propertyChanged = true;
    }
  }

  public override destroy(): void {
    this.material.dispose();
    this.renderTarget.dispose();
    super.destroy();
  }

  public requestRender(): void {
    this.renderRequired = true;
  }

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
