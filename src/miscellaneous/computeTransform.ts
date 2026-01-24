import { Matrix4, Quaternion, Vector3 } from "three";
import { UIMicroAnchorMode } from "../miscellaneous/micro/UIMicro.Internal";

const TEMP_POSITION = new Vector3();
const TEMP_QUATERNION = new Quaternion();
const TEMP_SCALE = new Vector3();
const TEMP_MATRIX = new Matrix4();
const Z_AXIS = new Vector3(0, 0, 1);

/**
 * Computes element transform matrix.
 * @returns Transform matrix (reused, do not store reference)
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

/**
 * Computes transform matrix for trimmed sprite.
 * @param width Source width including trimmed areas
 * @param height Source height including trimmed areas
 * @param trimLeft Pixels trimmed from left
 * @param trimRight Pixels trimmed from right
 * @param trimTop Pixels trimmed from top
 * @param trimBottom Pixels trimmed from bottom
 * @returns Transform matrix (reused, do not store reference)
 */
export function computeTrimmedTransformMatrix(
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
  trimLeft: number,
  trimRight: number,
  trimTop: number,
  trimBottom: number,
): Matrix4 {
  const trimmedWidth = width - trimLeft - trimRight;
  const trimmedHeight = height - trimTop - trimBottom;

  const scaledWidth = width * microScaleX;
  const scaledHeight = height * microScaleY;

  const anchorOffsetX = microAnchorX * scaledWidth;
  const anchorOffsetY = microAnchorY * scaledHeight;

  const cos = Math.cos(microRotation);
  const sin = Math.sin(microRotation);

  const rotatedAnchorX = anchorOffsetX * cos - anchorOffsetY * sin;
  const rotatedAnchorY = anchorOffsetX * sin + anchorOffsetY * cos;

  const trimOffsetX = trimLeft * microScaleX;
  const trimOffsetY = trimBottom * microScaleY;

  const rotatedTrimX = trimOffsetX * cos - trimOffsetY * sin;
  const rotatedTrimY = trimOffsetX * sin + trimOffsetY * cos;

  if (microAnchorMode === UIMicroAnchorMode.POSITION_ROTATION_SCALE) {
    TEMP_POSITION.x = x + microX - rotatedAnchorX + rotatedTrimX;
    TEMP_POSITION.y = y + microY - rotatedAnchorY + rotatedTrimY;
  } else {
    const rawAnchorOffsetX = microAnchorX * width;
    const rawAnchorOffsetY = microAnchorY * height;
    TEMP_POSITION.x = x + rawAnchorOffsetX - rotatedAnchorX + microX + rotatedTrimX;
    TEMP_POSITION.y = y + rawAnchorOffsetY - rotatedAnchorY + microY + rotatedTrimY;
  }

  TEMP_POSITION.z = zIndex;
  TEMP_SCALE.x = trimmedWidth * microScaleX;
  TEMP_SCALE.y = trimmedHeight * microScaleY;
  TEMP_QUATERNION.setFromAxisAngle(Z_AXIS, microRotation);

  TEMP_MATRIX.compose(TEMP_POSITION, TEMP_QUATERNION, TEMP_SCALE);
  return TEMP_MATRIX;
}
