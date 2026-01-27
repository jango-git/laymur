import { Vector2 } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UISpawnModule } from "./UISpawnModule";

export class UIPointSpawnModule extends UISpawnModule<{ position: "Vector2" }> {
  public readonly requiredProperties = { position: "Vector2" } as const;

  constructor(private readonly offset: Vector2Like) {
    super();
  }

  public spawn(): { position: Vector2 } {
    return { position: new Vector2(this.offset.x, this.offset.y) };
  }
}
