import type { WebGLRenderer } from "three";
import { type Object3D } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidNumber } from "../miscellaneous/asserts";
import { UIMicro } from "../miscellaneous/UIMicro";
import { UIMode } from "../miscellaneous/UIMode";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISceneWrapper } from "../wrappers/UISceneWrapper";
import { UIAnchor } from "./UIAnchor";

export enum UIElementEvent {
  CLICK = "click",
}

export abstract class UIElement<
  T extends Object3D = Object3D,
> extends UIAnchor {
  public readonly micro = new UIMicro();

  public readonly wVariable: number;
  public readonly hVariable: number;

  protected readonly sceneWrapper: UISceneWrapper;
  protected modeInternal: UIMode = UIMode.VISIBLE;

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
    this.sceneWrapper = this.layer["getSceneWrapperInternal"]();
    this.sceneWrapper.insertObject(this, this.object);
    this.wVariable = this.solverWrapper.createVariable(w, UIPriority.P7);
    this.hVariable = this.solverWrapper.createVariable(h, UIPriority.P7);
  }

  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  public get zIndex(): number {
    return this.sceneWrapper.getZIndex(this);
  }

  public get mode(): UIMode {
    return this.modeInternal;
  }

  public set width(value: number) {
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  public set height(value: number) {
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  public set zIndex(value: number) {
    this.sceneWrapper.setZIndex(this, value);
  }

  public set mode(value: UIMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      this.sceneWrapper.setVisibility(this, value !== UIMode.HIDDEN);
    }
  }

  public override destroy(): void {
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
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
    const isClicked =
      this.modeInternal === UIMode.INTERACTIVE &&
      x > this.x &&
      x < this.x + this.width &&
      y > this.y &&
      y < this.y + this.height;
    if (isClicked) {
      this.emit(UIElementEvent.CLICK, x, y, this);
    }
    return isClicked;
  }
}
