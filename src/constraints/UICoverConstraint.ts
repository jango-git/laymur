// import { UILayerEvent } from "../layers/UILayer";
// import {
//   assertValidConstraintSubjects,
//   type UIPlaneElement,
// } from "../miscellaneous/asserts";
// import { UIExpression } from "../miscellaneous/UIExpression";
// import {
//   resolveOrientation,
//   UIOrientation,
// } from "../miscellaneous/UIOrientation";
// import { resolvePriority, type UIPriority } from "../miscellaneous/UIPriority";
// import { UIRelation } from "../miscellaneous/UIRelation";
// import { UIConstraint } from "./UIConstraint";

// const DEFAULT_ANCHOR = 0.5;

// export interface UICoverConstraintOptions {
//   anchorHorizontal: number;
//   anchorVertical: number;
//   priority: UIPriority;
//   orientation: UIOrientation;
// }

// export class UICoverConstraint extends UIConstraint {
//   private readonly xConstraint: number;
//   private readonly yConstraint: number;
//   private readonly wConstraint: number;
//   private readonly hConstraint: number;

//   private anchorHorizontalInternal: number;
//   private anchorVerticalInternal: number;
//   private priorityInternal: UIPriority;
//   private orientationInternal: UIOrientation;

//   constructor(
//     private readonly a: UIPlaneElement,
//     private readonly b: UIPlaneElement,
//     options: Partial<UICoverConstraintOptions> = {},
//   ) {
//     super(assertValidConstraintSubjects(a, b, "UICoverConstraint"));

//     this.anchorHorizontalInternal = options.anchorHorizontal ?? DEFAULT_ANCHOR;
//     this.anchorVerticalInternal = options.anchorVertical ?? DEFAULT_ANCHOR;
//     this.priorityInternal = resolvePriority(options.priority);
//     this.orientationInternal = resolveOrientation(options.orientation);

//     const enabled = this.isConstraintEnabled();

//     this.xConstraint = this.solverWrapper.createConstraint(
//       UIExpression.minus(
//         new UIExpression(0, [
//           [this.a.xVariable, 1],
//           [this.a.wVariable, this.anchorHorizontalInternal],
//         ]),
//         new UIExpression(0, [
//           [this.b.xVariable, 1],
//           [this.b.wVariable, this.anchorHorizontalInternal],
//         ]),
//       ),
//       new UIExpression(0),
//       UIRelation.EQUAL,
//       this.priorityInternal,
//       enabled,
//     );

//     this.yConstraint = this.solverWrapper.createConstraint(
//       UIExpression.minus(
//         new UIExpression(0, [
//           [this.a.yVariable, 1],
//           [this.a.hVariable, this.anchorVerticalInternal],
//         ]),
//         new UIExpression(0, [
//           [this.b.yVariable, 1],
//           [this.b.hVariable, this.anchorVerticalInternal],
//         ]),
//       ),
//       new UIExpression(0),
//       UIRelation.EQUAL,
//       this.priorityInternal,
//       enabled,
//     );

//     this.wConstraint = this.solverWrapper.createConstraint(
//       new UIExpression(0, [
//         [this.a.wVariable, 1],
//         [this.b.wVariable, -1],
//       ]),
//       new UIExpression(0),
//       UIRelation.EQUAL,
//       this.priorityInternal,
//       enabled,
//     );

//     this.hConstraint = this.solverWrapper.createConstraint(
//       new UIExpression(0, [
//         [this.a.hVariable, 1],
//         [this.b.hVariable, -1],
//       ]),
//       new UIExpression(0),
//       UIRelation.EQUAL,
//       this.priorityInternal,
//       enabled,
//     );

//     this.layer.on(UILayerEvent.ORIENTATION_CHANGE, this.onOrientationChange);
//   }

//   public get anchorHorizontal(): number {
//     return this.anchorHorizontalInternal;
//   }

//   public get anchorVertical(): number {
//     return this.anchorVerticalInternal;
//   }

//   public get priority(): UIPriority {
//     return this.priorityInternal;
//   }

//   public get orientation(): UIOrientation {
//     return this.orientationInternal;
//   }

//   public set anchorHorizontal(value: number) {
//     if (value !== this.anchorHorizontalInternal) {
//       this.anchorHorizontalInternal = value;
//       this.solverWrapper.setConstraintLHS(
//         this.xConstraint,
//         UIExpression.minus(
//           new UIExpression(0, [
//             [this.a.xVariable, 1],
//             [this.a.wVariable, this.anchorHorizontalInternal],
//           ]),
//           new UIExpression(0, [
//             [this.b.xVariable, 1],
//             [this.b.wVariable, this.anchorHorizontalInternal],
//           ]),
//         ),
//       );
//     }
//   }

//   public set anchorVertical(value: number) {
//     if (value !== this.anchorVerticalInternal) {
//       this.anchorVerticalInternal = value;
//       this.solverWrapper.setConstraintLHS(
//         this.yConstraint,
//         UIExpression.minus(
//           new UIExpression(0, [
//             [this.a.yVariable, 1],
//             [this.a.hVariable, this.anchorVerticalInternal],
//           ]),
//           new UIExpression(0, [
//             [this.b.yVariable, 1],
//             [this.b.hVariable, this.anchorVerticalInternal],
//           ]),
//         ),
//       );
//     }
//   }

//   public set priority(value: UIPriority) {
//     if (value !== this.priorityInternal) {
//       this.priorityInternal = value;
//       this.solverWrapper.setConstraintPriority(
//         this.xConstraint,
//         this.priorityInternal,
//       );
//       this.solverWrapper.setConstraintPriority(
//         this.yConstraint,
//         this.priorityInternal,
//       );
//       this.solverWrapper.setConstraintPriority(
//         this.wConstraint,
//         this.priorityInternal,
//       );
//       this.solverWrapper.setConstraintPriority(
//         this.hConstraint,
//         this.priorityInternal,
//       );
//     }
//   }

//   public set orientation(value: UIOrientation) {
//     if (value !== this.orientationInternal) {
//       this.orientationInternal = value;
//       this.onOrientationChange();
//     }
//   }

//   public destroy(): void {
//     this.layer.off(UILayerEvent.ORIENTATION_CHANGE, this.onOrientationChange);
//   }

//   protected isConstraintEnabled(): boolean {
//     return (
//       this.orientationInternal === UIOrientation.ALWAYS ||
//       this.orientationInternal === this.layer.orientation
//     );
//   }

//   private readonly onOrientationChange = (): void => {
//     const enabled = this.isConstraintEnabled();
//     this.solverWrapper.setConstraintEnabled(this.xConstraint, enabled);
//     this.solverWrapper.setConstraintEnabled(this.yConstraint, enabled);
//     this.solverWrapper.setConstraintEnabled(this.wConstraint, enabled);
//     this.solverWrapper.setConstraintEnabled(this.hConstraint, enabled);
//   };
// }
