import type { UILayer } from "../../layers/UILayer/UILayer";
import { assertValidNumber } from "../../miscellaneous/asserts";
import type { UILayerElement, UIPointElement } from "../../miscellaneous/shared";
import { UIPriority } from "../../miscellaneous/UIPriority";
import type { UISolverWrapperView } from "../../wrappers/UISolverWrapper/UISolverWrapper.Internal";
import type { UIAnchorOptions } from "./UIAnchor.Internal";
import { ANCHOR_DEFAULT_NAME, ANCHOR_DEFAULT_X, ANCHOR_DEFAULT_Y } from "./UIAnchor.Internal";

/** Point in 2D space with constraint-based positioning */
export class UIAnchor implements UILayerElement, UIPointElement {
  /** Identifier for debugging */
  public name: string;

  /** Solver variable for x coordinate */
  public readonly xVariable: number;

  /** Solver variable for y coordinate */
  public readonly yVariable: number;

  protected readonly solverWrapper: UISolverWrapperView;

  /**
   * Creates a new UIAnchor instance.
   *
   * @param layer - Layer containing this anchor
   * @param options - Configuration options
   */
  constructor(
    public readonly layer: UILayer,
    options?: Partial<UIAnchorOptions>,
  ) {
    const x = options?.x ?? ANCHOR_DEFAULT_X;
    const y = options?.y ?? ANCHOR_DEFAULT_Y;
    assertValidNumber(x, "UIAnchor.constructor.options.x");
    assertValidNumber(y, "UIAnchor.constructor.options.y");

    this.solverWrapper = this.layer.solverWrapper;
    this.xVariable = this.solverWrapper.createVariable(x, UIPriority.P7);
    this.yVariable = this.solverWrapper.createVariable(y, UIPriority.P7);
    this.name = options?.name ?? ANCHOR_DEFAULT_NAME;
  }

  /** X coordinate relative to layer origin (bottom-left) */
  public get x(): number {
    return this.solverWrapper.readVariableValue(this.xVariable);
  }

  /** Y coordinate relative to layer origin (bottom-left) */
  public get y(): number {
    return this.solverWrapper.readVariableValue(this.yVariable);
  }

  /** X coordinate relative to layer origin (bottom-left) */
  public set x(value: number) {
    assertValidNumber(value, "UIAnchor.x");
    this.solverWrapper.suggestVariableValue(this.xVariable, value);
  }

  /** Y coordinate relative to layer origin (bottom-left) */
  public set y(value: number) {
    assertValidNumber(value, "UIAnchor.y");
    this.solverWrapper.suggestVariableValue(this.yVariable, value);
  }

  /** Removes anchor and frees resources */
  public destroy(): void {
    this.solverWrapper.removeVariable(this.yVariable);
    this.solverWrapper.removeVariable(this.xVariable);
  }
}
