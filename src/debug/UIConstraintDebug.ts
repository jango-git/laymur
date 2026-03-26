import type { UIConstraint } from "../core/constraints/UIConstraint";

export interface UIConstraintDebug {
  get constraint(): UIConstraint;
  get visible(): boolean;
  set visible(value: boolean);
  destroy(): void;
}
