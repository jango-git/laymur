import type { Texture, WebGLRenderer } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor } from "../miscellaneous/color/UIColor";
import type { UIElementCommonOptions } from "../miscellaneous/UIElementCommonOptions";
import source from "../shaders/UIImage.glsl";
import { UIElement } from "./UIElement";

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
  public readonly color: UIColor;

  private textureInternal: Texture;
  private textureInternalDirty = false;

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
    options: Partial<UIElementCommonOptions> = {},
  ) {
    const w = options.width ?? texture.image.width;
    const h = options.height ?? texture.image.height;
    const color = new UIColor(options.color);

    super(layer, options.x ?? 0, options.y ?? 0, w, h, source, {
      color,
      texture,
      textureTransform: texture.matrix,
    });

    this.color = color;
    this.mode = options.mode ?? this.mode;
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
    if (this.textureInternal !== value) {
      const w = value.image.width;
      const h = value.image.height;

      assertValidPositiveNumber(w, "UIImage.texture.width");
      assertValidPositiveNumber(h, "UIImage.texture.height");

      this.solverWrapper.suggestVariableValue(this.wVariable, w);
      this.solverWrapper.suggestVariableValue(this.hVariable, h);

      this.textureInternal = value;
      this.textureInternalDirty = true;
    }
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (this.color.dirty || this.textureInternalDirty) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: this.textureInternal,
        textureTransform: this.textureInternal.matrix,
        color: this.color,
      });

      this.color.dirty = false;
      this.textureInternalDirty = false;
    }
    super.onWillRender(renderer, deltaTime);
  }
}
