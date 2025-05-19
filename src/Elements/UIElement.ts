import { Variable } from "kiwi.js";
import type { Object3D } from "three";
import {
  convertPowerToStrength,
  UIConstraintPower,
} from "../Constraints/UIConstraintPower";
import type { UILayer } from "../Layers/UILayer";
import {
  addUIElementSymbol,
  addVariableSymbol,
  heightSymbol,
  readMicroSymbol,
  readVariablesSymbol,
  removeUIElementSymbol,
  removeVariableSymbol,
  suggestVariableSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import type { UIMicroTransformable } from "../Miscellaneous/UIMicroTransformations";
import { UIMicroTransformations } from "../Miscellaneous/UIMicroTransformations";

export abstract class UIElement implements UIMicroTransformable {
  public readonly micro = new UIMicroTransformations(this);

  public [xSymbol] = new Variable("x");
  public [ySymbol] = new Variable("y");
  public [widthSymbol] = new Variable("width");
  public [heightSymbol] = new Variable("height");

  constructor(
    public readonly layer: UILayer,
    protected readonly object: Object3D,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
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
    this[widthSymbol].setValue(w);
    this[heightSymbol].setValue(h);

    this.layer[suggestVariableSymbol](this, this[xSymbol], x);
    this.layer[suggestVariableSymbol](this, this[ySymbol], y);
    this.layer[suggestVariableSymbol](this, this[widthSymbol], w);
    this.layer[suggestVariableSymbol](this, this[heightSymbol], h);
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

  public destroy(): void {
    this.layer[removeVariableSymbol](this, this[xSymbol]);
    this.layer[removeVariableSymbol](this, this[ySymbol]);
    this.layer[removeVariableSymbol](this, this[widthSymbol]);
    this.layer[removeVariableSymbol](this, this[heightSymbol]);
    this.layer[removeUIElementSymbol](this);
  }

  public abstract [readVariablesSymbol](): void;
  public abstract [readMicroSymbol](): void;
}
