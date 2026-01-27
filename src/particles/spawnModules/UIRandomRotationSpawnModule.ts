import { MathUtils } from "three";
import { UISpawnModule } from "./UISpawnModule";

export class UIRandomRotationSpawnModule extends UISpawnModule<{ rotation: "number" }> {
  public requiredProperties = { rotation: "number" } as const;

  constructor(private readonly rotation: { min: number; max: number }) {
    super();
  }

  public override spawn(): { rotation: number } {
    return { rotation: MathUtils.randFloat(this.rotation.min, this.rotation.max) };
  }
}
