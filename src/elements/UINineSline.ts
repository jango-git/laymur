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
 *
 * @public
 */
export interface UINineSliceOptions {
  /** X position of the element */
  x: number;
  /** Y position of the element */
  y: number;
  /** Color tint applied to the nine-slice element */
  color: UIColor;
  /** Nine-slice border configuration (can be number, object with horizontal/vertical, or full border object) */
  sliceBorders: UINineSliceBorders;
}

/**
 * Nine-slice UI element that scales textures while preserving border regions.
 *
 * Divides a texture into 9 regions where corners keep their size, edges scale in one
 * direction, and the center scales in both directions. Useful for UI panels and buttons
 * that need to resize without distorting their borders.
 *
 * @public
 */
export class UINineSlice extends UIElement {
  /** @internal */
  private readonly textureInternal: Texture;
  /** @internal */
  private readonly colorInternal: UIColor;
  /** @internal */
  private readonly sliceBordersInternal: Vector4;
  /** @internal */
  private readonly dimensions: Vector4;

  /**
   * Creates a nine-slice UI element.
   *
   * @param layer - UI layer to contain this element
   * @param texture - Texture for nine-slice rendering
   * @param options - Configuration options
   * @throws Error when texture dimensions are invalid
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
   * Gets the current texture.
   *
   * @returns Current texture
   */
  public get texture(): Texture {
    return this.textureInternal;
  }

  /**
   * Gets the color tint.
   *
   * @returns Color tint
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Gets the left border size.
   *
   * @returns Border size as percentage (0-1) of texture width
   */
  public get sliceBorderLeft(): number {
    return this.sliceBordersInternal.x;
  }

  /**
   * Gets the right border size.
   *
   * @returns Border size as percentage (0-1) of texture width
   */
  public get sliceBorderRight(): number {
    return this.sliceBordersInternal.y;
  }

  /**
   * Gets the top border size.
   *
   * @returns Border size as percentage (0-1) of texture height
   */
  public get sliceBorderTop(): number {
    return this.sliceBordersInternal.z;
  }

  /**
   * Gets the bottom border size.
   *
   * @returns Border size as percentage (0-1) of texture height
   */
  public get sliceBorderBottom(): number {
    return this.sliceBordersInternal.w;
  }

  /**
   * Sets the texture.
   *
   * Updates internal dimensions while maintaining current world size.
   * Nine-slice borders remain unchanged.
   *
   * @param value - New texture to display
   * @throws Error when texture dimensions are invalid
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
   * Sets the color tint.
   *
   * @param value - Color tint
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Sets the left border size.
   *
   * @param value - Border size as percentage (0-1) of texture width
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
   * Sets the right border size.
   *
   * @param value - Border size as percentage (0-1) of texture width
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
   * Sets the top border size.
   *
   * @param value - Border size as percentage (0-1) of texture height
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
   * Sets the bottom border size.
   *
   * @param value - Border size as percentage (0-1) of texture height
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
   * Sets all four border sizes.
   *
   * @param left - Left border size (0-1)
   * @param right - Right border size (0-1)
   * @param top - Top border size (0-1)
   * @param bottom - Bottom border size (0-1)
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

  /**
   * Destroys the element and cleans up resources.
   */
  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    super.destroy();
  }

  /**
   * Updates dimensions before rendering.
   *
   * @param renderer - WebGL renderer
   * @param deltaTime - Time since last frame
   * @internal
   */
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

  /** @internal */
  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };
}
