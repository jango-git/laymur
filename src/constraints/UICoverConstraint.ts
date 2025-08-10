// import { Constraint, Expression, Operator } from "@lume/kiwi";
// import { UIElement } from "../elements/UIElement";
// import type { UILayer } from "../layers/UILayer";
// import { assertSameLayer } from "../miscellaneous/asserts";

// import {
//   resolveOrientation,
//   UIOrientation,
// } from "../miscellaneous/UIOrientation";
// import { UIConstraint } from "./UIConstraint";

// /**
//  * Default anchor value (0.5 = center) for cover constraint alignment
//  */

// const DEFAULT_ANCHOR = 0.5;

// /**
//  * Configuration options for cover constraints.
//  */
// export interface UICoverOptions {
//   /** Whether to force equal height (true) or allow stretching (false) */
//   isStrict: boolean;
//   /** Horizontal anchor point (0-1) for alignment between elements */
//   horizontalAnchor: number;
//   /** Vertical anchor point (0-1) for alignment between elements */
//   verticalAnchor: number;
//   /** Screen orientation when this constraint should be active */
//   orientation: UIOrientation;
// }

// /**
//  * Constraint that makes an element cover another element or layer.
//  *
//  * The covering element will:
//  * - Be aligned with the covered element using the specified anchors
//  * - Have at least the same width and height as the covered element
//  * - Optionally maintain strict proportions
//  *
//  * This is similar to CSS's "cover" object-fit behavior.
//  */
// export class UICoverConstraint extends UIConstraint {
//   /** The configuration options for this constraint */
//   private readonly options: UICoverOptions;

//   /** Constraint for X-axis alignment */
//   private constraintX?: Constraint;
//   /** Constraint for Y-axis alignment */
//   private constraintY?: Constraint;
//   /** Constraint for width relationship */
//   private constraintW?: Constraint;
//   /** Constraint for height relationship */
//   private constraintH?: Constraint;
//   /** Optional constraint for maintaining strict proportions */
//   private constraintStrict?: Constraint;

//   /**
//    * Creates a new cover constraint.
//    *
//    * @param elementOne - The element or layer to be covered (the reference)
//    * @param elementTwo - The element that will cover the reference
//    * @param options - Configuration options
//    */
//   constructor(
//     private readonly elementOne: UIElement | UILayer,
//     private readonly elementTwo: UIElement,
//     options: Partial<UICoverOptions> = {},
//   ) {
//     assertSameLayer(elementOne, elementTwo);
//     super(
//       elementTwo.layer,
//       new Set(
//         elementOne instanceof UIElement
//           ? [elementOne, elementTwo]
//           : [elementTwo],
//       ),
//     );

//     this.options = {
//       isStrict: options.isStrict ?? true,
//       horizontalAnchor: options.horizontalAnchor ?? DEFAULT_ANCHOR,
//       verticalAnchor: options.verticalAnchor ?? DEFAULT_ANCHOR,
//       orientation: resolveOrientation(options.orientation),
//     };

//     if (
//       this.options.orientation === UIOrientation.ALWAYS ||
//       this.options.orientation === this.layer.orientation
//     ) {
//       this.buildConstraints();
//     }
//   }

//   /**
//    * Destroys this constraint, removing it from the constraint system.
//    */
//   public override destroy(): void {
//     this.destroyConstraints();
//     super.destroy();
//   }

//   /**
//    * Internal method to disable this constraint when orientation changes.
//    *
//    * @param orientation - The new screen orientation
//    * @internal
//    */
//   public ["disableConstraintInternal"](orientation: UIOrientation): void {
//     if (
//       this.options.orientation !== UIOrientation.ALWAYS &&
//       orientation !== this.options.orientation
//     ) {
//       this.destroyConstraints();
//     }
//   }

//   /**
//    * Internal method to enable this constraint when orientation changes.
//    *
//    * @param orientation - The new screen orientation
//    * @internal
//    */
//   public ["enableConstraintInternal"](orientation: UIOrientation): void {
//     if (
//       this.options.orientation !== UIOrientation.ALWAYS &&
//       orientation === this.options.orientation
//     ) {
//       this.buildConstraints();
//     }
//   }

//   /**
//    * Builds and adds the cover constraints to the constraint solver.
//    *
//    * Creates five constraints:
//    * 1. X alignment between the elements
//    * 2. Y alignment between the elements
//    * 3. Width covering (elementTwo width ≥ elementOne width)
//    * 4. Height covering (elementTwo height ≥ elementOne height)
//    * 5. Optional strict proportions (if isStrict = false)
//    *
//    */
//   protected buildConstraints(): void {
//     this.constraintX = new Constraint(
//       new Expression(this.elementOne["xInternal"]).plus(
//         new Expression(this.elementOne["widthInternal"]).multiply(
//           this.options.horizontalAnchor,
//         ),
//       ),
//       Operator.Eq,
//       new Expression(this.elementTwo["xIndex"]).plus(
//         new Expression(this.elementTwo["widthInternal"]).multiply(
//           this.options.horizontalAnchor,
//         ),
//       ),
//     );

//     this.constraintY = new Constraint(
//       new Expression(this.elementOne["yInternal"]).plus(
//         new Expression(this.elementOne["heightInternal"]).multiply(
//           this.options.verticalAnchor,
//         ),
//       ),
//       Operator.Eq,
//       new Expression(this.elementTwo["yIndex"]).plus(
//         new Expression(this.elementTwo["heightInternal"]).multiply(
//           this.options.verticalAnchor,
//         ),
//       ),
//     );

//     this.constraintW = new Constraint(
//       new Expression(this.elementOne["widthInternal"]),
//       Operator.Eq,
//       new Expression(this.elementTwo["widthInternal"]),
//     );

//     this.constraintH = new Constraint(
//       new Expression(this.elementOne["heightInternal"]),
//       Operator.Eq,
//       new Expression(this.elementTwo["heightInternal"]),
//     );

//     this.layer["addConstraintInternal"](this, this.constraintX);
//     this.layer["addConstraintInternal"](this, this.constraintY);
//     this.layer["addConstraintInternal"](this, this.constraintW);
//     this.layer["addConstraintInternal"](this, this.constraintH);

//     if (!this.options.isStrict) {
//       this.constraintStrict = new Constraint(
//         new Expression(this.elementOne["heightInternal"]),
//         Operator.Eq,
//         new Expression(this.elementTwo["heightInternal"]),
//       );

//       this.layer["addConstraintInternal"](this, this.constraintStrict);
//     }
//   }

//   /**
//    * Removes all cover constraints from the constraint solver.
//    *
//    */
//   protected destroyConstraints(): void {
//     if (this.constraintX) {
//       this.layer["removeConstraintInternal"](this, this.constraintX);
//       this.constraintX = undefined;
//     }
//     if (this.constraintY) {
//       this.layer["removeConstraintInternal"](this, this.constraintY);
//       this.constraintY = undefined;
//     }
//     if (this.constraintW) {
//       this.layer["removeConstraintInternal"](this, this.constraintW);
//       this.constraintW = undefined;
//     }
//     if (this.constraintH) {
//       this.layer["removeConstraintInternal"](this, this.constraintH);
//       this.constraintH = undefined;
//     }
//     if (this.constraintStrict) {
//       this.layer["removeConstraintInternal"](this, this.constraintStrict);
//       this.constraintStrict = undefined;
//     }
//   }
// }
