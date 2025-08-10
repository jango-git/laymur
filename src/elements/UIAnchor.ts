import { Eventail } from "eventail";
import type { UILayer } from "../layers/UILayer";
import { assertValidNumber } from "../miscellaneous/asserts";
import { UIPriority, type UISolverWrapper } from "../wrappers/UISolverWrapper";

export abstract class UIAnchor extends Eventail {
  public name = "";

  protected readonly solverWrapper: UISolverWrapper;
  protected readonly xIndex: number;
  protected readonly yIndex: number;

  constructor(layer: UILayer, x: number, y: number) {
    assertValidNumber(x, "X");
    assertValidNumber(y, "Y");

    super();
    this.solverWrapper = layer["getSolverWrapperInternal"]();
    this.xIndex = this.solverWrapper.createVariable(x, UIPriority.P7);
    this.yIndex = this.solverWrapper.createVariable(y, UIPriority.P7);
  }

  public get x(): number {
    return this.solverWrapper.readVariableValue(this.xIndex);
  }

  public get y(): number {
    return this.solverWrapper.readVariableValue(this.yIndex);
  }

  public set x(value: number) {
    this.solverWrapper.suggestVariableValue(this.xIndex, value);
  }

  public set y(value: number) {
    this.solverWrapper.suggestVariableValue(this.yIndex, value);
  }

  public destroy(): void {
    this.solverWrapper.removeVariable(this.yIndex);
    this.solverWrapper.removeVariable(this.xIndex);
  }
}
