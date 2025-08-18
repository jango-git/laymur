import type { Texture } from "three";
import { MathUtils, Mesh } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIProgressMaterial } from "../materials/UIProgressMaterial";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { geometry } from "../miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

/**
 * Configuration options for creating a UIProgress element.
 */
export interface UIProgressOptions {
  /** X position of the element */
  x: number;
  /** Y position of the element */
  y: number;
  /** Optional background texture (if not provided, only foreground is shown) */
  textureBackground: Texture;
  /** Progress value between 0.0 (empty) and 1.0 (full) */
  progress: number;
  /** Direction of progress fill (true = forward, false = reverse) */
  isForwardDirection: boolean;
  /** Angle of progress fill in degrees (0 = horizontal, 90 = vertical) */
  angle: number;
  /** Background color tint as hex number (e.g., 0xFFFFFF) */
  backgroundColor: number;
  /** Foreground color tint as hex number (e.g., 0xFFFFFF) */
  foregroundColor: number;
  /** Background opacity between 0.0 (transparent) and 1.0 (opaque) */
  backgroundOpacity: number;
  /** Foreground opacity between 0.0 (transparent) and 1.0 (opaque) */
  foregroundOpacity: number;
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
export class UIProgress extends UIElement<Mesh> {
  private readonly material: UIProgressMaterial;

  /**
   * Creates a new progress bar UI element.
   *
   * @param layer - The UI layer to add this element to
   * @param textureForeground - The texture used for the progress fill
   * @param options - Configuration options for the progress bar
   */
  constructor(
    layer: UILayer,
    textureForeground: Texture,
    options: Partial<UIProgressOptions> = {},
  ) {
    const foregroundWidth = textureForeground.image?.width;
    const foregroundHeight = textureForeground.image?.height;

    assertValidPositiveNumber(
      foregroundWidth,
      "UIProgress foreground texture width",
    );
    assertValidPositiveNumber(
      foregroundHeight,
      "UIProgress foreground texture height",
    );

    const backgroundWidth = options.textureBackground?.image?.width;
    const backgroundHeight = options.textureBackground?.image?.height;

    if (options.textureBackground) {
      assertValidPositiveNumber(
        backgroundWidth,
        "UIProgress background texture width",
      );
      assertValidPositiveNumber(
        backgroundHeight,
        "UIProgress background texture height",
      );
    }

    const material = new UIProgressMaterial(
      textureForeground,
      options.textureBackground,
    );
    const object = new Mesh(geometry, material);

    if (options.progress !== undefined) {
      material.setProgress(options.progress);
    }

    if (options.isForwardDirection !== undefined) {
      material.setIsForwardDirection(options.isForwardDirection);
    }

    if (options.angle !== undefined) {
      material.setAngle(MathUtils.degToRad(options.angle));
    }

    if (options.backgroundColor !== undefined) {
      material.setBackgroundColor(options.backgroundColor);
    }

    if (options.foregroundColor !== undefined) {
      material.setForegroundColor(options.foregroundColor);
    }

    if (options.backgroundOpacity !== undefined) {
      material.setBackgroundOpacity(options.backgroundOpacity);
    }

    if (options.foregroundOpacity !== undefined) {
      material.setForegroundOpacity(options.foregroundOpacity);
    }

    const imageWidth = backgroundWidth ?? foregroundWidth;
    const imageHeight = foregroundHeight ?? backgroundHeight;

    super(
      layer,
      options.x ?? 0,
      options.y ?? 0,
      imageWidth,
      imageHeight,
      object,
    );

    this.material = material;
  }

  /**
   * Gets the current progress value.
   * @returns Progress value between 0.0 (empty) and 1.0 (full)
   */
  public get progress(): number {
    return this.material.getProgress();
  }

  /**
   * Gets the background texture.
   * @returns The background texture, or undefined if none is set
   */
  public get backgroundTexture(): Texture | undefined {
    return this.material.getBackgroundTexture();
  }

  /**
   * Gets the foreground (fill) texture.
   * @returns The foreground texture
   */
  public get foregroundTexture(): Texture {
    return this.material.getForegroundTexture();
  }

  /**
   * Gets the background color tint.
   * @returns The background color as a hex number (e.g., 0xFFFFFF)
   */
  public get backgroundColor(): number {
    return this.material.getBackgroundColor();
  }

  /**
   * Gets the foreground color tint.
   * @returns The foreground color as a hex number (e.g., 0xFFFFFF)
   */
  public get foregroundColor(): number {
    return this.material.getForegroundColor();
  }

  /**
   * Gets the background opacity.
   * @returns Opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public get backgroundOpacity(): number {
    return this.material.getBackgroundOpacity();
  }

  /**
   * Gets the foreground opacity.
   * @returns Opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public get foregroundOpacity(): number {
    return this.material.getForegroundOpacity();
  }

  /**
   * Gets whether transparency is enabled for the image.
   * @returns True if transparency is enabled, false otherwise
   */
  public get transparency(): boolean {
    return this.material.getTransparency();
  }

  /**
   * Gets the progress fill angle in degrees.
   * @returns Angle in degrees (0 = horizontal, 90 = vertical)
   */
  public get angle(): number {
    return MathUtils.radToDeg(this.material.getAngle());
  }

  /**
   * Gets whether the progress fills in forward direction.
   * @returns True if filling forward, false if filling in reverse
   */
  public get isForwardDirection(): boolean {
    return this.material.getIsForwardDirection();
  }

  /**
   * Sets the progress value.
   * @param value - Progress value between 0.0 (empty) and 1.0 (full)
   */
  public set progress(value: number) {
    this.material.setProgress(value);
  }

  /**
   * Sets the background texture.
   * @param value - The background texture, or undefined to remove background
   */
  public set backgroundTexture(value: Texture | undefined) {
    if (value) {
      const width = value.image.width;
      const height = value.image.height;

      assertValidPositiveNumber(width, "UIProgress background texture width");
      assertValidPositiveNumber(height, "UIProgress background texture height");
    }

    this.material.setBackgroundTexture(value);
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
    const width = value.image.width;
    const height = value.image.height;

    assertValidPositiveNumber(width, "UIProgress foreground texture width");
    assertValidPositiveNumber(height, "UIProgress foreground texture height");

    this.material.setForegroundTexture(value);
    this.solverWrapper.suggestVariableValue(this.wVariable, width);
    this.solverWrapper.suggestVariableValue(this.hVariable, height);
  }

  /**
   * Sets the background color tint.
   * @param value - The background color as a hex number (e.g., 0xFFFFFF)
   */
  public set backgroundColor(value: number) {
    this.material.setBackgroundColor(value);
  }

  /**
   * Sets the foreground color tint.
   * @param value - The foreground color as a hex number (e.g., 0xFFFFFF)
   */
  public set foregroundColor(value: number) {
    this.material.setForegroundColor(value);
  }

  /**
   * Sets the background opacity.
   * @param value - Opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public set backgroundOpacity(value: number) {
    this.material.setBackgroundOpacity(value);
  }

  /**
   * Sets the foreground opacity.
   * @param value - Opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public set foregroundOpacity(value: number) {
    this.material.setForegroundOpacity(value);
  }

  /**
   * Sets whether transparency is enabled for the image.
   * @param value - True to enable transparency, false to disable
   */
  public set transparency(value: boolean) {
    this.material.setTransparency(value);
  }

  /**
   * Sets the progress fill angle.
   * @param value - Angle in degrees (0 = horizontal, 90 = vertical)
   */
  public set angle(value: number) {
    this.material.setAngle(MathUtils.degToRad(value));
  }

  /**
   * Sets the progress fill direction.
   * @param value - True for forward direction, false for reverse
   */
  public set isForwardDirection(value: boolean) {
    this.material.setIsForwardDirection(value);
  }

  /**
   * Destroys the progress bar element and cleans up resources.
   *
   * This method disposes of the material and calls the parent destroy method.
   */
  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }
}
