import type { Matrix3, WebGLRenderer } from "three";
import { Vector4 } from "three";
import { type UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import { UIPadding } from "../miscellaneous/padding/UIPadding";
import { UITexture } from "../miscellaneous/texture/UITexture";
import type { UITextureConfig } from "../miscellaneous/texture/UITexture.Internal";
import source from "../shaders/UINineSlice.glsl";
import { UIElement } from "./UIElement";
import {
  NINE_DEFAULT_BORDER,
  type UINineSliceOptions,
} from "./UINineSlice.Internal";

/**
 * Nine-slice UI element for scalable images with preserved border regions.
 *
 * Nine-slice scaling divides an image into 9 regions: 4 corners, 4 edges, and 1 center.
 * The corners maintain their original size, edges scale in one dimension, and the center
 * scales in both dimensions. This technique is commonly used for creating scalable UI
 * panels, buttons, and borders that maintain visual quality at any size.
 */
export class UINineSlice extends UIElement {
  public readonly texture: UITexture;
  public readonly color: UIColor;
  public readonly sliceBorders: UIPadding;
  public readonly sliceRegions: UIPadding;

  private readonly textureTransform: Matrix3;

  private readonly sliceBordersVector = new Vector4();
  private readonly sliceRegionsVector = new Vector4();

  /**
   * Creates a new nine-slice UI element.
   *
   * The element initially sizes itself to match the texture's dimensions.
   * Border regions are defined by the slice borders configuration.
   *
   * @param layer - The UI layer to add this element to
   * @param texture - The texture to use for nine-slice rendering
   * @param options - Configuration options for the nine-slice element
   * @throws Will throw an error if the texture dimensions are not valid positive numbers
   */
  constructor(
    layer: UILayer,
    texture: UITextureConfig,
    options: Partial<UINineSliceOptions> = {},
  ) {
    const color = new UIColor(options.color);

    const uiTexture = new UITexture(texture);
    const textureTransform = uiTexture.calculateTransform();

    options.width = options.width ?? uiTexture.width;
    options.height = options.width ?? uiTexture.height;

    const sliceBorders = new UIPadding(
      options.sliceBorders ?? NINE_DEFAULT_BORDER,
    );
    const sliceRegions = new UIPadding(
      options.sliceRegions ?? NINE_DEFAULT_BORDER,
    );

    const sliceBordersVector = sliceBorders.toVector4();
    const sliceRegionsVector = sliceRegions.toVector4();

    super(
      layer,
      source,
      {
        texture: uiTexture.texture,
        textureTransform: textureTransform,
        color,
        sliceBorders: sliceBordersVector,
        sliceRegions: sliceRegionsVector,
      },
      options,
    );

    this.texture = uiTexture;
    this.textureTransform = textureTransform;
    this.color = color;

    this.sliceBorders = sliceBorders;
    this.sliceRegions = sliceRegions;

    this.sliceBordersVector = sliceBordersVector;
    this.sliceRegionsVector = sliceRegionsVector;
  }

  /**
   * Called before each render frame to update the element's dimensions for nine-slice scaling.
   * Updates the world dimensions (z, w components) based on current width, height, and micro scaling.
   * @param renderer - The WebGL renderer
   * @param deltaTime - Time since last frame in seconds
   */
  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (
      this.color.dirty ||
      this.sliceBorders.dirty ||
      this.sliceRegions.dirty
    ) {
      this.sliceBorders.toVector4(this.sliceBordersVector);
      this.sliceRegions.toVector4(this.sliceRegionsVector);

      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: this.texture.texture,
        textureTransform: this.texture.calculateTransform(
          this.textureTransform,
        ),
        color: this.color,
        sliceBorders: this.sliceRegionsVector,
        sliceRegions: this.sliceRegionsVector,
      });

      this.color.setDirtyFalse();
      this.sliceBorders.setDirtyFalse();
      this.sliceRegions.setDirtyFalse();
    }

    super.onWillRender(renderer, deltaTime);
  }
}
