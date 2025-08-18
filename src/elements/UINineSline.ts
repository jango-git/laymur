import type { Texture } from "three";
import { Mesh } from "three";
import { UILayerEvent, type UILayer } from "../layers/UILayer";
import { UINineSliceMaterial } from "../materials/UINineSliceMaterial";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { geometry } from "../miscellaneous/threeInstances";
import {
  resolveNineSliceBorder,
  type UINineSliceBorder,
} from "../miscellaneous/UINineSliceBorder";
import { UIElement } from "./UIElement";

/**
 * Configuration options for creating a UINineSlice element.
 */
export interface UINineSliceOptions {
  /** Nine-slice border configuration (can be number, object with horizontal/vertical, or full border object) */
  sliceBorder: UINineSliceBorder;
  /** X position of the element */
  x: number;
  /** Y position of the element */
  y: number;
}

/**
 * Nine-slice UI element for scalable images with preserved border regions.
 *
 * Nine-slice scaling divides an image into 9 regions: 4 corners, 4 edges, and 1 center.
 * The corners maintain their original size, edges scale in one dimension, and the center
 * scales in both dimensions. This technique is commonly used for creating scalable UI
 * panels, buttons, and borders that maintain visual quality at any size.
 */
export class UINineSlice extends UIElement<Mesh> {
  private readonly material: UINineSliceMaterial;
  private readonly textureInternal: Texture;

  /**
   * Creates a new nine-slice UI element.
   *
   * @param layer - The UI layer to add this element to
   * @param texture - The texture to use for nine-slice rendering
   * @param options - Configuration options for the nine-slice element
   */
  constructor(
    layer: UILayer,
    texture: Texture,
    options: Partial<UINineSliceOptions> = {},
  ) {
    const w = texture.image.width;
    const h = texture.image.height;

    const material = new UINineSliceMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, options.x ?? 0, options.y ?? 0, w, h, object);
    this.layer.on(UILayerEvent.WILL_RENDER, this.onWillRenderInternal);

    this.material = material;
    this.textureInternal = texture;

    const sliceBorder = resolveNineSliceBorder(options.sliceBorder);
    this.material.setSliceBorder(
      sliceBorder.left,
      sliceBorder.right,
      sliceBorder.top,
      sliceBorder.bottom,
    );
  }

  /**
   * Gets the left border size for nine-slice scaling.
   * @returns The left border size in texture UV coordinates
   */
  public get sliceBorderLeft(): number {
    return this.material.getSliceBorderLeft();
  }

  /**
   * Gets the right border size for nine-slice scaling.
   * @returns The right border size in texture UV coordinates
   */
  public get sliceBorderRight(): number {
    return this.material.getSliceBorderRight();
  }

  /**
   * Gets the top border size for nine-slice scaling.
   * @returns The top border size in texture UV coordinates
   */
  public get sliceBorderTop(): number {
    return this.material.getSliceBorderTop();
  }

  /**
   * Gets the bottom border size for nine-slice scaling.
   * @returns The bottom border size in texture UV coordinates
   */
  public get sliceBorderBottom(): number {
    return this.material.getSliceBorderBottom();
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
   * Sets the left border size for nine-slice scaling.
   * @param value - The left border size in texture UV coordinates
   */
  public set sliceBorderLeft(value: number) {
    this.material.setSliceBorderLeft(value);
  }

  /**
   * Sets the right border size for nine-slice scaling.
   * @param value - The right border size in texture UV coordinates
   */
  public set sliceBorderRight(value: number) {
    this.material.setSliceBorderRight(value);
  }

  /**
   * Sets the top border size for nine-slice scaling.
   * @param value - The top border size in texture UV coordinates
   */
  public set sliceBorderTop(value: number) {
    this.material.setSliceBorderTop(value);
  }

  /**
   * Sets the bottom border size for nine-slice scaling.
   * @param value - The bottom border size in texture UV coordinates
   */
  public set sliceBorderBottom(value: number) {
    this.material.setSliceBorderBottom(value);
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

    assertValidPositiveNumber(width, "UINineSlice texture width");
    assertValidPositiveNumber(height, "UINineSlice texture height");

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
   * Sets all four border sizes for nine-slice scaling at once.
   *
   * @param left - The left border size in texture UV coordinates
   * @param right - The right border size in texture UV coordinates
   * @param top - The top border size in texture UV coordinates
   * @param bottom - The bottom border size in texture UV coordinates
   */
  public setSliceBorders(
    left: number,
    right: number,
    top: number,
    bottom: number,
  ): void {
    this.material.setSliceBorder(left, right, top, bottom);
  }

  /**
   * Destroys the nine-slice element and cleans up resources.
   *
   * This method removes event listeners, disposes of the material,
   * and calls the parent destroy method.
   */
  public override destroy(): void {
    this.layer.off(UILayerEvent.WILL_RENDER, this.onWillRenderInternal);
    this.material.dispose();
    super.destroy();
  }

  /**
   * Internal render callback that updates the material's quad size.
   * This ensures the nine-slice scaling works correctly with micro transformations.
   */
  private readonly onWillRenderInternal = (): void => {
    this.material.setQuadSize(
      this.width * this.micro.scaleX,
      this.height * this.micro.scaleY,
    );
  };
}
