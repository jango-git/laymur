import type { WebGLRenderer } from "three";
import { Matrix4, Quaternion, Vector3 } from "three";
import type { UILayerInputListener } from "../layers/UILayer";
import { UILayerEvent, type UILayer } from "../layers/UILayer";
import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../miscellaneous/asserts";
import { UIInputEvent } from "../miscellaneous/UIInputEvent";
import { UIMicro } from "../miscellaneous/UIMicro";
import { UIMicroAnchorMode } from "../miscellaneous/UIMicroAnchorMode";
import { UIMode } from "../miscellaneous/UIMode";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISceneWrapperClientAPI } from "../miscellaneous/UISceneWrapperClientAPI";
import { UITransparencyMode } from "../miscellaneous/UITransparencyMode";
import { UIAnchor } from "./UIAnchor";
const position = new Vector3();
const quaternion = new Quaternion();
const scale = new Vector3();
const matrix = new Matrix4();
const axis = new Vector3(0, 0, 1);

function isElementClicked(x: number, y: number, element: UIElement): boolean {
  return (
    x > element.x &&
    x < element.x + element.width &&
    y > element.y &&
    y < element.y + element.height
  );
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

  protected transparencyInternal: UITransparencyMode = UITransparencyMode.CLIP;

  protected zIndexInternal = 0;

  protected listener?: UILayerInputListener;

  protected readonly sceneWrapper: UISceneWrapperClientAPI;
  protected readonly planeHandler: number;

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
    source: string,
    uniforms: Record<string, unknown>,
  ) {
    assertValidPositiveNumber(width, "UIElement width");
    assertValidPositiveNumber(height, "UIElement height");

    super(layer, x, y);
    this.layer.on(UILayerEvent.WILL_RENDER, this.onWillRender, this);

    this.wVariable = this.solverWrapper.createVariable(width, UIPriority.P6);
    this.hVariable = this.solverWrapper.createVariable(height, UIPriority.P6);

    this.sceneWrapper = layer["getSceneWrapperClientAPI"]();
    this.planeHandler = this.sceneWrapper.createPlane(source, uniforms);
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

  public get zIndex(): number {
    return this.zIndexInternal;
  }

  /**
   * Gets the current visibility and interaction mode.
   * @returns The current UIMode setting
   * @see {@link UIMode}
   */
  public get mode(): UIMode {
    return this.modeInternal;
  }

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

  public set zIndex(value: number) {
    assertValidNumber(value, "UIElement zIndex");
    if (this.listener) {
      this.layer["setListenerZIndex"](this.listener, value);
    }
  }

  /**
   * Sets the current visibility and interaction mode.
   * @param value - The new UIMode setting
   * @see {@link UIMode}
   */
  public set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      if (value === UIMode.INTERACTIVE) {
        this.listener = { catchClick: this.onClick };
        this.layer["listenPointerInput"](this.listener, this.zIndexInternal);
      } else if (this.modeInternal === UIMode.INTERACTIVE && this.listener) {
        this.layer["unlistenPointerInput"](this.listener);
        this.listener = undefined;
      }

      this.modeInternal = value;
      this.sceneWrapper.setVisibility(
        this.planeHandler,
        value !== UIMode.HIDDEN,
      );
    }
  }

  public set transparency(value: UITransparencyMode) {
    this.transparencyInternal = value;
    this.sceneWrapper.setTransparency(this.planeHandler, value);
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
    this.layer.off(UILayerEvent.WILL_RENDER, this.onWillRender, this);
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
    this.sceneWrapper.destroyPlane(this.planeHandler);
    super.destroy();
  }

  protected readonly onClick = (x: number, y: number): boolean => {
    const clicked = isElementClicked(x, y, this);
    if (clicked) {
      this.emit(UIInputEvent.CLICK, x, y, this);
    }
    return clicked;
  };

  protected onWillRender(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by UILayer event interface but not used in base implementation
    renderer: WebGLRenderer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by UILayer event interface but not used in base implementation
    deltaTime: number,
  ): void {
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
      position.x = this.x + micro.x - rotatedAnchorX;
      position.y = this.y + micro.y - rotatedAnchorY;
    } else {
      const rawAnchorOffsetX = micro.anchorX * this.width;
      const rawAnchorOffsetY = micro.anchorY * this.height;
      position.x = this.x + rawAnchorOffsetX - rotatedAnchorX + micro.x;
      position.y = this.y + rawAnchorOffsetY - rotatedAnchorY + micro.y;
    }

    position.z = this.zIndexInternal;
    scale.x = width;
    scale.y = height;
    quaternion.setFromAxisAngle(axis, micro.rotation);

    matrix.compose(position, quaternion, scale);
    this.sceneWrapper.setTransform(this.planeHandler, matrix);
  }
}
