import type { WebGLRenderer } from "three";
import { Matrix4 } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import { computeTransformMatrix } from "../../miscellaneous/computeTransform";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared";
import { UIMicro } from "../../miscellaneous/micro/UIMicro";
import type { UIBlendMode } from "../../miscellaneous/UIBlendMode";
import type { UIMode } from "../../miscellaneous/UIMode";
import { isUIModeVisible } from "../../miscellaneous/UIMode";
import type { UITransparencyMode } from "../../miscellaneous/UITransparencyMode";
import type { UISceneWrapperView } from "../../wrappers/UISceneWrapper/UISceneWrapper.Internal";
import { UIDummy } from "../UIDummy/UIDummy";
import type { UIElementOptions } from "./UIElement.Internal";
import {
  blendModeToFactor,
  ELEMENT_DEFAULT_BLEND_MODE,
  ELEMENT_DEFAULT_HUE,
  ELEMENT_DEFAULT_LIGHTNESS,
  ELEMENT_DEFAULT_SATURATION,
  ELEMENT_DEFAULT_TRANSPARENCY_MODE,
  packHSL,
} from "./UIElement.Internal";

/** Base class for renderable UI elements */
export abstract class UIElement extends UIDummy {
  /** Transforms that don't affect constraints */
  public readonly micro: UIMicro;

  protected readonly sceneWrapper: UISceneWrapperView;
  protected planeHandler: number;

  private transparencyModeInternal: UITransparencyMode;
  private transparencyModeDirty = false;
  private blendModeInternal: UIBlendMode;
  private blendModeDirty = false;
  private hueInternal: number;
  private saturationInternal: number;
  private lightnessInternal: number;
  private hslDirty = false;
  private readonly hslValue = { h: 0, s: 0, l: 0 };
  private visibilityDirty = false;

  /**
   * Creates a new UIElement instance.
   *
   * @param layer - Layer containing this element
   * @param source - GLSL shader source code
   * @param properties - Shader uniform properties
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    source: string,
    properties: Record<string, UIProperty>,
    options?: Partial<UIElementOptions>,
  ) {
    super(layer, options);
    this.micro = new UIMicro(options?.micro);

    this.transparencyModeInternal = options?.transparencyMode ?? ELEMENT_DEFAULT_TRANSPARENCY_MODE;
    this.blendModeInternal = options?.blendMode ?? ELEMENT_DEFAULT_BLEND_MODE;
    this.hueInternal = options?.hue ?? ELEMENT_DEFAULT_HUE;
    this.saturationInternal = options?.saturation ?? ELEMENT_DEFAULT_SATURATION;
    this.lightnessInternal = options?.lightness ?? ELEMENT_DEFAULT_LIGHTNESS;

    this.sceneWrapper = this.layer.sceneWrapper;
    this.planeHandler = this.sceneWrapper.createPlane(
      source,
      properties,
      new Matrix4().identity(),
      isUIModeVisible(options?.mode ?? this.mode),
      this.transparencyModeInternal,
      blendModeToFactor(this.blendModeInternal),
      packHSL(this.hslValue, this.hueInternal, this.saturationInternal, this.lightnessInternal),
    );

    this.layer.signalRendering.on(this.handleWillRender);
  }

  /** Alpha blending mode */
  public get transparencyMode(): UITransparencyMode {
    return this.transparencyModeInternal;
  }

  /** Color blending mode (only affects BLEND transparency) */
  public get blendMode(): UIBlendMode {
    return this.blendModeInternal;
  }

  /** Alpha blending mode */
  public set transparencyMode(value: UITransparencyMode) {
    if (this.transparencyModeInternal !== value) {
      this.transparencyModeInternal = value;
      this.transparencyModeDirty = true;
    }
  }

  /** Color blending mode (only affects BLEND transparency) */
  public set blendMode(value: UIBlendMode) {
    if (this.blendModeInternal !== value) {
      this.blendModeInternal = value;
      this.blendModeDirty = true;
    }
  }

  /** Hue shift in degrees */
  public get hue(): number {
    return this.hueInternal;
  }

  /** Hue shift in degrees */
  public set hue(value: number) {
    if (this.hueInternal !== value) {
      this.hueInternal = value;
      this.hslDirty = true;
    }
  }

  /** Saturation multiplier (1 = unchanged, 0 = grayscale) */
  public get saturation(): number {
    return this.saturationInternal;
  }

  /** Saturation multiplier (1 = unchanged, 0 = grayscale) */
  public set saturation(value: number) {
    if (this.saturationInternal !== value) {
      this.saturationInternal = value;
      this.hslDirty = true;
    }
  }

  /** Lightness offset (0 = unchanged) */
  public get lightness(): number {
    return this.lightnessInternal;
  }

  /** Lightness offset (0 = unchanged) */
  public set lightness(value: number) {
    if (this.lightnessInternal !== value) {
      this.lightnessInternal = value;
      this.hslDirty = true;
    }
  }

  public override set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      this.visibilityDirty = isUIModeVisible(this.modeInternal) !== isUIModeVisible(value);
      super.mode = value;
    }
  }

  /** Removes element and frees resources */
  public override destroy(): void {
    this.layer.signalRendering.off(this.handleWillRender);
    this.sceneWrapper.destroyPlane(this.planeHandler);
    super.destroy();
  }

  protected setPlaneTransform(): void {
    if (this.micro.dirty || this.inputWrapper.dirty || this.solverWrapper.dirty) {
      this.sceneWrapper.setTransform(
        this.planeHandler,
        computeTransformMatrix(
          this.x,
          this.y,
          this.width,
          this.height,
          this.zIndex,
          this.micro.x,
          this.micro.y,
          this.micro.anchorX,
          this.micro.anchorY,
          this.micro.scaleX,
          this.micro.scaleY,
          this.micro.rotation,
          this.micro.anchorMode,
        ),
      );
      this.micro.setDirtyFalse();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by UILayer event interface but not used in base implementation
  protected onWillRender(renderer: WebGLRenderer, deltaTime: number): void {
    if (this.transparencyModeDirty) {
      this.sceneWrapper.setTransparency(this.planeHandler, this.transparencyModeInternal);
      this.transparencyModeDirty = false;
    }

    if (this.blendModeDirty) {
      this.sceneWrapper.setBlend(this.planeHandler, blendModeToFactor(this.blendModeInternal));
      this.blendModeDirty = false;
    }

    if (this.hslDirty) {
      this.sceneWrapper.setHSL(
        this.planeHandler,
        packHSL(this.hslValue, this.hueInternal, this.saturationInternal, this.lightnessInternal),
      );
      this.hslDirty = false;
    }

    if (this.visibilityDirty) {
      this.sceneWrapper.setVisibility(this.planeHandler, isUIModeVisible(this.modeInternal));
      this.visibilityDirty = false;
    }

    this.setPlaneTransform();
  }

  private readonly handleWillRender = (renderer: WebGLRenderer, deltaTime: number): void => {
    this.onWillRender(renderer, deltaTime);
  };
}
