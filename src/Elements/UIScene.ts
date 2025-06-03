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
import type { UILayer } from "../Layers/UILayer";
import { UIMaterial } from "../Materials/UIMaterial";
import { assertSize } from "../Miscellaneous/asserts";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export enum UISceneUpdateBehavior {
  AUTO = "AUTO",
  PROPERTY = "PROPERTY",
  MANUAL = "MANUAL",
}

const DEFAULT_RESOLUTION_FACTOR = 0.5;
const MIN_RESOLUTION_FACTOR = 0.1;
const MAX_RESOLUTION_FACTOR = 8;
const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 512;
const DEFAULT_FOV = 75;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 100;
const DEFAULT_UPDATE_BEHAVIOR = UISceneUpdateBehavior.PROPERTY;
const DEFAULT_CLEAR_COLOR = 0x000000;
const DEFAULT_CLEAR_ALPHA = 0;
const DEFAULT_RENDERED_BY_DEFAULT = false;
const DEFAULT_USE_DEPTH = true;

export interface UISceneOptions {
  scene: Scene;
  camera: Camera;
  width: number;
  height: number;
  resolutionFactor: number;
  renderedByDefault: boolean;
  useDepth: boolean;
  clearColor: number;
  clearAlpha: number;
  updateBehavior: UISceneUpdateBehavior;
}

export class UIScene extends UIElement {
  private readonly material: UIMaterial;
  private readonly renderTarget: WebGLRenderTarget;

  private clearColorInternal: number;
  private clearAlphaInternal: number;

  private needsRenderInternal = false;
  private readonly updateBehaviorInternal: UISceneUpdateBehavior;
  private resolutionFactorInternal: number;

  private sceneInternal: Scene;
  private cameraInternal: Camera;

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

    assertSize(
      width,
      height,
      `Invalid width or height: ${width}x${height}. Must be positive.`,
    );

    const renderTarget = new WebGLRenderTarget(
      width * resolutionFactor,
      height * resolutionFactor,
      {
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        type: UnsignedByteType,
        depthBuffer: options.useDepth ?? DEFAULT_USE_DEPTH,
        stencilBuffer: false,
      },
    );

    const material = new UIMaterial(renderTarget.texture);
    const object = new Mesh(geometry, material);

    super(layer, object, 0, 0, width, height);

    this.sceneInternal = options.scene ?? new Scene();
    this.cameraInternal =
      options.camera ??
      new PerspectiveCamera(
        DEFAULT_FOV,
        width / height,
        DEFAULT_NEAR,
        DEFAULT_FAR,
      );

    this.resolutionFactorInternal = resolutionFactor;

    this.updateBehaviorInternal =
      options.updateBehavior ?? DEFAULT_UPDATE_BEHAVIOR;

    if (options.renderedByDefault ?? DEFAULT_RENDERED_BY_DEFAULT) {
      this.needsRenderInternal = true;
    }

    this.clearColorInternal = options.clearColor ?? DEFAULT_CLEAR_COLOR;
    this.clearAlphaInternal = options.clearAlpha ?? DEFAULT_CLEAR_ALPHA;

    this.renderTarget = renderTarget;
    this.material = material;

    this.applyTransformations();
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

  public get clearColor(): number {
    return this.clearColorInternal;
  }

  public get clearAlpha(): number {
    return this.clearAlphaInternal;
  }

  public get resolutionFactor(): number {
    return this.resolutionFactorInternal;
  }

  public set color(value: number) {
    this.material.setColor(value);
    this.composerInternal.requestUpdate();
  }

  public set opacity(value: number) {
    this.material.setOpacity(value);
    this.composerInternal.requestUpdate();
  }

  public set scene(value: Scene) {
    if (this.sceneInternal !== value) {
      this.sceneInternal = value;
      if (this.updateBehaviorInternal === UISceneUpdateBehavior.PROPERTY) {
        this.requestRender();
      }
    }
  }

  public set camera(value: Camera) {
    if (this.cameraInternal !== value) {
      this.cameraInternal = value;
      if (this.updateBehaviorInternal === UISceneUpdateBehavior.PROPERTY) {
        this.requestRender();
      }
    }
  }

  public set clearColor(value: number) {
    if (this.clearColorInternal !== value) {
      this.clearColorInternal = value;
      if (this.updateBehaviorInternal === UISceneUpdateBehavior.PROPERTY) {
        this.requestRender();
      }
    }
  }

  public set clearAlpha(value: number) {
    if (this.clearAlphaInternal !== value) {
      this.clearAlphaInternal = value;
      if (this.updateBehaviorInternal === UISceneUpdateBehavior.PROPERTY) {
        this.requestRender();
      }
    }
  }

  public set resolutionFactor(value: number) {
    if (this.resolutionFactorInternal !== value) {
      this.resolutionFactorInternal = value;
      this.renderTarget.setSize(
        this.width * this.resolutionFactorInternal,
        this.height * this.resolutionFactorInternal,
      );
      if (this.updateBehaviorInternal === UISceneUpdateBehavior.PROPERTY) {
        this.requestRender();
      }
    }
  }

  public override destroy(): void {
    this.material.dispose();
    this.renderTarget.dispose();
    super.destroy();
  }

  public requestRender(): void {
    this.needsRenderInternal = true;
    this.composerInternal.requestUpdate();
  }

  protected override render(renderer: WebGLRenderer): void {
    if (
      this.needsRenderInternal ||
      this.updateBehaviorInternal === UISceneUpdateBehavior.AUTO
    ) {
      this.needsRenderInternal = false;
      this.renderTarget.setSize(
        this.width * this.resolutionFactorInternal,
        this.height * this.resolutionFactorInternal,
      );
      renderer.setClearColor(this.clearColorInternal, this.clearAlpha);
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear(true, true, false);
      renderer.render(this.sceneInternal, this.cameraInternal);
    }

    (this.object as Mesh).material = this.composerInternal.compose(
      renderer,
      this.width * this.resolutionFactorInternal,
      this.height * this.resolutionFactorInternal,
      this.material,
    );
    this.applyTransformations();
  }
}
