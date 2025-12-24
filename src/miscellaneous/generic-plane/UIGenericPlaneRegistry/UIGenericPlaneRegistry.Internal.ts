import type { UIGenericInstancedPlane } from "../UIGenericInstancedPlane/UIGenericInstancedPlane";
import type { UIGenericPlane } from "../UIGenericPlane/UIGenericPlane";

export type PlaneDescriptor = SinglePlaneDescriptor | InstancedPlaneDescriptor;

export interface SinglePlaneDescriptor {
  plane: UIGenericPlane;
}

export interface InstancedPlaneDescriptor {
  plane: UIGenericInstancedPlane;
  instanceHandler: number;
}

export function isSinglePlaneDescriptor(
  descriptor: PlaneDescriptor,
): descriptor is SinglePlaneDescriptor {
  return !("instanceHandler" in descriptor);
}

export function isInstancedPlaneDescriptor(
  descriptor: PlaneDescriptor,
): descriptor is InstancedPlaneDescriptor {
  return "instanceHandler" in descriptor;
}
