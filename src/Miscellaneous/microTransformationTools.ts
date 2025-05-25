import type { Object3D } from "three";
import type { UIMicroTransformations } from "./UIMicroTransformations";

export function applyMicroTransformations(
  object: Object3D,
  micro: UIMicroTransformations,
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number,
): void {
  const realX = x - padding;
  const realY = y - padding;

  const realWidth = width + padding * 2;
  const realHeight = height + padding * 2;

  const anchorOffsetX = realWidth * micro.anchorX;
  const anchorOffsetY = realHeight * micro.anchorY;

  const centerX = realX + anchorOffsetX;
  const centerY = realY + anchorOffsetY;

  let localX = realX - centerX;
  let localY = realY - centerY;

  localX *= micro.scaleX;
  localY *= micro.scaleY;

  const cos = Math.cos(micro.rotation);
  const sin = Math.sin(micro.rotation);

  localX = localX * cos - localY * sin;
  localY = localX * sin + localY * cos;

  localX += micro.x;
  localY += micro.y;

  object.position.x = localX + centerX;
  object.position.y = localY + centerY;
  object.rotation.z = micro.rotation;
  object.scale.x = realWidth * micro.scaleX;
  object.scale.y = realHeight * micro.scaleY;
}
