import { Matrix4 } from "three";
import type { UIDummy } from "../../elements/UIDummy/UIDummy.js";
import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { assertValidNonNegativeNumber, assertValidNumber } from "../asserts.js";
import { UIInsets } from "../insets/UIInsets.js";
import type { UIMaskOptions } from "./UIMask.Internal.js";
import {
  computeMaskDistance,
  MASK_DATA_MODE_OFFSET,
  MASK_DATA_ROW0_OFFSET,
  MASK_DATA_ROW1_OFFSET,
  MASK_DATA_SHAPE_OFFSET,
  MASK_DATA_SIZE,
  MASK_DEFAULT_CLIP_INPUT,
  MASK_DEFAULT_INVERTED,
  MASK_DEFAULT_RADIUS,
  MASK_DEFAULT_SHAPE,
  MASK_DEFAULT_SOFTNESS,
  MASK_DEFAULT_USE_MICRO,
  MASK_EMPTY_OFFSET,
  UIMaskShape,
} from "./UIMask.Internal.js";

const TEMP_TRANSFORM = new Matrix4();
const TEMP_DATA = new Float32Array(MASK_DATA_SIZE);

/**
 * Tells an element from a layer without importing UIDummy as a value, which would also fail
 * for an element of another copy of laymur
 */
function isElementSource(source: UIDummy | UILayer): source is UIDummy {
  return "computeVisualTransform" in source;
}

/**
 * Analytic mask that follows the rectangle of a source element or layer.
 *
 * Elements are masked by assigning the mask to their `mask` property; one mask can serve any
 * number of elements of the same layer. The mask is computed in the shader, so edges can be
 * soft, masked elements keep batching together and no stencil buffer is needed. With
 * `clipInput` the masked part of an element stops catching input as well.
 *
 * Lifetime follows the rules of constraints: destroying the source destroys the mask, and a
 * destroyed mask is taken off every element it masked.
 */
export class UIMask {
  /** Insets shrinking the source rectangle, in world units */
  public readonly padding: UIInsets;

  /** Layer of the source; only elements of this layer can use the mask */
  public readonly layer: UILayer;

  private shapeInternal: UIMaskShape;
  private radiusInternal: number;
  private softnessInternal: number;
  private invertedInternal: boolean;
  private useMicroInternal: boolean;
  private clipInputInternal: boolean;

  private readonly consumers = new Set<UIDummy>();
  private readonly dataInternal = new Float32Array(MASK_DATA_SIZE);
  private versionInternal = 0;
  private destroyedInternal = false;

  /**
   * Creates a new UIMask instance.
   *
   * @param source - Element or layer whose rectangle the mask follows
   * @param options - Configuration options
   * @throws If the source is destroyed
   */
  constructor(
    public readonly source: UIDummy | UILayer,
    options: Partial<UIMaskOptions> = {},
  ) {
    if (source.destroyed) {
      throw new Error(`UIMask.constructor.source: source is destroyed`);
    }

    const radius = options.radius ?? MASK_DEFAULT_RADIUS;
    const softness = options.softness ?? MASK_DEFAULT_SOFTNESS;
    assertValidNonNegativeNumber(radius, "UIMask.constructor.options.radius");
    assertValidNonNegativeNumber(softness, "UIMask.constructor.options.softness");

    this.layer = isElementSource(source) ? source.layer : source;
    this.padding = new UIInsets(options.padding);
    this.shapeInternal = options.shape ?? MASK_DEFAULT_SHAPE;
    this.radiusInternal = radius;
    this.softnessInternal = softness;
    this.invertedInternal = options.inverted ?? MASK_DEFAULT_INVERTED;
    this.useMicroInternal = options.useMicro ?? MASK_DEFAULT_USE_MICRO;
    this.clipInputInternal = options.clipInput ?? MASK_DEFAULT_CLIP_INPUT;

    this.layer.addMask(this);
  }

  /** Whether the mask is destroyed, by its own `destroy` or together with its source */
  public get destroyed(): boolean {
    return this.destroyedInternal;
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

  /** Whether the mask keeps the outside of the shape instead of the inside */
  public get inverted(): boolean {
    return this.invertedInternal;
  }

  /** Whether the micro transform of the source moves the mask */
  public get useMicro(): boolean {
    return this.useMicroInternal;
  }

  /** Whether masked elements also stop catching input outside the visible part */
  public get clipInput(): boolean {
    return this.clipInputInternal;
  }

  /** Elements masked by this mask */
  public get elements(): readonly UIDummy[] {
    return [...this.consumers];
  }

  /**
   * Incremented whenever the packed data changes.
   * @internal
   */
  public get version(): number {
    return this.versionInternal;
  }

  /**
   * Packed mask data, see MASK_DATA_SIZE; valid after {@link resolve}.
   * @internal
   */
  public get data(): Readonly<Float32Array> {
    return this.dataInternal;
  }

  /** Shape cut out of the source rectangle */
  public set shape(value: UIMaskShape) {
    this.assertNotDestroyed("UIMask.shape");
    this.shapeInternal = value;
  }

  /** Corner radius of RECTANGLE in world units */
  public set radius(value: number) {
    this.assertNotDestroyed("UIMask.radius");
    assertValidNonNegativeNumber(value, "UIMask.radius");
    this.radiusInternal = value;
  }

  /** Width of the soft edge in world units, laid inside the shape */
  public set softness(value: number) {
    this.assertNotDestroyed("UIMask.softness");
    assertValidNonNegativeNumber(value, "UIMask.softness");
    this.softnessInternal = value;
  }

  /** Whether the mask keeps the outside of the shape instead of the inside */
  public set inverted(value: boolean) {
    this.assertNotDestroyed("UIMask.inverted");
    this.invertedInternal = value;
  }

  /** Whether the micro transform of the source moves the mask */
  public set useMicro(value: boolean) {
    this.assertNotDestroyed("UIMask.useMicro");
    this.useMicroInternal = value;
  }

  /** Whether masked elements also stop catching input outside the visible part */
  public set clipInput(value: boolean) {
    this.assertNotDestroyed("UIMask.clipInput");
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
    this.assertNotDestroyed("UIMask.containsPoint");
    assertValidNumber(x, "UIMask.containsPoint.x");
    assertValidNumber(y, "UIMask.containsPoint.y");

    this.resolve();
    const data = this.dataInternal;
    const localX =
      data[MASK_DATA_ROW0_OFFSET] * x +
      data[MASK_DATA_ROW0_OFFSET + 1] * y +
      data[MASK_DATA_ROW0_OFFSET + 2];
    const localY =
      data[MASK_DATA_ROW1_OFFSET] * x +
      data[MASK_DATA_ROW1_OFFSET + 1] * y +
      data[MASK_DATA_ROW1_OFFSET + 2];

    const inside =
      computeMaskDistance(
        localX,
        localY,
        data[MASK_DATA_SHAPE_OFFSET],
        data[MASK_DATA_SHAPE_OFFSET + 1],
        data[MASK_DATA_SHAPE_OFFSET + 2],
        this.shapeInternal,
      ) <= 0;

    return inside !== this.invertedInternal;
  }

  /**
   * Takes the mask off every element and removes it from its layer.
   * Does nothing if the mask is already destroyed.
   */
  public destroy(): void {
    if (this.destroyedInternal) {
      return;
    }
    this.destroyedInternal = true;

    for (const consumer of [...this.consumers]) {
      consumer.releaseMask(this);
    }
    this.consumers.clear();
    this.layer.removeMask(this);
  }

  /**
   * Brings the packed data up to date with the source, bumping the version on a change. Cheap
   * enough to be done by every masked element every frame, so it is never a frame late.
   * @internal
   */
  public resolve(): void {
    const data = TEMP_DATA;
    this.computeData(data);

    for (let i = 0; i < MASK_DATA_SIZE; i++) {
      if (!Object.is(this.dataInternal[i], data[i])) {
        this.dataInternal.set(data);
        this.versionInternal++;
        return;
      }
    }
  }

  /** @internal */
  public attach(consumer: UIDummy): void {
    this.consumers.add(consumer);
  }

  /** @internal */
  public detach(consumer: UIDummy): void {
    this.consumers.delete(consumer);
  }

  private computeData(data: Float32Array): void {
    const source = this.source;
    const width = source.width;
    const height = source.height;

    data[MASK_DATA_SHAPE_OFFSET + 3] = this.softnessInternal;
    data[MASK_DATA_MODE_OFFSET] =
      (this.shapeInternal === UIMaskShape.ELLIPSE ? 1 : 0) + (this.invertedInternal ? 2 : 0);

    // A source collapsed by the layout has no area: nothing is inside, everything is outside
    if (!(width > 0 && height > 0)) {
      data.fill(0, 0, MASK_DATA_SHAPE_OFFSET + 3);
      data[MASK_DATA_ROW0_OFFSET + 2] = MASK_EMPTY_OFFSET;
      data[MASK_DATA_ROW1_OFFSET + 2] = MASK_EMPTY_OFFSET;
      return;
    }

    let originX: number;
    let originY: number;
    let axisXx: number;
    let axisXy: number;
    let axisYx: number;
    let axisYy: number;

    if (isElementSource(source)) {
      const e = source.computeVisualTransform(this.useMicroInternal, TEMP_TRANSFORM).elements;
      axisXx = e[0];
      axisXy = e[1];
      axisYx = e[4];
      axisYy = e[5];
      originX = e[12];
      originY = e[13];
    } else {
      axisXx = width;
      axisXy = 0;
      axisYx = 0;
      axisYy = height;
      originX = source.x;
      originY = source.y;
    }

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

    data[MASK_DATA_ROW0_OFFSET] = unitXx;
    data[MASK_DATA_ROW0_OFFSET + 1] = unitXy;
    data[MASK_DATA_ROW0_OFFSET + 2] = -(centerX * unitXx + centerY * unitXy);
    data[MASK_DATA_ROW1_OFFSET] = unitYx;
    data[MASK_DATA_ROW1_OFFSET + 1] = unitYy;
    data[MASK_DATA_ROW1_OFFSET + 2] = -(centerX * unitYx + centerY * unitYy);
    data[MASK_DATA_SHAPE_OFFSET] = halfWidth;
    data[MASK_DATA_SHAPE_OFFSET + 1] = halfHeight;
    data[MASK_DATA_SHAPE_OFFSET + 2] = Math.min(this.radiusInternal, halfWidth, halfHeight);
  }

  private assertNotDestroyed(subject: string): void {
    if (this.destroyedInternal) {
      throw new Error(`${subject}: mask is destroyed`);
    }
  }
}
