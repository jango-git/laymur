import { Variable } from "kiwi.js";
import { Object3D } from "three";
import {
  powerToStrength,
  UIConstraintPower,
} from "../Constraints/UIConstraintPower";
import { UILayer } from "../Layers/UILayer";
import {
  addVariable,
  hSymbol,
  layerSymbol,
  readVariablesSymbol,
  suggestVariable,
  wSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";

export abstract class UIElement {
  public readonly [layerSymbol]: UILayer;

  public [xSymbol] = new Variable("x");
  public [ySymbol] = new Variable("y");
  public [wSymbol] = new Variable("width");
  public [hSymbol] = new Variable("height");

  protected abstract object: Object3D;

  public constructor(
    layer: UILayer,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    this[layerSymbol] = layer;

    this[layerSymbol][addVariable](
      this[xSymbol],
      powerToStrength(UIConstraintPower.p7),
    );
    this[layerSymbol][addVariable](
      this[ySymbol],
      powerToStrength(UIConstraintPower.p7),
    );
    this[layerSymbol][addVariable](
      this[wSymbol],
      powerToStrength(UIConstraintPower.p5),
    );
    this[layerSymbol][addVariable](
      this[hSymbol],
      powerToStrength(UIConstraintPower.p5),
    );

    this[xSymbol].setValue(x);
    this[ySymbol].setValue(y);
    this[wSymbol].setValue(w);
    this[hSymbol].setValue(h);

    this[layerSymbol][suggestVariable](this[xSymbol], x);
    this[layerSymbol][suggestVariable](this[ySymbol], y);
    this[layerSymbol][suggestVariable](this[wSymbol], w);
    this[layerSymbol][suggestVariable](this[hSymbol], h);
  }

  public get x(): number {
    return this[xSymbol].value();
  }

  public get y(): number {
    return this[ySymbol].value();
  }

  public get width(): number {
    return this[wSymbol].value();
  }

  public get height(): number {
    return this[hSymbol].value();
  }

  public get zIndex(): number {
    return this.object.position.z;
  }

  public set x(value: number) {
    this[layerSymbol][suggestVariable](this[xSymbol], value);
  }

  public set y(value: number) {
    this[layerSymbol][suggestVariable](this[ySymbol], value);
  }

  public set width(value: number) {
    this[layerSymbol][suggestVariable](this[wSymbol], value);
  }

  public set height(value: number) {
    this[layerSymbol][suggestVariable](this[hSymbol], value);
  }

  public set zIndex(value: number) {
    this.object.position.z = value;
  }

  public abstract destroy(): void;
  public abstract [readVariablesSymbol](): void;
}
