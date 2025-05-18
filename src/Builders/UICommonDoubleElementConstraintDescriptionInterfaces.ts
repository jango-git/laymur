import {
  isUIConstraintPower,
  UIConstraintPower,
} from "../Constraints/UIConstraintPower";
import {
  isUIConstraintRule,
  UIConstraintRule,
} from "../Constraints/UIConstraintRule";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";

export type AtLeastOneNumber =
  | { x?: number; y: number }
  | { x: number; y?: number };

export type AtLeastOnePower =
  | { x?: UIConstraintPower; y: UIConstraintPower }
  | { x: UIConstraintPower; y?: UIConstraintPower };

export type AtLeastOneRule =
  | { x?: UIConstraintRule; y: UIConstraintRule }
  | { x: UIConstraintRule; y?: UIConstraintRule };

export interface UICommonDoubleElementConstraintDescription {
  elementOne: UIElement | UILayer;
  elementTwo: UIElement;
}

export interface UICommonProportionalConstraintDescription
  extends UICommonDoubleElementConstraintDescription {
  proportion: AtLeastOneNumber;
  power?: AtLeastOnePower;
  rule?: AtLeastOneRule;
}

export interface UICommonDistanceConstraintDescription
  extends UICommonDoubleElementConstraintDescription {
  distance: AtLeastOneNumber;
  anchorOne?: AtLeastOneNumber;
  anchorTwo?: AtLeastOneNumber;
  power?: AtLeastOnePower;
  rule?: AtLeastOneRule;
}

export interface UICommonCoverConstraintDescription
  extends UICommonDoubleElementConstraintDescription {
  isStrict: boolean;
  anchor?: AtLeastOneNumber;
}

export type UIAnyCommonDoubleElementConstraintDescription =
  | UICommonProportionalConstraintDescription
  | UICommonDistanceConstraintDescription
  | UICommonCoverConstraintDescription;

export function isAtLeastOneNumber(obj: unknown): obj is AtLeastOneNumber {
  return (
    obj !== null &&
    typeof obj === "object" &&
    (("x" in obj && typeof obj.x === "number") ||
      ("y" in obj && typeof obj.y === "number"))
  );
}

export function isAtLeastOnePower(obj: unknown): obj is AtLeastOnePower {
  return (
    obj !== null &&
    typeof obj === "object" &&
    (("x" in obj && isUIConstraintPower(obj.x)) ||
      ("y" in obj && isUIConstraintPower(obj.y)))
  );
}

export function isAtLeastOneRule(obj: unknown): obj is AtLeastOneRule {
  return (
    obj !== null &&
    typeof obj === "object" &&
    (("x" in obj && isUIConstraintRule(obj.x)) ||
      ("y" in obj && isUIConstraintRule(obj.y)))
  );
}

export function isUICommonDoubleElementConstraintDescription(
  obj: unknown,
): obj is UICommonDoubleElementConstraintDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "elementOne" in obj &&
    "elementTwo" in obj &&
    (obj.elementOne instanceof UIElement ||
      obj.elementOne instanceof UILayer) &&
    obj.elementTwo instanceof UIElement
  );
}

export function isUICommonDistanceConstraintDescription(
  obj: unknown,
): obj is UICommonDistanceConstraintDescription {
  return (
    isUICommonDoubleElementConstraintDescription(obj) &&
    "distance" in obj &&
    isAtLeastOneNumber(obj.distance) &&
    (!("anchorOne" in obj) ||
      ("anchorOne" in obj && isAtLeastOneNumber(obj.anchorOne))) &&
    (!("anchorTwo" in obj) ||
      ("anchorTwo" in obj && isAtLeastOneNumber(obj.anchorTwo))) &&
    (!("power" in obj) || isAtLeastOnePower(obj.power)) &&
    (!("rule" in obj) || isAtLeastOneRule(obj.rule))
  );
}

export function isUICommonProportionalConstraintDescription(
  obj: unknown,
): obj is UICommonProportionalConstraintDescription {
  return (
    isUICommonDoubleElementConstraintDescription(obj) &&
    "proportion" in obj &&
    isAtLeastOneNumber(obj.proportion) &&
    (!("power" in obj) || isAtLeastOnePower(obj.power)) &&
    (!("rule" in obj) || isAtLeastOneRule(obj.rule))
  );
}

export function isUICommonCoverConstraintDescription(
  obj: unknown,
): obj is UICommonCoverConstraintDescription {
  return (
    isUICommonDoubleElementConstraintDescription(obj) &&
    "isStrict" in obj &&
    typeof obj.isStrict === "boolean" &&
    (!("anchor" in obj) || ("anchor" in obj && isAtLeastOneNumber(obj.anchor)))
  );
}
