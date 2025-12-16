import { Eventail } from "eventail";
import type { WebGLRenderer } from "three";
import type { UIPlaneElement } from "../miscellaneous/asserts";

import { isUIModeVisible } from "../miscellaneous/UIMode";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import { UIPriority } from "../miscellaneous/UIPriority";
import { UIInputWrapper } from "../wrappers/UIInputWrapper";
import type { UIInputWrapperInterface } from "../wrappers/UIInputWrapper.Internal";
import { UISceneWrapper } from "../wrappers/UISceneWrapper";
import type { UISceneWrapperInterface } from "../wrappers/UISceneWrapper.Internal";
import { UISolverWrapper } from "../wrappers/UISolverWrapper";
import type { UISolverWrapperInterface } from "../wrappers/UISolverWrapper.Internal";
import type { UILayerMode, UILayerOrientation } from "./UILayer.Internal";
import { UILayerEvent } from "./UILayer.Internal";

/**
 * Abstract base class for UI layout containers with constraint solving and rendering.
 *
 * UILayer serves as the fundamental container for UI elements, providing constraint-based
 * layout solving, 3D scene management, and event handling. It manages the layer's
 * dimensions through solver variables, handles orientation changes, and coordinates
 * rendering and interaction for all contained elements.
 *
 * Each layer maintains its own constraint solver and scene graph, allowing for
 * independent layout calculation and rendering optimization.
 *
 * @see {@link UIElement} - Elements contained within layers
 * @see {@link UISolverWrapper} - Constraint solving system
 * @see {@link UISceneWrapper} - 3D scene management
 * @see {@link UIOrientation} - Layer orientation states
 */
export abstract class UILayer extends Eventail implements UIPlaneElement {
  /** Optional name identifier for the layer. */
  public name = "";

  /**
   * Solver variable descriptor for the x-coordinate position.
   * This variable is managed by the constraint solver system.
   */
  public readonly xVariable: number;

  /**
   * Solver variable descriptor for the y-coordinate position.
   * This variable is managed by the constraint solver system.
   */
  public readonly yVariable: number;

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
   * Constraint solver wrapper for managing layout calculations.
   * @see {@link UISolverWrapper}
   */
  protected readonly solverWrapperInternal = new UISolverWrapper();

  protected readonly sceneWrapperInternal: UISceneWrapper;

  protected readonly inputWrapperInternal = new UIInputWrapper();

  /** Internal storage for the current visibility/interaction mode. */
  protected modeInternal: UILayerMode;

  /** Internal storage for the current orientation state. */
  protected orientationInternal: UILayerOrientation;

  /** Collection of input listeners for handling user interactions, sorted by z-index. */

  /**
   * Creates a new UILayer instance with specified dimensions.
   *
   * Initializes the constraint solver with position and dimension variables,
   * sets up the 3D scene wrapper, and determines the initial orientation
   * based on the width-to-height ratio.
   *
   * @param w - Initial width of the layer
   * @param h - Initial height of the layer
   */
  constructor(w: number, h: number, mode: UILayerMode) {
    super();
    this.sceneWrapperInternal = new UISceneWrapper(w, h);
    this.modeInternal = mode;
    this.orientationInternal =
      w > h ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;

    this.xVariable = this.solverWrapperInternal.createVariable(
      0,
      UIPriority.P0,
    );
    this.yVariable = this.solverWrapperInternal.createVariable(
      0,
      UIPriority.P0,
    );
    this.wVariable = this.solverWrapperInternal.createVariable(
      w,
      UIPriority.P0,
    );
    this.hVariable = this.solverWrapperInternal.createVariable(
      h,
      UIPriority.P0,
    );
  }

  /** @internal */
  public get sceneWrapper(): UISceneWrapperInterface {
    return this.sceneWrapperInternal;
  }

  /** @internal */
  public get solverWrapper(): UISolverWrapperInterface {
    return this.solverWrapperInternal;
  }

  /** @internal */
  public get inputWrapper(): UIInputWrapperInterface {
    return this.inputWrapperInternal;
  }

  /**
   * Gets the current x position value from the constraint solver.
   * @returns The current x position in pixels
   */
  public get x(): number {
    return this.solverWrapperInternal.readVariableValue(this.xVariable);
  }

  /**
   * Gets the current y position value from the constraint solver.
   * @returns The current y position in pixels
   */
  public get y(): number {
    return this.solverWrapperInternal.readVariableValue(this.yVariable);
  }

  /**
   * Gets the current width value from the constraint solver.
   * @returns The current layer width in pixels
   */
  public get width(): number {
    return this.solverWrapperInternal.readVariableValue(this.wVariable);
  }

  /**
   * Gets the current height value from the constraint solver.
   * @returns The current layer height in pixels
   */
  public get height(): number {
    return this.solverWrapperInternal.readVariableValue(this.hVariable);
  }

  /**
   * Gets the current visibility and interaction mode.
   * @returns The current UIMode setting
   * @see {@link UIMode}
   */
  public get mode(): UILayerMode {
    return this.modeInternal;
  }

  /**
   * Gets the current orientation state.
   * @returns The current orientation (horizontal or vertical)
   * @see {@link UIOrientation}
   */
  public get orientation(): UILayerOrientation {
    return this.orientationInternal;
  }

  /**
   * Sets the visibility and interaction mode and emits change event.
   * @param value - The new UIMode setting
   * @see {@link UIMode}
   */
  public set mode(value: UILayerMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      this.emit(UILayerEvent.MODE_CHANGED, this.modeInternal, this);
    }
  }

  /**
   * Internal method for resizing the layer and updating orientation.
   *
   * Updates the solver variables for width and height, resizes the scene wrapper,
   * and determines if the orientation has changed based on the new dimensions.
   * Emits an orientation change event if the orientation has changed.
   *
   * @param width - The new layer width
   * @param height - The new layer height
   * @protected
   */
  protected resizeInternal(width: number, height: number): void {
    this.solverWrapperInternal.suggestVariableValue(this.wVariable, width);
    this.solverWrapperInternal.suggestVariableValue(this.hVariable, height);
    this.sceneWrapperInternal.resize(width, height);

    const orientation =
      width > height ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;

    if (orientation !== this.orientationInternal) {
      this.orientationInternal = orientation;
      this.emit(
        UILayerEvent.ORIENTATION_CHANGED,
        this.orientationInternal,
        this,
      );
    }
  }

  /**
   * Internal method for rendering the layer and its elements.
   *
   * Delegates rendering to the scene wrapper if the layer is not hidden.
   * This method is called during the rendering loop to update and draw
   * all elements contained within the layer.
   *
   * @param renderer - The WebGL renderer instance
   * @param deltaTime - Time elapsed since the last frame in seconds
   * @protected
   */
  protected renderInternal(renderer: WebGLRenderer, deltaTime: number): void {
    if (isUIModeVisible(this.mode)) {
      this.emit(UILayerEvent.RENDERING, renderer, deltaTime, this);
      this.sceneWrapperInternal.render(renderer);
    }

    this.solverWrapperInternal.dirty = false;
    this.inputWrapperInternal.dirty = false;
  }
}
