import type { Matrix3 } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import { computeTrimmedTransformMatrix } from "../miscellaneous/computeTransform";
import { UITexture } from "../miscellaneous/texture/UITexture";
import type { UITextureConfig } from "../miscellaneous/texture/UITexture.Internal";
import { UITextureEvent } from "../miscellaneous/texture/UITexture.Internal";
import source from "../shaders/UIImage.glsl";
import { UIElement } from "./UIElement";
import type { UIImageOptions } from "./UIImage.Internal";

/** Textured image element */
export class UIImage extends UIElement {
  /** Texture displayed by this image */
  public readonly texture: UITexture;
  /** Multiplicative tint. Alpha channel controls opacity. */
  public readonly color: UIColor;

  private readonly textureTransform: Matrix3;

  /**
   * Creates a new UIImage instance.
   *
   * Defaults size to texture dimensions if width and height not provided.
   *
   * @param layer - Layer containing this image
   * @param texture - Texture to display
   * @param options - Configuration options
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

  /** Removes image and frees resources */
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
