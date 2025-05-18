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

export interface UISize2DParameters {
  element: UIElement;
  width: number;
  height: number;
  powerHorizontal?: UIConstraintPower;
  powerVertical?: UIConstraintPower;
  ruleHorizontal?: UIConstraintRule;
  ruleVertical?: UIConstraintRule;
}

export interface UIDistance2DParameters {
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
}

export interface UIProportional2DParameters {
  elementOne: UIElement | UILayer;
  elementTwo: UIElement;
  proportionHorizontal?: number;
  proportionVertical?: number;
  powerHorizontal?: UIConstraintPower;
  powerVertical?: UIConstraintPower;
  ruleHorizontal?: UIConstraintRule;
  ruleVertical?: UIConstraintRule;
}

export interface UISize2DResult {
  width: UIWidthConstraint;
  height: UIHeightConstraint;
}

export interface UIDistance2DResult {
  horizontal: UIHorizontalDistanceConstraint;
  vertical: UIVerticalDistanceConstraint;
}

export interface UIProportional2DResult {
  horizontal: UIHorizontalProportionConstraint;
  vertical: UIVerticalProportionConstraint;
}
