import type { Texture, WebGLRenderer } from "three";
import { MathUtils, Mesh } from "three";
import type { UILayer } from "../Layers/UILayer";
import { UIProgressMaterial } from "../Materials/UIProgressMaterial";
import { assertSize } from "../Miscellaneous/asserts";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

/**
 * Options for customizing the UIProgress element.
 */

export interface UIProgressOptions {
  /** Optional background texture to display behind the progress indicator */
  textureBackground: Texture;
  /** Progress value from 0 to 1 */
  progress: number;
  /** Whether progress increases in the direction specified by angle (true) or opposite to it (false) */
  isForegroundDirection: boolean;
  /** Angle in degrees specifying the direction of progress */
  angle: number;
  /** Overall color tint applied to both textures */
  color: number;
  /** Overall opacity applied to both textures */
  opacity: number;
  /** Color tint applied to the background texture */
  backgroundColor: number;
  /** Color tint applied to the foreground texture */
  foregroundColor: number;
  /** Opacity of the background texture */
  backgroundOpacity: number;
  /** Opacity of the foreground texture */
  foregroundOpacity: number;
}

/**
 * A UI element that displays a progress indicator.
 * Can be used for loading bars, health bars, sliders, etc.
 */

export class UIProgress extends UIElement {
  /** Material used to render the progress indicator */
  private readonly material: UIProgressMaterial;
  /** Width of the underlying image texture */
  private readonly imageWidth: number;
  /** Height of the underlying image texture */
  private readonly imageHeight: number;

  /**
   * Creates a new progress UI element.
   *
   * @param layer - The UI layer that contains this element
   * @param textureForeground - The texture to use for the progress indicator
   * @param options - Options to customize the progress indicator
   * @throws Error if either texture has invalid dimensions
   */
  constructor(
    layer: UILayer,
    textureForeground: Texture,
    options: Partial<UIProgressOptions> = {},
  ) {
    const foregroundWidth = textureForeground.image?.width;
    const foregroundHeight = textureForeground.image?.height;

    assertSize(
      foregroundWidth,
      foregroundHeight,
      `Invalid image dimensions - texture "${textureForeground.name || "unnamed"}" has invalid width (${foregroundWidth}) or height (${foregroundHeight}). Image dimensions must be non-zero positive numbers.`,
    );

    const backgroundWidth = options.textureBackground?.image?.width;
    const backgroundHeight = options.textureBackground?.image?.height;

    if (options.textureBackground) {
      assertSize(
        backgroundWidth,
        backgroundHeight,
        `Invalid image dimensions - texture "${options.textureBackground.name || "unnamed"}" has invalid width (${backgroundWidth}) or height (${backgroundHeight}). Image dimensions must be non-zero positive numbers.`,
      );
    }

    const material = new UIProgressMaterial(
      textureForeground,
      options.textureBackground,
    );
    const object = new Mesh(geometry, material);

    if (options.progress) {
      material.setProgress(options.progress);
    }

    if (options.isForegroundDirection) {
      material.setIsForwardDirection(options.isForegroundDirection);
    }

    if (options.angle) {
      material.setAngle(MathUtils.degToRad(options.angle));
    }

    if (options.color) {
      material.setColor(options.color);
    }

    if (options.opacity) {
      material.setOpacity(options.opacity);
    }

    if (options.backgroundColor) {
      material.setBackgroundColor(options.backgroundColor);
    }

    if (options.foregroundColor) {
      material.setForegroundColor(options.foregroundColor);
    }

    if (options.backgroundOpacity) {
      material.setBackgroundOpacity(options.backgroundOpacity);
    }

    if (options.foregroundOpacity) {
      material.setForegroundOpacity(options.foregroundOpacity);
    }

    const imageWidth = backgroundWidth ?? foregroundWidth;
    const imageHeight = foregroundHeight ?? backgroundHeight;

    super(layer, object, 0, 0, imageWidth, imageHeight);

    this.material = material;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;

    this.applyTransformations();
  }

  /** Gets the current progress value (0 to 1) */
  public get progress(): number {
    return this.material.getProgress();
  }

  /** Gets the background texture if one was provided */
  public get backgroundTexture(): Texture | undefined {
    return this.material.getBackgroundTexture();
  }

  /** Gets the foreground texture used for the progress indicator */
  public get foregroundTexture(): Texture {
    return this.material.getForegroundTexture();
  }

  /** Gets the color tint applied to the background texture */
  public get backgroundColor(): number {
    return this.material.getBackgroundColor();
  }

  /** Gets the color tint applied to the foreground texture */
  public get foregroundColor(): number {
    return this.material.getForegroundColor();
  }

  /** Gets the overall color tint applied to both textures */
  public get color(): number {
    return this.material.getColor();
  }

  /** Gets the opacity of the background texture */
  public get backgroundOpacity(): number {
    return this.material.getBackgroundOpacity();
  }

  /** Gets the opacity of the foreground texture */
  public get foregroundOpacity(): number {
    return this.material.getForegroundOpacity();
  }

  /** Gets the overall opacity applied to both textures */
  public get opacity(): number {
    return this.material.getOpacity();
  }

  /** Gets the angle in degrees specifying the direction of progress */
  public get angle(): number {
    return MathUtils.radToDeg(this.material.getAngle());
  }

  /** Gets whether progress increases in the direction specified by angle (true) or opposite to it (false) */
  public get isForwardDirection(): boolean {
    return this.material.getIsForwardDirection();
  }

  /**
   * Sets the progress value
   * @param value - Progress value between 0 (empty) and 1 (full)
   */
  public set progress(value: number) {
    this.material.setProgress(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the color tint applied to the background texture
   * @param value - Color in hexadecimal format
   */
  public set backgroundColor(value: number) {
    this.material.setBackgroundColor(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the color tint applied to the foreground texture
   * @param value - Color in hexadecimal format
   */
  public set foregroundColor(value: number) {
    this.material.setForegroundColor(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the overall color tint applied to both textures
   * @param value - Color in hexadecimal format
   */
  public set color(value: number) {
    this.material.setColor(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the opacity of the background texture
   * @param value - Opacity value between 0 (transparent) and 1 (opaque)
   */
  public set backgroundOpacity(value: number) {
    this.material.setBackgroundOpacity(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the opacity of the foreground texture
   * @param value - Opacity value between 0 (transparent) and 1 (opaque)
   */
  public set foregroundOpacity(value: number) {
    this.material.setForegroundOpacity(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the overall opacity applied to both textures
   * @param value - Opacity value between 0 (transparent) and 1 (opaque)
   */
  public set opacity(value: number) {
    this.material.setOpacity(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the angle specifying the direction of progress
   * @param value - Angle in degrees
   */
  public set angle(value: number) {
    this.material.setAngle(MathUtils.degToRad(value));
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets whether progress increases in the direction specified by angle
   * @param value - true to increase in the direction of angle, false for opposite
   */
  public set isForwardDirection(value: boolean) {
    this.material.setIsForwardDirection(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Destroys the progress element, disposing of all resources and removing it from the layer.
   * This should be called when the element is no longer needed.
   */
  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }

  /**
   * Renders the progress element.
   *
   * @param renderer - The WebGL renderer
   */
  protected override render(renderer: WebGLRenderer): void {
    (this.object as Mesh).material = this.composerInternal.compose(
      renderer,
      this.imageWidth,
      this.imageHeight,
      this.material,
    );
    this.applyTransformations();
  }
}
