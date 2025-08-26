import { Eventail } from "eventail";
import type { WebGLRenderer } from "three";
import { UIMode } from "../miscellaneous/UIMode";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISceneWrapperClientAPI } from "../miscellaneous/UISceneWrapperClientAPI";
import { UISceneWrapper } from "../wrappers/UISceneWrapper";
import { UISolverWrapper } from "../wrappers/UISolverWrapper";

/**
 * Interface for handling input events within UI layers.
 *
 * @public
 */
export interface UILayerInputListener {
  /**
   * Handles click events at the specified coordinates.
   *
   * @param x - The x-coordinate of the click
   * @param y - The y-coordinate of the click
   * @returns True if the click was handled, false otherwise
   */
  catchClick(x: number, y: number): boolean;
}

/**
 * Events that can be emitted by UI layers.
 *
 * @public
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
 * Base class for UI layout containers with constraint solving and rendering.
 *
 * Manages UI elements, handles constraint-based layout, and coordinates
 * rendering and interaction. Each layer has its own constraint solver
 * and scene graph.
 *
 * @public
 */
export abstract class UILayer extends Eventail {
  /** Optional name identifier for the layer. */
  public name = "";

  /**
   * Solver variable for the x-coordinate position.
   */
  public readonly xVariable: number;

  /**
   * Solver variable for the y-coordinate position.
   */
  public readonly yVariable: number;

  /**
   * Solver variable for the width dimension.
   */
  public readonly wVariable: number;

  /**
   * Solver variable for the height dimension.
   */
  public readonly hVariable: number;

  /**
   * Constraint solver wrapper for layout calculations.
   */
  protected readonly solverWrapper = new UISolverWrapper();

  /**
   * 3D scene wrapper for rendering and element hierarchy.
   */
  protected readonly sceneWrapper: UISceneWrapper;

  /** Current visibility/interaction mode. */
  protected modeInternal: UIMode = UIMode.VISIBLE;

  /** Current orientation state. */
  protected orientationInternal: UIOrientation;

  /** Input listeners for handling user interactions, sorted by z-index. */

  private readonly inputListeners: {
    zIndex: number;
    listener: UILayerInputListener;
  }[] = [];

  /**
   * Creates a new UILayer instance with specified dimensions.
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
   * Gets the current width from the constraint solver.
   *
   * @returns The current layer width in pixels
   */
  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  /**
   * Gets the current height from the constraint solver.
   *
   * @returns The current layer height in pixels
   */
  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  /**
   * Gets the current visibility and interaction mode.
   *
   * @returns The current UIMode setting
   */
  public get mode(): UIMode {
    return this.modeInternal;
  }

  /**
   * Gets the current orientation state.
   *
   * @returns The current orientation (horizontal or vertical)
   */
  public get orientation(): UIOrientation {
    return this.orientationInternal;
  }

  /**
   * Sets the visibility and interaction mode.
   *
   * @param value - The new UIMode setting
   */
  public set mode(value: UIMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      this.emit(UILayerEvent.MODE_CHANGE, this.modeInternal, this);
    }
  }

  /**
   * Resizes the layer and updates orientation.
   * Emits orientation change event if orientation changes.
   *
   * @param width - The new layer width
   * @param height - The new layer height
   *
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
   * Renders the layer and its elements.
   * Delegates to scene wrapper if layer is not hidden.
   *
   * @param renderer - The WebGL renderer instance
   * @param deltaTime - Time elapsed since the last frame in seconds
   *
   * @protected
   */
  protected renderInternal(renderer: WebGLRenderer, deltaTime: number): void {
    if (this.mode !== UIMode.HIDDEN) {
      this.emit(UILayerEvent.WILL_RENDER, renderer, deltaTime, this);
      this.sceneWrapper.render(renderer);
    }
  }

  /**
   * Handles click events on the layer.
   * Tests elements in reverse z-order until one handles the click.
   * Only processes clicks when layer is in interactive mode.
   *
   * @param x - The x-coordinate of the click
   * @param y - The y-coordinate of the click
   *
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
   * Provides access to the constraint solver wrapper.
   *
   * @returns The constraint solver wrapper instance
   *
   * @internal
   */
  protected ["getSolverWrapperInternal"](): UISolverWrapper {
    return this.solverWrapper;
  }

  /**
   * Provides access to the 3D scene wrapper.
   *
   * @returns The scene wrapper instance
   *
   * @internal
   */
  protected ["getSceneWrapperClientAPI"](): UISceneWrapperClientAPI {
    return this.sceneWrapper;
  }

  /**
   * Registers an input listener for pointer events.
   * Higher z-index listeners are processed first.
   *
   * @param listener - The input listener to register
   * @param zIndex - The z-index priority for event handling order
   *
   * @throws Error if the listener is already registered
   *
   * @internal
   */

  protected ["listenPointerInput"](
    listener: UILayerInputListener,
    zIndex: number,
  ): void {
    if (this.inputListeners.find((l) => l.listener === listener)) {
      throw new Error("Listener already exists");
    }
    this.inputListeners.push({ zIndex, listener });
  }

  /**
   * Updates the z-index of an existing input listener.
   *
   * @param listener - The input listener to update
   * @param zIndex - The new z-index priority
   *
   * @throws Error if the listener is not found
   *
   * @internal
   */

  protected ["setListenerZIndex"](
    listener: UILayerInputListener,
    zIndex: number,
  ): void {
    const index = this.inputListeners.findIndex((l) => l.listener === listener);
    if (index === -1) {
      throw new Error("Listener not found");
    }
    this.inputListeners[index].zIndex = zIndex;
  }

  /**
   * Unregisters an input listener.
   * The listener will no longer receive click events.
   *
   * @param listener - The input listener to remove
   *
   * @throws Error if the listener is not found
   *
   * @internal
   */

  protected ["unlistenPointerInput"](listener: UILayerInputListener): void {
    const index = this.inputListeners.findIndex((l) => l.listener === listener);
    if (index === -1) {
      throw new Error("Listener not found");
    }
    this.inputListeners.splice(index, 1);
  }
}
