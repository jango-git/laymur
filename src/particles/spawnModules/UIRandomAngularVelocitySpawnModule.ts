import { MathUtils } from "three";
import { UISpawnModule } from "./UISpawnModule";

export class UIRandomAngularVelocitySpawnModule extends UISpawnModule<{
  angularVelocity: "number";
}> {
  public readonly requiredProperties = { angularVelocity: "number" } as const;

  constructor(private readonly angularVelocity: { min: number; max: number }) {
    super();
  }

  public spawn(): { angularVelocity: number } {
    return { angularVelocity: MathUtils.randFloat(this.angularVelocity.min, this.angularVelocity.max) };
  }
}
