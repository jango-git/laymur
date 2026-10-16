import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { assertValidNumber } from "../../miscellaneous/asserts.js";
import type { UILayerElement, UIPointElement } from "../../miscellaneous/shared.js";
import { UIPriority } from "../../miscellaneous/UIPriority.js";
import type { UISolverWrapperView } from "../../wrappers/UISolverWrapper/UISolverWrapper.Internal.js";
import type { UIAnchorOptions } from "./UIAnchor.Internal.js";
import { ANCHOR_DEFAULT_NAME, ANCHOR_DEFAULT_X, ANCHOR_DEFAULT_Y } from "./UIAnchor.Internal.js";

/** Point in 2D space with constraint-based positioning */
export class UIAnchor implements UILayerElement, UIPointElement {
  /** Identifier for debugging */
  public name: string;

  /** Solver variable for x coordinate */
  public readonly xVariable: number;

  /** Solver variable for y coordinate */
  public readonly yVariable: number;

  protected readonly solverWrapper: UISolverWrapperView;

  private destroyedInternal = false;

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

    this.layer.addElement(this);
    this.solverWrapper = this.layer.solverWrapper;
    this.xVariable = this.solverWrapper.createVariable(x, UIPriority.P7);
    this.yVariable = this.solverWrapper.createVariable(y, UIPriority.P7);
    this.name = options?.name ?? ANCHOR_DEFAULT_NAME;
  }

  /**
   * Whether the element is removed from its layer. An element is removed by its own
   * `destroy` or together with its layer.
   */
  public get destroyed(): boolean {
    return this.destroyedInternal;
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
    this.assertNotDestroyed("UIAnchor.x");
    assertValidNumber(value, "UIAnchor.x");
    this.solverWrapper.suggestVariableValue(this.xVariable, value);
  }

  /** Y coordinate relative to layer origin (bottom-left) */
  public set y(value: number) {
    this.assertNotDestroyed("UIAnchor.y");
    assertValidNumber(value, "UIAnchor.y");
    this.solverWrapper.suggestVariableValue(this.yVariable, value);
  }

  /**
   * Removes element from its layer together with the constraints that refer to it.
   * Does nothing if the element is already destroyed.
   */
  public destroy(): void {
    if (this.destroyedInternal) {
      return;
    }
    this.destroyedInternal = true;
    this.layer.destroyConstraintsUsingVariables(this.getSolverVariables());
    this.destroyInternal();
    this.layer.removeElement(this);
  }

  /** Solver variables of the element; constraints that use any of them are destroyed with it */
  protected getSolverVariables(): number[] {
    return [this.xVariable, this.yVariable];
  }

  /** Frees what the element holds; called once, after its constraints are destroyed */
  protected destroyInternal(): void {
    this.solverWrapper.removeVariable(this.yVariable);
    this.solverWrapper.removeVariable(this.xVariable);
  }

  /**
   * Throws if the element is destroyed.
   * @param subject Name of the changed property for the error message
   */
  protected assertNotDestroyed(subject: string): void {
    if (this.destroyedInternal) {
      throw new Error(`${subject}: element is destroyed`);
    }
  }
}
