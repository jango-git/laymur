import type { Matrix3 } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import { computePaddingTransformMatrix } from "../miscellaneous/computeTransform";
import { UITexture } from "../miscellaneous/texture/UITexture";
import type { UITextureConfig } from "../miscellaneous/texture/UITexture.Internal";
import source from "../shaders/UIImage.glsl";
import { UIElement } from "./UIElement";
import type { UIImageOptions } from "./UIImage.Internal";

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
  public readonly texture: UITexture;
  public readonly color: UIColor;

  private readonly textureTransform: Matrix3;

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
    texture: UITextureConfig,
    options: Partial<UIImageOptions> = {},
  ) {
    const color = new UIColor(options.color);
    const uiTexture = new UITexture(texture);
    const textureTransform = uiTexture.calculateTransform();

    options.width = options.width ?? uiTexture.originalWidth;
    options.height = options.width ?? uiTexture.originalHeight;

    super(
      layer,
      source,
      {
        texture: uiTexture.texture,
        textureTransform: textureTransform,
        color,
      },
      options,
    );

    this.texture = uiTexture;
    this.textureTransform = textureTransform;
    this.color = color;
  }

  protected override updatePlaneTransform(): void {
    if (this.texture.dirty || this.color.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: this.texture.texture,
        textureTransform: this.texture.calculateTransform(
          this.textureTransform,
        ),
        color: this.color,
      });

      this.color.setDirtyFalse();
    }

    if (this.texture.dirty) {
      this.width = this.texture.originalWidth;
      this.height = this.texture.originalHeight;
    }

    if (
      this.texture.dirty ||
      this.micro.dirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty
    ) {
      this.sceneWrapper.setTransform(
        this.planeHandler,
        computePaddingTransformMatrix(
          this.x,
          this.y,
          this.width,
          this.height,
          this.zIndex,
          this.micro.x,
          this.micro.y,
          this.micro.anchorX,
          this.micro.anchorY,
          this.micro.scaleX,
          this.micro.scaleY,
          this.micro.rotation,
          this.micro.anchorMode,
          this.texture.trimLeft,
          this.texture.trimRight,
          this.texture.trimTop,
          this.texture.trimBottom,
        ),
      );

      this.texture.setDirtyFalse();
      this.micro.setDirtyFalse();
    }
  }
}
