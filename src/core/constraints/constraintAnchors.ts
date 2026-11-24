import type { UIPlaneElement, UIPointElement } from "../miscellaneous/shared.js";
import { isUIPlaneElement, isUIPointElement } from "../miscellaneous/shared.js";
import { UIExpression } from "../miscellaneous/UIExpression.js";

export const DEFAULT_ANCHOR = 0.5;

/**
 * Builds the position of an anchor along one axis: position + size * anchor for a plane
 * element, and the position itself for a point element.
 * @param element Anchored element
 * @param anchor Anchor on the element (0 = left or bottom, 0.5 = center, 1 = right or top)
 * @param vertical True for the vertical axis
 * @returns Expression of the anchor position
 * @throws If the element is neither a point nor a plane element
 */
export function buildAnchorExpression(
  element: UIPointElement | UIPlaneElement,
  anchor: number,
  vertical: boolean,
): UIExpression {
  if (isUIPlaneElement(element)) {
    return new UIExpression(0, [
      [vertical ? element.yVariable : element.xVariable, 1],
      [vertical ? element.hVariable : element.wVariable, anchor],
    ]);
  }
  if (isUIPointElement(element)) {
    return new UIExpression().plus(vertical ? element.yVariable : element.xVariable, 1);
  }
  throw new Error("buildAnchorExpression.element: element is neither a point nor a plane element");
}
