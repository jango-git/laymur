import type { UIConstraint } from "../core/constraints/UIConstraint.js";

export interface UIConstraintDebug {
  get constraint(): UIConstraint;
  get visible(): boolean;
  set visible(value: boolean);
  destroy(): void;
}
