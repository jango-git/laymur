import type { WebGLRenderer } from "three";
import { Matrix4 } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer.js";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared.js";
import type { UIMask } from "../../miscellaneous/mask/UIMask.js";
import { UIMicro } from "../../miscellaneous/micro/UIMicro.js";
import type { UIBlendMode } from "../../miscellaneous/UIBlendMode.js";
import type { UIMode } from "../../miscellaneous/UIMode.js";
import { isUIModeVisible } from "../../miscellaneous/UIMode.js";
import type { UITransparencyMode } from "../../miscellaneous/UITransparencyMode.js";
import type { UISceneWrapperView } from "../../wrappers/UISceneWrapper/UISceneWrapper.Internal.js";
import { UIDummy } from "../UIDummy/UIDummy.js";
import type { UIElementOptions } from "./UIElement.Internal.js";
import {
  blendModeToFactor,
  ELEMENT_DEFAULT_BLEND_MODE,
  ELEMENT_DEFAULT_HUE,
  ELEMENT_DEFAULT_LIGHTNESS,
  ELEMENT_DEFAULT_SATURATION,
  ELEMENT_DEFAULT_TRANSPARENCY_MODE,
  packHSL,
} from "./UIElement.Internal.js";

const TEMP_TRANSFORM = new Matrix4();

/**
 * Base class for renderable UI elements: a quad drawn with a custom fragment shader.
 *
 * The source defines `vec4 draw()` and reads `p_uv` and each property as `p_<name>`.
 * Textures are uniforms, other properties are per instance, so elements sharing the source
 * and textures batch together. Update properties with `sceneWrapper.setProperties`.
 */
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

  /** Mask as last applied to the plane; compared every frame, see applyMask */
  private appliedMask: UIMask | null = null;
  private appliedMaskVersion = -1;
  private appliedMaskHandler = -1;

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

  /** Hue shift in degrees */
  public get hue(): number {
    return this.hueInternal;
  }

  /** Saturation multiplier (1 = unchanged, 0 = grayscale) */
  public get saturation(): number {
    return this.saturationInternal;
  }

  /** Lightness offset (0 = unchanged) */
  public get lightness(): number {
    return this.lightnessInternal;
  }

  /**
   * Controls visibility and interactivity.
   *
   * Redeclared here because declaring only a setter would shadow the accessor
   * pair inherited from {@link UIDummy}, making reads return undefined.
   */
  public override get mode(): UIMode {
    return this.modeInternal;
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
  public set hue(value: number) {
    if (this.hueInternal !== value) {
      this.hueInternal = value;
      this.hslDirty = true;
    }
  }

  /** Saturation multiplier (1 = unchanged, 0 = grayscale) */
  public set saturation(value: number) {
    if (this.saturationInternal !== value) {
      this.saturationInternal = value;
      this.hslDirty = true;
    }
  }

  /** Lightness offset (0 = unchanged) */
  public set lightness(value: number) {
    if (this.lightnessInternal !== value) {
      this.lightnessInternal = value;
      this.hslDirty = true;
    }
  }

  /** Controls visibility and interactivity */
  public override set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      this.visibilityDirty = isUIModeVisible(this.modeInternal) !== isUIModeVisible(value);
      super.mode = value;
    }
  }

  /** Frees resources of the element */
  protected override destroyInternal(): void {
    this.layer.signalRendering.off(this.handleWillRender);
    this.sceneWrapper.destroyPlane(this.planeHandler);
    super.destroyInternal();
  }

  protected override getMicro(): UIMicro {
    return this.micro;
  }

  protected setPlaneTransform(): void {
    if (this.micro.dirty || this.inputWrapper.dirty || this.solverWrapper.dirty) {
      this.sceneWrapper.setTransform(
        this.planeHandler,
        this.computeVisualTransform(true, TEMP_TRANSFORM, this.renderDepth),
      );
      this.micro.setDirtyFalse();
    }
  }

  /**
   * Replaces the plane with one drawn by another shader source, keeping the visibility,
   * transparency, blend, color adjustment and mask of the element.
   */
  protected recreatePlane(
    source: string,
    properties: Record<string, UIProperty>,
    transform: Matrix4,
  ): void {
    this.sceneWrapper.destroyPlane(this.planeHandler);
    this.planeHandler = this.sceneWrapper.createPlane(
      source,
      properties,
      transform,
      isUIModeVisible(this.modeInternal),
      this.transparencyModeInternal,
      blendModeToFactor(this.blendModeInternal),
      packHSL(this.hslValue, this.hueInternal, this.saturationInternal, this.lightnessInternal),
    );
    this.applyMask();
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

    this.applyMask();
    this.setPlaneTransform();
  }

  /**
   * Brings the plane mask up to date. Pulled every frame rather than pushed: the mask data
   * depends on the layout and micro of the mask source, whose dirty flags belong to the source.
   */
  private applyMask(): void {
    const mask = this.mask;
    const planeChanged = this.appliedMaskHandler !== this.planeHandler;

    if (mask !== this.appliedMask || planeChanged) {
      this.appliedMask = mask;
      this.appliedMaskHandler = this.planeHandler;
      this.appliedMaskVersion = -1;
      if (mask === null) {
        this.sceneWrapper.setMask(this.planeHandler, null);
        return;
      }
    }

    if (mask !== null) {
      mask.resolve();
      if (mask.version !== this.appliedMaskVersion) {
        this.sceneWrapper.setMask(this.planeHandler, mask.data);
        this.appliedMaskVersion = mask.version;
      }
    }
  }

  private readonly handleWillRender = (renderer: WebGLRenderer, deltaTime: number): void => {
    this.onWillRender(renderer, deltaTime);
  };
}
