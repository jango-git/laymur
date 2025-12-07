import type { Texture } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import type { UIMode } from "../miscellaneous/UIMode";
import source from "../shaders/UIDefaultShader.glsl";
import { UIElement } from "./UIElement";

/**
 * Configuration options for creating a UIImage element.
 */
export interface UIImageOptions {
  /** X position of the element */
  x: number;
  /** Y position of the element */
  y: number;
  /** Width of the element */
  width: number;
  /** Height of the element */
  height: number;
  /** Color tint applied to the image */
  color: UIColor;
  /** Default UIMode */
  mode: UIMode;
}

/**
 * UI element for displaying textured images.
 *
 * UIImage is a concrete implementation of UIElement that renders a textured
 * image using shader-based planes. It automatically sizes itself
 * to match the texture dimensions and provides control over visual properties
 * such as color tinting.
 *
 * @see {@link UIElement} - Base class providing UI element functionality
 * @see {@link Texture} - Three.js texture for image data
 */
export class UIImage extends UIElement {
  /** Internal storage for the current texture */
  private textureInternal: Texture;
  /** Internal storage for the color tint */
  private readonly colorInternal: UIColor;

  /**
   * Creates a new UIImage instance.
   *
   * The image will automatically size itself to match the texture's dimensions.
   * All options have default values if not specified.
   *
   * @param layer - The UI layer that contains this image
   * @param texture - The Three.js texture to display
   * @param options - Configuration options for the image
   * @throws Will throw an error if the texture dimensions are not valid positive numbers
   */
  constructor(
    layer: UILayer,
    texture: Texture,
    options: Partial<UIImageOptions> = {},
  ) {
    const w = options.width ?? texture.image.width;
    const h = options.height ?? texture.image.height;

    const color = options.color ?? new UIColor();

    super(layer, options.x ?? 0, options.y ?? 0, w, h, source, {
      map: texture,
      uvTransform: texture.matrix,
      color,
    });

    this.textureInternal = texture;
    this.colorInternal = color;
    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);

    if (options.mode !== undefined) {
      this.mode = options.mode;
    }
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
   * @returns The UIColor instance
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
    this.sceneWrapper.setProperties(this.planeHandler, {
      map: value,
      uvTransform: value.matrix,
    });
  }

  /**
   * Sets the color tint applied to the image.
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
    this.sceneWrapper.setProperties(this.planeHandler, { color: color });
  };
}
