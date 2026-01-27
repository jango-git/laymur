import { MathUtils, Vector2 } from "three";
import { UISpawnModule } from "./UISpawnModule";

export class UIRandomLifetimeSpawnModule extends UISpawnModule<{ lifetime: "Vector2" }> {
  public override requiredProperties = { lifetime: "Vector2" } as const;

  constructor(private readonly lifetime: { min: number; max: number }) {
    super();
  }

  public override spawn(): { lifetime: Vector2 } {
    return { lifetime: new Vector2(MathUtils.randFloat(this.lifetime.min, this.lifetime.max), 0) };
  }
}
