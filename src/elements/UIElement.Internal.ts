import { Matrix4, Quaternion, Vector3 } from "three";
import type { UIBorderConfig } from "../miscellaneous/border/UIBorder.Internal";
import type { UIMicroConfig } from "../miscellaneous/micro/UIMicro.Internal";
import { UIMicroAnchorMode } from "../miscellaneous/micro/UIMicro.Internal";
import { UITransparencyMode } from "../miscellaneous/UITransparencyMode";
import type { UIDummyOptions } from "./UIDummy.Internal";

export const ELEMENT_DEFAULT_TRANSPARENCY_MODE = UITransparencyMode.BLEND;

const TEMP_POSITION = new Vector3();
const TEMP_QUATERNION = new Quaternion();
const TEMP_SCALE = new Vector3();
const TEMP_MATRIX = new Matrix4();
const Z_AXIS = new Vector3(0, 0, 1);

export interface UIElementOptions extends UIDummyOptions {
  micro: UIMicroConfig;
  padding: UIBorderConfig;
  transparencyMode: UITransparencyMode;
}

/**
 * Computes transformation matrix for UI element with micro-transformations.
 * Returns a temporary matrix that may be reused on subsequent calls.
 * @internal
 */
export function computeTransformMatrix(
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex: number,
  microX: number,
  microY: number,
  microAnchorX: number,
  microAnchorY: number,
  microScaleX: number,
  microScaleY: number,
  microRotation: number,
  microAnchorMode: UIMicroAnchorMode,
): Matrix4 {
  const scaledWidth = width * microScaleX;
  const scaledHeight = height * microScaleY;

  const anchorOffsetX = microAnchorX * scaledWidth;
  const anchorOffsetY = microAnchorY * scaledHeight;

  const cos = Math.cos(microRotation);
  const sin = Math.sin(microRotation);

  const rotatedAnchorX = anchorOffsetX * cos - anchorOffsetY * sin;
  const rotatedAnchorY = anchorOffsetX * sin + anchorOffsetY * cos;

  if (microAnchorMode === UIMicroAnchorMode.POSITION_ROTATION_SCALE) {
    TEMP_POSITION.x = x + microX - rotatedAnchorX;
    TEMP_POSITION.y = y + microY - rotatedAnchorY;
  } else {
    const rawAnchorOffsetX = microAnchorX * width;
    const rawAnchorOffsetY = microAnchorY * height;
    TEMP_POSITION.x = x + rawAnchorOffsetX - rotatedAnchorX + microX;
    TEMP_POSITION.y = y + rawAnchorOffsetY - rotatedAnchorY + microY;
  }

  TEMP_POSITION.z = zIndex;
  TEMP_SCALE.x = scaledWidth;
  TEMP_SCALE.y = scaledHeight;
  TEMP_QUATERNION.setFromAxisAngle(Z_AXIS, microRotation);

  TEMP_MATRIX.compose(TEMP_POSITION, TEMP_QUATERNION, TEMP_SCALE);
  return TEMP_MATRIX;
}
