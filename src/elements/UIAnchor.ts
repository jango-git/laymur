import { Variable } from "@lume/kiwi";
import { Eventail } from "eventail";
import type { Object3D, WebGLRenderer } from "three";
import { MathUtils } from "three";
import {
  convertPowerToStrength,
  UIConstraintPower,
} from "../constraints/UIConstraintPower";
import type { UILayer } from "../layers/UILayer";

export abstract class UIAnchor extends Eventail {
  /** X position variable for constraint system */
  public ["xInternal"] = new Variable("x");

  /** Y position variable for constraint system */
  public ["yInternal"] = new Variable("y");

  /** Flag indicating whether the element needs recalculation */
  public ["needsRecalculationInternal"] = false;

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

    if (this.object) {
      this.object.matrixAutoUpdate = false;
    }

    this.layer["addUIElementInternal"](this, object);

    this.layer["addVariableInternal"](
      this,
      this["xInternal"],
      convertPowerToStrength(UIConstraintPower.P7),
    );
    this.layer["addVariableInternal"](
      this,
      this["yInternal"],
      convertPowerToStrength(UIConstraintPower.P7),
    );

    this["xInternal"].setValue(x);
    this["yInternal"].setValue(y);

    this.layer["suggestVariableInternal"](this, this["xInternal"], x);
    this.layer["suggestVariableInternal"](this, this["yInternal"], y);
  }

  /** Gets the current x position of the anchor */
  public get x(): number {
    return this["xInternal"].value();
  }

  /** Gets the current y position of the anchor */
  public get y(): number {
    return this["yInternal"].value();
  }

  /** Gets the current z-index (depth) of the element */
  public get zIndex(): number {
    return this.object?.position.z ?? 0;
  }

  /** Gets whether the element needs recalculation */
  protected get needsRecalculation(): boolean {
    return this["needsRecalculationInternal"];
  }

  /**
   * Sets the x position of the element
   * @param value - New x position
   */
  public set x(value: number) {
    this.layer["suggestVariableInternal"](this, this["xInternal"], value);
  }

  /**
   * Sets the y position of the element
   * @param value - New y position
   */
  public set y(value: number) {
    this.layer["suggestVariableInternal"](this, this["yInternal"], value);
  }

  /**
   * Sets the z-index (depth) of the element
   * @param value - New z-index
   */
  public set zIndex(value: number) {
    if (this.object && this.object.renderOrder !== value) {
      this.object.position.z = value;
      this.object.renderOrder = value;
      this.layer["sortInternal"]();
      this.object.updateMatrix();
    }
  }

  /**
   * Destroys the anchor, cleaning up all resources and removing it from the layer.
   * This should be called when the anchor is no longer needed.
   */
  public destroy(): void {
    this.layer["removeVariableInternal"](this, this["yInternal"]);
    this.layer["removeVariableInternal"](this, this["xInternal"]);
    this.layer["removeUIElementInternal"](this);
  }

  /**
   * Internal method called by the rendering system to render this element.
   *
   * @param renderer - The WebGL renderer
   * @param deltaTime - Time elapsed since the last frame
   * @internal
   */
  public ["renderInternal"](renderer: WebGLRenderer, deltaTime: number): void {
    this.render(renderer, deltaTime);
  }

  /**
   * Applies transformations to the underlying Three.js object.
   * This is called when the element's position, size, or other properties change.
   */
  protected applyTransformations(): void {
    if (this["needsRecalculationInternal"]) {
      if (this.object) {
        this.object.updateMatrix();
      }
      this["needsRecalculationInternal"] = false;
    }
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
