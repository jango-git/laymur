import type { WebGLRenderer } from "three";
import { type Object3D } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidNumber } from "../miscellaneous/asserts";
import { UIMicro } from "../miscellaneous/UIMicro";
import { UIMode } from "../miscellaneous/UIMode";
import type { UISceneWrapper } from "../wrappers/UISceneWrapper";
import { UIPriority } from "../wrappers/UISolverWrapper";
import { UIAnchor } from "./UIAnchor";

export abstract class UIElement<
  T extends Object3D = Object3D,
> extends UIAnchor {
  public mode: UIMode = UIMode.VISIBLE;
  public readonly micro = new UIMicro();

  protected readonly sceneWrapper: UISceneWrapper;
  protected readonly wIndex: number;
  protected readonly hIndex: number;

  constructor(
    layer: UILayer,
    x: number,
    y: number,
    w: number,
    h: number,
    protected readonly object: T,
  ) {
    assertValidNumber(w, "W");
    assertValidNumber(h, "H");

    super(layer, x, y);
    this.sceneWrapper = layer["getSceneWrapperInternal"]();
    this.sceneWrapper.insertObject(this, this.object);
    this.wIndex = this.solverWrapper.createVariable(w, UIPriority.P7);
    this.hIndex = this.solverWrapper.createVariable(h, UIPriority.P7);
  }

  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wIndex);
  }

  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hIndex);
  }

  public get zIndex(): number {
    return this.sceneWrapper.getZIndex(this);
  }

  public set width(value: number) {
    this.solverWrapper.suggestVariableValue(this.wIndex, value);
  }

  public set height(value: number) {
    this.solverWrapper.suggestVariableValue(this.hIndex, value);
  }

  public set zIndex(value: number) {
    this.sceneWrapper.setZIndex(this, value);
  }

  public override destroy(): void {
    this.solverWrapper.removeVariable(this.hIndex);
    this.solverWrapper.removeVariable(this.wIndex);
    this.sceneWrapper.removeObject(this);
    super.destroy();
  }

  protected ["onBeforeRenderInternal"](
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    void renderer;
    void deltaTime;
  }

  protected ["onClickInternal"](x: number, y: number): boolean {
    return (
      this.mode === UIMode.INTERACTIVE &&
      x > this.x &&
      x < this.x + this.width &&
      y > this.y &&
      y < this.y + this.height
    );
  }
}
