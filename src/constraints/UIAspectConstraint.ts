// import { Constraint, Expression } from "@lume/kiwi";
// import type { UIElement } from "../elements/UIElement";

// import {
//   resolveOrientation,
//   UIOrientation,
// } from "../miscellaneous/UIOrientation";
// import { UIConstraint } from "./UIConstraint";
// import type { UIConstraintPower } from "./UIConstraintPower";
// import { convertPowerToStrength, resolvePower } from "./UIConstraintPower";
// import type { UIConstraintRule } from "./UIConstraintRule";
// import { convertRuleToOperator, resolveRule } from "./UIConstraintRule";

// /**
//  * Configuration options for aspect ratio constraints.
//  */
// export interface UIAspectOptions {
//   /** The aspect ratio to maintain (width / height) */
//   aspect: number;
//   /** Priority level for this constraint */
//   power: UIConstraintPower;
//   /** Rule for the constraint relationship (equal, less than, greater than) */
//   rule: UIConstraintRule;
//   /** Screen orientation when this constraint should be active */
//   orientation: UIOrientation;
// }

// /**
//  * Constraint that maintains a specific aspect ratio for a UI element.
//  *
//  * The aspect ratio is defined as width divided by height (w/h).
//  * This constraint ensures that an element maintains its proportions
//  * during layout calculations.
//  */
// export class UIAspectConstraint extends UIConstraint {
//   /** The configuration options for this constraint */
//   private readonly options: UIAspectOptions;
//   /** The Kiwi.js constraint object */
//   private constraint?: Constraint;

//   /**
//    * Creates a new aspect ratio constraint.
//    *
//    * @param element - The UI element to constrain
//    * @param options - Configuration options
//    */
//   constructor(
//     private readonly element: UIElement,
//     options: Partial<UIAspectOptions> = {},
//   ) {
//     super(element.layer, new Set([element]));

//     this.options = {
//       aspect: options.aspect ?? this.element.width / this.element.height,
//       power: resolvePower(options.power),
//       rule: resolveRule(options.rule),
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
//    * @param newOrientation - The new screen orientation
//    * @internal
//    */
//   public ["disableConstraintInternal"](newOrientation: UIOrientation): void {
//     if (
//       this.options.orientation !== UIOrientation.ALWAYS &&
//       newOrientation !== this.options.orientation
//     ) {
//       this.destroyConstraints();
//     }
//   }

//   /**
//    * Internal method to enable this constraint when orientation changes.
//    *
//    * @param newOrientation - The new screen orientation
//    * @internal
//    */
//   public ["enableConstraintInternal"](newOrientation: UIOrientation): void {
//     if (
//       this.options.orientation !== UIOrientation.ALWAYS &&
//       newOrientation === this.options.orientation
//     ) {
//       this.buildConstraints();
//     }
//   }

//   /**
//    * Builds and adds the aspect ratio constraint to the constraint solver.
//    *
//    * Creates a constraint expression in the form: width - (height * aspect) = 0
//    * This ensures that width/height = aspect.
//    *
//    */
//   protected buildConstraints(): void {
//     const expression = new Expression(this.element["widthInternal"]).plus(
//       new Expression(this.element["heightInternal"]).multiply(
//         -this.options.aspect,
//       ),
//     );

//     this.constraint = new Constraint(
//       expression,
//       convertRuleToOperator(this.options.rule),
//       0,
//       convertPowerToStrength(this.options.power),
//     );

//     this.layer["addConstraintInternal"](this, this.constraint);
//   }

//   /**
//    * Removes the aspect ratio constraint from the constraint solver.
//    *
//    */
//   protected destroyConstraints(): void {
//     if (this.constraint) {
//       this.layer["removeConstraintInternal"](this, this.constraint);
//       this.constraint = undefined;
//     }
//   }
// }
