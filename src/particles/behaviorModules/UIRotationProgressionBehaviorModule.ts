import type { InstancedBufferAttribute } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIRotationProgressionBehaviorModule extends UIBehaviorModule<{
  rotation: "number";
  angularVelocity: "number";
}> {
  public readonly requiredProperties = {
    rotation: "number",
    angularVelocity: "number",
  } as const;

  public update(
    properties: {
      rotation: InstancedBufferAttribute;
      angularVelocity: InstancedBufferAttribute;
    },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const rotation = properties.rotation;
    const angularVelocity = properties.angularVelocity;

    for (let i = 0; i < instanceCount; i++) {
      const rotationOffset = i * rotation.itemSize;
      const angularVelocityOffset = i * angularVelocity.itemSize;

      rotation.array[rotationOffset] += angularVelocity.array[angularVelocityOffset] * deltaTime;
    }

    rotation.needsUpdate = true;
  }
}
