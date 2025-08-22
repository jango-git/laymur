import { Texture } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import source from "../shaders/UIProgressShader.glsl";
import { UIElement } from "./UIElement";

const DEFAULT_TEXTURE = new Texture();

const DEFAULT_MASK_FUNCTION = `float calculateMask() {
  return step(progress, io_UV.x);
}`;

/**
 * Configuration options for creating a UIProgress element.
 */
export interface UIProgressOptions {
  /** X position of the element */
  x: number;
  /** Y position of the element */
  y: number;
  /** Optional background texture (if not provided, only foreground is shown) */
  backgroundTexture: Texture;
  /** Background color tint as hex number (e.g., 0xFFFFFF) */
  color: UIColor;
  /** Foreground color tint as hex number (e.g., 0xFFFFFF) */
  foregroundColor: UIColor;
  /** Background color tint as hex number (e.g., 0xFFFFFF) */
  backgroundColor: UIColor;
  maskFunction: string;
  /** Progress value between 0.0 (empty) and 1.0 (full) */
  progress: number;
  inverseDirection: boolean;
}

/**
 * Progress bar UI element with customizable fill direction and appearance.
 *
 * UIProgress displays a progress bar that can be filled in various directions
 * (horizontal, vertical, or at custom angles). It supports separate background
 * and foreground textures with independent color tinting and opacity control.
 *
 * The progress value ranges from 0.0 (empty) to 1.0 (completely filled).
 * The fill direction can be controlled both by angle and forward/reverse direction.
 */
export class UIProgress extends UIElement {
  private foregroundTextureInternal: Texture;
  private backgroundTextureInternal?: Texture;

  private readonly colorInternal: UIColor;
  private readonly foregroundColorInternal: UIColor;
  private readonly backgroundColorInternal: UIColor;

  private progressInternal: number;
  private inverseDirectionInternal: boolean;

  /**
   * Creates a new progress bar UI element.
   *
   * @param layer - The UI layer to add this element to
   * @param foregroundTexture - The texture used for the progress fill
   * @param options - Configuration options for the progress bar
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
      (options.maskFunction ?? DEFAULT_MASK_FUNCTION) + source,
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
   * Gets the foreground (fill) texture.
   * @returns The foreground texture
   */
  public get foregroundTexture(): Texture {
    return this.foregroundTextureInternal;
  }

  /**
   * Gets the background texture.
   * @returns The background texture, or undefined if none is set
   */
  public get backgroundTexture(): Texture | undefined {
    return this.backgroundTextureInternal;
  }

  /**
   * Gets the color tint.
   * @returns The color as a hex number (e.g., 0xFFFFFF)
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Gets the foreground color tint.
   * @returns The foreground color as a hex number (e.g., 0xFFFFFF)
   */
  public get foregroundColor(): UIColor {
    return this.foregroundColorInternal;
  }

  /**
   * Gets the background color tint.
   * @returns The background color as a hex number (e.g., 0xFFFFFF)
   */
  public get backgroundColor(): UIColor {
    return this.backgroundColorInternal;
  }

  /**
   * Gets the current progress value.
   * @returns Progress value between 0.0 (empty) and 1.0 (full)
   */
  public get progress(): number {
    return this.progressInternal;
  }

  /**
   * Gets whether the progress fills in forward direction.
   * @returns True if filling forward, false if filling in reverse
   */
  public get inverseDirection(): boolean {
    return this.inverseDirectionInternal;
  }

  /**
   * Sets the foreground (fill) texture.
   *
   * When setting a new texture, the progress bar will automatically resize
   * to match the new texture's dimensions.
   *
   * @param value - The new foreground texture
   * @throws Will throw an error if the texture dimensions are not valid positive numbers
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
   * @param value - The background texture, or undefined to remove background
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
   * @param value - The color as a hex number (e.g., 0xFFFFFF)
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Sets the foreground color tint.
   * @param value - The foreground color as a hex number (e.g., 0xFFFFFF)
   */
  public set foregroundColor(value: UIColor) {
    this.foregroundColorInternal.copy(value);
  }

  /**
   * Sets the background color tint.
   * @param value - The background color as a hex number (e.g., 0xFFFFFF)
   */
  public set backgroundColor(value: UIColor) {
    this.backgroundColorInternal.copy(value);
  }

  /**
   * Sets the progress fill direction.
   * @param value - True for forward direction, false for reverse
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

  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };

  private readonly onForegroundColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "foregroundcolor", color);
  };

  private readonly onBackgroundColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "backgroundcolor", color);
  };
}
