import type { Matrix4, Scene } from "three";
import type { UITransparencyMode } from "../../UITransparencyMode";
import type { UIProperty } from "../shared";
import {
  cloneGLProperties,
  cloneProperties,
  convertUIPropertiesToGLProperties,
  extractZIndex,
} from "../shared";
import { UIGenericInstancedPlane } from "../UIGenericInstancedPlane/UIGenericInstancedPlane";
import type {
  PlaneDescriptor,
  PlaneState,
} from "./UIGenericPlaneRegistry.Internal";

/**
 * Manages shader plane instances with automatic batching based on zIndex order.
 *
 * Uses dirty/flush pattern:
 * - Mutations update internal state and mark dirty
 * - flush() applies all pending changes to GPU representation
 * - setVisibility is immediate (doesn't affect structure)
 *
 * @internal
 */
export class UIPlaneRegistry {
  private readonly scene: Scene;

  // Source of truth
  private readonly handlerToState: Map<number, PlaneState> = new Map();
  private lastHandler = 0;

  // GPU representation
  private readonly orderedMeshes: UIGenericInstancedPlane[] = [];
  private readonly handlerToDescriptor: Map<number, PlaneDescriptor> =
    new Map();

  // Dirty tracking
  private readonly pendingCreate: Set<number> = new Set();
  private readonly pendingDelete: Set<number> = new Set();
  private readonly pendingRelocate: Set<number> = new Set();
  private needsFlush = false;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Creates plane with given shader and properties.
   * Properties and transform are cloned; originals can be safely modified.
   * Changes are pending until flush() is called.
   * @returns Plane handler for subsequent operations
   */
  public createPlane(
    source: string,
    properties: Record<string, UIProperty>,
    transform: Matrix4,
    visibility: boolean,
    transparency: UITransparencyMode,
  ): number {
    const handler = this.lastHandler++;
    const glProperties = convertUIPropertiesToGLProperties(
      cloneProperties(properties),
    );
    const zIndex = extractZIndex(transform);

    const state: PlaneState = {
      source,
      properties: glProperties,
      transform: transform.clone(),
      visibility,
      transparency,
      zIndex,
    };

    this.handlerToState.set(handler, state);
    this.pendingCreate.add(handler);
    this.needsFlush = true;

    return handler;
  }

  /**
   * Removes plane. Changes are pending until flush() is called.
   */
  public destroyPlane(handler: number): void {
    if (!this.handlerToState.has(handler)) {
      throw new Error(
        `UIPlaneRegistry.destroyPlane: handler ${handler} not found`,
      );
    }

    this.handlerToState.delete(handler);

    // If was pending create, just remove from there
    if (this.pendingCreate.has(handler)) {
      this.pendingCreate.delete(handler);
      return;
    }

    // Remove from relocate if was there
    this.pendingRelocate.delete(handler);

    // Mark for deletion
    this.pendingDelete.add(handler);
    this.needsFlush = true;
  }

  /**
   * Updates plane properties.
   * Values are copied; originals can be safely modified.
   * If texture changes, element will be relocated on flush().
   * Instantiable properties are applied immediately.
   */
  public setProperties(
    handler: number,
    properties: Record<string, UIProperty>,
  ): void {
    const state = this.resolveState(handler);
    const glProperties = convertUIPropertiesToGLProperties(properties);

    // Check if any non-instantiable (texture) changed
    let textureChanged = false;
    for (const name in glProperties) {
      const newProp = glProperties[name];
      const oldProp = state.properties[name];

      if (!newProp.glslTypeInfo.instantiable) {
        if (oldProp.value !== newProp.value) {
          textureChanged = true;
        }
      }

      // Update state
      state.properties[name] = {
        value: newProp.value,
        glslTypeInfo: newProp.glslTypeInfo,
      };
    }

    if (textureChanged && !this.pendingCreate.has(handler)) {
      this.pendingRelocate.add(handler);
      this.needsFlush = true;
    } else {
      // Apply immediately if already in mesh and no texture change
      const descriptor = this.handlerToDescriptor.get(handler);
      if (descriptor) {
        descriptor.mesh.setPropertiesAt(descriptor.instanceIndex, glProperties);
      }
    }
  }

  /**
   * Updates plane transform matrix.
   * Matrix is copied; original can be safely modified.
   * If zIndex changes, element will be relocated on flush().
   */
  public setTransform(handler: number, transform: Matrix4): void {
    const state = this.resolveState(handler);
    const newZIndex = extractZIndex(transform);
    const oldZIndex = state.zIndex;

    state.transform.copy(transform);
    state.zIndex = newZIndex;

    if (oldZIndex !== newZIndex && !this.pendingCreate.has(handler)) {
      this.pendingRelocate.add(handler);
      this.needsFlush = true;
    } else {
      // Apply immediately if already in mesh and zIndex unchanged
      const descriptor = this.handlerToDescriptor.get(handler);
      if (descriptor) {
        descriptor.mesh.setTransformAt(descriptor.instanceIndex, transform);
      }
    }
  }

  /**
   * Updates plane visibility.
   * This is applied immediately (doesn't affect batching structure).
   */
  public setVisibility(handler: number, visibility: boolean): void {
    const state = this.resolveState(handler);
    state.visibility = visibility;

    // Apply immediately if already in a mesh
    const descriptor = this.handlerToDescriptor.get(handler);
    if (descriptor) {
      descriptor.mesh.setVisibilityAt(descriptor.instanceIndex, visibility);
    }
  }

  /**
   * Updates plane transparency mode.
   * Element will be relocated on flush() if transparency changes.
   */
  public setTransparency(
    handler: number,
    transparency: UITransparencyMode,
  ): void {
    const state = this.resolveState(handler);

    if (state.transparency === transparency) {
      return;
    }

    state.transparency = transparency;

    if (!this.pendingCreate.has(handler)) {
      this.pendingRelocate.add(handler);
      this.needsFlush = true;
    }
  }

  /**
   * Apply all pending changes to GPU representation.
   * Call this before rendering.
   */
  public flush(): void {
    if (!this.needsFlush) {
      return;
    }

    this.processDeletes();
    this.processRelocates();
    this.processCreates();
    this.mergeCompatibleNeighbors();
    this.cleanupEmptyMeshes();
    this.syncSceneOrder();

    this.pendingCreate.clear();
    this.pendingDelete.clear();
    this.pendingRelocate.clear();
    this.needsFlush = false;
  }

  private processDeletes(): void {
    for (const handler of this.pendingDelete) {
      const descriptor = this.handlerToDescriptor.get(handler);
      if (!descriptor) {
        continue; // Already removed
      }

      const { mesh, instanceIndex } = descriptor;

      mesh.removeAt(instanceIndex);
      this.shiftHandlerIndices(mesh, instanceIndex + 1, -1);
      this.handlerToDescriptor.delete(handler);
    }
  }

  private processRelocates(): void {
    for (const handler of this.pendingRelocate) {
      const descriptor = this.handlerToDescriptor.get(handler);
      if (!descriptor) {
        continue; // Not in mesh yet
      }

      const { mesh, instanceIndex } = descriptor;

      mesh.removeAt(instanceIndex);
      this.shiftHandlerIndices(mesh, instanceIndex + 1, -1);
      this.handlerToDescriptor.delete(handler);

      // Will be re-inserted in processCreates
      this.pendingCreate.add(handler);
    }
  }

  private processCreates(): void {
    if (this.pendingCreate.size === 0) {
      return;
    }

    // Collect and sort by zIndex
    const toCreate: { handler: number; state: PlaneState }[] = [];
    for (const handler of this.pendingCreate) {
      const state = this.handlerToState.get(handler);
      if (state) {
        toCreate.push({ handler, state });
      }
    }

    toCreate.sort((a, b) => a.state.zIndex - b.state.zIndex);

    // Check for duplicate zIndex
    for (let i = 1; i < toCreate.length; i++) {
      if (toCreate[i].state.zIndex === toCreate[i - 1].state.zIndex) {
        throw new Error(
          `UIPlaneRegistry.flush: duplicate zIndex=${toCreate[i].state.zIndex} ` +
            `for handlers ${toCreate[i - 1].handler} and ${toCreate[i].handler}`,
        );
      }
    }

    // Insert each element
    for (const { handler, state } of toCreate) {
      this.insertSingleElement(handler, state);
    }
  }

  private insertSingleElement(handler: number, state: PlaneState): void {
    const { source, properties, transform, visibility, transparency, zIndex } =
      state;

    // Find compatible mesh
    let candidateMesh: UIGenericInstancedPlane | null = null;

    for (const mesh of this.orderedMeshes) {
      if (!mesh.isCompatibleWith(source, properties, transparency)) {
        continue;
      }

      if (mesh.instancesCount === 0) {
        candidateMesh = mesh;
        break;
      }

      const meshMinZ = mesh.getZIndexAt(0);
      const meshMaxZ = mesh.getZIndexAt(mesh.instancesCount - 1);

      // Can insert if zIndex fits within or extends the range
      if (zIndex >= meshMinZ - 1 && zIndex <= meshMaxZ + 1) {
        candidateMesh = mesh;
        break;
      }
    }

    if (candidateMesh) {
      const instanceIndex = this.findInstanceIndexInMesh(candidateMesh, zIndex);

      candidateMesh.insertAt(instanceIndex, properties, transform, visibility);
      this.shiftHandlerIndices(candidateMesh, instanceIndex, 1);
      this.handlerToDescriptor.set(handler, {
        mesh: candidateMesh,
        instanceIndex,
      });
    } else {
      // Create new mesh
      const meshIndex = this.findMeshIndexForZIndex(zIndex);

      const mesh = new UIGenericInstancedPlane(
        source,
        cloneGLProperties(properties),
        transparency,
      );
      mesh.insertAt(0, properties, transform, visibility);

      this.orderedMeshes.splice(meshIndex, 0, mesh);
      this.scene.add(mesh);

      this.handlerToDescriptor.set(handler, { mesh, instanceIndex: 0 });
    }
  }

  private mergeCompatibleNeighbors(): void {
    let i = 0;
    while (i < this.orderedMeshes.length - 1) {
      const left = this.orderedMeshes[i];
      const right = this.orderedMeshes[i + 1];

      if (left.instancesCount === 0 || right.instancesCount === 0) {
        i++;
        continue;
      }

      const leftMaxZ = left.getZIndexAt(left.instancesCount - 1);
      const rightMinZ = right.getZIndexAt(0);

      // Check if they can be merged (non-overlapping zIndex ranges and compatible)
      if (
        leftMaxZ < rightMinZ &&
        left.isCompatibleWith(
          right.source,
          right.getProperties(),
          right.transparency,
        )
      ) {
        const indexOffset = left.instancesCount;
        left.merge(right);
        this.remapHandlersAfterMerge(right, left, indexOffset);

        this.scene.remove(right);
        right.destroy();
        this.orderedMeshes.splice(i + 1, 1);

        // Don't increment i, check if we can merge again
        continue;
      }

      i++;
    }
  }

  private cleanupEmptyMeshes(): void {
    for (let i = this.orderedMeshes.length - 1; i >= 0; i--) {
      const mesh = this.orderedMeshes[i];
      if (mesh.instancesCount === 0) {
        this.scene.remove(mesh);
        mesh.destroy();
        this.orderedMeshes.splice(i, 1);
      }
    }
  }

  private resolveState(handler: number): PlaneState {
    const state = this.handlerToState.get(handler);
    if (!state) {
      throw new Error(
        `UIPlaneRegistry.resolveState: handler ${handler} not found`,
      );
    }
    return state;
  }

  private findMeshIndexForZIndex(zIndex: number): number {
    for (let i = 0; i < this.orderedMeshes.length; i++) {
      const mesh = this.orderedMeshes[i];
      if (mesh.instancesCount > 0 && mesh.getZIndexAt(0) > zIndex) {
        return i;
      }
    }
    return this.orderedMeshes.length;
  }

  private findInstanceIndexInMesh(
    mesh: UIGenericInstancedPlane,
    zIndex: number,
  ): number {
    for (let i = 0; i < mesh.instancesCount; i++) {
      if (mesh.getZIndexAt(i) > zIndex) {
        return i;
      }
    }
    return mesh.instancesCount;
  }

  private shiftHandlerIndices(
    mesh: UIGenericInstancedPlane,
    fromIndex: number,
    delta: number,
  ): void {
    for (const descriptor of this.handlerToDescriptor.values()) {
      if (descriptor.mesh === mesh && descriptor.instanceIndex >= fromIndex) {
        descriptor.instanceIndex += delta;
      }
    }
  }

  private remapHandlersAfterMerge(
    fromMesh: UIGenericInstancedPlane,
    toMesh: UIGenericInstancedPlane,
    indexOffset: number,
  ): void {
    for (const descriptor of this.handlerToDescriptor.values()) {
      if (descriptor.mesh === fromMesh) {
        descriptor.mesh = toMesh;
        descriptor.instanceIndex += indexOffset;
      }
    }
  }

  private syncSceneOrder(): void {
    // Sort meshes by their minimum zIndex
    this.orderedMeshes.sort((a, b) => {
      const aZ = a.instancesCount > 0 ? a.getZIndexAt(0) : 0;
      const bZ = b.instancesCount > 0 ? b.getZIndexAt(0) : 0;
      return aZ - bZ;
    });

    // Update render order
    for (let i = 0; i < this.orderedMeshes.length; i++) {
      this.orderedMeshes[i].renderOrder = i;
    }
  }
}
