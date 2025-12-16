import source from "../../shaders/UIProgressMaskFunctionCircular.glsl";
import type { UIPropertyType } from "../generic-plane/shared";
import { UIProgressMaskFunction } from "./UIProgressMaskFunction";

/** Circular radial progress fill */
export class UIProgressMaskFunctionCircular extends UIProgressMaskFunction {
  private startAngleInternal: number;
  private inverseDirectionInternal: boolean;

  /**
   * Creates circular mask function.
   *
   * @param startAngle - Starting angle in radians
   * @param inverseDirection - Whether to fill counter-clockwise
   */
  constructor(startAngle = 0, inverseDirection = false) {
    super(source);
    this.startAngleInternal = startAngle;
    this.inverseDirectionInternal = inverseDirection;
  }

  /** Starting angle in radians */
  public get startAngle(): number {
    return this.startAngleInternal;
  }

  /** Whether fill is counter-clockwise */
  public get inverseDirection(): boolean {
    return this.inverseDirectionInternal;
  }

  /** Starting angle in radians */
  public set startAngle(value: number) {
    if (this.startAngleInternal !== value) {
      this.startAngleInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Whether fill is counter-clockwise */
  public set inverseDirection(value: boolean) {
    if (this.inverseDirectionInternal !== value) {
      this.inverseDirectionInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** @internal */
  public enumerateProperties(): Record<string, UIPropertyType> {
    return {
      direction: this.inverseDirectionInternal ? -1 : 1,
      startAngle: this.startAngleInternal,
    };
  }
}
