import { assertValidPositiveNumber } from "../../miscellaneous/asserts";
import type {
  UILayerElement,
  UIPlaneElement,
} from "../../miscellaneous/shared";
import { UIExpression } from "../../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint/UISingleParameterConstraint";
import type { UIHeightConstraintOptions } from "./UIHeightConstraint.Internal";

/** Fixes element height to constant value */
export class UIHeightConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;

  /** Current height value */
  private heightInternal: number;

  /**
   * @param element Element to constrain
   * @param options Height configuration. Defaults to element's current height.
   */
  constructor(
    private readonly element: UIPlaneElement & UILayerElement,
    options: Partial<UIHeightConstraintOptions> = {},
  ) {
    if (options.height !== undefined) {
      assertValidPositiveNumber(
        options.height,
        "UIHeightConstraint.constructor.options.height",
      );
    }

    super(element.layer, options);

    this.heightInternal = options.height ?? element.height;
    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0, [[this.element.hVariable, 1]]),
      new UIExpression(this.heightInternal),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /** Current height in world units */
  public get height(): number {
    return this.heightInternal;
  }

  /** Updates height */
  public set height(value: number) {
    assertValidPositiveNumber(value, "UIHeightConstraint.height");
    if (this.heightInternal !== value) {
      this.heightInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(value),
      );
    }
  }
}
