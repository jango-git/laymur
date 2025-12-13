import { MathUtils } from "three";
import type { UILayer } from "../layers/UILayer";
import type { UIArea } from "../miscellaneous/area/UIArea";
import { UIAreaRectangle } from "../miscellaneous/area/UIAreaRectangle";
import {
  assertValidNumber,
  assertValidPositiveNumber,
  type UIPlaneElement,
} from "../miscellaneous/asserts";
import { UIInputEvent } from "../miscellaneous/UIInputEvent";
import { isUIModeInteractive, UIMode } from "../miscellaneous/UIMode";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UIInputWrapperInterface } from "../wrappers/UIInputWrapper.Internal";
import { UIAnchor } from "./UIAnchor";
import {
  DUMMY_DEFAULT_HEIGHT,
  DUMMY_DEFAULT_MODE,
  DUMMY_DEFAULT_WIDTH,
  DUMMY_DEFAULT_Z_INDEX,
  type UIDummyOptions,
} from "./UIDummy.Internal";

/**
 * Rectangular area with position and dimensions but without rendering.
 * Supports custom interaction areas and input events.
 */
export class UIDummy extends UIAnchor implements UIPlaneElement {
  public interactionArea: UIArea;

  /** Solver variable for width. */
  public readonly wVariable: number;

  /** Solver variable for height. */
  public readonly hVariable: number;

  protected modeInternal: UIMode;
  private readonly inputWrapper: UIInputWrapperInterface;
  private readonly catcherHandler: number;
  private lastPointerInside = false;

  constructor(layer: UILayer, options?: Partial<UIDummyOptions>) {
    const w = options?.width ?? DUMMY_DEFAULT_WIDTH;
    const h = options?.height ?? DUMMY_DEFAULT_HEIGHT;

    assertValidPositiveNumber(w, "UIDummy.constructor.width");
    assertValidPositiveNumber(h, "UIDummy.constructor.height");

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
  }

  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  public get oppositeX(): number {
    return this.x + this.width;
  }

  public get oppositeY(): number {
    return this.y + this.height;
  }

  public get centerX(): number {
    return this.x + this.width / 2;
  }

  public get centerY(): number {
    return this.y + this.height / 2;
  }

  public get mode(): UIMode {
    return this.modeInternal;
  }

  public get zIndex(): number {
    return this.inputWrapper.getZIndex(this.catcherHandler);
  }

  public set width(value: number) {
    assertValidPositiveNumber(value, "UIDummy.width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  public set height(value: number) {
    assertValidPositiveNumber(value, "UIDummy.height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  public set oppositeX(value: number) {
    assertValidNumber(value, "UIDummy.oppositeX");
    this.x = value - this.width;
  }

  public set oppositeY(value: number) {
    assertValidNumber(value, "UIDummy.oppositeY");
    this.y = value - this.height;
  }

  public set centerX(value: number) {
    assertValidNumber(value, "UIDummy.centerX");
    this.x = value - this.width / 2;
  }

  public set centerY(value: number) {
    assertValidNumber(value, "UIDummy.centerY");
    this.y = value - this.height / 2;
  }

  public set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      const newInteractivity = isUIModeInteractive(value);
      this.inputWrapper.setActive(this.catcherHandler, newInteractivity);
      this.modeInternal = value;
    }
  }

  public set zIndex(value: number) {
    assertValidNumber(value, "UIElement.zIndex");
    this.inputWrapper.setZIndex(this.catcherHandler, value);
  }

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
    assertValidNumber(x, "UIDummy.handleInputEvent.x");
    assertValidNumber(y, "UIDummy.handleInputEvent.y");
    assertValidNumber(identifier, "UIDummy.handleInputEvent.identifier");

    const isPointerInside = this.interactionArea.contains(
      MathUtils.lerp(this.x, this.oppositeX, x),
      MathUtils.lerp(this.y, this.oppositeY, x),
    );

    if (isPointerInside) {
      this.emit(inputEvent, x, y, identifier, this);
    }

    if (this.lastPointerInside && !isPointerInside) {
      this.emit(UIInputEvent.LEAVE, x, y, identifier, this);
    } else if (!this.lastPointerInside && isPointerInside) {
      this.emit(UIInputEvent.ENTER, x, y, identifier, this);
    }

    this.lastPointerInside = isPointerInside;
    return this.modeInternal === UIMode.INTERACTIVE_TRANSPARENT
      ? false
      : isPointerInside;
  }
}
