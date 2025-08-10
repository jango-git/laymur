// import type { UIConstraintPower } from "../constraints/UIConstraintPower";
// import type { UIHorizontalDistanceOptions } from "../constraints/UIHorizontalDistanceConstraint";
// import { UIHorizontalDistanceConstraint } from "../constraints/UIHorizontalDistanceConstraint";
// import type { UIHorizontalProportionOptions } from "../constraints/UIHorizontalProportionConstraint";
// import { UIHorizontalProportionConstraint } from "../constraints/UIHorizontalProportionConstraint";
// import type { UIVerticalDistanceOptions } from "../constraints/UIVerticalDistanceConstraint";
// import { UIVerticalDistanceConstraint } from "../constraints/UIVerticalDistanceConstraint";
// import type { UIVerticalProportionOptions } from "../constraints/UIVerticalProportionConstraint";
// import { UIVerticalProportionConstraint } from "../constraints/UIVerticalProportionConstraint";
// import type { UIElement } from "../elements/UIElement";
// import type { UILayer } from "../layers/UILayer";
// import type { UIOrientation } from "../miscellaneous/UIOrientation";

// export interface UIConstraintStackBuilderOptions {
//   distance: number;
//   keepProportions: boolean;
//   keepAlignment: boolean;
//   power: UIConstraintPower;
//   orientation: UIOrientation;
// }

// export interface UIConstraintStackBuilderResult<
//   TDistance,
//   TProportion,
//   TCenter,
// > {
//   distanceConstraints: TDistance[];
//   proportionConstraints: TProportion[];
//   alignmentConstraints: TCenter[];
// }

// interface ConstraintConstructors<TDistance, TProportion, TCenter> {
//   distanceConstraint: new (
//     elementOne: UIElement | UILayer,
//     elementTwo: UIElement,
//     options:
//       | Partial<UIHorizontalDistanceOptions | UIVerticalDistanceOptions>
//       | undefined,
//   ) => TDistance;
//   proportionConstraint: new (
//     elementOne: UIElement | UILayer,
//     elementTwo: UIElement,
//     options:
//       | Partial<UIHorizontalProportionOptions | UIVerticalProportionOptions>
//       | undefined,
//   ) => TProportion;
//   centerDistanceConstraint: new (
//     elementOne: UIElement | UILayer,
//     elementTwo: UIElement,
//     options:
//       | Partial<UIHorizontalDistanceOptions | UIVerticalDistanceOptions>
//       | undefined,
//   ) => TCenter;
// }

// export class UIConstraintStackBuilder {
//   public static buildHorizontal(
//     elements: UIElement[],
//     options: Partial<UIConstraintStackBuilderOptions>,
//   ): UIConstraintStackBuilderResult<
//     UIHorizontalDistanceConstraint,
//     UIHorizontalProportionConstraint,
//     UIVerticalDistanceConstraint
//   > {
//     return this.buildStack(elements, options, {
//       distanceConstraint: UIHorizontalDistanceConstraint,
//       proportionConstraint: UIHorizontalProportionConstraint,
//       centerDistanceConstraint: UIVerticalDistanceConstraint,
//     });
//   }

//   public static buildVertical(
//     elements: UIElement[],
//     options: Partial<UIConstraintStackBuilderOptions>,
//   ): UIConstraintStackBuilderResult<
//     UIVerticalDistanceConstraint,
//     UIVerticalProportionConstraint,
//     UIHorizontalDistanceConstraint
//   > {
//     return this.buildStack(elements, options, {
//       distanceConstraint: UIVerticalDistanceConstraint,
//       proportionConstraint: UIVerticalProportionConstraint,
//       centerDistanceConstraint: UIHorizontalDistanceConstraint,
//     });
//   }

//   private static buildStack<TDistance, TProportion, TCenter>(
//     elements: UIElement[],
//     options: Partial<UIConstraintStackBuilderOptions>,
//     constructors: ConstraintConstructors<TDistance, TProportion, TCenter>,
//   ): UIConstraintStackBuilderResult<TDistance, TProportion, TCenter> {
//     const distances: TDistance[] = [];
//     const proportions: TProportion[] = [];
//     const centers: TCenter[] = [];

//     for (let i = 0; i < elements.length - 1; i++) {
//       const element = elements[i];
//       const nextElement = elements[i + 1];

//       distances.push(
//         new constructors.distanceConstraint(element, nextElement, {
//           anchorOne: 1,
//           anchorTwo: 0,
//           distance: options.distance,
//           power: options.power,
//           orientation: options.orientation,
//         }),
//       );

//       if (options.keepProportions !== false) {
//         proportions.push(
//           new constructors.proportionConstraint(element, nextElement, {
//             power: options.power,
//             orientation: options.orientation,
//           }),
//         );
//       }

//       if (options.keepAlignment !== false) {
//         centers.push(
//           new constructors.centerDistanceConstraint(element, nextElement, {
//             power: options.power,
//             anchorOne: 0,
//             anchorTwo: 0,
//             orientation: options.orientation,
//           }),
//         );
//       }
//     }

//     return {
//       distanceConstraints: distances,
//       proportionConstraints: proportions,
//       alignmentConstraints: centers,
//     };
//   }
// }
