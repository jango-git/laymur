import { Matrix4, Quaternion, Vector3 } from "three";
import { UIMicroAnchorMode } from "../miscellaneous/micro/UIMicro.Internal";

const TEMP_POSITION = new Vector3();
const TEMP_QUATERNION = new Quaternion();
const TEMP_SCALE = new Vector3();
const TEMP_MATRIX = new Matrix4();
const Z_AXIS = new Vector3(0, 0, 1);
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

export function computePaddingTransformMatrix(
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
  paddingLeft: number,
  paddingRight: number,
  paddingTop: number,
  paddingBottom: number,
): Matrix4 {
  const virtualWidth = width + paddingLeft + paddingRight;
  const virtualHeight = height + paddingTop + paddingBottom;

  const scaledVirtualWidth = virtualWidth * microScaleX;
  const scaledVirtualHeight = virtualHeight * microScaleY;

  const anchorOffsetX = microAnchorX * scaledVirtualWidth;
  const anchorOffsetY = microAnchorY * scaledVirtualHeight;

  const cos = Math.cos(microRotation);
  const sin = Math.sin(microRotation);
  const rotatedAnchorX = anchorOffsetX * cos - anchorOffsetY * sin;
  const rotatedAnchorY = anchorOffsetX * sin + anchorOffsetY * cos;

  const paddingOffsetX = paddingLeft * microScaleX;
  const paddingOffsetY = paddingBottom * microScaleY;

  const rotatedPaddingX = paddingOffsetX * cos - paddingOffsetY * sin;
  const rotatedPaddingY = paddingOffsetX * sin + paddingOffsetY * cos;

  if (microAnchorMode === UIMicroAnchorMode.POSITION_ROTATION_SCALE) {
    TEMP_POSITION.x = x + microX - rotatedAnchorX + rotatedPaddingX;
    TEMP_POSITION.y = y + microY - rotatedAnchorY + rotatedPaddingY;
  } else {
    const rawAnchorOffsetX = microAnchorX * virtualWidth;
    const rawAnchorOffsetY = microAnchorY * virtualHeight;
    TEMP_POSITION.x =
      x + rawAnchorOffsetX - rotatedAnchorX + microX + rotatedPaddingX;
    TEMP_POSITION.y =
      y + rawAnchorOffsetY - rotatedAnchorY + microY + rotatedPaddingY;
  }

  TEMP_POSITION.z = zIndex;

  TEMP_SCALE.x = width * microScaleX;
  TEMP_SCALE.y = height * microScaleY;

  TEMP_QUATERNION.setFromAxisAngle(Z_AXIS, microRotation);
  TEMP_MATRIX.compose(TEMP_POSITION, TEMP_QUATERNION, TEMP_SCALE);
  return TEMP_MATRIX;
}
