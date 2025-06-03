import { Eventail } from "eventail";
import { Variable } from "kiwi.js";
import type { WebGLRenderer } from "three";
import { MathUtils, type Object3D } from "three";
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
import { UIMode } from "../Miscellaneous/UIBehavior";
import { UIMicro, UIMicroInternal } from "../Miscellaneous/UIMicro";
import { UIComposer, UIComposerInternal } from "../Passes/UIComposer";

export enum UIElementEvent {
  CLICK = "click",
}

export abstract class UIElement extends Eventail {
  public [xSymbol] = new Variable("x");
  public [ySymbol] = new Variable("y");
  public [widthSymbol] = new Variable("width");
  public [heightSymbol] = new Variable("height");
  public [needsRecalculation] = false;

  public name = MathUtils.generateUUID();
  public readonly micro: UIMicro;
  public readonly composer: UIComposer;
  protected readonly microInternal = new UIMicroInternal();
  protected readonly composerInternal = new UIComposerInternal();

  protected modeInternal = UIMode.VISIBLE;

  constructor(
    public readonly layer: UILayer,
    protected readonly object: Object3D,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    super();
    this.micro = new UIMicro(this.microInternal, this);
    this.composer = new UIComposer(this.composerInternal);

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

  public get mode(): UIMode {
    return this.modeInternal;
  }

  protected get needsRecalculation(): boolean {
    return this[needsRecalculation];
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

  public set mode(value: UIMode) {
    this.modeInternal = value;
    this.object.visible = value !== UIMode.HIDDEN;
  }

  public destroy(): void {
    this.composerInternal.destroy();
    this.layer[removeVariableSymbol](this, this[heightSymbol]);
    this.layer[removeVariableSymbol](this, this[widthSymbol]);
    this.layer[removeVariableSymbol](this, this[ySymbol]);
    this.layer[removeVariableSymbol](this, this[xSymbol]);
    this.layer[removeUIElementSymbol](this);
  }

  public [renderSymbol](renderer: WebGLRenderer, deltaTime: number): void {
    this.render(renderer, deltaTime);
  }

  public [clickSymbol](x: number, y: number): boolean {
    return this.click(x, y);
  }

  protected applyTransformations(): void {
    if (
      this[needsRecalculation] ||
      this.microInternal.needsRecalculation ||
      this.composerInternal.paddingHasChanged
    ) {
      applyMicroTransformations(
        this.object,
        this.microInternal,
        this.x,
        this.y,
        this.width,
        this.height,
        this.composerInternal.padding,
      );

      this[needsRecalculation] = false;
      this.microInternal.needsRecalculation = false;
    }
  }

  protected click(x: number, y: number): boolean {
    if (this.mode !== UIMode.INTERACTIVE) {
      return false;
    }

    this.applyTransformations();
    if (testElement(this.x, this.y, this.width, this.height, x, y)) {
      this.emit(UIElementEvent.CLICK, this);
      return true;
    }

    return false;
  }

  protected abstract render(renderer: WebGLRenderer, deltaTime: number): void;
}
