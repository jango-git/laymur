import type { WebGLRenderer } from "three";
import { type Object3D } from "three";
import type { UILayer } from "../layers/UILayer";
import type { UIPlaneElement } from "../miscellaneous/asserts";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../miscellaneous/asserts";
import { UIMicro } from "../miscellaneous/UIMicro";
import { UIMode } from "../miscellaneous/UIMode";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISceneWrapper } from "../wrappers/UISceneWrapper";
import { UIAnchor } from "./UIAnchor";

export enum UIElementEvent {
  CLICK = "click",
}

export abstract class UIElement<T extends Object3D = Object3D>
  extends UIAnchor
  implements UIPlaneElement
{
  public readonly micro = new UIMicro();

  public readonly wVariable: number;
  public readonly hVariable: number;

  protected readonly sceneWrapper: UISceneWrapper;
  protected modeInternal: UIMode = UIMode.VISIBLE;

  constructor(
    layer: UILayer,
    x: number,
    y: number,
    width: number,
    height: number,
    protected readonly object: T,
  ) {
    assertValidPositiveNumber(width, "UIElement width");
    assertValidPositiveNumber(height, "UIElement height");

    super(layer, x, y);
    this.sceneWrapper = this.layer["getSceneWrapperInternal"]();
    this.sceneWrapper.insertObject(this, this.object);
    this.wVariable = this.solverWrapper.createVariable(width, UIPriority.P7);
    this.hVariable = this.solverWrapper.createVariable(height, UIPriority.P7);
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
    assertValidPositiveNumber(value, "UIElement width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  public set height(value: number) {
    assertValidPositiveNumber(value, "UIElement height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  public set zIndex(value: number) {
    assertValidNumber(value, "UIElement zIndex");
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

  protected ["onBeforeRenderInternal"](
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- empty basic method, parameters unused
    renderer: WebGLRenderer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- empty basic method, parameters unused
    deltaTime: number,
  ): void {}
}
