import type { Matrix3 } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import { UIColor } from "../../miscellaneous/color/UIColor";
import { computeTrimmedTransformMatrix } from "../../miscellaneous/computeTransform";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared";
import { UITextureView } from "../../miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../miscellaneous/texture/UITextureView.Internal";
import { UITextureViewEvent } from "../../miscellaneous/texture/UITextureView.Internal";
import source from "../../shaders/UIImage.glsl";
import { UIElement } from "../UIElement/UIElement";
import type { UIImageOptions } from "./UIImage.Internal";

/** Textured image element */
export class UIImage extends UIElement {
  /** Texture displayed by this image */
  public readonly texture: UITextureView;
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
    const textureView = new UITextureView(texture);
    const textureTransform = textureView.calculateUVTransform();

    options.width = options.width ?? textureView.width;
    options.height = options.height ?? textureView.height;

    super(
      layer,
      source,
      {
        texture: textureView.texture,
        textureTransform: textureTransform,
        color,
      },
      options,
    );

    this.texture = textureView;
    this.textureTransform = textureTransform;
    this.color = color;

    this.texture.on(
      UITextureViewEvent.DIMENSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
  }

  /** Removes image and frees resources */
  public override destroy(): void {
    this.texture.off(
      UITextureViewEvent.DIMENSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
    super.destroy();
  }

  protected override setPlaneTransform(): void {
    let properties: Record<string, UIProperty> | undefined;

    if (this.color.dirty) {
      properties ??= {};
      properties["color"] = this.color;
      this.color.setDirtyFalse();
    }

    if (this.texture.textureDirty) {
      properties ??= {};
      properties["texture"] = this.texture.texture;
      this.texture.setTextureDirtyFalse();
    }

    if (this.texture.uvTransformDirty) {
      properties ??= {};
      properties["textureTransform"] = this.texture.calculateUVTransform(
        this.textureTransform,
      );
      this.texture.setUVTransformDirtyFalse();
    }

    if (properties) {
      this.sceneWrapper.setProperties(this.planeHandler, properties);
    }

    const isTransformDirty =
      this.micro.dirty ||
      this.texture.trimDirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty;

    if (isTransformDirty) {
      const micro = this.micro;
      const textureTrim = this.texture.trim;

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
          textureTrim.left,
          textureTrim.right,
          textureTrim.top,
          textureTrim.bottom,
        ),
      );
      this.micro.setDirtyFalse();
      this.texture.setTrimDirtyFalse();
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
