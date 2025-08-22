import { Eventail } from "eventail";
import type { WebGLRenderer } from "three";
import { UIMode } from "../miscellaneous/UIMode";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISceneWrapperClientAPI } from "../miscellaneous/UISceneWrapperClientAPI";
import { UISceneWrapper } from "../wrappers/UISceneWrapper";
import { UISolverWrapper } from "../wrappers/UISolverWrapper";

export interface UILayerInputListener {
  catchClick(x: number, y: number): boolean;
}

/**
 * Events that can be emitted by UI layers.
 */
export enum UILayerEvent {
  /** Emitted when the layer's orientation changes between horizontal and vertical. */
  ORIENTATION_CHANGE = "orientation_change",
  /** Emitted when the layer's visibility/interaction mode changes. */
  MODE_CHANGE = "mode_change",
  /** Emitted before the layer is rendered. */
  WILL_RENDER = "will_render",
}

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
export abstract class UILayer extends Eventail {
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
  protected readonly solverWrapper = new UISolverWrapper();

  /**
   * 3D scene wrapper for managing rendering and element hierarchy.
   * @see {@link UISceneWrapper}
   */
  protected readonly sceneWrapper: UISceneWrapper;

  /** Internal storage for the current visibility/interaction mode. */
  protected modeInternal: UIMode = UIMode.VISIBLE;

  /** Internal storage for the current orientation state. */
  protected orientationInternal: UIOrientation;

  private readonly inputListeners: {
    zIndex: number;
    listener: UILayerInputListener;
  }[] = [];

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
  constructor(w: number, h: number) {
    super();
    this.sceneWrapper = new UISceneWrapper(w, h);
    this.xVariable = this.solverWrapper.createVariable(0, UIPriority.P0);
    this.yVariable = this.solverWrapper.createVariable(0, UIPriority.P0);
    this.wVariable = this.solverWrapper.createVariable(w, UIPriority.P0);
    this.hVariable = this.solverWrapper.createVariable(h, UIPriority.P0);
    this.orientationInternal =
      w > h ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;
  }

  /**
   * Gets the current width value from the constraint solver.
   * @returns The current layer width in pixels
   */
  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  /**
   * Gets the current height value from the constraint solver.
   * @returns The current layer height in pixels
   */
  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
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
   * Gets the current orientation state.
   * @returns The current orientation (horizontal or vertical)
   * @see {@link UIOrientation}
   */
  public get orientation(): UIOrientation {
    return this.orientationInternal;
  }

  /**
   * Sets the visibility and interaction mode and emits change event.
   * @param value - The new UIMode setting
   * @see {@link UIMode}
   */
  public set mode(value: UIMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      this.emit(UILayerEvent.MODE_CHANGE, this.modeInternal, this);
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
    this.solverWrapper.suggestVariableValue(this.wVariable, width);
    this.solverWrapper.suggestVariableValue(this.hVariable, height);
    this.sceneWrapper.resize(width, height);

    const orientation =
      width > height ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;

    if (orientation !== this.orientationInternal) {
      this.orientationInternal = orientation;
      this.emit(
        UILayerEvent.ORIENTATION_CHANGE,
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
    if (this.mode !== UIMode.HIDDEN) {
      this.emit(UILayerEvent.WILL_RENDER, renderer, deltaTime, this);
      this.sceneWrapper.render(renderer);
    }
  }

  /**
   * Internal method for handling click events on the layer.
   *
   * Processes click events by testing elements in reverse z-order (top to bottom)
   * until one handles the click. Only processes clicks when the layer is in
   * interactive mode.
   *
   * @param x - The x-coordinate of the click
   * @param y - The y-coordinate of the click
   * @protected
   */
  protected pointerClickInternal(x: number, y: number): void {
    if (this.mode === UIMode.INTERACTIVE) {
      this.inputListeners.sort((a, b) => b.zIndex - a.zIndex);
      for (const listener of this.inputListeners) {
        if (listener.listener.catchClick(x, y)) {
          return;
        }
      }
    }
  }

  /**
   * Internal method for accessing the constraint solver wrapper.
   *
   * Provides access to the layer's constraint solver for elements and
   * constraints that need to create variables or constraints.
   *
   * @returns The constraint solver wrapper instance
   */
  protected ["getSolverWrapperInternal"](): UISolverWrapper {
    return this.solverWrapper;
  }

  /**
   * Internal method for accessing the 3D scene wrapper.
   *
   * Provides access to the layer's scene management system for elements
   * that need to be added to or removed from the 3D scene.
   *
   * @returns The scene wrapper instance
   */
  protected ["getSceneWrapperClientAPI"](): UISceneWrapperClientAPI {
    return this.sceneWrapper;
  }

  protected ["listenPointerInput"](
    listener: UILayerInputListener,
    zIndex: number,
  ): void {
    if (this.inputListeners.find((l) => l.listener === listener)) {
      throw new Error("Listener already exists");
    }
    this.inputListeners.push({ zIndex, listener });
  }

  protected ["setListenerZIndex"](
    listener: UILayerInputListener,
    zIndex: number,
  ): void {
    if (this.inputListeners.findIndex((l) => l.listener === listener) === -1) {
      throw new Error("Listener not found");
    }
    this.inputListeners.push({ zIndex, listener });
  }

  protected ["unlistenPointerInput"](listener: UILayerInputListener): void {
    const index = this.inputListeners.findIndex((l) => l.listener === listener);
    if (index === -1) {
      throw new Error("Listener not found");
    }
    this.inputListeners.splice(index, 1);
  }
}
