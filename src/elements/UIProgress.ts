import type { WebGLRenderer } from "three";
import { Texture } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor } from "../miscellaneous/color/UIColor";
import type { UIElementCommonOptions } from "../miscellaneous/UIElementCommonOptions";
import source from "../shaders/UIProgress.glsl";
import { UIElement } from "./UIElement";

const EMPTY_TEXTURE = new Texture();

/**
 * Predefined mask functions that control how the progress bar fills.
 * Each function defines a different fill pattern using GLSL shader code.
 */
export enum UIProgressMaskFunction {
  /** Fill horizontally from left to right (or right to left if inverse) */
  HORIZONTAL = `float calculateMask() {
    return step((p_direction * p_uv.x + (1.0 - p_direction) * 0.5), p_progress);
  }`,

  /** Fill vertically from bottom to top (or top to bottom if inverse) */
  VERTICAL = `float calculateMask() {
    return step((p_direction * p_uv.y + (1.0 - p_direction) * 0.5), p_progress);
  }`,

  /** Fill diagonally from bottom-left to top-right */
  DIAGONAL = `float calculateMask() {
    float d = (p_uv.x + p_uv.y) * (0.1);
    return step((p_direction * d + (1.0 - p_direction) * 0.5), p_progress);
  }`,

  /** Fill in a circular pattern around the center, starting from the left */
  CIRCLE_LEFT = `float calculateMask() {
    vec2 p = p_uv - 0.5;
    float angle = atan(p.y, p.x);
    angle = (angle + 3.14159265) / PI;
    angle *= 0.5;
    return step((p_direction * angle + (1.0 - p_direction) * 0.5), p_progress);
  }`,

  /** Fill in a circular pattern around the center, starting from the top */
  CIRCLE_TOP = `float calculateMask() {
    vec2 p = p_uv - 0.5;
    float angle = atan(p.y, p.x);
    angle = (angle + PI) / (2.0 * PI);
    angle = mod(angle + 0.25, 1.0);
    return step((p_direction * angle + (1.0 - p_direction) * 0.5), p_progress);
  }`,
}

/**
 * Configuration options for creating a UIProgress element.
 */
export interface UIProgressOptions extends UIElementCommonOptions {
  /** Optional background texture (if not provided, default texture is used) */
  backgroundTexture: Texture;
  /** Foreground color tint applied to the filled portion */
  foregroundColor: UIColor;
  /** Background color tint applied to the unfilled portion */
  backgroundColor: UIColor;
  /** Mask function that defines how the progress bar fills (predefined enum or custom GLSL code) */
  maskFunction: UIProgressMaskFunction | string;
  /** Progress value between 0.0 (empty) and 1.0 (full) */
  progress: number;
  /** Whether to fill in reverse direction (true for reverse, false for normal) */
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
  public readonly color: UIColor;
  public readonly foregroundColor: UIColor;
  public readonly backgroundColor: UIColor;

  private foregroundTextureInternal: Texture;
  private backgroundTextureInternal?: Texture;

  private progressInternal: number;
  private inverseDirectionInternal: boolean;

  private dirty = false;

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
    const w = options.width ?? foregroundTexture.image.width;
    const h = options.height ?? foregroundTexture.image.height;

    assertValidPositiveNumber(
      w,
      "UIProgress.constructor.foregroundTexture.width",
    );
    assertValidPositiveNumber(
      h,
      "UIProgress.constructor.foregroundTexture.height",
    );

    if (options.backgroundTexture) {
      assertValidPositiveNumber(
        options.backgroundTexture.image.width,
        "UIProgress.constructor.backgroundTexture.width",
      );
      assertValidPositiveNumber(
        options.backgroundTexture.image.height,
        "UIProgress.constructor.backgroundTexture.height",
      );
    }

    const color = new UIColor(options.color);
    const foregroundColor = new UIColor(options.foregroundColor);
    const backgroundColor = new UIColor(options.backgroundColor);
    const progress = options.progress ?? 1;
    const inverseDirection = options.inverseDirection ?? false;

    const maskFunction =
      options.maskFunction ?? UIProgressMaskFunction.HORIZONTAL;
    const minifiedSource = (maskFunction + source)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "")
      .replace(/\s*([{}(),=;+\-*/<>])\s*/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    super(layer, options.x ?? 0, options.y ?? 0, w, h, minifiedSource, {
      foregroundTexture,
      backgroundTexture: options.backgroundTexture ?? EMPTY_TEXTURE,
      color,
      foregroundColor,
      backgroundColor,
      progress,
      direction: inverseDirection ? -1 : 1,
    });

    this.foregroundTextureInternal = foregroundTexture;
    this.backgroundTextureInternal = options.backgroundTexture;

    this.color = color;
    this.foregroundColor = foregroundColor;
    this.backgroundColor = backgroundColor;

    this.progressInternal = progress;
    this.inverseDirectionInternal = inverseDirection;

    this.mode = options.mode ?? this.mode;
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
   * Gets the current progress value.
   * @returns Progress value between 0.0 (empty) and 1.0 (full)
   */
  public get progress(): number {
    return this.progressInternal;
  }

  /**
   * Gets whether the progress fills in reverse direction.
   * @returns True if filling in reverse, false if filling forward
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
    if (this.foregroundTexture !== value) {
      const w = value.image.width;
      const h = value.image.height;

      assertValidPositiveNumber(w, "UIProgress.foregroundTexture.width");
      assertValidPositiveNumber(h, "UIProgress.foregroundTexture.height");

      this.solverWrapper.suggestVariableValue(this.wVariable, w);
      this.solverWrapper.suggestVariableValue(this.hVariable, h);

      this.foregroundTextureInternal = value;
      this.dirty = true;
    }
  }

  /**
   * Sets the background texture.
   * @param value - The background texture, or undefined to remove background
   */
  public set backgroundTexture(value: Texture | undefined) {
    if (this.backgroundTexture !== value) {
      if (value !== undefined) {
        assertValidPositiveNumber(
          value.image.width,
          "UIProgress.backgroundTexture.width",
        );
        assertValidPositiveNumber(
          value.image.height,
          "UIProgress.backgroundTexture.height",
        );
      }

      this.backgroundTextureInternal = value;
      this.dirty = true;
    }
  }

  /**
   * Sets the progress fill direction.
   * @param value - True for reverse direction, false for forward
   */
  public set inverseDirection(value: boolean) {
    if (this.inverseDirectionInternal !== value) {
      this.inverseDirectionInternal = value;
      this.dirty = true;
    }
  }

  /**
   * Sets the progress value.
   * @param value - Progress value between 0.0 (empty) and 1.0 (full)
   */
  public set progress(value: number) {
    if (this.progressInternal !== value) {
      this.progressInternal = value;
      this.dirty = true;
    }
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (
      this.color.dirty ||
      this.backgroundColor.dirty ||
      this.foregroundColor.dirty ||
      this.dirty
    ) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        foregroundTexture: this.foregroundTextureInternal,
        backgroundTexture: this.backgroundTextureInternal ?? EMPTY_TEXTURE,
        color: this.color,
        foregroundColor: this.foregroundColor,
        backgroundColor: this.backgroundColor,
        progress: this.progressInternal,
        direction: this.inverseDirection ? -1 : 1,
      });

      this.color.dirty = false;
      this.backgroundColor.dirty = false;
      this.foregroundColor.dirty = false;
      this.dirty = false;
    }
    super.onWillRender(renderer, deltaTime);
  }
}
