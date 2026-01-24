import type { FerrsignView1 } from "ferrsign";
import { Ferrsign1 } from "ferrsign";
import { MathUtils } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import type { UIArea } from "../../miscellaneous/area/UIArea";
import { UIAreaRectangle } from "../../miscellaneous/area/UIAreaRectangle";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../../miscellaneous/asserts";
import type { UIPlaneElement } from "../../miscellaneous/shared";
import { isUIModeInteractive, UIMode } from "../../miscellaneous/UIMode";
import { UIPriority } from "../../miscellaneous/UIPriority";
import type { UIInputWrapperInterface } from "../../wrappers/UIInputWrapper/UIInputWrapper.Internal";
import { UIAnchor } from "../UIAnchor/UIAnchor";
import type { UIDummyOptions, UIInputEventData } from "./UIDummy.Internal";
import {
  DUMMY_DEFAULT_HEIGHT,
  DUMMY_DEFAULT_MODE,
  DUMMY_DEFAULT_WIDTH,
  DUMMY_DEFAULT_Z_INDEX,
} from "./UIDummy.Internal";

/** Rectangular area with dimensions but no rendering */
export class UIDummy extends UIAnchor implements UIPlaneElement {
  /** Shape defining interactive region in element-local space (0,0 = bottom-left, 1,1 = top-right) */
  public interactionArea: UIArea;

  /** Solver variable for width */
  public readonly wVariable: number;

  /** Solver variable for height */
  public readonly hVariable: number;

  protected modeInternal: UIMode;
  protected readonly inputWrapper: UIInputWrapperInterface;
  private readonly catcherHandler: number;
  private wasPointerInside = false;

  private readonly signalPointerPressedInternal =
    new Ferrsign1<UIInputEventData>();
  private readonly signalPointerMovedInternal =
    new Ferrsign1<UIInputEventData>();
  private readonly signalPointerReleasedInternal =
    new Ferrsign1<UIInputEventData>();
  private readonly signalPointerEnteredInternal =
    new Ferrsign1<UIInputEventData>();
  private readonly signalPointerLeftInternal =
    new Ferrsign1<UIInputEventData>();

  /**
   * Creates a new UIDummy instance.
   *
   * @param layer - Layer containing this element
   * @param options - Configuration options
   */
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

  /** Signal fired when pointer is pressed */
  public get signalPointerPressed(): FerrsignView1<UIInputEventData> {
    return this.signalPointerPressedInternal;
  }

  /** Signal fired when pointer is moved */
  public get signalPointerMoved(): FerrsignView1<UIInputEventData> {
    return this.signalPointerMovedInternal;
  }

  /** Signal fired when pointer is released */
  public get signalPointerReleased(): FerrsignView1<UIInputEventData> {
    return this.signalPointerReleasedInternal;
  }

  /** Signal fired when pointer enters element */
  public get signalPointerEntered(): FerrsignView1<UIInputEventData> {
    return this.signalPointerEnteredInternal;
  }

  /** Signal fired when pointer leaves element */
  public get signalPointerLeft(): FerrsignView1<UIInputEventData> {
    return this.signalPointerLeftInternal;
  }

  /** Width in world units */
  public set width(value: number) {
    assertValidPositiveNumber(value, "UIDummy.width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  /** Height in world units */
  public set height(value: number) {
    assertValidPositiveNumber(value, "UIDummy.height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  /** X coordinate of right edge */
  public set oppositeX(value: number) {
    assertValidNumber(value, "UIDummy.oppositeX");
    this.x = value - this.width;
  }

  /** Y coordinate of top edge */
  public set oppositeY(value: number) {
    assertValidNumber(value, "UIDummy.oppositeY");
    this.y = value - this.height;
  }

  /** X coordinate of horizontal center */
  public set centerX(value: number) {
    assertValidNumber(value, "UIDummy.centerX");
    this.x = value - this.width / 2;
  }

  /** Y coordinate of vertical center */
  public set centerY(value: number) {
    assertValidNumber(value, "UIDummy.centerY");
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
    assertValidNumber(value, "UIDummy.zIndex");
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
    return this.handleInputEvent(
      x,
      y,
      identifier,
      this.signalPointerPressedInternal,
    );
  };

  protected readonly catchPointerMove = (
    x: number,
    y: number,
    identifier: number,
  ): boolean => {
    return this.handleInputEvent(
      x,
      y,
      identifier,
      this.signalPointerMovedInternal,
    );
  };

  protected readonly catchPointerUp = (
    x: number,
    y: number,
    identifier: number,
  ): boolean => {
    return this.handleInputEvent(
      x,
      y,
      identifier,
      this.signalPointerReleasedInternal,
    );
  };

  protected handleInputEvent(
    x: number,
    y: number,
    identifier: number,
    signal: Ferrsign1<UIInputEventData>,
  ): boolean {
    assertValidNumber(x, "UIDummy.handleInputEvent.x");
    assertValidNumber(y, "UIDummy.handleInputEvent.y");
    assertValidNumber(identifier, "UIDummy.handleInputEvent.identifier");

    const isPointerInside = this.interactionArea.contains(
      MathUtils.mapLinear(x, this.x, this.oppositeX, 0, 1),
      MathUtils.mapLinear(y, this.y, this.oppositeY, 0, 1),
    );

    if (isPointerInside) {
      signal.emit({ x, y, identifier, element: this });
    }

    if (this.wasPointerInside && !isPointerInside) {
      this.signalPointerLeftInternal.emit({ x, y, identifier, element: this });
    } else if (!this.wasPointerInside && isPointerInside) {
      this.signalPointerEnteredInternal.emit({
        x,
        y,
        identifier,
        element: this,
      });
    }

    this.wasPointerInside = isPointerInside;
    return (
      this.modeInternal !== UIMode.INTERACTIVE_TRANSPARENT && isPointerInside
    );
  }
}
