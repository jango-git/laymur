import { Eventail } from "eventail";
import type { UILayer } from "../layers/UILayer";
import { assertValidNumber } from "../miscellaneous/asserts";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISolverWrapper } from "../wrappers/UISolverWrapper";

export abstract class UIAnchor extends Eventail {
  public name = "";

  public readonly xVariable: number;
  public readonly yVariable: number;

  protected readonly solverWrapper: UISolverWrapper;

  constructor(
    public readonly layer: UILayer,
    x: number,
    y: number,
  ) {
    assertValidNumber(x, "X");
    assertValidNumber(y, "Y");

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
    this.solverWrapper.suggestVariableValue(this.xVariable, value);
  }

  public set y(value: number) {
    this.solverWrapper.suggestVariableValue(this.yVariable, value);
  }

  public destroy(): void {
    this.solverWrapper.removeVariable(this.yVariable);
    this.solverWrapper.removeVariable(this.xVariable);
  }
}
