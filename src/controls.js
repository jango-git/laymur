import { UIImage, UIMode, UINineSlice } from "laymur";

import {
  center,
  height,
  horizontalDistance,
  LANDSCAPE,
  PORTRAIT,
  text,
  verticalDistance,
  width,
} from "./kit.js";
import { controlColors } from "./style.js";
import { OUTLINE_TEXTURE_SIZE, outlineTexture } from "./textures.js";

/*
 * Buttons of the page. A button is a label or an icon in a frame, and the frame takes the pointer.
 * A label sets the width of its frame, and an icon sits in the middle of a square one. Buttons are
 * larger in portrait, where they are pressed with a finger. The caps of a label are 16 units tall
 * and sit in the middle of the frame, and the border of the frame texture takes two texture
 * pixels per layer unit.
 */

export const BUTTON_HEIGHT = { [LANDSCAPE]: 44, [PORTRAIT]: 56 };
const BUTTON_GAP = 10;
const BUTTON_PADDING = { [LANDSCAPE]: 18, [PORTRAIT]: 14 };
const ICON_SIZE = { [LANDSCAPE]: 24, [PORTRAIT]: 28 };
const LABEL_TOP = { [LANDSCAPE]: 14, [PORTRAIT]: 20 };
const FRAME_BORDER = 8;

export function setCursor(cursor) {
  document.body.style.cursor = cursor;
}

export function createControls(layer) {
  const hovered = new Set();

  function button(content, onClick) {
    const isIcon = typeof content !== "string";
    const label = isIcon ? new UIImage(layer, content) : text(layer, content, { size: 20 });
    const frame = new UINineSlice(layer, outlineTexture, {
      sliceBorders: FRAME_BORDER / OUTLINE_TEXTURE_SIZE,
      sliceRegions: FRAME_BORDER / 2,
    });
    frame.mode = UIMode.INTERACTIVE;
    for (const orientation of [LANDSCAPE, PORTRAIT]) {
      const size = BUTTON_HEIGHT[orientation];
      height(frame, size, orientation);
      if (isIcon) {
        width(frame, size, orientation);
        width(label, ICON_SIZE[orientation], orientation);
        height(label, ICON_SIZE[orientation], orientation);
      } else {
        width(frame, label.width + 2 * BUTTON_PADDING[orientation], orientation);
        horizontalDistance(frame, label, 0, 0, BUTTON_PADDING[orientation], orientation);
        verticalDistance(label, frame, 1, 1, LABEL_TOP[orientation], orientation);
      }
    }
    if (isIcon) {
      center(label, frame);
    }
    const control = { label, frame };
    frame.signalPointerEntered.on(() => {
      hovered.add(control);
      setCursor("pointer");
    });
    frame.signalPointerLeft.on(() => {
      hovered.delete(control);
      setCursor("");
    });
    frame.signalPointerClicked.on(onClick);
    return control;
  }

  function paint(control, isCurrent = false) {
    [control.frame.color, control.label.color] = controlColors({
      isCurrent,
      isHovered: hovered.has(control),
    });
  }

  function row(controls) {
    for (let i = 1; i < controls.length; i++) {
      horizontalDistance(controls[i - 1].frame, controls[i].frame, 1, 0, BUTTON_GAP);
      verticalDistance(controls[i].frame, controls[0].frame, 1, 1, 0);
    }
  }

  return { button, paint, row };
}
