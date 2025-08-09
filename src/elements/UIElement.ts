import { Variable } from "@lume/kiwi";
import type { WebGLRenderer } from "three";
import { type Object3D } from "three";
import {
  convertPowerToStrength,
  UIConstraintPower,
} from "../constraints/UIConstraintPower";
import type { UILayer } from "../layers/UILayer";
import { testElement } from "../miscellaneous/math";
import { applyMicroTransformations } from "../miscellaneous/microTransformationTools";
import { UIMicro, UIMicroInternal } from "../miscellaneous/UIMicro";
import { UIMode } from "../miscellaneous/UIMode";
import { UIComposer, UIComposerInternal } from "../passes/UIComposer";
import { UIAnchor } from "./UIAnchor";

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
export abstract class UIElement extends UIAnchor {
  /** Micro transformation interface for the element */
  public readonly micro: UIMicro;

  /** Composer interface for the element */
  public readonly composer: UIComposer;

  /** Width variable for constraint system */
  protected readonly ["widthInternal"] = new Variable("width");

  /** Height variable for constraint system */
  protected readonly ["heightInternal"] = new Variable("height");

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
    layer: UILayer,
    object: Object3D,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    super(layer, x, y, object);

    this.micro = new UIMicro(this.microInternal, this);
    this.composer = new UIComposer(this.composerInternal);

    this.layer["addVariableInternal"](
      this,
      this["widthInternal"],
      convertPowerToStrength(UIConstraintPower.P5),
    );
    this.layer["addVariableInternal"](
      this,
      this["heightInternal"],
      convertPowerToStrength(UIConstraintPower.P5),
    );

    this["widthInternal"].setValue(width);
    this["heightInternal"].setValue(height);

    this.layer["suggestVariableInternal"](this, this["widthInternal"], width);
    this.layer["suggestVariableInternal"](this, this["heightInternal"], height);
  }

  /** Gets the current width of the element */
  public get width(): number {
    return this["widthInternal"].value();
  }

  /** Gets the current height of the element */
  public get height(): number {
    return this["heightInternal"].value();
  }

  /** Gets the current visibility/interactivity mode of the element */
  public get mode(): UIMode {
    return this.modeInternal;
  }

  /** Gets whether the element needs recalculation */
  protected get needsRecalculation(): boolean {
    return this["needsRecalculationInternal"];
  }

  /**
   * Sets the width of the element
   * @param value - New width
   */
  public set width(value: number) {
    this.layer["suggestVariableInternal"](this, this["widthInternal"], value);
  }

  /**
   * Sets the height of the element
   * @param value - New height
   */
  public set height(value: number) {
    this.layer["suggestVariableInternal"](this, this["heightInternal"], value);
  }

  /**
   * Sets the visibility/interactivity mode of the element
   * @param value - New UI mode
   */
  public set mode(value: UIMode) {
    this.modeInternal = value;
    if (this.object) {
      this.object.visible = value !== UIMode.HIDDEN;
    }
  }

  /**
   * Destroys the element, cleaning up all resources and removing it from the layer.
   * This should be called when the element is no longer needed.
   */
  public override destroy(): void {
    this.composerInternal.destroy();
    this.layer["removeVariableInternal"](this, this["heightInternal"]);
    this.layer["removeVariableInternal"](this, this["widthInternal"]);
    super.destroy();
  }

  /**
   * Internal method called by the event system to handle clicks on this element.
   *
   * @param x - X coordinate of the click
   * @param y - Y coordinate of the click
   * @returns Whether the click was handled by this element
   * @internal
   */
  public ["clickInternal"](x: number, y: number): boolean {
    return this.click(x, y);
  }

  /**
   * Internal method called by the rendering system to render this element.
   *
   * @param renderer - The WebGL renderer
   * @param deltaTime - Time elapsed since the last frame
   * @internal
   */
  protected override ["renderInternal"](
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    this.render(renderer, deltaTime);
  }

  /**
   * Applies transformations to the underlying Three.js object.
   * This is called when the element's position, size, or other properties change.
   */
  protected override applyTransformations(): void {
    if (
      this.object &&
      (this.needsRecalculationInternal ||
        this.microInternal.needsRecalculation ||
        this.composerInternal.paddingHasChanged)
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

      this.object.updateMatrix();

      this.needsRecalculationInternal = false;
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

  protected requestRecalculation(): void {
    this.needsRecalculationInternal = true;
  }
}
