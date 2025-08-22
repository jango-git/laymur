// import type { InstancedBufferGeometry, Material } from "three";
// import { Mesh } from "three";

// export const SCALABLE_MESH_CAPACITY_STEP = 32;

// export abstract class UIScalableMesh extends Mesh {
//   private readonly users = new Map<number, number>();
//   private lastUserIndex = -1;
//   private capacity = SCALABLE_MESH_CAPACITY_STEP;

//   constructor(geometry: InstancedBufferGeometry, material: Material) {
//     super(geometry, material);
//     (this.geometry as InstancedBufferGeometry).instanceCount = 0;
//   }

//   public createInstance(): number {
//     if (
//       (this.geometry as InstancedBufferGeometry).instanceCount + 1 <=
//       this.capacity
//     ) {
//       this.resizeInstancedGeometry();
//     }

//     const currentUserIndex = this.lastUserIndex++;
//     const currentGeometryDataIndex = (this.geometry as InstancedBufferGeometry)
//       .instanceCount++;
//     this.users.set(currentUserIndex, currentGeometryDataIndex);
//     return currentUserIndex;
//   }

//   public removeInstance(index: number): void {
//     const geometryDataIndex = this.users.get(index);
//     if (geometryDataIndex === undefined) {
//       throw new Error(`Instance ${index} is not in use`);
//     }

//     this.copyIndexToIndex(
//       this.geometry as InstancedBufferGeometry,
//       (this.geometry as InstancedBufferGeometry).instanceCount - 1,
//       geometryDataIndex,
//     );
//     (this.geometry as InstancedBufferGeometry).instanceCount--;
//   }

//   protected getGeometryDataIndex(userIndex: number): number {
//     const geometryDataIndex = this.users.get(userIndex);
//     if (geometryDataIndex === undefined) {
//       throw new Error(`Instance ${userIndex} is not in use`);
//     }
//     return geometryDataIndex;
//   }

//   private resizeInstancedGeometry(): void {
//     this.capacity += SCALABLE_MESH_CAPACITY_STEP;
//     const geometry = this.buildGeometry(this.capacity);
//     this.copyGeometryToGeometry(
//       this.geometry as InstancedBufferGeometry,
//       geometry,
//     );

//     this.geometry.dispose();
//     this.geometry = geometry;
//   }

//   protected abstract buildGeometry(capacity: number): InstancedBufferGeometry;

//   protected abstract copyGeometryToGeometry(
//     from: InstancedBufferGeometry,
//     to: InstancedBufferGeometry,
//   ): void;

//   protected abstract copyIndexToIndex(
//     geometry: InstancedBufferGeometry,
//     from: number,
//     to: number,
//   ): void;
// }
