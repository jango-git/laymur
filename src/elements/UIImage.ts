import type { Matrix3 } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import { computeTrimmedTransformMatrix } from "../miscellaneous/computeTransform";
import { UITexture } from "../miscellaneous/texture/UITexture";
import {
  UITextureEvent,
  type UITextureConfig,
} from "../miscellaneous/texture/UITexture.Internal";
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
    const textureTransform = uiTexture.calculateUVTransform();

    options.width = options.width ?? uiTexture.width;
    options.height = options.height ?? uiTexture.height;

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

    this.texture.on(
      UITextureEvent.DIMENSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
  }

  public override destroy(): void {
    this.texture.off(
      UITextureEvent.DIMENSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
    super.destroy();
  }

  protected override updatePlaneTransform(): void {
    if (this.texture.dirty || this.color.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: this.texture.texture,
        textureTransform: this.texture.calculateUVTransform(
          this.textureTransform,
        ),
        color: this.color,
      });

      this.color.setDirtyFalse();
    }

    if (
      this.texture.dirty ||
      this.micro.dirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty
    ) {
      const trim = this.texture.trim;
      const micro = this.micro;
      this.sceneWrapper.setTransform(
        this.planeHandler,
        computeTrimmedTransformMatrix(
          this.x,
          this.y,
          this.width,
          this.height,
          this.zIndex,
          micro.x,
          micro.y,
          micro.anchorX,
          micro.anchorY,
          micro.scaleX,
          micro.scaleY,
          micro.rotation,
          micro.anchorMode,
          trim.left,
          trim.right,
          trim.top,
          trim.bottom,
        ),
      );
      this.texture.setDirtyFalse();
      this.micro.setDirtyFalse();
    }
  }

  private readonly onTextureDimensionsChanged = (
    width: number,
    height: number,
  ): void => {
    this.width = width;
    this.height = height;
  };
}
