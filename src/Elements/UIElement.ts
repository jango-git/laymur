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
import { UIMicro, UIMicroInternal } from "../Miscellaneous/UIMicro";
import { UIMode } from "../Miscellaneous/UIMode";
import { UIComposer, UIComposerInternal } from "../Passes/UIComposer";

/**
 * Events that can be emitted by UI elements.
 */
export enum UIElementEvent {
  /** Triggered when an interactive element is clicked */
  CLICK = "click",
}

/**
 * Abstract base class for all UI elements in the system.
 * Provides core functionality for positioning, sizing, and rendering UI elements.
 *
 * Each UI element has:
 * - Position (x, y) and size (width, height) variables
 * - Layer management integration
 * - Event handling capabilities
 * - Micro transformations support
 * - Rendering capabilities
 */
export abstract class UIElement extends Eventail {
  /** X position variable for constraint system */
  public [xSymbol] = new Variable("x");

  /** Y position variable for constraint system */
  public [ySymbol] = new Variable("y");

  /** Width variable for constraint system */
  public [widthSymbol] = new Variable("width");

  /** Height variable for constraint system */
  public [heightSymbol] = new Variable("height");

  /** Flag indicating whether the element needs recalculation */
  public [needsRecalculation] = false;

  /** Unique identifier for the element */
  public name = MathUtils.generateUUID();

  /** Micro transformation interface for the element */
  public readonly micro: UIMicro;

  /** Composer interface for the element */
  public readonly composer: UIComposer;

  /** Internal micro transformation implementation */
  protected readonly microInternal = new UIMicroInternal();

  /** Internal composer implementation */
  protected readonly composerInternal = new UIComposerInternal();

  /** Current visibility/interactivity mode */
  protected modeInternal = UIMode.VISIBLE;

  /**
   * Creates a new UI element.
   *
   * @param layer - The UI layer that contains this element
   * @param object - The Three.js object that represents this element
   * @param x - Initial x position
   * @param y - Initial y position
   * @param width - Initial width
   * @param height - Initial height
   */
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

  /** Gets the current x position of the element */
  public get x(): number {
    return this[xSymbol].value();
  }

  /** Gets the current y position of the element */
  public get y(): number {
    return this[ySymbol].value();
  }

  /** Gets the current width of the element */
  public get width(): number {
    return this[widthSymbol].value();
  }

  /** Gets the current height of the element */
  public get height(): number {
    return this[heightSymbol].value();
  }

  /** Gets the current z-index (depth) of the element */
  public get zIndex(): number {
    return this.object.position.z;
  }

  /** Gets the current visibility/interactivity mode of the element */
  public get mode(): UIMode {
    return this.modeInternal;
  }

  /** Gets whether the element needs recalculation */
  protected get needsRecalculation(): boolean {
    return this[needsRecalculation];
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
   * Sets the width of the element
   * @param value - New width
   */
  public set width(value: number) {
    this.layer[suggestVariableSymbol](this, this[widthSymbol], value);
  }

  /**
   * Sets the height of the element
   * @param value - New height
   */
  public set height(value: number) {
    this.layer[suggestVariableSymbol](this, this[heightSymbol], value);
  }

  /**
   * Sets the z-index (depth) of the element
   * @param value - New z-index
   */
  public set zIndex(value: number) {
    this.object.position.z = value;
  }

  /**
   * Sets the visibility/interactivity mode of the element
   * @param value - New UI mode
   */
  public set mode(value: UIMode) {
    this.modeInternal = value;
    this.object.visible = value !== UIMode.HIDDEN;
  }

  /**
   * Destroys the element, cleaning up all resources and removing it from the layer.
   * This should be called when the element is no longer needed.
   */
  public destroy(): void {
    this.composerInternal.destroy();
    this.layer[removeVariableSymbol](this, this[heightSymbol]);
    this.layer[removeVariableSymbol](this, this[widthSymbol]);
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
   * Internal method called by the event system to handle clicks on this element.
   *
   * @param x - X coordinate of the click
   * @param y - Y coordinate of the click
   * @returns Whether the click was handled by this element
   * @internal
   */
  public [clickSymbol](x: number, y: number): boolean {
    return this.click(x, y);
  }

  /**
   * Applies transformations to the underlying Three.js object.
   * This is called when the element's position, size, or other properties change.
   */
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

  /**
   * Handles click events on this element.
   *
   * @param x - X coordinate of the click
   * @param y - Y coordinate of the click
   * @returns Whether the click was handled by this element
   */
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

  /**
   * Renders the element.
   * This must be implemented by concrete subclasses.
   *
   * @param renderer - The WebGL renderer
   * @param deltaTime - Time elapsed since the last frame
   */
  protected abstract render(renderer: WebGLRenderer, deltaTime: number): void;
}
