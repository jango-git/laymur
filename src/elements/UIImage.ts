import type { Texture } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import source from "../shaders/UIDefaultShader.glsl";
import { UIElement } from "./UIElement";

/**
 * Configuration options for creating a UIImage element.
 *
 * @public
 */
export interface UIImageOptions {
  /** X position of the element */
  x: number;
  /** Y position of the element */
  y: number;
  /** Color tint applied to the image */
  color: UIColor;
}

/**
 * UI element for displaying textured images.
 *
 * Renders a textured image using shader-based planes. Automatically sizes itself
 * to match the texture dimensions and provides color tinting control.
 *
 * @public
 */
export class UIImage extends UIElement {
  /** Current texture */
  private textureInternal: Texture;
  /** Current color tint */
  private readonly colorInternal: UIColor;

  /**
   * Creates a new UIImage instance.
   * The image automatically sizes itself to match the texture's dimensions.
   *
   * @param layer - The UI layer that contains this image
   * @param texture - The Three.js texture to display
   * @param options - Configuration options for the image
   *
   * @throws Error if the texture dimensions are not valid positive numbers
   */
  constructor(
    layer: UILayer,
    texture: Texture,
    options: Partial<UIImageOptions> = {},
  ) {
    const w = texture.image.width;
    const h = texture.image.height;

    const color = options.color ?? new UIColor();

    super(layer, options.x ?? 0, options.y ?? 0, w, h, source, {
      map: texture,
      color,
    });

    this.textureInternal = texture;
    this.colorInternal = color;
    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);
  }

  /**
   * Gets the current texture being displayed.
   *
   * @returns The current Three.js texture
   */
  public get texture(): Texture {
    return this.textureInternal;
  }

  /**
   * Gets the current color tint applied to the image.
   *
   * @returns The UIColor instance
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Sets a new texture for the image.
   * The image will automatically resize to match the new texture's dimensions.
   *
   * @param value - The new Three.js texture to display
   *
   * @throws Error if the texture dimensions are not valid positive numbers
   */
  public set texture(value: Texture) {
    const w = value.image.width;
    const h = value.image.height;

    assertValidPositiveNumber(w, "UIImage texture width");
    assertValidPositiveNumber(h, "UIImage texture height");

    this.solverWrapper.suggestVariableValue(this.wVariable, w);
    this.solverWrapper.suggestVariableValue(this.hVariable, h);

    this.textureInternal = value;
    this.sceneWrapper.setUniform(this.planeHandler, "map", value);
  }

  /**
   * Sets the color tint applied to the image.
   *
   * @param value - The UIColor instance
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Destroys the UI image by cleaning up color event listeners and all associated resources.
   */
  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    super.destroy();
  }

  /** Event handler for when the color changes */
  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };
}
