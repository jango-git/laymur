import type { Texture } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import source from "../shaders/UIDefaultShader.glsl";
import { UIElement } from "./UIElement";

export interface UIImageOptions {
  x: number;
  y: number;
  color: UIColor;
}

/**
 * UI element for displaying textured images.
 *
 * UIImage is a concrete implementation of UIElement that renders a textured
 * image using Three.js Mesh and UIMaterial. It automatically sizes itself
 * to match the texture dimensions and provides control over visual properties
 * such as color tinting, opacity, and transparency.
 *
 * @see {@link UIElement} - Base class providing UI element functionality
 * @see {@link UIMaterial} - Material system for rendering
 * @see {@link Texture} - Three.js texture for image data
 */
export class UIImage extends UIElement {
  private textureInternal: Texture;
  private readonly colorInternal: UIColor;

  /**
   * Creates a new UIImage instance.
   *
   * The image will automatically size itself to match the texture's dimensions.
   * The position defaults to (0, 0) if not specified.
   *
   * @param layer - The UI layer that contains this image
   * @param texture - The Three.js texture to display
   * @param x - Initial x-coordinate position (defaults to 0)
   * @param y - Initial y-coordinate position (defaults to 0)
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
   * @returns The current Three.js texture
   */
  public get texture(): Texture {
    return this.textureInternal;
  }

  /**
   * Gets the current color tint applied to the image.
   * @returns The color value as a number (e.g., 0xFFFFFF for white)
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Sets a new texture for the image.
   *
   * When setting a new texture, the image will automatically resize to match
   * the new texture's dimensions.
   *
   * @param value - The new Three.js texture to display
   * @throws Will throw an error if the texture dimensions are not valid positive numbers
   * @see {@link assertValidPositiveNumber}
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
   * @param value - The color value as a number (e.g., 0xFFFFFF for white)
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    super.destroy();
  }

  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };
}
