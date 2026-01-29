import type { InstancedBufferAttribute } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { resolveUIVector2Config, type UIVector2Config } from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorDirectionalGravity extends UIBehaviorModule<{ velocity: "Vector2" }> {
  /** @internal */
  public readonly requiredProperties = { velocity: "Vector2" } as const;
  private directionInternal: Vector2Like;

  constructor(direction: Vector2Like) {
    super();
    this.directionInternal = resolveUIVector2Config(direction);
    assertValidNumber(
      this.directionInternal.x,
      "UIBehaviorDirectionalGravity.constructor.direction.x",
    );
    assertValidNumber(
      this.directionInternal.y,
      "UIBehaviorDirectionalGravity.constructor.direction.y",
    );
  }

  public get direction(): Vector2Like {
    return this.directionInternal;
  }

  public set direction(value: UIVector2Config) {
    this.directionInternal = resolveUIVector2Config(value);
    assertValidNumber(this.directionInternal.x, "UIBehaviorDirectionalGravity.direction.x");
    assertValidNumber(this.directionInternal.y, "UIBehaviorDirectionalGravity.direction.y");
  }

  /** @internal */
  public update(
    properties: { velocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { velocity: velocityAttribute } = properties;
    const { array: velocityArray, itemSize: velocityItemSize } = velocityAttribute;

    const offsetX = this.directionInternal.x * deltaTime;
    const offsetY = this.directionInternal.y * deltaTime;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * velocityItemSize;
      velocityArray[offset] += offsetX;
      velocityArray[offset + 1] += offsetY;
    }

    velocityAttribute.needsUpdate = true;
  }
}
