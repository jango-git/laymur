import type { UIGenericInstancedPlane } from "./UIGenericInstancedPlane";
import type { UIGenericPlane } from "./UIGenericPlane";

export interface GenericPlaneDescriptor {
  plane: UIGenericPlane | UIGenericInstancedPlane;
  instanceHandler?: number;
}
