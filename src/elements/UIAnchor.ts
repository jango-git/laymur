import { Eventail } from "eventail";
import type { UILayer } from "../layers/UILayer";
import type { UIPointElement } from "../miscellaneous/asserts";
import { assertValidNumber } from "../miscellaneous/asserts";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISolverWrapper } from "../wrappers/UISolverWrapper";

export abstract class UIAnchor extends Eventail implements UIPointElement {
  public name = "";

  public readonly xVariable: number;
  public readonly yVariable: number;

  protected readonly solverWrapper: UISolverWrapper;

  constructor(
    public readonly layer: UILayer,
    x: number,
    y: number,
  ) {
    assertValidNumber(x, "UIAnchor x");
    assertValidNumber(y, "UIAnchor y");

    super();
    this.solverWrapper = this.layer["getSolverWrapperInternal"]();
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
    assertValidNumber(value, "UIAnchor x");
    this.solverWrapper.suggestVariableValue(this.xVariable, value);
  }

  public set y(value: number) {
    assertValidNumber(value, "UIAnchor y");
    this.solverWrapper.suggestVariableValue(this.yVariable, value);
  }

  public destroy(): void {
    this.solverWrapper.removeVariable(this.yVariable);
    this.solverWrapper.removeVariable(this.xVariable);
  }
}
