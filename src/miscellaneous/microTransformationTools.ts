// import { Matrix3, Vector3, type Object3D } from "three";
// import type { UIMicroDescriptor } from "./UIMicro";

// const tempMatrixA = new Matrix3();
// const tempMatrixB = new Matrix3();
// const tempMatrixC = new Matrix3();
// const tempMatrixD = new Matrix3();
// const tempMatrixE = new Matrix3();
// const tempVectorA = new Vector3();

// export function applyMicroTransformations(
//   object: Object3D,
//   micro: UIMicroDescriptor,
//   x: number,
//   y: number,
//   width: number,
//   height: number,
//   padding: number,
// ): void {
//   const realX = x - padding;
//   const realY = y - padding;
//   const realWidth = width + padding * 2;
//   const realHeight = height + padding * 2;

//   const anchorOffsetX = realWidth * micro.anchorX;
//   const anchorOffsetY = realHeight * micro.anchorY;
//   const centerX = realX + anchorOffsetX;
//   const centerY = realY + anchorOffsetY;

//   const translateToCenter = tempMatrixA.set(
//     1,
//     0,
//     -centerX,
//     0,
//     1,
//     -centerY,
//     0,
//     0,
//     1,
//   );

//   const scale = tempMatrixB.set(
//     micro.scaleX,
//     0,
//     0,
//     0,
//     micro.scaleY,
//     0,
//     0,
//     0,
//     1,
//   );

//   const rotation = tempMatrixC.set(
//     Math.cos(micro.rotation),
//     -Math.sin(micro.rotation),
//     0,
//     Math.sin(micro.rotation),
//     Math.cos(micro.rotation),
//     0,
//     0,
//     0,
//     1,
//   );

//   const translateFinal = tempMatrixD.set(
//     1,
//     0,
//     micro.x + centerX,
//     0,
//     1,
//     micro.y + centerY,
//     0,
//     0,
//     1,
//   );

//   const finalMatrix = tempMatrixE
//     .multiplyMatrices(translateFinal, rotation)
//     .multiply(scale)
//     .multiply(translateToCenter);

//   const point = tempVectorA.set(realX, realY, 1).applyMatrix3(finalMatrix);

//   object.position.x = point.x;
//   object.position.y = point.y;
//   object.rotation.z = micro.rotation;
//   object.scale.x = realWidth * micro.scaleX;
//   object.scale.y = realHeight * micro.scaleY;
// }
