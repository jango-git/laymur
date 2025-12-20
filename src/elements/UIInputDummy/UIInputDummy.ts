import { MathUtils } from "three";
import type { UILayer } from "../../layers/UILayer";
import type { UIArea } from "../../miscellaneous/area/UIArea";
import { UIAreaRectangle } from "../../miscellaneous/area/UIAreaRectangle";
import type { UIPlaneElement } from "../../miscellaneous/asserts";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../../miscellaneous/asserts";
import { UIInputEvent } from "../../miscellaneous/UIInputEvent";
import { isUIModeInteractive, UIMode } from "../../miscellaneous/UIMode";
import { UIPriority } from "../../miscellaneous/UIPriority";
import type { UIInputWrapperInterface } from "../../wrappers/UIInputWrapper.Internal";
import { UIAnchor } from "../UIAnchor/UIAnchor";
import type { UIInputDummyOptions } from "./UIInputDummy.Internal";
import {
  DUMMY_DEFAULT_HEIGHT,
  DUMMY_DEFAULT_MODE,
  DUMMY_DEFAULT_WIDTH,
  DUMMY_DEFAULT_Z_INDEX,
} from "./UIInputDummy.Internal";

/** Rectangular area with dimensions but no rendering */
export class UIInputDummy extends UIAnchor implements UIPlaneElement {
  /** Shape defining interactive region in normalized coordinates */
  public interactionArea: UIArea;

  /** Solver variable for width */
  public readonly wVariable: number;

  /** Solver variable for height */
  public readonly hVariable: number;

  protected modeInternal: UIMode;
  protected readonly inputWrapper: UIInputWrapperInterface;
  private readonly catcherHandler: number;
  private lastPointerInside = false;

  /**
   * Creates a new UIInputDummy instance.
   *
   * @param layer - Layer containing this element
   * @param options - Configuration options
   */
  constructor(layer: UILayer, options?: Partial<UIInputDummyOptions>) {
    const w = options?.width ?? DUMMY_DEFAULT_WIDTH;
    const h = options?.height ?? DUMMY_DEFAULT_HEIGHT;

    assertValidPositiveNumber(w, "UIInputDummy.constructor.width");
    assertValidPositiveNumber(h, "UIInputDummy.constructor.height");

    super(layer, options);

    this.interactionArea =
      options?.interactionArea ?? new UIAreaRectangle(0, 0, 1, 1);
    this.modeInternal = options?.mode ?? DUMMY_DEFAULT_MODE;
    this.inputWrapper = this.layer.inputWrapper;

    this.wVariable = this.solverWrapper.createVariable(w, UIPriority.P6);
    this.hVariable = this.solverWrapper.createVariable(h, UIPriority.P6);

    this.catcherHandler = this.inputWrapper.createInputCatcher(
      this.catchPointerDown,
      this.catchPointerMove,
      this.catchPointerUp,
      DUMMY_DEFAULT_Z_INDEX,
    );

    this.inputWrapper.setActive(
      this.catcherHandler,
      isUIModeInteractive(this.modeInternal),
    );
  }

  /** Width in world units */
  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  /** Height in world units */
  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  /** X coordinate of right edge */
  public get oppositeX(): number {
    return this.x + this.width;
  }

  /** Y coordinate of top edge */
  public get oppositeY(): number {
    return this.y + this.height;
  }

  /** X coordinate of horizontal center */
  public get centerX(): number {
    return this.x + this.width / 2;
  }

  /** Y coordinate of vertical center */
  public get centerY(): number {
    return this.y + this.height / 2;
  }

  /** Controls visibility and interactivity */
  public get mode(): UIMode {
    return this.modeInternal;
  }

  /** Rendering and input priority. Higher values on top. */
  public get zIndex(): number {
    return this.inputWrapper.getZIndex(this.catcherHandler);
  }

  /** Width in world units */
  public set width(value: number) {
    assertValidPositiveNumber(value, "UIInputDummy.width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  /** Height in world units */
  public set height(value: number) {
    assertValidPositiveNumber(value, "UIInputDummy.height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  /** X coordinate of right edge */
  public set oppositeX(value: number) {
    assertValidNumber(value, "UIInputDummy.oppositeX");
    this.x = value - this.width;
  }

  /** Y coordinate of top edge */
  public set oppositeY(value: number) {
    assertValidNumber(value, "UIInputDummy.oppositeY");
    this.y = value - this.height;
  }

  /** X coordinate of horizontal center */
  public set centerX(value: number) {
    assertValidNumber(value, "UIInputDummy.centerX");
    this.x = value - this.width / 2;
  }

  /** Y coordinate of vertical center */
  public set centerY(value: number) {
    assertValidNumber(value, "UIInputDummy.centerY");
    this.y = value - this.height / 2;
  }

  /** Controls visibility and interactivity */
  public set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      const newInteractivity = isUIModeInteractive(value);
      this.inputWrapper.setActive(this.catcherHandler, newInteractivity);
      this.modeInternal = value;
    }
  }

  /** Rendering and input priority. Higher values on top. */
  public set zIndex(value: number) {
    assertValidNumber(value, "UIInputDummy.zIndex");
    this.inputWrapper.setZIndex(this.catcherHandler, value);
  }

  /** Removes element and frees resources */
  public override destroy(): void {
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
    this.inputWrapper.destroyInputCatcher(this.catcherHandler);
    super.destroy();
  }

  protected readonly catchPointerDown = (
    x: number,
    y: number,
    identifier: number,
  ): boolean => {
    return this.handleInputEvent(x, y, identifier, UIInputEvent.PRESSED);
  };

  protected readonly catchPointerMove = (
    x: number,
    y: number,
    identifier: number,
  ): boolean => {
    return this.handleInputEvent(x, y, identifier, UIInputEvent.MOVED);
  };

  protected readonly catchPointerUp = (
    x: number,
    y: number,
    identifier: number,
  ): boolean => {
    return this.handleInputEvent(x, y, identifier, UIInputEvent.RELEASED);
  };

  protected handleInputEvent(
    x: number,
    y: number,
    identifier: number,
    inputEvent: UIInputEvent,
  ): boolean {
    assertValidNumber(x, "UIInputDummy.handleInputEvent.x");
    assertValidNumber(y, "UIInputDummy.handleInputEvent.y");
    assertValidNumber(identifier, "UIInputDummy.handleInputEvent.identifier");

    const isPointerInside = this.interactionArea.contains(
      MathUtils.mapLinear(x, this.x, this.oppositeX, 0, 1),
      MathUtils.mapLinear(y, this.y, this.oppositeY, 0, 1),
    );

    if (isPointerInside) {
      this.emit(inputEvent, x, y, identifier, this);
    }

    if (this.lastPointerInside && !isPointerInside) {
      this.emit(UIInputEvent.LEFT, x, y, identifier, this);
    } else if (!this.lastPointerInside && isPointerInside) {
      this.emit(UIInputEvent.ENTERED, x, y, identifier, this);
    }

    this.lastPointerInside = isPointerInside;
    return this.modeInternal === UIMode.INTERACTIVE_TRANSPARENT
      ? false
      : isPointerInside;
  }
}
