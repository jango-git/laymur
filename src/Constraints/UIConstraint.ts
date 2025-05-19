import type { UIElement } from "../Elements/UIElement";
import type { UILayer } from "../Layers/UILayer";
import {
  addUIConstraintSymbol,
  removeUIConstraintSymbol,
  resizeSymbol,
} from "../Miscellaneous/symbols";
import type { UIOrientation } from "../Miscellaneous/UIOrientation";

export abstract class UIConstraint {
  constructor(
    public readonly layer: UILayer,
    elements: Set<UIElement>,
  ) {
    this.layer[addUIConstraintSymbol](this, elements);
  }
  public destroy(): void {
    this.layer[removeUIConstraintSymbol](this);
  }
  public abstract [resizeSymbol](orientation: UIOrientation): void;
  protected abstract buildConstraints(): void;
  protected abstract destroyConstraints(): void;
}
