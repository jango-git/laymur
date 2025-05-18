import {
  isUIConstraintPower,
  UIConstraintPower,
} from "../Constraints/UIConstraintPower";
import {
  isUIConstraintRule,
  UIConstraintRule,
} from "../Constraints/UIConstraintRule";
import { UIElement } from "../Elements/UIElement";

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

export type UIAnyCommonSingleElementConstraintDescription =
  | UIKeepAspectConstraintDescription
  | UIKeepSizeConstraintDescription;

export function isUICommonSingleElementConstraintDescription(
  obj: unknown,
): obj is UICommonSingleElementConstraintDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "element" in obj &&
    obj.element instanceof UIElement &&
    (!("power" in obj) || isUIConstraintPower(obj.power)) &&
    (!("rule" in obj) || isUIConstraintRule(obj.rule))
  );
}

export function isUIKeepAspectConstraintDescription(
  obj: unknown,
): obj is UIKeepAspectConstraintDescription {
  return (
    isUICommonSingleElementConstraintDescription(obj) &&
    "keepAspect" in obj &&
    typeof obj.keepAspect === "boolean" &&
    (!("keepWidth" in obj) || typeof obj.keepWidth === "boolean")
  );
}

export function isUIKeepSizeConstraintDescription(
  obj: unknown,
): obj is UIKeepSizeConstraintDescription {
  return (
    isUICommonSingleElementConstraintDescription(obj) &&
    "keepSize" in obj &&
    typeof obj.keepSize === "boolean"
  );
}
