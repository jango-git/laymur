import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorScaleOverLife extends UIBehaviorModule<{
  scale: "Vector2";
  lifetime: "Vector2";
}> {
  /** @internal */
  public readonly requiredProperties = {
    scale: "Vector2",
    lifetime: "Vector2",
  } as const;

  constructor(
    private readonly scales: number[],
    public aspect = 1,
  ) {
    super();

    if (scales.length < 2) {
      throw new Error("UIBehaviorScaleOverLife.scales");
    }
  }

  /** @internal */
  public update(
    properties: { scale: InstancedBufferAttribute; lifetime: InstancedBufferAttribute },
    instanceCount: number,
  ): void {
    const scaleBuffer = properties.scale;
    const lifetime = properties.lifetime;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * lifetime.itemSize;
      const maxLifetime = lifetime.array[offset];
      const currentLifetime = lifetime.array[offset + 1];

      const t = MathUtils.clamp(currentLifetime / maxLifetime, 0, 1);
      let interpolatedScale = 0;

      if (t === 0) {
        interpolatedScale = this.scales[0];
      } else if (t === 1) {
        const lastElementIndex = this.scales.length - 1;
        interpolatedScale = this.scales[lastElementIndex];
      } else {
        const segment = (this.scales.length - 1) * t;
        const index = Math.floor(segment);

        const localT = segment - index;
        const scale0 = this.scales[index];
        const scale1 = this.scales[index + 1];

        interpolatedScale = scale0 + (scale1 - scale0) * localT;
      }

      const itemOffset = i * scaleBuffer.itemSize;
      scaleBuffer.array[itemOffset] = interpolatedScale * this.aspect;
      scaleBuffer.array[itemOffset + 1] = interpolatedScale;
    }

    scaleBuffer.needsUpdate = true;
  }
}
