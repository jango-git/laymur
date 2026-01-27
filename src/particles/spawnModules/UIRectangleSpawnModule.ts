import { MathUtils, Vector2 } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UISpawnModule } from "./UISpawnModule";

export class UIRectangleSpawnModule extends UISpawnModule<{ position: "Vector2" }> {
  public readonly requiredProperties = { position: "Vector2" } as const;

  constructor(
    private readonly min: Vector2Like,
    private readonly max: Vector2Like,
  ) {
    super();
  }

  public spawn(): { position: Vector2 } {
    return {
      position: new Vector2(
        MathUtils.randFloat(this.min.x, this.max.x),
        MathUtils.randFloat(this.min.y, this.max.y),
      ),
    };
  }
}
