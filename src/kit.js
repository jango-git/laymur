import {
  UIAspectConstraint,
  UIHeightConstraint,
  UIHorizontalDistanceConstraint,
  UIHorizontalInterpolationConstraint,
  UIHorizontalProportionConstraint,
  UIMode,
  UINineSlice,
  UIOrientation,
  UIText,
  UIVerticalDistanceConstraint,
  UIVerticalInterpolationConstraint,
  UIVerticalProportionConstraint,
  UIWidthConstraint,
} from "laymur";

import { color, COLORS, MONO } from "./style.js";
import { buttonTexture, panelTexture, warnButtonTexture } from "./textures.js";

/*
 * Helpers that create the constraints. Anchors run from 0 at the left or bottom edge to 1 at the
 * right or top edge, distances go from a to b, and the orientation limits a constraint to
 * landscape or portrait layouts. `aspect` without a value keeps the aspect the element has now,
 * and `inside` leaves an edge free where its inset is null.
 */

export const LANDSCAPE = UIOrientation.HORIZONTAL;
export const PORTRAIT = UIOrientation.VERTICAL;
export const ALWAYS = UIOrientation.ALWAYS;

export const horizontalDistance = (a, b, anchorA, anchorB, distance, orientation = ALWAYS) =>
  new UIHorizontalDistanceConstraint(a, b, { anchorA, anchorB, distance, orientation });
export const verticalDistance = (a, b, anchorA, anchorB, distance, orientation = ALWAYS) =>
  new UIVerticalDistanceConstraint(a, b, { anchorA, anchorB, distance, orientation });
export const horizontalInterpolation = (
  a,
  b,
  c,
  anchorA,
  anchorB,
  anchorC,
  t,
  orientation = ALWAYS,
) =>
  new UIHorizontalInterpolationConstraint(a, b, c, { anchorA, anchorB, anchorC, t, orientation });
export const verticalInterpolation = (
  a,
  b,
  c,
  anchorA,
  anchorB,
  anchorC,
  t,
  orientation = ALWAYS,
) => new UIVerticalInterpolationConstraint(a, b, c, { anchorA, anchorB, anchorC, t, orientation });
export const horizontalProportion = (a, b, proportion, orientation = ALWAYS) =>
  new UIHorizontalProportionConstraint(a, b, { proportion, orientation });
export const verticalProportion = (a, b, proportion, orientation = ALWAYS) =>
  new UIVerticalProportionConstraint(a, b, { proportion, orientation });
export const width = (element, value, orientation = ALWAYS) =>
  new UIWidthConstraint(element, { width: value, orientation });
export const height = (element, value, orientation = ALWAYS) =>
  new UIHeightConstraint(element, { height: value, orientation });
export const aspect = (element, value) =>
  new UIAspectConstraint(element, value === undefined ? {} : { aspect: value });

export function inside(element, box, left, right, bottom, top, orientation = ALWAYS) {
  if (left !== null) {
    horizontalDistance(box, element, 0, 0, left, orientation);
  }
  if (right !== null) {
    horizontalDistance(element, box, 1, 1, right, orientation);
  }
  if (bottom !== null) {
    verticalDistance(box, element, 0, 0, bottom, orientation);
  }
  if (top !== null) {
    verticalDistance(element, box, 1, 1, top, orientation);
  }
}

export const fill = (element, box) => inside(element, box, 0, 0, 0, 0);

export function center(element, box) {
  horizontalDistance(box, element, 0.5, 0.5, 0);
  verticalDistance(box, element, 0.5, 0.5, 0);
}

export function text(layer, content, { size = 16, css = COLORS.text, family = MONO } = {}) {
  const element = new UIText(layer, content, {
    commonStyle: {
      fontFamily: family,
      fontSize: size,
      fontWeight: family === MONO ? 500 : 400,
      color: "#ffffff",
    },
  });
  element.color = color(css);
  return element;
}

/* A new text is measured and drawn again, so the text is set only when it changes */
export function setText(element, content) {
  if (element.content[0].text !== content) {
    element.content = content;
  }
}

export function formatClock(seconds, fractionDigits = 0) {
  const twoDigits = (value) => String(Math.floor(value)).padStart(2, "0");
  const secondsWidth = fractionDigits > 0 ? 3 + fractionDigits : 2;
  const rest = (seconds % 60).toFixed(fractionDigits).padStart(secondsWidth, "0");
  return `${twoDigits(seconds / 3600)}:${twoDigits((seconds / 60) % 60)}:${rest}`;
}

export const panel = (layer) =>
  new UINineSlice(layer, panelTexture, { sliceBorders: 0.3, sliceRegions: 16 });

/*
 * A button of a scene. It lights up under the pointer and while the pointer holds it, it is
 * brighter and smaller. Every change takes one frame, the same way in every scene.
 */
export function button(layer, caption, { isWarn = false, size = 26, family = MONO } = {}) {
  const box = new UINineSlice(layer, isWarn ? warnButtonTexture : buttonTexture, {
    sliceBorders: 0.3,
    sliceRegions: 16,
  });
  box.mode = UIMode.INTERACTIVE;
  const label = text(layer, caption, { size, family, css: isWarn ? COLORS.warn : COLORS.text });
  center(label, box);
  const state = { isHovered: false, isPressed: false };
  const show = (change) => {
    Object.assign(state, change);
    box.lightness = state.isPressed ? 0.35 : state.isHovered ? 0.15 : 0;
    for (const element of [box, label]) {
      element.micro.scaleX = element.micro.scaleY = state.isPressed ? 0.94 : 1;
    }
  };
  box.signalPointerEntered.on(() => show({ isHovered: true }));
  box.signalPointerLeft.on(() => show({ isHovered: false }));
  box.signalPointerPressed.on(() => show({ isPressed: true }));
  box.signalPointerClicked.on(() => show({ isPressed: false }));
  box.signalPointerCancelled.on(() => show({ isPressed: false }));
  return { box, label };
}
