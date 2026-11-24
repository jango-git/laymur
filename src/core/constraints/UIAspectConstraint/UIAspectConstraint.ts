import { assertNotDestroyed, assertValidPositiveNumber } from "../../miscellaneous/asserts.js";
import type {
  UIContentAspectElement,
  UILayerElement,
  UIPlaneElement,
} from "../../miscellaneous/shared.js";
import { isUIContentAspectElement } from "../../miscellaneous/shared.js";
import { UIExpression } from "../../miscellaneous/UIExpression.js";
import { assertValidConstraintElement } from "../constraintAsserts.js";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint/UISingleParameterConstraint.js";
import type { UIAspectConstraintOptions } from "./UIAspectConstraint.Internal.js";

/**
 * Maintains element aspect ratio (width = height * aspect). Without an aspect in the options it
 * follows the content of an element that has its own aspect, such as `UIText` or `UIImage`, and
 * keeps the current ratio of any other element.
 */
export class UIAspectConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;

  /** Current aspect ratio */
  private aspectInternal: number;
  /** Element whose content aspect the constraint follows, null once an aspect is set */
  private followedContent: UIContentAspectElement | null = null;

  /**
   * @param element Element to constrain
   * @param options Aspect configuration. Without an aspect, the content aspect of the element or
   *   its current ratio.
   */
  constructor(
    public readonly element: UIPlaneElement & UILayerElement,
    options: Partial<UIAspectConstraintOptions> = {},
  ) {
    if (process.env.NODE_ENV !== "production" && options.aspect !== undefined) {
      assertValidPositiveNumber(options.aspect, "UIAspectConstraint.constructor.options.aspect");
    }

    super(assertValidConstraintElement(element, "UIAspectConstraint.constructor"), options);

    if (options.aspect !== undefined) {
      this.aspectInternal = options.aspect;
    } else if (isUIContentAspectElement(element)) {
      this.aspectInternal = element.contentAspect;
      this.followedContent = element;
      element.signalContentAspectChanged.on(this.onContentAspectChanged);
    } else {
      this.aspectInternal = element.width / element.height;
    }
    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(0),
      this.relation,
      this.priority,
      this.enabled,
      this,
    );
  }

  /** Current aspect ratio (width/height) */
  public get aspect(): number {
    return this.aspectInternal;
  }

  /** Updates aspect ratio. The constraint stops following the content aspect of the element. */
  public set aspect(value: number) {
    assertNotDestroyed(this, "constraint", "UIAspectConstraint.aspect");
    assertValidPositiveNumber(value, "UIAspectConstraint.aspect");
    this.stopFollowingContent();
    this.applyAspect(value);
  }

  protected override destroyInternal(): void {
    this.stopFollowingContent();
    super.destroyInternal();
  }

  private applyAspect(value: number): void {
    if (this.aspectInternal !== value) {
      this.aspectInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  private stopFollowingContent(): void {
    this.followedContent?.signalContentAspectChanged.off(this.onContentAspectChanged);
    this.followedContent = null;
  }

  /** Builds constraint expression: width - (height * aspect) = 0 */
  private buildLHS(): UIExpression {
    return new UIExpression(0, [
      [this.element.wVariable, 1],
      [this.element.hVariable, -this.aspectInternal],
    ]);
  }

  private readonly onContentAspectChanged = (aspect: number): void => {
    this.applyAspect(aspect);
  };
}
