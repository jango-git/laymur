// import type { BufferAttribute, Color, Material, Matrix3, Matrix4 } from "three";
// import {
//   InstancedBufferAttribute,
//   InstancedBufferGeometry,
//   PlaneGeometry,
//   StaticDrawUsage,
// } from "three";
// import { SCALABLE_MESH_CAPACITY_STEP, UIScalableMesh } from "./UIScalableMesh";

// const TRANSFORM_ITEM_SIZE = 16;
// const TRANSFORM_UV_ITEM_SIZE = 9;
// const COLOR_ITEM_SIZE = 4;
// const MISC_ITEM_SIZE = 1;

// export class UIScalablePlaneMesh extends UIScalableMesh {
//   constructor(material: Material) {
//     super(
//       UIScalablePlaneMesh.buildPlaneGeometry(SCALABLE_MESH_CAPACITY_STEP),
//       material,
//     );
//   }

//   private static buildPlaneGeometry(capacity: number): InstancedBufferGeometry {
//     const plane = new PlaneGeometry(1, 1);
//     const instancedGeometry = new InstancedBufferGeometry();
//     instancedGeometry.index = plane.index;

//     instancedGeometry.setAttribute(
//       "position",
//       plane.attributes["position"] as BufferAttribute,
//     );
//     instancedGeometry.setAttribute(
//       "uv",
//       plane.attributes["uv"] as BufferAttribute,
//     );

//     plane.dispose();

//     const transformBufferLength = capacity * TRANSFORM_ITEM_SIZE;
//     const uvTransformBufferLength = capacity * TRANSFORM_UV_ITEM_SIZE;
//     const colorBufferLength = capacity * COLOR_ITEM_SIZE;
//     const miscBufferLength = capacity * MISC_ITEM_SIZE;

//     instancedGeometry.setAttribute(
//       "instanceTransform",
//       new InstancedBufferAttribute(
//         new Float32Array(transformBufferLength),
//         TRANSFORM_ITEM_SIZE,
//       ).setUsage(StaticDrawUsage),
//     );
//     instancedGeometry.setAttribute(
//       "instanceUVTransform",
//       new InstancedBufferAttribute(
//         new Float32Array(uvTransformBufferLength),
//         TRANSFORM_UV_ITEM_SIZE,
//       ).setUsage(StaticDrawUsage),
//     );
//     instancedGeometry.setAttribute(
//       "instanceColor",
//       new InstancedBufferAttribute(
//         new Float32Array(colorBufferLength),
//         COLOR_ITEM_SIZE,
//       ).setUsage(StaticDrawUsage),
//     );
//     instancedGeometry.setAttribute(
//       "instanceMisc",
//       new InstancedBufferAttribute(
//         new Float32Array(miscBufferLength),
//         MISC_ITEM_SIZE,
//       ).setUsage(StaticDrawUsage),
//     );

//     return instancedGeometry;
//   }

//   public setTransform(userIndex: number, matrix: Matrix4): this {
//     const index = this.getGeometryDataIndex(userIndex);
//     const transform = this.geometry.attributes[
//       "instanceTransform"
//     ] as BufferAttribute;

//     transform.set(matrix.elements, index);
//     return this;
//   }

//   public setUVTransform(userIndex: number, matrix: Matrix3): this {
//     const index = this.getGeometryDataIndex(userIndex);
//     const uvTransform = this.geometry.attributes[
//       "instanceUVTransform"
//     ] as BufferAttribute;

//     uvTransform.set(matrix.elements, index);
//     return this;
//   }

//   public setColor(userIndex: number, color: Color): this {
//     const index = this.getGeometryDataIndex(userIndex);
//     const colorAttribute = this.geometry.attributes[
//       "instanceColor"
//     ] as BufferAttribute;

//     colorAttribute.setXYZ(index, color.r, color.g, color.b);
//     return this;
//   }

//   public setMisc(userIndex: number, alphaTest: number): this {
//     const index = this.getGeometryDataIndex(userIndex);
//     const colorAttribute = this.geometry.attributes[
//       "instanceColor"
//     ] as BufferAttribute;

//     colorAttribute.setX(index, alphaTest);
//     return this;
//   }

//   protected buildGeometry(capacity: number): InstancedBufferGeometry {
//     return UIScalablePlaneMesh.buildPlaneGeometry(capacity);
//   }

//   protected copyGeometryToGeometry(
//     from: InstancedBufferGeometry,
//     to: InstancedBufferGeometry,
//   ): void {
//     const fromTransform = from.attributes[
//       "instanceTransform"
//     ] as BufferAttribute;
//     const fromUVTransform = from.attributes[
//       "instanceUVTransform"
//     ] as BufferAttribute;
//     const fromColor = from.attributes["instanceColor"] as BufferAttribute;
//     const fromMisc = from.attributes["instanceMisc"] as BufferAttribute;

//     const toTransform = to.attributes["instanceTransform"] as BufferAttribute;
//     const toUVTransform = to.attributes[
//       "instanceUVTransform"
//     ] as BufferAttribute;
//     const toColor = to.attributes["instanceColor"] as BufferAttribute;
//     const toMisc = to.attributes["instanceMisc"] as BufferAttribute;

//     toTransform.copy(fromTransform);
//     toUVTransform.copy(fromUVTransform);
//     toColor.copy(fromColor);
//     toMisc.copy(fromMisc);

//     toTransform.needsUpdate = true;
//     toUVTransform.needsUpdate = true;
//     toColor.needsUpdate = true;
//     toMisc.needsUpdate = true;
//   }

//   protected copyIndexToIndex(
//     geometry: InstancedBufferGeometry,
//     from: number,
//     to: number,
//   ): void {
//     const transform = geometry.attributes[
//       "instanceTransform"
//     ] as BufferAttribute;
//     const uvTransform = geometry.attributes[
//       "instanceUVTransform"
//     ] as BufferAttribute;
//     const color = geometry.attributes["instanceColor"] as BufferAttribute;
//     const misc = geometry.attributes["instanceMisc"] as BufferAttribute;

//     for (let i = 0; i < TRANSFORM_ITEM_SIZE; i++) {
//       transform.setComponent(to, i, transform.getComponent(from, i));
//     }

//     for (let i = 0; i < TRANSFORM_UV_ITEM_SIZE; i++) {
//       uvTransform.setComponent(to, i, uvTransform.getComponent(from, i));
//     }

//     for (let i = 0; i < COLOR_ITEM_SIZE; i++) {
//       color.setComponent(to, i, color.getComponent(from, i));
//     }

//     for (let i = 0; i < MISC_ITEM_SIZE; i++) {
//       misc.setComponent(to, i, misc.getComponent(from, i));
//     }

//     transform.needsUpdate = true;
//     uvTransform.needsUpdate = true;
//     color.needsUpdate = true;
//     misc.needsUpdate = true;
//   }
// }
