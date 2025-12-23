import { assertValidPositiveNumber } from "../../miscellaneous/asserts";
import type {
  UILayerElement,
  UIPlaneElement,
} from "../../miscellaneous/shared";
import { UIExpression } from "../../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint";
import type { UIWidthConstraintOptions } from "./UIWidthConstraint.Internal";

/** Fixes element width to constant value */
export class UIWidthConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;

  /** Current width value */
  private widthInternal: number;

  /**
   * @param element Element to constrain
   * @param options Width configuration. Defaults to element's current width.
   */
  constructor(
    private readonly element: UIPlaneElement & UILayerElement,
    options: Partial<UIWidthConstraintOptions> = {},
  ) {
    if (options.width !== undefined) {
      assertValidPositiveNumber(
        options.width,
        "UIWidthConstraint.constructor.options.width",
      );
    }

    super(element.layer, options);

    this.widthInternal = options.width ?? element.width;
    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0, [[this.element.wVariable, 1]]),
      new UIExpression(this.widthInternal),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /** Current width in world units */
  public get width(): number {
    return this.widthInternal;
  }

  /** Updates width */
  public set width(value: number) {
    assertValidPositiveNumber(value, "UIWidthConstraint.width");
    if (this.widthInternal !== value) {
      this.widthInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(value),
      );
    }
  }
}
