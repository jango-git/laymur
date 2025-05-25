import type { Object3D } from "three";
import type { UIMicroTransformations } from "./UIMicroTransformations";

export function applyMicroTransformations(
  object: Object3D,
  micro: UIMicroTransformations,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const anchorOffsetX = width * micro.anchorX;
  const anchorOffsetY = height * micro.anchorY;

  const centerX = x + anchorOffsetX;
  const centerY = y + anchorOffsetY;

  let localX = x - centerX;
  let localY = y - centerY;

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
  object.scale.x = width * micro.scaleX;
  object.scale.y = height * micro.scaleY;
}
