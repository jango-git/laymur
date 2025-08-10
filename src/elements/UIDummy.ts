import type { UILayer } from "../layers/UILayer";
import { UIPriority } from "../miscellaneous/UIPriority";
import { UIAnchor } from "./UIAnchor";

export abstract class UIDummy extends UIAnchor {
  public readonly wVariable: number;
  public readonly hVariable: number;

  constructor(layer: UILayer, x: number, y: number, w: number, h: number) {
    super(layer, x, y);
    this.wVariable = this.solverWrapper.createVariable(w, UIPriority.P7);
    this.hVariable = this.solverWrapper.createVariable(h, UIPriority.P7);
  }

  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  public set width(value: number) {
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  public set height(value: number) {
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  public override destroy(): void {
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
    super.destroy();
  }
}
