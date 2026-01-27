import { MathUtils, Vector2 } from "three";
import { UISpawnModule } from "./UISpawnModule";

export class UIRandomVelocitySpawnModule extends UISpawnModule<{ linearVelocity: "Vector2" }> {
  public readonly requiredProperties = { linearVelocity: "Vector2" } as const;

  constructor(
    private readonly angle: { min: number; max: number },
    private readonly magnitude: { min: number; max: number },
  ) {
    super();
  }

  public spawn(): { linearVelocity: Vector2 } {
    const angle = MathUtils.randFloat(this.angle.min, this.angle.max);
    const magnitude = MathUtils.randFloat(this.magnitude.min, this.magnitude.max);
    return {
      linearVelocity: new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude),
    };
  }
}
