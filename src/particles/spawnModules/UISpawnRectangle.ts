import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { resolveUIVector2Config, type UIVector2Config } from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRectangle extends UISpawnModule<{ position: "Vector2" }> {
  /** @internal */
  public readonly requiredProperties = { position: "Vector2" } as const;
  private minInternal: Vector2Like;
  private maxInternal: Vector2Like;

  constructor(min: UIVector2Config = { x: -50, y: -50 }, max: UIVector2Config = { x: 50, y: 50 }) {
    super();
    this.minInternal = resolveUIVector2Config(min);
    this.maxInternal = resolveUIVector2Config(max);
  }

  public get min(): Vector2Like {
    return this.minInternal;
  }

  public get max(): Vector2Like {
    return this.maxInternal;
  }

  public set min(value: UIVector2Config) {
    this.minInternal = resolveUIVector2Config(value);
  }

  public set max(value: UIVector2Config) {
    this.maxInternal = resolveUIVector2Config(value);
  }

  /** @internal */
  public spawn(
    properties: { position: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const positionBuffer = properties.position;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * positionBuffer.itemSize;
      positionBuffer.array[itemOffset] = MathUtils.randFloat(
        this.minInternal.x,
        this.maxInternal.x,
      );
      positionBuffer.array[itemOffset + 1] = MathUtils.randFloat(
        this.minInternal.y,
        this.maxInternal.y,
      );
    }

    positionBuffer.needsUpdate = true;
  }
}
