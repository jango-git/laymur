import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import type { UIRange } from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomRotation extends UISpawnModule<{ rotation: "number" }> {
  /** @internal */
  public requiredProperties = { rotation: "number" } as const;

  constructor(public readonly rotation: UIRange = { min: -Math.PI, max: Math.PI }) {
    super();
  }

  /** @internal */
  public spawn(
    properties: { rotation: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const rotationBuffer = properties.rotation;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * rotationBuffer.itemSize;
      rotationBuffer.array[itemOffset] = MathUtils.randFloat(this.rotation.min, this.rotation.max);
    }

    rotationBuffer.needsUpdate = true;
  }
}
