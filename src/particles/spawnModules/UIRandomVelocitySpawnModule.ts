import { MathUtils, Vector2 } from "three";
import { UISpawnModule } from "./UISpawnModule";

export class UIRandomVelocitySpawnModule extends UISpawnModule<{ velocity: "Vector2" }> {
  public readonly requiredProperties = { velocity: "Vector2" } as const;

  constructor(
    private readonly angle: { min: number; max: number },
    private readonly magnitude: { min: number; max: number },
  ) {
    super();
  }

  public spawn(): { velocity: Vector2 } {
    const angle = MathUtils.randFloat(this.angle.min, this.angle.max);
    const magnitude = MathUtils.randFloat(this.magnitude.min, this.magnitude.max);
    return { velocity: new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude) };
  }
}
