import type { WebGLRenderer } from "three";
import { Matrix4, Quaternion, Vector3 } from "three";
import type { UILayerInputListener } from "../layers/UILayer";
import { UILayerEvent, type UILayer } from "../layers/UILayer";
import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../miscellaneous/asserts";
import type { UIPropertyType } from "../miscellaneous/generic-plane/shared";
import { UIMicro } from "../miscellaneous/micro/UIMicro";
import { UIMicroAnchorMode } from "../miscellaneous/micro/UIMicroAnchorMode";
import { UIInputEvent } from "../miscellaneous/UIInputEvent";
import { UIMode } from "../miscellaneous/UIMode";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISceneWrapperInterface } from "../miscellaneous/UISceneWrapperInterface";
import { UITransparencyMode } from "../miscellaneous/UITransparencyMode";
import { UIAnchor } from "./UIAnchor";

const TEMP_POSITION = new Vector3();
const TEMP_QUATERNION = new Quaternion();
const TEMP_SCALE = new Vector3();
const TEMP_MATRIX = new Matrix4();
const Z_AXIS = new Vector3(0, 0, 1);

/**
 * Abstract base class for all renderable UI elements with dimensions.
 *
 * UIElement serves as the fundamental building block for all other UI elements
 * that need to be visually rendered. It extends UIAnchor with dimensional properties
 * and integrates with the Three.js rendering system through shader-based planes. This class
 * provides essential functionality for positioning, sizing, rendering, visibility,
 * z-index management, and user interaction.
 *
 * @see {@link UIAnchor} - Base class providing position functionality
 * @see {@link UIPlaneElement} - Interface defining dimensional element behavior
 * @see {@link UIMicro} - Micro-optimization utilities
 */
export abstract class UIElement
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

  /** Internal storage for the current visibility/interaction mode. */
  protected modeInternal: UIMode = UIMode.VISIBLE;

  /** Internal storage for the transparency rendering mode. */
  protected transparencyInternal: UITransparencyMode = UITransparencyMode.BLEND;

  /** Internal storage for the z-index (depth) value. */
  protected zIndexInternal = 0;

  /** Optional input listener for handling user interactions when in interactive mode. */
  protected listener?: UILayerInputListener;

  protected isPointerInside = false;

  /** Client API for interacting with the scene wrapper (rendering system). */
  protected readonly sceneWrapper: UISceneWrapperInterface;

  /** Handle to the plane object in the rendering system. */
  protected readonly planeHandler: number;

  protected transparencyDirty = false;

  /**
   * Creates a new UIElement instance with rendering capabilities.
   *
   * @param layer - The UI layer that contains this element
   * @param x - Initial x-coordinate position
   * @param y - Initial y-coordinate position
   * @param width - Initial width dimension (must be positive)
   * @param height - Initial height dimension (must be positive)
   * @param source - GLSL shader source code for rendering this element
   * @param uniforms - Uniform values to pass to the shader
   * @throws Will throw an error if width or height are not valid positive numbers
   * @see {@link assertValidPositiveNumber}
   */
  constructor(
    layer: UILayer,
    x: number,
    y: number,
    width: number,
    height: number,
    source: string,
    uniforms: Record<string, UIPropertyType>,
  ) {
    assertValidPositiveNumber(width, "UIElement.constructor.width");
    assertValidPositiveNumber(height, "UIElement.constructor.height");

    super(layer, x, y);
    this.layer.on(UILayerEvent.WILL_RENDER, this.onWillRender, this);

    this.wVariable = this.solverWrapper.createVariable(width, UIPriority.P6);
    this.hVariable = this.solverWrapper.createVariable(height, UIPriority.P6);

    this.sceneWrapper = this.layer.sceneWrapper;
    this.planeHandler = this.sceneWrapper.createPlane(
      source,
      uniforms,
      this.transparencyInternal,
      false,
    );
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
   * Gets the current z-index (depth) value.
   * @returns The current z-index value
   */
  public get zIndex(): number {
    return this.zIndexInternal;
  }

  /**
   * The right edge X coordinate of this element (x + width).
   */
  public get oppositeX(): number {
    return this.x + this.width;
  }

  /**
   * The bottom edge Y coordinate of this element (y + height).
   */
  public get oppositeY(): number {
    return this.y + this.height;
  }

  /**
   * The X coordinate of the center of this element.
   */
  public get centerX(): number {
    return this.x + this.width / 2;
  }

  /**
   * The Y coordinate of the center of this element.
   */
  public get centerY(): number {
    return this.y + this.height / 2;
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
   * Gets the current transparency rendering mode.
   * @returns The current transparency mode
   * @see {@link UITransparencyMode}
   */
  public get transparency(): UITransparencyMode {
    return this.transparencyInternal;
  }

  /**
   * Sets the width value through the solver system.
   * @param value - The new width dimension (must be positive)
   * @throws Will throw an error if value is not a valid positive number
   * @see {@link assertValidPositiveNumber}
   */
  public set width(value: number) {
    assertValidPositiveNumber(value, "UIElement.width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  /**
   * Sets the height value through the solver system.
   * @param value - The new height dimension (must be positive)
   * @throws Will throw an error if value is not a valid positive number
   * @see {@link assertValidPositiveNumber}
   */
  public set height(value: number) {
    assertValidPositiveNumber(value, "UIElement.height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  /**
   * Sets the z-index (depth) value for rendering order and input handling.
   * @param value - The new z-index value
   * @throws Will throw an error if value is not a valid number
   * @see {@link assertValidNumber}
   */
  public set zIndex(value: number) {
    assertValidNumber(value, "UIElement.zIndex");
    this.zIndexInternal = value;
    if (this.listener) {
      this.listener.zIndex = this.zIndexInternal;
    }
  }

  /**
   * The right edge X coordinate of this element (x + width).
   */
  public set oppositeX(value: number) {
    this.x = value - this.width;
  }

  /**
   * The bottom edge Y coordinate of this element (y + height).
   */
  public set oppositeY(value: number) {
    this.y = value - this.height;
  }

  /**
   * The X coordinate of the center of this element.
   */
  public set centerX(value: number) {
    this.x = value - this.width / 2;
  }

  /**
   * The Y coordinate of the center of this element.
   */
  public set centerY(value: number) {
    this.y = value - this.height / 2;
  }

  /**
   * Sets the current visibility and interaction mode.
   * @param value - The new UIMode setting
   * @see {@link UIMode}
   */
  public set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      if (value === UIMode.INTERACTIVE) {
        this.listener = {
          catchPointerDown: this.catchPointerDown,
          catchPointerMove: this.catchPointerMove,
          catchPointerUp: this.catchPointerUp,
          zIndex: this.zIndexInternal,
        };
        this.layer["subscribeInputCatcher"](this.listener);
      } else if (this.modeInternal === UIMode.INTERACTIVE && this.listener) {
        this.layer["unsubscribeInputCatcher"](this.listener);
        this.listener = undefined;
      }

      this.modeInternal = value;
      this.sceneWrapper.setVisibility(
        this.planeHandler,
        value !== UIMode.HIDDEN,
      );
    }
  }

  /**
   * Sets the transparency rendering mode.
   * @param value - The new transparency mode
   * @see {@link UITransparencyMode}
   */
  public set transparency(value: UITransparencyMode) {
    if (this.transparencyInternal !== value) {
      this.transparencyInternal = value;
      this.transparencyDirty = true;
      // this.sceneWrapper.setTransparency(this.planeHandler, value);
    }
  }

  /**
   * Destroys the UI element by cleaning up all associated resources.
   *
   * This method removes the element from the rendering scene, cleans up
   * dimension solver variables, removes input listeners, and calls the parent
   * destroy method to clean up position variables. After calling this method,
   * the element should not be used anymore.
   */
  public override destroy(): void {
    this.layer.off(UILayerEvent.WILL_RENDER, this.onWillRender, this);
    if (this.listener) {
      this.layer["unsubscribeInputCatcher"](this.listener);
    }
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
    this.sceneWrapper.destroyPlane(this.planeHandler);
    super.destroy();
  }

  protected readonly catchPointerDown = (
    x: number,
    y: number,
    identifier: number,
  ): boolean => {
    return this.handleInputEvent(x, y, identifier, UIInputEvent.DOWN);
  };

  protected readonly catchPointerMove = (
    x: number,
    y: number,
    identifier: number,
  ): boolean => {
    return this.handleInputEvent(x, y, identifier, UIInputEvent.MOVE);
  };

  protected readonly catchPointerUp = (
    x: number,
    y: number,
    identifier: number,
  ): boolean => {
    return this.handleInputEvent(x, y, identifier, UIInputEvent.UP);
  };

  protected handleInputEvent(
    x: number,
    y: number,
    identifier: number,
    inputEvent: UIInputEvent,
  ): boolean {
    const isPointerInside =
      x > this.x && x < this.oppositeX && y > this.y && y < this.oppositeY;

    if (isPointerInside) {
      this.emit(inputEvent, x, y, identifier, this);
    }

    if (this.isPointerInside && !isPointerInside) {
      this.emit(UIInputEvent.LEAVE, x, y, identifier, this);
    } else if (!this.isPointerInside && isPointerInside) {
      this.emit(UIInputEvent.ENTER, x, y, identifier, this);
    }

    this.isPointerInside = isPointerInside;
    return isPointerInside;
  }

  /**
   * Called before each render frame to update the element's transform matrix.
   * Applies micro-transformations (position, rotation, scale, anchor) and updates
   * the rendering system with the final transformation matrix.
   * @param renderer - The WebGL renderer (unused in base implementation)
   * @param deltaTime - Time since last frame in seconds (unused in base implementation)
   */
  protected onWillRender(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by UILayer event interface but not used in base implementation
    renderer: WebGLRenderer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by UILayer event interface but not used in base implementation
    deltaTime: number,
  ): void {
    if (this.solverWrapper.dirty || this.micro.dirty) {
      this.micro.dirty = false;

      const micro = this.micro;

      const width = this.width * micro.scaleX;
      const height = this.height * micro.scaleY;

      const anchorOffsetX = micro.anchorX * width;
      const anchorOffsetY = micro.anchorY * height;

      const cos = Math.cos(micro.rotation);
      const sin = Math.sin(micro.rotation);

      const rotatedAnchorX = anchorOffsetX * cos - anchorOffsetY * sin;
      const rotatedAnchorY = anchorOffsetX * sin + anchorOffsetY * cos;

      if (micro.anchorMode === UIMicroAnchorMode.POSITION_ROTATION_SCALE) {
        TEMP_POSITION.x = this.x + micro.x - rotatedAnchorX;
        TEMP_POSITION.y = this.y + micro.y - rotatedAnchorY;
      } else {
        const rawAnchorOffsetX = micro.anchorX * this.width;
        const rawAnchorOffsetY = micro.anchorY * this.height;
        TEMP_POSITION.x = this.x + rawAnchorOffsetX - rotatedAnchorX + micro.x;
        TEMP_POSITION.y = this.y + rawAnchorOffsetY - rotatedAnchorY + micro.y;
      }

      TEMP_POSITION.z = this.zIndexInternal;
      TEMP_SCALE.x = width;
      TEMP_SCALE.y = height;
      TEMP_QUATERNION.setFromAxisAngle(Z_AXIS, micro.rotation);

      TEMP_MATRIX.compose(TEMP_POSITION, TEMP_QUATERNION, TEMP_SCALE);
      this.sceneWrapper.setTransform(this.planeHandler, TEMP_MATRIX);
    }
  }
}
