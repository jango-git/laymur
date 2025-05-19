import { UIConstraintPower } from "../Constraints/UIConstraintPower";
import { UIConstraintRule } from "../Constraints/UIConstraintRule";
import { UIHeightConstraint } from "../Constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../Constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../Constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../Constraints/UIWidthConstraint";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
import { UIOrientation } from "../Miscellaneous/UIOrientation";

export interface UISize2DConstraintParameters {
  element: UIElement;
  width: number;
  height: number;
  powerHorizontal?: UIConstraintPower;
  powerVertical?: UIConstraintPower;
  ruleHorizontal?: UIConstraintRule;
  ruleVertical?: UIConstraintRule;
  orientationHorizontal?: UIOrientation;
  orientationVertical?: UIOrientation;
}

export interface UIDistance2DConstraintParameters {
  elementOne: UIElement | UILayer;
  elementTwo: UIElement;
  anchorHorizontalOne?: number;
  anchorVerticalOne?: number;
  anchorHorizontalTwo?: number;
  anchorVerticalTwo?: number;
  distanceHorizontal?: number;
  distanceVertical?: number;
  powerHorizontal?: UIConstraintPower;
  powerVertical?: UIConstraintPower;
  ruleHorizontal?: UIConstraintRule;
  ruleVertical?: UIConstraintRule;
  orientationHorizontal?: UIOrientation;
  orientationVertical?: UIOrientation;
}

export interface UIProportion2DConstraintParameters {
  elementOne: UIElement | UILayer;
  elementTwo: UIElement;
  proportionHorizontal?: number;
  proportionVertical?: number;
  powerHorizontal?: UIConstraintPower;
  powerVertical?: UIConstraintPower;
  ruleHorizontal?: UIConstraintRule;
  ruleVertical?: UIConstraintRule;
  orientationHorizontal?: UIOrientation;
  orientationVertical?: UIOrientation;
}

export interface UISize2DConstraint {
  width: UIWidthConstraint;
  height: UIHeightConstraint;
}

export interface UIDistance2DConstraint {
  horizontal: UIHorizontalDistanceConstraint;
  vertical: UIVerticalDistanceConstraint;
}

export interface UIProprtion2DConstraint {
  horizontal: UIHorizontalProportionConstraint;
  vertical: UIVerticalProportionConstraint;
}
