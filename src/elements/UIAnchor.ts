import { Eventail } from "eventail";
import type { UILayer } from "../layers/UILayer";
import type { UILayerElement, UIPointElement } from "../miscellaneous/asserts";
import { assertValidNumber } from "../miscellaneous/asserts";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISolverWrapperInterface } from "../wrappers/UISolverWrapper.Internal";
import type { UIAnchorOptions } from "./UIAnchor.Internal";
import { ANCHOR_DEFAULT_X, ANCHOR_DEFAULT_Y } from "./UIAnchor.Internal";

/**
 * Point in 2D space with constraint-based positioning.
 */
export class UIAnchor
  extends Eventail
  implements UILayerElement, UIPointElement
{
  public name = "";

  /** Solver variable for x-coordinate. */
  public readonly xVariable: number;

  /** Solver variable for y-coordinate. */
  public readonly yVariable: number;

  protected readonly solverWrapper: UISolverWrapperInterface;

  constructor(
    public readonly layer: UILayer,
    options?: Partial<UIAnchorOptions>,
  ) {
    const x = options?.x ?? ANCHOR_DEFAULT_X;
    const y = options?.y ?? ANCHOR_DEFAULT_Y;
    if (options?.x !== undefined) {
      assertValidNumber(options.x, "UIAnchor.constructor.options.x");
    }
    if (options?.y !== undefined) {
      assertValidNumber(options.y, "UIAnchor.constructor.options.y");
    }

    super();
    this.solverWrapper = this.layer.solverWrapper;
    this.xVariable = this.solverWrapper.createVariable(x, UIPriority.P7);
    this.yVariable = this.solverWrapper.createVariable(y, UIPriority.P7);
  }

  public get x(): number {
    return this.solverWrapper.readVariableValue(this.xVariable);
  }

  public get y(): number {
    return this.solverWrapper.readVariableValue(this.yVariable);
  }

  public set x(value: number) {
    assertValidNumber(value, "UIAnchor.x");
    this.solverWrapper.suggestVariableValue(this.xVariable, value);
  }

  public set y(value: number) {
    assertValidNumber(value, "UIAnchor.y");
    this.solverWrapper.suggestVariableValue(this.yVariable, value);
  }

  public destroy(): void {
    this.solverWrapper.removeVariable(this.yVariable);
    this.solverWrapper.removeVariable(this.xVariable);
  }
}
