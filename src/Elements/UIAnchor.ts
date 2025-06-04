import { Eventail } from "eventail";
import { Variable } from "kiwi.js";
import type { Object3D, WebGLRenderer } from "three";
import { MathUtils } from "three";
import {
  convertPowerToStrength,
  UIConstraintPower,
} from "../Constraints/UIConstraintPower";
import type { UILayer } from "../Layers/UILayer";
import {
  addUIElementSymbol,
  addVariableSymbol,
  removeUIElementSymbol,
  removeVariableSymbol,
  renderSymbol,
  suggestVariableSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";

export abstract class UIAnchor extends Eventail {
  /** X position variable for constraint system */
  public [xSymbol] = new Variable("x");

  /** Y position variable for constraint system */
  public [ySymbol] = new Variable("y");

  /** Unique identifier for the element */
  public name = MathUtils.generateUUID();

  /**
   * Creates a new UI element.
   *
   * @param layer - The UI layer that contains this element
   * @param x - Initial x position
   * @param y - Initial y position
   */
  constructor(
    public readonly layer: UILayer,
    x: number,
    y: number,
    protected readonly object?: Object3D,
  ) {
    super();

    this.layer[addUIElementSymbol](this, object);

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

    this[xSymbol].setValue(x);
    this[ySymbol].setValue(y);

    this.layer[suggestVariableSymbol](this, this[xSymbol], x);
    this.layer[suggestVariableSymbol](this, this[ySymbol], y);
  }

  /** Gets the current x position of the anchor */
  public get x(): number {
    return this[xSymbol].value();
  }

  /** Gets the current y position of the anchor */
  public get y(): number {
    return this[ySymbol].value();
  }

  /**
   * Sets the x position of the element
   * @param value - New x position
   */
  public set x(value: number) {
    this.layer[suggestVariableSymbol](this, this[xSymbol], value);
  }

  /**
   * Sets the y position of the element
   * @param value - New y position
   */
  public set y(value: number) {
    this.layer[suggestVariableSymbol](this, this[ySymbol], value);
  }

  /**
   * Destroys the anchor, cleaning up all resources and removing it from the layer.
   * This should be called when the anchor is no longer needed.
   */
  public destroy(): void {
    this.layer[removeVariableSymbol](this, this[ySymbol]);
    this.layer[removeVariableSymbol](this, this[xSymbol]);
    this.layer[removeUIElementSymbol](this);
  }

  /**
   * Internal method called by the rendering system to render this element.
   *
   * @param renderer - The WebGL renderer
   * @param deltaTime - Time elapsed since the last frame
   * @internal
   */
  public [renderSymbol](renderer: WebGLRenderer, deltaTime: number): void {
    this.render(renderer, deltaTime);
  }

  /**
   * Renders the element.
   * This must be implemented by concrete subclasses.
   *
   * @param renderer - The WebGL renderer
   * @param deltaTime - Time elapsed since the last frame
   */
  protected abstract render(renderer: WebGLRenderer, deltaTime: number): void;
}
