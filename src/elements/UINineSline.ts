import type { Texture, WebGLRenderer } from "three";
import { Vector4 } from "three";
import { type UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import {
  resolveNineSliceBorders,
  type UINineSliceBorders,
} from "../miscellaneous/UINineSliceBorder";
import source from "../shaders/UINineSliceShader.glsl";
import { UIElement } from "./UIElement";

/**
 * Configuration options for creating a UINineSlice element.
 */
export interface UINineSliceOptions {
  /** X position of the element */
  x: number;
  /** Y position of the element */
  y: number;
  color: UIColor;
  /** Nine-slice border configuration (can be number, object with horizontal/vertical, or full border object) */
  sliceBorders: UINineSliceBorders;
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
  private readonly textureInternal: Texture;
  private readonly colorInternal: UIColor;
  private readonly sliceBordersInternal: Vector4;
  private readonly dimensions: Vector4; //texture pixel size, quad world size

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
    const width = texture.image.width;
    const height = texture.image.height;

    const color = options.color ?? new UIColor();
    const resolvedSliceBorders = resolveNineSliceBorders(options.sliceBorders);
    const sliceBorders = new Vector4(
      resolvedSliceBorders.l,
      resolvedSliceBorders.r,
      resolvedSliceBorders.t,
      resolvedSliceBorders.b,
    );
    const dimensions = new Vector4(width, height, width, height);

    super(layer, options.x ?? 0, options.y ?? 0, width, height, source, {
      map: texture,
      color,
      sliceBorders,
      dimensions,
    });

    this.textureInternal = texture;
    this.colorInternal = color;
    this.sliceBordersInternal = sliceBorders;
    this.dimensions = dimensions;

    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);
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
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Gets the left border size for nine-slice scaling.
   * @returns The left border size in texture UV coordinates
   */
  public get sliceBorderLeft(): number {
    return this.sliceBordersInternal.x;
  }

  /**
   * Gets the right border size for nine-slice scaling.
   * @returns The right border size in texture UV coordinates
   */
  public get sliceBorderRight(): number {
    return this.sliceBordersInternal.y;
  }

  /**
   * Gets the top border size for nine-slice scaling.
   * @returns The top border size in texture UV coordinates
   */
  public get sliceBorderTop(): number {
    return this.sliceBordersInternal.z;
  }

  /**
   * Gets the bottom border size for nine-slice scaling.
   * @returns The bottom border size in texture UV coordinates
   */
  public get sliceBorderBottom(): number {
    return this.sliceBordersInternal.w;
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

    assertValidPositiveNumber(w, "UINineSlice texture width");
    assertValidPositiveNumber(h, "UINineSlice texture height");

    this.solverWrapper.suggestVariableValue(this.wVariable, w);
    this.solverWrapper.suggestVariableValue(this.hVariable, h);

    this.dimensions.x = w;
    this.dimensions.y = h;
    this.sceneWrapper.setUniform(
      this.planeHandler,
      "dimensions",
      this.dimensions,
    );
    this.sceneWrapper.setUniform(this.planeHandler, "map", value);
  }

  /**
   * Sets the color tint applied to the image.
   * @param value - The color value as a number (e.g., 0xFFFFFF for white)
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Sets the left border size for nine-slice scaling.
   * @param value - The left border size in texture UV coordinates
   */
  public set sliceBorderLeft(value: number) {
    this.sliceBordersInternal.x = value;
    this.sceneWrapper.setUniform(
      this.planeHandler,
      "sliceBorders",
      this.sliceBordersInternal,
    );
  }

  /**
   * Sets the right border size for nine-slice scaling.
   * @param value - The right border size in texture UV coordinates
   */
  public set sliceBorderRight(value: number) {
    this.sliceBordersInternal.y = value;
    this.sceneWrapper.setUniform(
      this.planeHandler,
      "sliceBorders",
      this.sliceBordersInternal,
    );
  }

  /**
   * Sets the top border size for nine-slice scaling.
   * @param value - The top border size in texture UV coordinates
   */
  public set sliceBorderTop(value: number) {
    this.sliceBordersInternal.z = value;
    this.sceneWrapper.setUniform(
      this.planeHandler,
      "sliceBorders",
      this.sliceBordersInternal,
    );
  }

  /**
   * Sets the bottom border size for nine-slice scaling.
   * @param value - The bottom border size in texture UV coordinates
   */
  public set sliceBorderBottom(value: number) {
    this.sliceBordersInternal.w = value;
    this.sceneWrapper.setUniform(
      this.planeHandler,
      "sliceBorders",
      this.sliceBordersInternal,
    );
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
    this.sliceBordersInternal.set(left, right, top, bottom);
    this.sceneWrapper.setUniform(
      this.planeHandler,
      "sliceBorders",
      this.sliceBordersInternal,
    );
  }

  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    super.destroy();
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    super.onWillRender(renderer, deltaTime);

    this.dimensions.z = this.width * this.micro.scaleX;
    this.dimensions.w = this.height * this.micro.scaleY;
    this.sceneWrapper.setUniform(
      this.planeHandler,
      "dimensions",
      this.dimensions,
    );
  }

  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };
}
