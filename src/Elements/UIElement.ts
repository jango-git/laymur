import { Variable } from "kiwi.js";
import { Object3D } from "three";
import {
  convertPowerToStrength,
  UIConstraintPower,
} from "../Constraints/UIConstraintPower";
import { UILayer } from "../Layers/UILayer";
import {
  addVariableSymbol,
  heightSymbol,
  readMicroSymbol,
  readVariablesSymbol,
  removeVariableSymbol,
  suggestVariableSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import {
  UIMicroTransformable,
  UIMicroTransformations,
} from "../Miscellaneous/UIMicroTransformations";

export abstract class UIElement implements UIMicroTransformable {
  public readonly micro = new UIMicroTransformations(this);

  public [xSymbol] = new Variable("x");
  public [ySymbol] = new Variable("y");
  public [widthSymbol] = new Variable("width");
  public [heightSymbol] = new Variable("height");

  protected abstract object: Object3D;

  public constructor(
    public readonly layer: UILayer,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    this.layer[addVariableSymbol](
      this[xSymbol],
      convertPowerToStrength(UIConstraintPower.p7),
    );
    this.layer[addVariableSymbol](
      this[ySymbol],
      convertPowerToStrength(UIConstraintPower.p7),
    );
    this.layer[addVariableSymbol](
      this[widthSymbol],
      convertPowerToStrength(UIConstraintPower.p5),
    );
    this.layer[addVariableSymbol](
      this[heightSymbol],
      convertPowerToStrength(UIConstraintPower.p5),
    );

    this[xSymbol].setValue(x);
    this[ySymbol].setValue(y);
    this[widthSymbol].setValue(w);
    this[heightSymbol].setValue(h);

    this.layer[suggestVariableSymbol](this[xSymbol], x);
    this.layer[suggestVariableSymbol](this[ySymbol], y);
    this.layer[suggestVariableSymbol](this[widthSymbol], w);
    this.layer[suggestVariableSymbol](this[heightSymbol], h);
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
    this.layer[suggestVariableSymbol](this[xSymbol], value);
  }

  public set y(value: number) {
    this.layer[suggestVariableSymbol](this[ySymbol], value);
  }

  public set width(value: number) {
    this.layer[suggestVariableSymbol](this[widthSymbol], value);
  }

  public set height(value: number) {
    this.layer[suggestVariableSymbol](this[heightSymbol], value);
  }

  public set zIndex(value: number) {
    this.object.position.z = value;
  }

  public destroy(): void {
    this.layer[removeVariableSymbol](this[xSymbol]);
    this.layer[removeVariableSymbol](this[ySymbol]);
    this.layer[removeVariableSymbol](this[widthSymbol]);
    this.layer[removeVariableSymbol](this[heightSymbol]);
  }

  public abstract [readVariablesSymbol](): void;
  public abstract [readMicroSymbol](): void;
}
