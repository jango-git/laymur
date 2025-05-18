import { Object3D } from "three";
import { UIMicroTransformations } from "./UIMicroTransformations";

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

  const dx = micro.x;
  const dy = micro.y;

  // Применяем трансформации
  object.position.x = centerX + dx;
  object.position.y = centerY + dy;

  object.scale.x = micro.scaleX * width;
  object.scale.y = micro.scaleY * height;

  object.rotation.z = micro.rotation;

  const scaledOffsetX = micro.anchorX * micro.scaleX * width;
  const scaledOffsetY = micro.anchorY * micro.scaleY * height;

  object.position.x -= scaledOffsetX;
  object.position.y -= scaledOffsetY;
}
// export function applyMicroTransformations(
//   object: Object3D,
//   micro: UIMicroTransformations,
//   x: number,
//   y: number,
//   width: number,
//   height: number,
// ): void {
//   const originalX = x;
//   const originalY = y;
//   const originalScaleX = width;
//   const originalScaleY = height;

//   const microPositionX = micro.x;
//   const microPositionY = micro.y;

//   const microScaleX = micro.scaleX;
//   const microScaleY = micro.scaleY;

//   const microAnchorX = micro.anchorX;
//   const microAnchorY = micro.anchorY;

//   const microRotation = micro.rotation;

//   //todo
// }
