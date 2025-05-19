import { UILayer } from "../Layers/UILayer";
import { resizeSymbol } from "../Miscellaneous/symbols";
import { UIConstraintOrientation } from "./UIConstraintOrientation";

export abstract class UIConstraint {
  public constructor(protected readonly layer: UILayer) {}
  public abstract destroy(): void;
  public abstract [resizeSymbol](orientation: UIConstraintOrientation): void;
  protected abstract buildConstraints(): void;
  protected abstract destroyConstraints(): void;
}
