import {
  isUIConstraintPower,
  UIConstraintPower,
} from "../Constraints/UIConstraintPower";
import {
  isUIConstraintRule,
  UIConstraintRule,
} from "../Constraints/UIConstraintRule";
import { UIElement } from "../Elements/UIElement";
import { UIOrientation } from "../Miscellaneous/UIOrientation";

export interface UICommonSingleElementConstraintDescription {
  element: UIElement;
  power?: UIConstraintPower;
  rule?: UIConstraintRule;
  orientation?: UIOrientation;
}

export interface UIWidthConstraintDescription
  extends UICommonSingleElementConstraintDescription {
  width: number;
}

export interface UIHeightConstraintDescription
  extends UICommonSingleElementConstraintDescription {
  height: number;
}

export interface UIKeepAspectConstraintDescription
  extends UICommonSingleElementConstraintDescription {
  keepAspect: boolean;
}

export interface UIKeepSizeConstraintDescription
  extends UICommonSingleElementConstraintDescription {
  keepSize: boolean;
}

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

export function isUIWidthConstraintDescription(
  obj: unknown,
): obj is UIWidthConstraintDescription {
  return (
    isUICommonSingleElementConstraintDescription(obj) &&
    "width" in obj &&
    typeof obj.width === "number"
  );
}

export function isUIHeightConstraintDescription(
  obj: unknown,
): obj is UIHeightConstraintDescription {
  return (
    isUICommonSingleElementConstraintDescription(obj) &&
    "height" in obj &&
    typeof obj.height === "number"
  );
}

export function isUIKeepAspectConstraintDescription(
  obj: unknown,
): obj is UIKeepAspectConstraintDescription {
  return (
    isUICommonSingleElementConstraintDescription(obj) &&
    "keepAspect" in obj &&
    typeof obj.keepAspect === "boolean"
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
