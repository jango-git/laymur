import type { UILayer } from "../layers/UILayer";
import {
  assertValidPositiveNumber,
  type UIPlaneElement,
} from "../miscellaneous/asserts";
import { UIPriority } from "../miscellaneous/UIPriority";
import { UIAnchor } from "./UIAnchor";

const DEFAULT_SIZE = 100;

export abstract class UIDummy extends UIAnchor implements UIPlaneElement {
  public readonly wVariable: number;
  public readonly hVariable: number;

  constructor(
    layer: UILayer,
    x: number,
    y: number,
    width: number = DEFAULT_SIZE,
    height: number = DEFAULT_SIZE,
  ) {
    assertValidPositiveNumber(width, "UIDummy width");
    assertValidPositiveNumber(height, "UIDummy height");

    super(layer, x, y);
    this.wVariable = this.solverWrapper.createVariable(width, UIPriority.P7);
    this.hVariable = this.solverWrapper.createVariable(height, UIPriority.P7);
  }

  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  public set width(value: number) {
    assertValidPositiveNumber(value, "UIDummy width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  public set height(value: number) {
    assertValidPositiveNumber(value, "UIDummy height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  public override destroy(): void {
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
    super.destroy();
  }
}
