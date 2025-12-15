import type { UIPropertyType } from "../generic-plane/shared";
import { UIProgressMaskFunction } from "./UIProgressMaskFunction";

const SOURCE = `float calculateMask() {
  float aspect = p_textureResolution.x / p_textureResolution.y;
  vec2 p = (p_uv - 0.5) * vec2(aspect, 1.0);

  float angle = atan(p.y, p.x);
  angle = (angle + PI) / (2.0 * PI);

  float adjusted = angle - p_startAngle;
  adjusted = p_direction > 0.0 ? adjusted : -adjusted;
  adjusted = fract(adjusted);

  return step(adjusted, p_progress);
}`;

export class UIProgressMaskFunctionCircular extends UIProgressMaskFunction {
  private startAngleInternal: number;
  private inverseDirectionInternal: boolean;

  constructor(startAngle = 0, inverseDirection = false) {
    super(SOURCE);
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
