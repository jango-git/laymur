import source from "../../shaders/UIProgressMaskFunctionCircular.glsl";
import type { UIPropertyType } from "../generic-plane/shared";
import { UIProgressMaskFunction } from "./UIProgressMaskFunction";

export class UIProgressMaskFunctionCircular extends UIProgressMaskFunction {
  private startAngleInternal: number;
  private inverseDirectionInternal: boolean;

  constructor(startAngle = 0, inverseDirection = false) {
    super(source);
    this.startAngleInternal = startAngle;
    this.inverseDirectionInternal = inverseDirection;
  }

  public get startAngle(): number {
    return this.startAngleInternal;
  }

  public get inverseDirection(): boolean {
    return this.inverseDirectionInternal;
  }

  public set startAngle(value: number) {
    if (this.startAngleInternal !== value) {
      this.startAngleInternal = value;
      this.dirtyInternal = true;
    }
  }

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
