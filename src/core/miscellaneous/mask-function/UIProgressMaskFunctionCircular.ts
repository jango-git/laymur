import source from "../../shaders/UIProgressMaskFunctionCircular.js";
import { assertValidNumber } from "../asserts.js";
import type { UIProperty } from "../generic-plane/shared.js";
import { UIProgressMaskFunction } from "./UIProgressMaskFunction.js";

/**
 * Circular radial progress fill. Angles are in radians, measured counter-clockwise from the
 * positive x axis, so 0 is the right edge and PI / 2 is the top.
 */
export class UIProgressMaskFunctionCircular extends UIProgressMaskFunction {
  private startAngleInternal: number;
  private inverseDirectionInternal: boolean;

  /**
   * Creates circular mask function.
   *
   * @param startAngle - Angle the fill starts from, in radians
   * @param inverseDirection - Whether to fill clockwise instead of counter-clockwise
   */
  constructor(startAngle = 0, inverseDirection = false) {
    assertValidNumber(startAngle, "UIProgressMaskFunctionCircular.constructor.startAngle");
    super(source);
    this.startAngleInternal = startAngle;
    this.inverseDirectionInternal = inverseDirection;
  }

  /** Angle the fill starts from, in radians */
  public get startAngle(): number {
    return this.startAngleInternal;
  }

  /** Whether the fill goes clockwise instead of counter-clockwise */
  public get inverseDirection(): boolean {
    return this.inverseDirectionInternal;
  }

  /** Angle the fill starts from, in radians */
  public set startAngle(value: number) {
    assertValidNumber(value, "UIProgressMaskFunctionCircular.startAngle");
    if (this.startAngleInternal !== value) {
      this.startAngleInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Whether the fill goes clockwise instead of counter-clockwise */
  public set inverseDirection(value: boolean) {
    if (this.inverseDirectionInternal !== value) {
      this.inverseDirectionInternal = value;
      this.dirtyInternal = true;
    }
  }

  public enumerateProperties(): Record<string, UIProperty> {
    return {
      direction: this.inverseDirectionInternal ? -1 : 1,
      startAngle: this.startAngleInternal / (2 * Math.PI),
    };
  }
}
