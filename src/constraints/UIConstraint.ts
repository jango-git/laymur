// import type { UIAnchor } from "../elements/UIAnchor";
// import type { UIElement } from "../elements/UIElement";
// import type { UILayer } from "../layers/UILayer";

// import type { UIOrientation } from "../miscellaneous/UIOrientation";

// /**
//  * Abstract base class for all UI constraints in the system.
//  *
//  * Constraints control the layout of UI elements by establishing relationships
//  * between their properties (position, size) and other elements or the screen.
//  *
//  * The constraint system uses Kiwi.js under the hood for solving the constraint system.
//  * Each constraint adds specific rules to the solver that determine element positioning.
//  */
// export abstract class UIConstraint {
//   /**
//    * Optional identifier for the constraint.
//    * Useful for debugging and identifying constraints.
//    */
//   public name = "";

//   /**
//    * Creates a new UI constraint.
//    *
//    * @param layer - The UI layer that will manage this constraint
//    * @param elements - The set of UI elements affected by this constraint
//    */
//   constructor(
//     public readonly layer: UILayer,
//     elements: Set<UIElement | UIAnchor>,
//   ) {
//     this.layer["addUIConstraintInternal"](this, elements);
//   }

//   /**
//    * Destroys the constraint, removing it from the layer and solver.
//    * This should be called when the constraint is no longer needed.
//    */
//   public destroy(): void {
//     this.layer["removeUIConstraintInternal"](this);
//   }

//   /**
//    * Internal method called when the constraint should be disabled.
//    * Typically called when the screen orientation changes and the
//    * constraint is not applicable for the current orientation.
//    *
//    * @param orientation - The current UI orientation
//    * @internal
//    */
//   public abstract ["disableConstraintInternal"](
//     orientation: UIOrientation,
//   ): void;

//   /**
//    * Internal method called when the constraint should be enabled.
//    * Typically called when the screen orientation changes and the
//    * constraint becomes applicable for the current orientation.
//    *
//    * @param orientation - The current UI orientation
//    * @internal
//    */
//   public abstract ["enableConstraintInternal"](
//     orientation: UIOrientation,
//   ): void;
// }
