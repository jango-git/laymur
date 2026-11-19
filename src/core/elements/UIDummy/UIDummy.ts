import type { FerrsignView1 } from "ferrsign";
import { Ferrsign1 } from "ferrsign";
import { MathUtils, Matrix4 } from "three";

import type { UILayer } from "../../layers/UILayer/UILayer.js";
import type { UIArea } from "../../miscellaneous/area/UIArea.js";
import { UIAreaRectangle } from "../../miscellaneous/area/UIAreaRectangle.js";
import { assertValidNumber, assertValidPositiveNumber } from "../../miscellaneous/asserts.js";
import { computeTransformMatrix } from "../../miscellaneous/computeTransform.js";
import type { UIMask } from "../../miscellaneous/mask/UIMask.js";
import type { UIMicro } from "../../miscellaneous/micro/UIMicro.js";
import type { UIPlaneElement } from "../../miscellaneous/shared.js";
import { isUIModeInteractive, UIMode } from "../../miscellaneous/UIMode.js";
import { UIPriority } from "../../miscellaneous/UIPriority.js";
import type { UIInputWrapperView } from "../../wrappers/UIInputWrapper/UIInputWrapper.Internal.js";
import { UIAnchor } from "../UIAnchor/UIAnchor.js";
import type { UIDummyOptions, UIDummyPointerState, UIInputEventData } from "./UIDummy.Internal.js";
import {
  DUMMY_DEFAULT_HEIGHT,
  DUMMY_DEFAULT_MODE,
  DUMMY_DEFAULT_WIDTH,
  DUMMY_DEFAULT_Z_INDEX,
} from "./UIDummy.Internal.js";

const TEMP_INPUT_TRANSFORM = new Matrix4();

/** Rectangular area with dimensions but no rendering */
export class UIDummy extends UIAnchor implements UIPlaneElement {
  /** Shape defining interactive region in element-local space (0,0 = bottom-left, 1,1 = top-right) */
  public interactionArea: UIArea;

  /** Solver variable for width */
  public readonly wVariable: number;

  /** Solver variable for height */
  public readonly hVariable: number;

  protected modeInternal: UIMode;
  protected readonly inputWrapper: UIInputWrapperView;
  private readonly catcherHandler: number;
  private readonly pointers = new Map<number, UIDummyPointerState>();
  private maskInternal: UIMask | null = null;

  private readonly signalPointerPressedInternal = new Ferrsign1<UIInputEventData>();
  private readonly signalPointerMovedInternal = new Ferrsign1<UIInputEventData>();
  private readonly signalPointerReleasedInternal = new Ferrsign1<UIInputEventData>();
  private readonly signalPointerEnteredInternal = new Ferrsign1<UIInputEventData>();
  private readonly signalPointerLeftInternal = new Ferrsign1<UIInputEventData>();
  private readonly signalPointerCancelledInternal = new Ferrsign1<UIInputEventData>();
  private readonly signalPointerClickedInternal = new Ferrsign1<UIInputEventData>();
  private readonly signalPointerDraggedInternal = new Ferrsign1<UIInputEventData>();

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
    const zIndex = options?.zIndex ?? DUMMY_DEFAULT_Z_INDEX;
    assertValidNumber(zIndex, "UIDummy.constructor.options.zIndex");

    super(layer, options);

    this.interactionArea = options?.interactionArea ?? new UIAreaRectangle(0, 0, 1, 1);
    this.modeInternal = options?.mode ?? DUMMY_DEFAULT_MODE;
    this.inputWrapper = this.layer.inputWrapper;

    this.wVariable = this.solverWrapper.createVariable(w, UIPriority.P6);
    this.hVariable = this.solverWrapper.createVariable(h, UIPriority.P6);

    this.catcherHandler = this.inputWrapper.createInputCatcher(
      {
        catchPointerDown: this.catchPointerDown,
        catchPointerMove: this.catchPointerMove,
        catchPointerUp: this.catchPointerUp,
        catchPointerCancel: this.catchPointerCancel,
      },
      zIndex,
    );

    this.inputWrapper.setActive(this.catcherHandler, isUIModeInteractive(this.modeInternal));

    const mask = options?.mask ?? null;
    if (mask !== null) {
      this.assertValidMask(mask, "UIDummy.constructor.options.mask");
      this.maskInternal = mask;
      mask.attach(this);
    }
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

  /**
   * Rendering and input priority. Higher values on top; elements with equal values keep the
   * order of creation, a later one on top.
   */
  public get zIndex(): number {
    return this.inputWrapper.getZIndex(this.catcherHandler);
  }

  /** Mask clipping the element (input only, for an element that draws nothing); null for none */
  public get mask(): UIMask | null {
    return this.maskInternal;
  }

  /**
   * Signal fired when pointer is pressed over the element. An element that catches the press
   * (any interactive mode but INTERACTIVE_TRANSPARENT) holds the pointer until it is released:
   * then exactly one of `signalPointerClicked` and `signalPointerCancelled` follows.
   */
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

  /**
   * Signal fired when pointer leaves element. A released touch or pen and a cancelled pointer
   * leave too; a released mouse stays over the element.
   */
  public get signalPointerLeft(): FerrsignView1<UIInputEventData> {
    return this.signalPointerLeftInternal;
  }

  /** Signal fired when a pointer pressed on the element is released over it */
  public get signalPointerClicked(): FerrsignView1<UIInputEventData> {
    return this.signalPointerClickedInternal;
  }

  /** Signal fired when a pointer pressed on the element moves, over the element or not */
  public get signalPointerDragged(): FerrsignView1<UIInputEventData> {
    return this.signalPointerDraggedInternal;
  }

  /**
   * Signal fired when a press on the element ends without a click: released outside the
   * element, cancelled by the browser (a system gesture, scrolling, a popup), or the element
   * stopped taking input. Reset what was started on press. The position is the last known one.
   */
  public get signalPointerCancelled(): FerrsignView1<UIInputEventData> {
    return this.signalPointerCancelledInternal;
  }

  /** Unique depth of the element among the elements of the layer, derived from `zIndex` */
  protected get renderDepth(): number {
    return this.inputWrapper.getDepth(this.catcherHandler);
  }

  /** Width in world units */
  public set width(value: number) {
    this.assertNotDestroyed("UIDummy.width");
    assertValidPositiveNumber(value, "UIDummy.width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  /** Height in world units */
  public set height(value: number) {
    this.assertNotDestroyed("UIDummy.height");
    assertValidPositiveNumber(value, "UIDummy.height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  /** X coordinate of right edge */
  public set oppositeX(value: number) {
    this.assertNotDestroyed("UIDummy.oppositeX");
    assertValidNumber(value, "UIDummy.oppositeX");
    this.x = value - this.width;
  }

  /** Y coordinate of top edge */
  public set oppositeY(value: number) {
    this.assertNotDestroyed("UIDummy.oppositeY");
    assertValidNumber(value, "UIDummy.oppositeY");
    this.y = value - this.height;
  }

  /** X coordinate of horizontal center */
  public set centerX(value: number) {
    this.assertNotDestroyed("UIDummy.centerX");
    assertValidNumber(value, "UIDummy.centerX");
    this.x = value - this.width / 2;
  }

  /** Y coordinate of vertical center */
  public set centerY(value: number) {
    this.assertNotDestroyed("UIDummy.centerY");
    assertValidNumber(value, "UIDummy.centerY");
    this.y = value - this.height / 2;
  }

  /** Controls visibility and interactivity */
  public set mode(value: UIMode) {
    this.assertNotDestroyed("UIDummy.mode");
    if (this.modeInternal !== value) {
      const newInteractivity = isUIModeInteractive(value);
      this.inputWrapper.setActive(this.catcherHandler, newInteractivity);
      this.modeInternal = value;
      if (!newInteractivity) {
        this.dropPointers();
      }
    }
  }

  /**
   * Rendering and input priority. Higher values on top; elements with equal values keep the
   * order of creation, a later one on top.
   */
  public set zIndex(value: number) {
    this.assertNotDestroyed("UIDummy.zIndex");
    assertValidNumber(value, "UIDummy.zIndex");
    this.inputWrapper.setZIndex(this.catcherHandler, value);
  }

  /**
   * Mask clipping the element (input only, for an element that draws nothing); null for none
   * @throws If the mask is destroyed or belongs to another layer
   */
  public set mask(value: UIMask | null) {
    this.assertNotDestroyed("UIDummy.mask");
    if (value === this.maskInternal) {
      return;
    }
    if (value !== null) {
      this.assertValidMask(value, "UIDummy.mask");
    }
    this.maskInternal?.detach(this);
    this.maskInternal = value;
    value?.attach(this);
  }

  /**
   * Transform of the full element rectangle as drawn: maps the unit square
   * (0,0 = bottom-left, 1,1 = top-right) to layer coordinates.
   * @param includeMicro Whether to apply the micro transform, if the element has one
   * @param result Matrix to write into
   * @param depth Translation z of the result, such as the render depth
   * @returns The result matrix
   */
  public computeVisualTransform(includeMicro: boolean, result: Matrix4, depth = 0): Matrix4 {
    const micro = includeMicro ? this.getMicro() : undefined;
    if (micro === undefined) {
      return result.makeScale(this.width, this.height, 1).setPosition(this.x, this.y, depth);
    }
    return result.copy(
      computeTransformMatrix(
        this.x,
        this.y,
        this.width,
        this.height,
        depth,
        micro.x,
        micro.y,
        micro.anchorX,
        micro.anchorY,
        micro.scaleX,
        micro.scaleY,
        micro.rotation,
        micro.anchorMode,
      ),
    );
  }

  /**
   * Takes the mask off the element when the mask is destroyed. Works on a destroyed element
   * too, since a mask may be destroyed as part of destroying its own source.
   * @internal
   */
  public releaseMask(mask: UIMask): void {
    if (this.maskInternal === mask) {
      this.maskInternal = null;
    }
  }

  /**
   * Micro transform the element is drawn with. Elements that have one override this, so that
   * input and masks follow it; see {@link UIMicro.affectsInput}.
   */
  protected getMicro(): UIMicro | undefined {
    return undefined;
  }

  protected override getSolverVariables(): number[] {
    return [...super.getSolverVariables(), this.wVariable, this.hVariable];
  }

  protected override destroyInternal(): void {
    // A press held by the element still ends with a cancel, and its pointers leave it
    this.dropPointers();
    this.maskInternal?.detach(this);
    this.maskInternal = null;
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
    this.inputWrapper.destroyInputCatcher(this.catcherHandler);
    super.destroyInternal();
  }

  protected readonly catchPointerDown = (x: number, y: number, identifier: number): boolean => {
    const state = this.trackPointer(x, y, identifier, this.signalPointerPressedInternal);
    const caught = this.catches(state);
    if (caught) {
      state.pressed = true;
    }
    this.forgetIfUntracked(identifier, state);
    return caught;
  };

  protected readonly catchPointerMove = (x: number, y: number, identifier: number): boolean => {
    const state = this.trackPointer(x, y, identifier, this.signalPointerMovedInternal);
    if (state.pressed) {
      this.emitPointer(this.signalPointerDraggedInternal, state, identifier);
    }
    this.forgetIfUntracked(identifier, state);
    return this.catches(state);
  };

  /** A mouse stays over the element after the release; a touch or a pen leaves it */
  protected readonly catchPointerUp = (
    x: number,
    y: number,
    identifier: number,
    hovering: boolean,
  ): boolean => {
    const state = this.trackPointer(x, y, identifier, this.signalPointerReleasedInternal);
    const caught = this.catches(state);
    if (hovering) {
      this.endPress(identifier, state, state.inside);
      this.forgetIfUntracked(identifier, state);
    } else {
      this.endPointer(identifier, state, state.inside);
    }
    return caught;
  };

  /** Signals of a cancel carry the last known position */
  protected readonly catchPointerCancel = (identifier: number): void => {
    const state = this.pointers.get(identifier);
    if (state !== undefined) {
      this.endPointer(identifier, state, false);
    }
  };

  /**
   * Updates what the element knows of a pointer: fires the signal of the event if the pointer
   * is over the element, then entered or left if that changed.
   */
  private trackPointer(
    x: number,
    y: number,
    identifier: number,
    signal: Ferrsign1<UIInputEventData>,
  ): UIDummyPointerState {
    assertValidNumber(x, "UIDummy.trackPointer.x");
    assertValidNumber(y, "UIDummy.trackPointer.y");
    assertValidNumber(identifier, "UIDummy.trackPointer.identifier");

    let state = this.pointers.get(identifier);
    if (state === undefined) {
      state = { x, y, inside: false, pressed: false };
      this.pointers.set(identifier, state);
    }
    state.x = x;
    state.y = y;

    const inside = this.isInputPointInside(x, y);
    if (inside) {
      this.emitPointer(signal, state, identifier);
    }
    if (inside !== state.inside) {
      state.inside = inside;
      this.emitPointer(
        inside ? this.signalPointerEnteredInternal : this.signalPointerLeftInternal,
        state,
        identifier,
      );
    }
    return state;
  }

  /**
   * Ends a pointer: a press on the element ends as a click or as cancelled, and the pointer
   * leaves. The pointer is forgotten, so that a touch, which never comes back with the same
   * identifier, does not stay over the element.
   */
  private endPointer(identifier: number, state: UIDummyPointerState, clicked: boolean): void {
    this.pointers.delete(identifier);
    this.endPress(identifier, state, clicked);
    if (state.inside) {
      state.inside = false;
      this.emitPointer(this.signalPointerLeftInternal, state, identifier);
    }
  }

  /** Ends a press on the element, if there is one, as a click or as cancelled */
  private endPress(identifier: number, state: UIDummyPointerState, clicked: boolean): void {
    if (state.pressed) {
      state.pressed = false;
      this.emitPointer(
        clicked ? this.signalPointerClickedInternal : this.signalPointerCancelledInternal,
        state,
        identifier,
      );
    }
  }

  /** Ends every pointer, for an element that stops taking input */
  private dropPointers(): void {
    for (const [identifier, state] of [...this.pointers]) {
      this.endPointer(identifier, state, false);
    }
  }

  private forgetIfUntracked(identifier: number, state: UIDummyPointerState): void {
    if (!state.inside && !state.pressed) {
      this.pointers.delete(identifier);
    }
  }

  /** Whether the event stops at the element: catchers below do not get it */
  private catches(state: UIDummyPointerState): boolean {
    return state.inside && this.modeInternal !== UIMode.INTERACTIVE_TRANSPARENT;
  }

  private emitPointer(
    signal: Ferrsign1<UIInputEventData>,
    state: UIDummyPointerState,
    identifier: number,
  ): void {
    signal.emit({ x: state.x, y: state.y, identifier, element: this });
  }

  /**
   * Whether a point in layer coordinates hits the element: it is in the visible part of the
   * mask, if the mask clips input, and in the interaction area of the rectangle as drawn, when
   * micro affects input.
   */
  private isInputPointInside(x: number, y: number): boolean {
    const mask = this.maskInternal;
    if (mask !== null && mask.clipInput && !mask.containsPoint(x, y)) {
      return false;
    }

    const micro = this.getMicro();
    if (micro?.affectsInput !== true) {
      return this.interactionArea.contains(
        MathUtils.mapLinear(x, this.x, this.oppositeX, 0, 1),
        MathUtils.mapLinear(y, this.y, this.oppositeY, 0, 1),
      );
    }

    const e = this.computeVisualTransform(true, TEMP_INPUT_TRANSFORM).elements;
    const axisXx = e[0];
    const axisXy = e[1];
    const axisYx = e[4];
    const axisYy = e[5];
    const determinant = axisXx * axisYy - axisYx * axisXy;
    // Scaled to nothing: the element is not on screen
    if (Math.abs(determinant) < Number.EPSILON) {
      return false;
    }

    const deltaX = x - e[12];
    const deltaY = y - e[13];
    return this.interactionArea.contains(
      (deltaX * axisYy - axisYx * deltaY) / determinant,
      (axisXx * deltaY - deltaX * axisXy) / determinant,
    );
  }

  private assertValidMask(mask: UIMask, subject: string): void {
    if (mask.destroyed) {
      throw new Error(`${subject}: mask is destroyed`);
    }
    if (mask.layer !== this.layer) {
      throw new Error(`${subject}: mask belongs to another layer`);
    }
  }
}
