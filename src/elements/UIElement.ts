import type { WebGLRenderer } from "three";
import { type Object3D } from "three";
import type { UILayer } from "../layers/UILayer";
import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../miscellaneous/asserts";
import { UIMicro } from "../miscellaneous/UIMicro";
import { UIMode } from "../miscellaneous/UIMode";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISceneWrapper } from "../wrappers/UISceneWrapper";
import { UIAnchor } from "./UIAnchor";

/**
 * Events that can be emitted by UI elements.
 */
export enum UIElementEvent {
  /** Emitted when the element is clicked. */
  CLICK = "click",
}

/**
 * Abstract base class for all renderable UI elements with dimensions.
 *
 * UIElement serves as the fundamental building block for all other UI elements
 * that need to be visually rendered. It extends UIAnchor with dimensional properties
 * and integrates with the Three.js rendering system through Object3D. This class
 * provides essential functionality for positioning, sizing, rendering, visibility,
 * z-index management, and user interaction.
 *
 * @template T - The type of Three.js Object3D used for rendering
 * @see {@link UIAnchor} - Base class providing position functionality
 * @see {@link UIPlaneElement} - Interface defining dimensional element behavior
 * @see {@link UISceneWrapper} - Scene management for rendering
 * @see {@link UIMicro} - Micro-optimization utilities
 */
export abstract class UIElement<T extends Object3D = Object3D>
  extends UIAnchor
  implements UIPlaneElement, UILayerElement
{
  /** Micro-transformation system for non-constraint based positioning, scaling, and rotation adjustments. */
  public readonly micro = new UIMicro();

  /**
   * Solver variable descriptor for the width dimension.
   * This variable is managed by the constraint solver system.
   */
  public readonly wVariable: number;

  /**
   * Solver variable descriptor for the height dimension.
   * This variable is managed by the constraint solver system.
   */
  public readonly hVariable: number;

  /**
   * Reference to the scene wrapper for rendering management.
   * @see {@link UISceneWrapper}
   */
  protected readonly sceneWrapper: UISceneWrapper;

  /** Internal storage for the current visibility/interaction mode. */
  protected modeInternal: UIMode = UIMode.VISIBLE;

  /**
   * Creates a new UIElement instance with rendering capabilities.
   *
   * @param layer - The UI layer that contains this element
   * @param x - Initial x-coordinate position
   * @param y - Initial y-coordinate position
   * @param width - Initial width dimension (must be positive)
   * @param height - Initial height dimension (must be positive)
   * @param object - The Three.js Object3D used for rendering this element
   * @throws Will throw an error if width or height are not valid positive numbers
   * @see {@link assertValidPositiveNumber}
   */
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
    this.wVariable = this.solverWrapper.createVariable(width, UIPriority.P6);
    this.hVariable = this.solverWrapper.createVariable(height, UIPriority.P6);
  }

  /**
   * Gets the current width value from the solver.
   * @returns The current width dimension
   */
  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  /**
   * Gets the current height value from the solver.
   * @returns The current height dimension
   */
  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  /**
   * Gets the current z-index (depth) value from the scene.
   * @returns The current z-index for rendering order
   */
  public get zIndex(): number {
    return this.sceneWrapper.getZIndex(this);
  }

  /**
   * Gets the current visibility and interaction mode.
   * @returns The current UIMode setting
   * @see {@link UIMode}
   */
  public get mode(): UIMode {
    return this.modeInternal;
  }

  /**
   * Sets the width value through the solver system.
   * @param value - The new width dimension (must be positive)
   * @throws Will throw an error if value is not a valid positive number
   * @see {@link assertValidPositiveNumber}
   */
  public set width(value: number) {
    assertValidPositiveNumber(value, "UIElement width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  /**
   * Sets the height value through the solver system.
   * @param value - The new height dimension (must be positive)
   * @throws Will throw an error if value is not a valid positive number
   * @see {@link assertValidPositiveNumber}
   */
  public set height(value: number) {
    assertValidPositiveNumber(value, "UIElement height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  /**
   * Sets the z-index (depth) value for rendering order.
   * @param value - The new z-index value
   * @throws Will throw an error if value is not a valid number
   * @see {@link assertValidNumber}
   */
  public set zIndex(value: number) {
    assertValidNumber(value, "UIElement zIndex");
    this.sceneWrapper.setZIndex(this, value);
  }

  /**
   * Sets the visibility and interaction mode.
   * @param value - The new UIMode setting
   * @see {@link UIMode}
   */
  public set mode(value: UIMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      this.sceneWrapper.setVisibility(this, value !== UIMode.HIDDEN);
    }
  }

  /**
   * Destroys the UI element by cleaning up all associated resources.
   *
   * This method removes the element from the rendering scene, cleans up
   * dimension solver variables, and calls the parent destroy method to
   * clean up position variables. After calling this method, the element
   * should not be used anymore.
   */
  public override destroy(): void {
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
    this.sceneWrapper.removeObject(this);
    super.destroy();
  }

  /**
   * Internal method for handling click events.
   *
   * Determines if the click coordinates intersect with this element's bounds
   * and emits a CLICK event if the element is in interactive mode.
   *
   * @param x - The x-coordinate of the click
   * @param y - The y-coordinate of the click
   * @returns True if the click was handled by this element
   */
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

  /**
   * Internal method called before rendering each frame.
   *
   * This is a hook method that can be overridden by subclasses to perform
   * pre-render operations such as updating animations, transforms, or
   * other dynamic properties.
   *
   * @param renderer - The WebGL renderer instance
   * @param deltaTime - Time elapsed since the last frame in seconds
   */
  protected ["onBeforeRenderInternal"](
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- empty basic method, parameters unused
    renderer: WebGLRenderer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- empty basic method, parameters unused
    deltaTime: number,
  ): void {}
}
