import { Eventail } from "eventail";
import { Variable } from "kiwi.js";
import type { WebGLRenderer } from "three";
import { type Object3D } from "three";
import {
  convertPowerToStrength,
  UIConstraintPower,
} from "../Constraints/UIConstraintPower";
import type { UILayer } from "../Layers/UILayer";
import { testElement } from "../Miscellaneous/math";
import { applyMicroTransformations } from "../Miscellaneous/microTransformationTools";
import {
  addUIElementSymbol,
  addVariableSymbol,
  clickSymbol,
  heightSymbol,
  needsRecalculation,
  removeUIElementSymbol,
  removeVariableSymbol,
  renderSymbol,
  suggestVariableSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import { UIBehavior } from "../Miscellaneous/UIBehavior";
import { UIMicroTransformations } from "../Miscellaneous/UIMicroTransformations";
import { UIComposer } from "../Passes/UIComposer";
import type { UIPass } from "../Passes/UIPass";

export enum UIElementEvent {
  CLICK = "click",
}

export abstract class UIElement extends Eventail {
  public name = "";
  public readonly micro = new UIMicroTransformations();

  public [xSymbol] = new Variable("x");
  public [ySymbol] = new Variable("y");
  public [widthSymbol] = new Variable("width");
  public [heightSymbol] = new Variable("height");
  public [needsRecalculation] = false;

  protected behaviorInternal = UIBehavior.VISIBLE;
  protected readonly composer = new UIComposer();
  protected lastPadding = 0;

  constructor(
    public readonly layer: UILayer,
    protected readonly object: Object3D,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    super();
    this.layer[addUIElementSymbol](this, this.object);

    this.layer[addVariableSymbol](
      this,
      this[xSymbol],
      convertPowerToStrength(UIConstraintPower.P7),
    );
    this.layer[addVariableSymbol](
      this,
      this[ySymbol],
      convertPowerToStrength(UIConstraintPower.P7),
    );
    this.layer[addVariableSymbol](
      this,
      this[widthSymbol],
      convertPowerToStrength(UIConstraintPower.P5),
    );
    this.layer[addVariableSymbol](
      this,
      this[heightSymbol],
      convertPowerToStrength(UIConstraintPower.P5),
    );

    this[xSymbol].setValue(x);
    this[ySymbol].setValue(y);
    this[widthSymbol].setValue(width);
    this[heightSymbol].setValue(height);

    this.layer[suggestVariableSymbol](this, this[xSymbol], x);
    this.layer[suggestVariableSymbol](this, this[ySymbol], y);
    this.layer[suggestVariableSymbol](this, this[widthSymbol], width);
    this.layer[suggestVariableSymbol](this, this[heightSymbol], height);
  }

  public get passes(): UIPass[] {
    return this.composer.passes;
  }

  public get x(): number {
    return this[xSymbol].value();
  }

  public get y(): number {
    return this[ySymbol].value();
  }

  public get width(): number {
    return this[widthSymbol].value();
  }

  public get height(): number {
    return this[heightSymbol].value();
  }

  public get zIndex(): number {
    return this.object.position.z;
  }

  public get behavior(): UIBehavior {
    return this.behaviorInternal;
  }

  public set x(value: number) {
    this.layer[suggestVariableSymbol](this, this[xSymbol], value);
  }

  public set y(value: number) {
    this.layer[suggestVariableSymbol](this, this[ySymbol], value);
  }

  public set width(value: number) {
    this.layer[suggestVariableSymbol](this, this[widthSymbol], value);
  }

  public set height(value: number) {
    this.layer[suggestVariableSymbol](this, this[heightSymbol], value);
  }

  public set zIndex(value: number) {
    this.object.position.z = value;
  }

  public set behavior(value: UIBehavior) {
    this.behaviorInternal = value;
    this.object.visible = value !== UIBehavior.HIDDEN;
  }

  public destroy(): void {
    this.composer.destroy();
    this.layer[removeVariableSymbol](this, this[heightSymbol]);
    this.layer[removeVariableSymbol](this, this[widthSymbol]);
    this.layer[removeVariableSymbol](this, this[ySymbol]);
    this.layer[removeVariableSymbol](this, this[xSymbol]);
    this.layer[removeUIElementSymbol](this);
  }

  public [clickSymbol](x: number, y: number): boolean {
    if (this.behavior !== UIBehavior.INTERACTIVE) {
      return false;
    }

    this.flushTransform();
    if (testElement(this.x, this.y, this.width, this.height, x, y)) {
      this.emit(UIElementEvent.CLICK, this);
      return true;
    }

    return false;
  }

  protected flushTransform(): void {
    if (
      this[needsRecalculation] ||
      this.micro[needsRecalculation] ||
      this.composer.lastPaddingHasChanged
    ) {
      applyMicroTransformations(
        this.object,
        this.micro,
        this.x,
        this.y,
        this.width,
        this.height,
        this.composer.lastPadding,
      );

      this[needsRecalculation] = false;
      this.micro[needsRecalculation] = false;
    }
  }

  protected abstract [renderSymbol](renderer: WebGLRenderer): void;
}
