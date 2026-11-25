import type { Texture } from "three";

import type { UIDummy } from "../../elements/UIDummy/UIDummy.js";
import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { assertNotDestroyed, assertValidNonNegativeNumber, assertValidNumber } from "../asserts.js";
import { UIInsets } from "../insets/UIInsets.js";
import { MASK_EMPTY_OFFSET } from "./UIMask.Internal.js";
import { UIMask } from "./UIMask.js";
import type { UIShapeMaskOptions } from "./UIShapeMask.Internal.js";
import {
  computeMaskDistance,
  SHAPE_MASK_DATA_MODE_OFFSET,
  SHAPE_MASK_DATA_ROW0_OFFSET,
  SHAPE_MASK_DATA_ROW1_OFFSET,
  SHAPE_MASK_DATA_SHAPE_OFFSET,
  SHAPE_MASK_DEFAULT_CLIP_INPUT,
  SHAPE_MASK_DEFAULT_RADIUS,
  SHAPE_MASK_DEFAULT_SHAPE,
  SHAPE_MASK_DEFAULT_SOFTNESS,
  SHAPE_MASK_PROGRAM,
  UIMaskShape,
} from "./UIShapeMask.Internal.js";

/**
 * Analytic mask: a rectangle, rounded or not, or an ellipse cut out of the rectangle of the
 * source. Edges can be soft, and with `clipInput` the masked part of an element stops catching
 * input as well.
 */
export class UIShapeMask extends UIMask {
  /** Insets shrinking the source rectangle, in world units */
  public readonly padding: UIInsets;

  private shapeInternal: UIMaskShape;
  private radiusInternal: number;
  private softnessInternal: number;
  private clipInputInternal: boolean;

  /**
   * Creates a new UIShapeMask instance.
   *
   * @param source - Element or layer whose rectangle the mask follows
   * @param options - Configuration options
   * @throws If the source is destroyed
   */
  constructor(source: UIDummy | UILayer, options: Partial<UIShapeMaskOptions> = {}) {
    const radius = options.radius ?? SHAPE_MASK_DEFAULT_RADIUS;
    const softness = options.softness ?? SHAPE_MASK_DEFAULT_SOFTNESS;
    assertValidNonNegativeNumber(radius, "UIShapeMask.constructor.options.radius");
    assertValidNonNegativeNumber(softness, "UIShapeMask.constructor.options.softness");

    super(source, SHAPE_MASK_PROGRAM, options);

    this.padding = new UIInsets(options.padding);
    this.shapeInternal = options.shape ?? SHAPE_MASK_DEFAULT_SHAPE;
    this.radiusInternal = radius;
    this.softnessInternal = softness;
    this.clipInputInternal = options.clipInput ?? SHAPE_MASK_DEFAULT_CLIP_INPUT;
  }

  /** Shape cut out of the source rectangle */
  public get shape(): UIMaskShape {
    return this.shapeInternal;
  }

  /** Corner radius of RECTANGLE in world units */
  public get radius(): number {
    return this.radiusInternal;
  }

  /** Width of the soft edge in world units, laid inside the shape */
  public get softness(): number {
    return this.softnessInternal;
  }

  /** Whether masked elements also stop catching input outside the visible part */
  public get clipInput(): boolean {
    return this.clipInputInternal;
  }

  /** Shape cut out of the source rectangle */
  public set shape(value: UIMaskShape) {
    assertNotDestroyed(this, "mask", "UIShapeMask.shape");
    this.shapeInternal = value;
  }

  /** Corner radius of RECTANGLE in world units */
  public set radius(value: number) {
    assertNotDestroyed(this, "mask", "UIShapeMask.radius");
    assertValidNonNegativeNumber(value, "UIShapeMask.radius");
    this.radiusInternal = value;
  }

  /** Width of the soft edge in world units, laid inside the shape */
  public set softness(value: number) {
    assertNotDestroyed(this, "mask", "UIShapeMask.softness");
    assertValidNonNegativeNumber(value, "UIShapeMask.softness");
    this.softnessInternal = value;
  }

  /** Whether masked elements also stop catching input outside the visible part */
  public set clipInput(value: boolean) {
    assertNotDestroyed(this, "mask", "UIShapeMask.clipInput");
    this.clipInputInternal = value;
  }

  /**
   * Whether a point is in the visible part of the mask; the boundary is the shape itself,
   * without the soft edge.
   * @param x X in layer coordinates
   * @param y Y in layer coordinates
   * @throws If the mask is destroyed
   */
  public containsPoint(x: number, y: number): boolean {
    assertNotDestroyed(this, "mask", "UIShapeMask.containsPoint");
    assertValidNumber(x, "UIShapeMask.containsPoint.x");
    assertValidNumber(y, "UIShapeMask.containsPoint.y");

    this.resolve();
    const data = this.data;
    const localX =
      data[SHAPE_MASK_DATA_ROW0_OFFSET] * x +
      data[SHAPE_MASK_DATA_ROW0_OFFSET + 1] * y +
      data[SHAPE_MASK_DATA_ROW0_OFFSET + 2];
    const localY =
      data[SHAPE_MASK_DATA_ROW1_OFFSET] * x +
      data[SHAPE_MASK_DATA_ROW1_OFFSET + 1] * y +
      data[SHAPE_MASK_DATA_ROW1_OFFSET + 2];

    const inside =
      computeMaskDistance(
        localX,
        localY,
        data[SHAPE_MASK_DATA_SHAPE_OFFSET],
        data[SHAPE_MASK_DATA_SHAPE_OFFSET + 1],
        data[SHAPE_MASK_DATA_SHAPE_OFFSET + 2],
        this.shapeInternal,
      ) <= 0;

    return inside !== this.inverted;
  }

  /** @internal */
  public override acceptsInputAt(x: number, y: number): boolean {
    return !this.clipInputInternal || this.containsPoint(x, y);
  }

  protected computeData(data: Float32Array): Texture | null {
    data[SHAPE_MASK_DATA_SHAPE_OFFSET + 3] = this.softnessInternal;
    data[SHAPE_MASK_DATA_MODE_OFFSET] =
      (this.shapeInternal === UIMaskShape.ELLIPSE ? 1 : 0) + (this.inverted ? 2 : 0);

    const frame = this.computeSourceFrame();
    // A source collapsed by the layout has no area, so nothing is inside and everything outside
    if (frame === null) {
      data.fill(0, 0, SHAPE_MASK_DATA_SHAPE_OFFSET + 3);
      data[SHAPE_MASK_DATA_ROW0_OFFSET + 2] = MASK_EMPTY_OFFSET;
      data[SHAPE_MASK_DATA_ROW1_OFFSET + 2] = MASK_EMPTY_OFFSET;
      return null;
    }

    const { originX, originY, axisXx, axisXy, axisYx, axisYy } = frame;
    const width = this.source.width;
    const height = this.source.height;

    // The padded rectangle in the unit space of the source, so that micro scale applies to it
    const u0 = this.padding.left / width;
    const u1 = 1 - this.padding.right / width;
    const v0 = this.padding.bottom / height;
    const v1 = 1 - this.padding.top / height;
    const centerU = (u0 + u1) / 2;
    const centerV = (v0 + v1) / 2;

    const lengthX = Math.hypot(axisXx, axisXy);
    const lengthY = Math.hypot(axisYx, axisYy);
    const halfWidth = Math.max(0, (u1 - u0) / 2) * lengthX;
    const halfHeight = Math.max(0, (v1 - v0) / 2) * lengthY;

    const centerX = originX + centerU * axisXx + centerV * axisYx;
    const centerY = originY + centerU * axisXy + centerV * axisYy;

    // Micro only rotates and scales, so the axes stay perpendicular; a zero axis is degenerate
    const unitXx = lengthX > 0 ? axisXx / lengthX : 1;
    const unitXy = lengthX > 0 ? axisXy / lengthX : 0;
    const unitYx = lengthY > 0 ? axisYx / lengthY : 0;
    const unitYy = lengthY > 0 ? axisYy / lengthY : 1;

    data[SHAPE_MASK_DATA_ROW0_OFFSET] = unitXx;
    data[SHAPE_MASK_DATA_ROW0_OFFSET + 1] = unitXy;
    data[SHAPE_MASK_DATA_ROW0_OFFSET + 2] = -(centerX * unitXx + centerY * unitXy);
    data[SHAPE_MASK_DATA_ROW1_OFFSET] = unitYx;
    data[SHAPE_MASK_DATA_ROW1_OFFSET + 1] = unitYy;
    data[SHAPE_MASK_DATA_ROW1_OFFSET + 2] = -(centerX * unitYx + centerY * unitYy);
    data[SHAPE_MASK_DATA_SHAPE_OFFSET] = halfWidth;
    data[SHAPE_MASK_DATA_SHAPE_OFFSET + 1] = halfHeight;
    data[SHAPE_MASK_DATA_SHAPE_OFFSET + 2] = Math.min(this.radiusInternal, halfWidth, halfHeight);
    return null;
  }
}
