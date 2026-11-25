import type { WebGLRenderer } from "three";
import { Matrix4 } from "three";

import type { UILayer } from "../../layers/UILayer/UILayer.js";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared.js";
import type { UIMask } from "../../miscellaneous/mask/UIMask.js";
import { UIMicro } from "../../miscellaneous/micro/UIMicro.js";
import type { UIBlendMode } from "../../miscellaneous/UIBlendMode.js";
import { blendModeToFactor } from "../../miscellaneous/UIBlendMode.js";
import type { UIMode } from "../../miscellaneous/UIMode.js";
import { isUIModeVisible } from "../../miscellaneous/UIMode.js";
import type { UITransparencyMode } from "../../miscellaneous/UITransparencyMode.js";
import type { UISceneWrapperView } from "../../wrappers/UISceneWrapper/UISceneWrapper.Internal.js";
import { UIDummy } from "../UIDummy/UIDummy.js";
import type { UIElementOptions } from "./UIElement.Internal.js";
import {
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
  private blendModeInternal: UIBlendMode;
  private hueInternal: number;
  private saturationInternal: number;
  private lightnessInternal: number;
  private readonly hslValue = { h: 0, s: 0, l: 0 };

  /** Layout and draw-order versions the plane was last placed by */
  private placedSolverVersion = -1;
  private placedInputVersion = -1;
  /** Layout version content sized by the element was last measured at */
  private measuredSolverVersion = -1;

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
    this.planeHandler = this.createPlane(
      source,
      properties,
      // A plane created during a frame is placed on the next one. Until then it is collapsed to
      // nothing, at its own depth: planes may not share one
      new Matrix4().makeScale(0, 0, 1).setPosition(0, 0, this.renderDepth),
    );
    this.applyMask();
    this.layer.signalRendering.on(this.handleWillRender);
    this.layer.signalSynchronizing.on(this.handleSynchronizing);
    this.layer.signalCompiling.on(this.handleCompiling);
  }

  /** Alpha blending mode */
  public get transparencyMode(): UITransparencyMode {
    return this.transparencyModeInternal;
  }

  /** Color blending mode (only affects BLEND transparency) */
  public get blendMode(): UIBlendMode {
    return this.blendModeInternal;
  }

  /**
   * Hue shift in degrees. Applied to the linear color, so the hue of a color is not the one a
   * color picker shows for its sRGB value.
   */
  public get hue(): number {
    return this.hueInternal;
  }

  /** Saturation multiplier (1 = unchanged, 0 = grayscale), applied to the linear color */
  public get saturation(): number {
    return this.saturationInternal;
  }

  /** Lightness offset (0 = unchanged), applied to the linear color */
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

  /** Whether the layout or the draw order changed since the plane was last placed */
  protected get placementDirty(): boolean {
    return (
      this.solverWrapper.version !== this.placedSolverVersion ||
      this.inputWrapper.version !== this.placedInputVersion
    );
  }

  /** Alpha blending mode */
  public set transparencyMode(value: UITransparencyMode) {
    if (this.transparencyModeInternal !== value) {
      this.transparencyModeInternal = value;
      this.sceneWrapper.setTransparency(this.planeHandler, value);
    }
  }

  /** Color blending mode (only affects BLEND transparency) */
  public set blendMode(value: UIBlendMode) {
    if (this.blendModeInternal !== value) {
      this.blendModeInternal = value;
      this.sceneWrapper.setBlend(this.planeHandler, blendModeToFactor(value));
    }
  }

  /**
   * Hue shift in degrees. Applied to the linear color, so the hue of a color is not the one a
   * color picker shows for its sRGB value.
   */
  public set hue(value: number) {
    if (this.hueInternal !== value) {
      this.hueInternal = value;
      this.applyHSL();
    }
  }

  /** Saturation multiplier (1 = unchanged, 0 = grayscale), applied to the linear color */
  public set saturation(value: number) {
    if (this.saturationInternal !== value) {
      this.saturationInternal = value;
      this.applyHSL();
    }
  }

  /** Lightness offset (0 = unchanged), applied to the linear color */
  public set lightness(value: number) {
    if (this.lightnessInternal !== value) {
      this.lightnessInternal = value;
      this.applyHSL();
    }
  }

  /** Controls visibility and interactivity */
  public override set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      const visibilityChanged = isUIModeVisible(this.modeInternal) !== isUIModeVisible(value);
      super.mode = value;
      if (visibilityChanged) {
        this.sceneWrapper.setVisibility(this.planeHandler, isUIModeVisible(value));
      }
    }
  }

  /** Frees resources of the element */
  protected override destroyInternal(): void {
    this.layer.signalRendering.off(this.handleWillRender);
    this.layer.signalSynchronizing.off(this.handleSynchronizing);
    this.layer.signalCompiling.off(this.handleCompiling);
    this.sceneWrapper.destroyPlane(this.planeHandler);
    super.destroyInternal();
  }

  protected override getMicro(): UIMicro {
    return this.micro;
  }

  protected override onMaskChanged(): void {
    this.applyMask();
  }

  protected setPlaneTransform(): void {
    if (this.micro.dirty || this.placementDirty) {
      this.sceneWrapper.setTransform(
        this.planeHandler,
        this.computeVisualTransform(true, TEMP_TRANSFORM, this.renderDepth),
      );
      this.micro.setDirtyFalse();
      this.setPlacementDirtyFalse();
    }
  }

  /**
   * Whether the layout changed since the last call. Content that depends on the element size,
   * such as text or nine-slice regions, reads the size only then: a read runs the solver.
   */
  protected consumeLayoutChange(): boolean {
    const version = this.solverWrapper.version;
    if (version === this.measuredSolverVersion) {
      return false;
    }
    this.measuredSolverVersion = version;
    return true;
  }

  /** Records the layout and draw order the plane is placed by */
  protected setPlacementDirtyFalse(): void {
    this.placedSolverVersion = this.solverWrapper.version;
    this.placedInputVersion = this.inputWrapper.version;
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
    this.planeHandler = this.createPlane(source, properties, transform);
    this.applyMask();
  }

  /**
   * Advances the state of the element in time, on `UILayer.signalRendering`. The plane is
   * written later, in {@link onSynchronize}.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Overridden by elements that change over time
  protected onWillRender(renderer: WebGLRenderer, deltaTime: number): void {}

  /**
   * Writes the state of the element into its plane, on `UILayer.signalSynchronizing`, after
   * every element and handler has changed its state for the frame.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Overridden by elements that draw on the renderer
  protected onSynchronize(renderer: WebGLRenderer): void {
    this.writePlane();
  }

  /** Creates a plane with the visibility, transparency, blend and color adjustment of the element */
  private createPlane(
    source: string,
    properties: Record<string, UIProperty>,
    transform: Matrix4,
  ): number {
    return this.sceneWrapper.createPlane(
      source,
      properties,
      transform,
      isUIModeVisible(this.modeInternal),
      this.transparencyModeInternal,
      blendModeToFactor(this.blendModeInternal),
      packHSL(this.hslValue, this.hueInternal, this.saturationInternal, this.lightnessInternal),
    );
  }

  /** Brings the mask and the transform of the plane up to date */
  private writePlane(): void {
    this.applyMask();
    this.setPlaneTransform();
  }

  private applyHSL(): void {
    this.sceneWrapper.setHSL(
      this.planeHandler,
      packHSL(this.hslValue, this.hueInternal, this.saturationInternal, this.lightnessInternal),
    );
  }

  /**
   * Brings the plane mask up to date. Called when the mask is set or taken off, since masked
   * planes are another shader variant, and every frame: the mask data depends on the layout and
   * micro of the mask source, whose dirty flags belong to the source.
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
        this.sceneWrapper.setMask(this.planeHandler, mask);
        this.appliedMaskVersion = mask.version;
      }
    }
  }

  private readonly handleWillRender = (renderer: WebGLRenderer, deltaTime: number): void => {
    this.onWillRender(renderer, deltaTime);
  };

  private readonly handleSynchronizing = (renderer: WebGLRenderer): void => {
    this.onSynchronize(renderer);
  };

  /**
   * Places the plane at the current depth before the programs are built. A plane keeps the depth
   * it was created at until its first frame, and elements created later may have shifted it.
   */
  private readonly handleCompiling = (): void => {
    this.writePlane();
  };
}
