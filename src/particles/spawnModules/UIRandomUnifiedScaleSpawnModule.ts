import { MathUtils, Vector2 } from "three";
import { UISpawnModule } from "./UISpawnModule";

export class UIRandomUnifiedScaleSpawnModule extends UISpawnModule<{ scale: "Vector2" }> {
  public requiredProperties = { scale: "Vector2" } as const;

  constructor(
    private readonly scale: { min: number; max: number },
    private readonly aspect = 1,
  ) {
    super();
  }

  public override spawn(): { scale: Vector2 } {
    const scale = MathUtils.randFloat(this.scale.min, this.scale.max);
    return { scale: new Vector2(scale * this.aspect, scale) };
  }
}
