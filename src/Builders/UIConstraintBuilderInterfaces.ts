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

//Parameters 2D

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

//Common descriptions

export interface UICommonSingleElementConstraintDescription {
  element: UIElement;
  power?: UIConstraintPower;
  rule?: UIConstraintRule;
}

export interface UIKeepAspectConstraintDescription
  extends UICommonSingleElementConstraintDescription {
  keepAspect: boolean;
  keepWidth?: boolean;
}

export interface UIKeepSizeConstraintDescription
  extends UICommonSingleElementConstraintDescription {
  keepSize: boolean;
}

type AtLeastOneXY<T> = { x?: T; y: T } | { x: T; y?: T };

export interface UICommonDoubleElementConstraintDescription {
  elementOne: UIElement | UILayer;
  elementTwo: UIElement;
  anchorOne?: AtLeastOneXY<number>;
  anchorTwo?: AtLeastOneXY<number>;
  power?: AtLeastOneXY<UIConstraintPower>;
  rule?: AtLeastOneXY<UIConstraintRule>;
}

export interface UIProportionalConstraintDescription
  extends UICommonDoubleElementConstraintDescription {
  proportion: AtLeastOneXY<number>;
  distance?: AtLeastOneXY<number>;
}

export interface UIDistanceConstraintDescription
  extends UICommonDoubleElementConstraintDescription {
  distance: AtLeastOneXY<number>;
  proportion?: AtLeastOneXY<number>;
}

export type UIConstraintDescription =
  | UIDistanceConstraintDescription
  | UIProportionalConstraintDescription
  | (UIDistanceConstraintDescription & UIProportionalConstraintDescription);

export type UIAnyCommonConstraintDescription =
  | UIKeepAspectConstraintDescription
  | UIKeepSizeConstraintDescription
  | UIConstraintDescription;

export function isUICommonSingleElementConstraintDescription(
  obj?: unknown,
): obj is UICommonSingleElementConstraintDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "element" in obj &&
    obj.element instanceof UIElement
  );
}

export function isUIKeepAspectConstraintDescription(
  obj?: unknown,
): obj is UIKeepAspectConstraintDescription {
  return (
    isUICommonSingleElementConstraintDescription(obj) &&
    "keepAspect" in obj &&
    typeof obj.keepAspect === "boolean"
  );
}

export function isUIKeepSizeConstraintDescription(
  obj?: unknown,
): obj is UIKeepSizeConstraintDescription {
  return (
    isUICommonSingleElementConstraintDescription(obj) &&
    "keepSize" in obj &&
    typeof obj.keepSize === "boolean"
  );
}

export function isUICommonDoubleElementConstraintDescription(
  obj?: unknown,
): obj is UICommonDoubleElementConstraintDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "elementOne" in obj &&
    (obj.elementOne instanceof UILayer ||
      obj.elementOne instanceof UIElement) &&
    "elementTwo" in obj &&
    obj.elementTwo instanceof UIElement &&
    ("distance" in obj || "proportion" in obj)
  );
}
