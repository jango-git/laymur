import { assertValidPositiveNumber } from "../../miscellaneous/asserts";
import type { UILayerElement, UIPlaneElement } from "../../miscellaneous/shared";
import { UIExpression } from "../../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint/UISingleParameterConstraint";
import type { UIAspectConstraintOptions } from "./UIAspectConstraint.Internal";

/** Maintains element aspect ratio (width = height * aspect) */
export class UIAspectConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;

  /** Current aspect ratio */
  private aspectInternal: number;

  /**
   * @param element Element to constrain
   * @param options Aspect configuration. Defaults to element's current ratio.
   */
  constructor(
    private readonly element: UIPlaneElement & UILayerElement,
    options: Partial<UIAspectConstraintOptions> = {},
  ) {
    if (options.aspect !== undefined) {
      assertValidPositiveNumber(options.aspect, "UIAspectConstraint.constructor.options.aspect");
    }

    super(element.layer, options);

    this.aspectInternal = options.aspect ?? element.width / element.height;
    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(0),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /** Current aspect ratio (width/height) */
  public get aspect(): number {
    return this.aspectInternal;
  }

  /** Updates aspect ratio */
  public set aspect(value: number) {
    assertValidPositiveNumber(value, "UIAspectConstraint.aspect");
    if (this.aspectInternal !== value) {
      this.aspectInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Builds constraint expression: width - (height * aspect) = 0 */
  private buildLHS(): UIExpression {
    return new UIExpression(0, [
      [this.element.wVariable, 1],
      [this.element.hVariable, -this.aspectInternal],
    ]);
  }
}
