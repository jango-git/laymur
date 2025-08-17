import type { Texture } from "three";
import { Mesh } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIMaterial } from "../materials/UIMaterial";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { geometry } from "../miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

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
export class UIImage extends UIElement<Mesh> {
  /** The material used for rendering the image. */
  private readonly material: UIMaterial;

  /** Internal storage for the current texture. */
  private readonly textureInternal: Texture;

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
  constructor(layer: UILayer, texture: Texture, x = 0, y = 0) {
    const width = texture.image.width;
    const height = texture.image.height;

    const material = new UIMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, x, y, width, height, object);
    this.material = material;
    this.textureInternal = texture;
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
  public get color(): number {
    return this.material.getColor();
  }

  /**
   * Gets the current opacity level of the image.
   * @returns The opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public get opacity(): number {
    return this.material.getOpacity();
  }

  /**
   * Gets whether transparency is enabled for the image.
   * @returns True if transparency is enabled, false otherwise
   */
  public get transparency(): boolean {
    return this.material.getTransparency();
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
    const width = value.image.width;
    const height = value.image.height;

    assertValidPositiveNumber(width, "UIImage texture width");
    assertValidPositiveNumber(height, "UIImage texture height");

    this.material.setTexture(value);
    this.solverWrapper.suggestVariableValue(this.wVariable, width);
    this.solverWrapper.suggestVariableValue(this.hVariable, height);
  }

  /**
   * Sets the color tint applied to the image.
   * @param value - The color value as a number (e.g., 0xFFFFFF for white)
   */
  public set color(value: number) {
    this.material.setColor(value);
  }

  /**
   * Sets the opacity level of the image.
   * @param value - The opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public set opacity(value: number) {
    this.material.setOpacity(value);
  }

  /**
   * Sets whether transparency is enabled for the image.
   * @param value - True to enable transparency, false to disable
   */
  public set transparency(value: boolean) {
    this.material.setTransparency(value);
  }

  /**
   * Destroys the image by cleaning up all associated resources.
   *
   * This method disposes of the material resources and calls the parent
   * destroy method to clean up the underlying UI element. After calling
   * this method, the image should not be used anymore.
   */
  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }
}
