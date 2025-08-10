import type { UILayer } from "../layers/UILayer";
import { UIPriority } from "../wrappers/UISolverWrapper";
import { UIAnchor } from "./UIAnchor";

export abstract class UIDummy extends UIAnchor {
  protected readonly wIndex: number;
  protected readonly hIndex: number;

  constructor(layer: UILayer, x: number, y: number, w: number, h: number) {
    super(layer, x, y);
    this.wIndex = this.solverWrapper.createVariable(w, UIPriority.P7);
    this.hIndex = this.solverWrapper.createVariable(h, UIPriority.P7);
  }

  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wIndex);
  }

  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hIndex);
  }

  public set width(value: number) {
    this.solverWrapper.suggestVariableValue(this.wIndex, value);
  }

  public set height(value: number) {
    this.solverWrapper.suggestVariableValue(this.hIndex, value);
  }

  public override destroy(): void {
    this.solverWrapper.removeVariable(this.hIndex);
    this.solverWrapper.removeVariable(this.wIndex);
    super.destroy();
  }
}
