import { Texture } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import source from "../shaders/UIProgressShader.glsl";
import { UIElement } from "./UIElement";

const DEFAULT_TEXTURE = new Texture();

/**
 * Predefined mask functions that control how the progress bar fills.
 * Each function defines a different fill pattern using GLSL shader code.
 *
 * @public
 */
export enum UIProgressMaskFunction {
  /** Fill horizontally from left to right (or right to left if inverse) */
  HORIZONTAL = `float calculateMask() {
    return step((direction * io_UV.x + (1.0 - direction) * 0.5), progress);
  }`,

  /** Fill vertically from bottom to top (or top to bottom if inverse) */
  VERTICAL = `float calculateMask() {
    return step((direction * io_UV.y + (1.0 - direction) * 0.5), progress);
  }`,

  /** Fill diagonally from bottom-left to top-right */
  DIAGONAL = `float calculateMask() {
    float d = (io_UV.x + io_UV.y) * (0.1);
    return step((direction * d + (1.0 - direction) * 0.5), progress);
  }`,

  /** Fill in a circular pattern around the center */
  CIRCLE = `float calculateMask() {
    vec2 p = io_UV - 0.5;
    float angle = atan(p.y, p.x);
    angle = (angle + 3.14159265) / 3.14159265;
    angle *= 0.5;
    return step((direction * angle + (1.0 - direction) * 0.5), progress);
  }`,
}

/**
 * Configuration options for creating a UIProgress element.
 *
 * @public
 */
export interface UIProgressOptions {
  /** X position of the element */
  x?: number;
  /** Y position of the element */
  y?: number;
  /** Optional background texture (if not provided, default texture is used) */
  backgroundTexture?: Texture;
  /** Overall color tint applied to the entire progress bar */
  color?: UIColor;
  /** Foreground color tint applied to the filled portion */
  foregroundColor?: UIColor;
  /** Background color tint applied to the unfilled portion */
  backgroundColor?: UIColor;
  /** Mask function that defines how the progress bar fills (predefined enum or custom GLSL code) */
  maskFunction?: UIProgressMaskFunction | string;
  /** Progress value between 0.0 (empty) and 1.0 (full) */
  progress?: number;
  /** Whether to fill in reverse direction (true for reverse, false for normal) */
  inverseDirection?: boolean;
}

/**
 * Progress bar UI element with customizable fill patterns.
 *
 * Displays a progress bar that can fill horizontally, vertically, or in custom
 * patterns. Supports separate textures for filled and empty areas with
 * independent color control.
 *
 * Progress value ranges from 0.0 (empty) to 1.0 (full).
 *
 * @public
 */
export class UIProgress extends UIElement {
  /** @internal */
  private foregroundTextureInternal: Texture;
  /** @internal */
  private backgroundTextureInternal?: Texture;

  /** @internal */
  private readonly colorInternal: UIColor;
  /** @internal */
  private readonly foregroundColorInternal: UIColor;
  /** @internal */
  private readonly backgroundColorInternal: UIColor;

  /** @internal */
  private progressInternal: number;
  /** @internal */
  private inverseDirectionInternal: boolean;

  /**
   * Creates a progress bar UI element.
   *
   * @param layer - UI layer to contain this element
   * @param foregroundTexture - Texture for the progress fill
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    foregroundTexture: Texture,
    options: Partial<UIProgressOptions> = {},
  ) {
    const w = foregroundTexture.image?.width;
    const h = foregroundTexture.image?.height;

    assertValidPositiveNumber(w, "UIProgress foreground texture width");
    assertValidPositiveNumber(h, "UIProgress foreground texture height");

    if (options.backgroundTexture) {
      assertValidPositiveNumber(
        options.backgroundTexture.image.width,
        "UIProgress background texture width",
      );
      assertValidPositiveNumber(
        options.backgroundTexture.image.height,
        "UIProgress background texture height",
      );
    }

    const color = options.color ?? new UIColor();
    const foregroundColor = options.foregroundColor ?? new UIColor();
    const backgroundColor = options.backgroundColor ?? new UIColor();
    const progress = options.progress ?? 1;
    const inverseDirection = options.inverseDirection ?? false;

    super(
      layer,
      options.x ?? 0,
      options.y ?? 0,
      w,
      h,
      (options.maskFunction ?? UIProgressMaskFunction.HORIZONTAL) + source,
      {
        foregroundTexture,
        backgroundTexture: options.backgroundTexture ?? DEFAULT_TEXTURE,
        color,
        foregroundColor,
        backgroundColor,
        progress,
        direction: inverseDirection ? -1 : 1,
      },
    );

    this.foregroundTextureInternal = foregroundTexture;
    this.backgroundTextureInternal = options.backgroundTexture;

    this.colorInternal = color;
    this.foregroundColorInternal = foregroundColor;
    this.backgroundColorInternal = backgroundColor;

    this.progressInternal = progress;
    this.inverseDirectionInternal = inverseDirection;

    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);
    this.foregroundColorInternal.on(
      UIColorEvent.CHANGE,
      this.onForegroundColorChange,
    );
    this.backgroundColorInternal.on(
      UIColorEvent.CHANGE,
      this.onBackgroundColorChange,
    );
  }

  /**
   * Gets the foreground texture.
   *
   * @returns Foreground texture
   */
  public get foregroundTexture(): Texture {
    return this.foregroundTextureInternal;
  }

  /**
   * Gets the background texture.
   *
   * @returns Background texture, or undefined if none is set
   */
  public get backgroundTexture(): Texture | undefined {
    return this.backgroundTextureInternal;
  }

  /**
   * Gets the color tint.
   *
   * @returns Color tint
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Gets the foreground color tint.
   *
   * @returns Foreground color tint
   */
  public get foregroundColor(): UIColor {
    return this.foregroundColorInternal;
  }

  /**
   * Gets the background color tint.
   *
   * @returns Background color tint
   */
  public get backgroundColor(): UIColor {
    return this.backgroundColorInternal;
  }

  /**
   * Gets the current progress value.
   *
   * @returns Progress value between 0.0 (empty) and 1.0 (full)
   */
  public get progress(): number {
    return this.progressInternal;
  }

  /**
   * Gets whether the progress fills in reverse direction.
   *
   * @returns True if filling in reverse, false if filling forward
   */
  public get inverseDirection(): boolean {
    return this.inverseDirectionInternal;
  }

  /**
   * Sets the foreground texture.
   *
   * Automatically resizes the progress bar to match the new texture dimensions.
   *
   * @param value - New foreground texture
   * @throws Error when texture dimensions are invalid
   */
  public set foregroundTexture(value: Texture) {
    const w = value.image.width;
    const h = value.image.height;

    assertValidPositiveNumber(w, "UIProgress foreground texture width");
    assertValidPositiveNumber(h, "UIProgress foreground texture height");

    this.solverWrapper.suggestVariableValue(this.wVariable, w);
    this.solverWrapper.suggestVariableValue(this.hVariable, h);

    this.foregroundTextureInternal = value;
    this.sceneWrapper.setUniform(this.planeHandler, "foregroundTexture", value);
  }

  /**
   * Sets the background texture.
   *
   * @param value - Background texture, or undefined to remove background
   */
  public set backgroundTexture(value: Texture | undefined) {
    if (value !== undefined) {
      assertValidPositiveNumber(
        value.image.width,
        "UIProgress background texture width",
      );
      assertValidPositiveNumber(
        value.image.height,
        "UIProgress background texture height",
      );
    }

    this.backgroundTextureInternal = value;
    this.sceneWrapper.setUniform(this.planeHandler, "backgroundTexture", value);
  }

  /**
   * Sets the color tint.
   *
   * @param value - Color tint
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Sets the foreground color tint.
   *
   * @param value - Foreground color tint
   */
  public set foregroundColor(value: UIColor) {
    this.foregroundColorInternal.copy(value);
  }

  /**
   * Sets the background color tint.
   *
   * @param value - Background color tint
   */
  public set backgroundColor(value: UIColor) {
    this.backgroundColorInternal.copy(value);
  }

  /**
   * Sets the progress fill direction.
   *
   * @param value - True for reverse direction, false for forward
   */
  public set inverseDirection(value: boolean) {
    this.inverseDirectionInternal = value;
    this.sceneWrapper.setUniform(
      this.planeHandler,
      "direction",
      value ? -1 : 1,
    );
  }

  /**
   * Sets the progress value.
   *
   * @param value - Progress value between 0.0 (empty) and 1.0 (full)
   */
  public set progress(value: number) {
    this.progressInternal = value;
    this.sceneWrapper.setUniform(this.planeHandler, "progress", value);
  }

  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    this.foregroundColorInternal.off(
      UIColorEvent.CHANGE,
      this.onForegroundColorChange,
    );
    this.backgroundColorInternal.off(
      UIColorEvent.CHANGE,
      this.onBackgroundColorChange,
    );
    super.destroy();
  }

  /** @internal */
  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };

  /** @internal */
  private readonly onForegroundColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "foregroundColor", color);
  };

  /** @internal */
  private readonly onBackgroundColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "backgroundColor", color);
  };
}
