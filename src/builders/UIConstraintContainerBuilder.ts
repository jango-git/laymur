// import type { UIConstraintPower } from "../constraints/UIConstraintPower";
// import { UIHorizontalDistanceConstraint } from "../constraints/UIHorizontalDistanceConstraint";
// import { UIVerticalDistanceConstraint } from "../constraints/UIVerticalDistanceConstraint";
// import type { UIElement } from "../elements/UIElement";
// import type { UIOrientation } from "../miscellaneous/UIOrientation";

// export enum UIConstraintContainerDirection {
//   FROM_LEFT_TOP,
//   FROM_LEFT_BOTTOM,
// }

// export interface UIConstraintContainerBuilderOptions {
//   direction: UIConstraintContainerDirection;
//   power: UIConstraintPower;
//   orientation: UIOrientation;
// }

// export class UIConstraintContainerBuilder {
//   public static build(
//     container: UIElement,
//     elementOne: UIElement,
//     elementTwo: UIElement,
//     options: Partial<UIConstraintContainerBuilderOptions> = {},
//   ): {
//     horizontalDistances: UIHorizontalDistanceConstraint[];
//     verticalDistances: UIVerticalDistanceConstraint[];
//   } {
//     const direction =
//       options.direction ?? UIConstraintContainerDirection.FROM_LEFT_TOP;

//     const horizontalDistances: UIHorizontalDistanceConstraint[] = [];
//     const verticalDistances: UIVerticalDistanceConstraint[] = [];

//     horizontalDistances.push(
//       new UIHorizontalDistanceConstraint(container, elementOne, {
//         anchorOne: 0,
//         anchorTwo: 0,
//         distance: 0,
//         power: options.power,
//         orientation: options.orientation,
//       }),
//       new UIHorizontalDistanceConstraint(container, elementTwo, {
//         anchorOne: 1,
//         anchorTwo: 1,
//         distance: 0,
//         power: options.power,
//         orientation: options.orientation,
//       }),
//     );

//     const anchorOne =
//       direction === UIConstraintContainerDirection.FROM_LEFT_TOP ? 1 : 0;
//     const anchorTwo =
//       direction === UIConstraintContainerDirection.FROM_LEFT_TOP ? 0 : 1;

//     verticalDistances.push(
//       new UIVerticalDistanceConstraint(container, elementOne, {
//         anchorOne: anchorOne,
//         anchorTwo: anchorOne,
//         distance: 0,
//         power: options.power,
//         orientation: options.orientation,
//       }),
//       new UIVerticalDistanceConstraint(container, elementTwo, {
//         anchorOne: anchorTwo,
//         anchorTwo: anchorTwo,
//         distance: 0,
//         power: options.power,
//         orientation: options.orientation,
//       }),
//     );

//     return {
//       horizontalDistances,
//       verticalDistances,
//     };
//   }
// }
