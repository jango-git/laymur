import type { Texture, WebGLRenderer } from "three";
import { Vector4 } from "three";
import { type UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor } from "../miscellaneous/color/UIColor";
import type { UIBorderConfig } from "../miscellaneous/UIBorder";
import { UIBorder } from "../miscellaneous/UIBorder";
import type { UIElementCommonOptions } from "../miscellaneous/UIElementCommonOptions";
import source from "../shaders/UINineSlice.glsl";
import { UIElement } from "./UIElement";

/**
 * Configuration options for creating a UINineSlice element.
 */
export interface UINineSliceOptions extends UIElementCommonOptions {
  sliceBorders: UIBorderConfig;
  sliceRegions: UIBorderConfig;
}

/**
 * Nine-slice UI element for scalable images with preserved border regions.
 *
 * Nine-slice scaling divides an image into 9 regions: 4 corners, 4 edges, and 1 center.
 * The corners maintain their original size, edges scale in one dimension, and the center
 * scales in both dimensions. This technique is commonly used for creating scalable UI
 * panels, buttons, and borders that maintain visual quality at any size.
 */
export class UINineSlice extends UIElement {
  public readonly color: UIColor;
  public readonly sliceBorders: UIBorder;
  public readonly sliceRegions: UIBorder;

  private textureInternal: Texture;
  private textureInternalDirty = false;

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
    texture: Texture,
    options: Partial<UINineSliceOptions> = {},
  ) {
    const w = options.width ?? texture.image.width;
    const h = options.height ?? texture.image.height;

    const color = new UIColor(options.color);

    const sliceBorders = new UIBorder(options.sliceBorders ?? 0.1);
    const sliceRegions = new UIBorder(options.sliceRegions ?? 0.1);

    const sliceBordersVector = sliceBorders.toVector4();
    const sliceRegionsVector = sliceRegions.toVector4();

    super(layer, options.x ?? 0, options.y ?? 0, w, h, source, {
      texture: texture,
      textureTransform: texture.matrix,
      color,
      sliceBorders: sliceBordersVector,
      sliceRegions: sliceRegionsVector,
    });

    this.textureInternal = texture;
    this.color = color;
    this.mode = options.mode ?? this.mode;

    this.sliceBorders = sliceBorders;
    this.sliceRegions = sliceRegions;

    this.sliceBordersVector = sliceBordersVector;
    this.sliceRegionsVector = sliceRegionsVector;
  }

  /**
   * Gets the current texture being displayed.
   * @returns The current Three.js texture
   */
  public get texture(): Texture {
    return this.textureInternal;
  }

  /**
   * Sets a new texture for the nine-slice element.
   *
   * When setting a new texture, the element will update its internal dimensions
   * but maintain the current world size. The nine-slice borders remain unchanged.
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
      this.textureInternalDirty ||
      this.sliceBorders.dirty ||
      this.sliceRegions.dirty
    ) {
      this.color.dirty = false;
      this.textureInternalDirty = false;
      this.sliceBorders.dirty = false;
      this.sliceRegions.dirty = false;

      this.sliceBorders.toVector4(this.sliceBordersVector);
      this.sliceRegions.toVector4(this.sliceRegionsVector);

      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: this.textureInternal,
        textureTransform: this.textureInternal.matrix,
        color: this.color,
        sliceBorders: this.sliceRegionsVector,
        sliceRegions: this.sliceRegionsVector,
      });
    }

    super.onWillRender(renderer, deltaTime);
  }
}
