import type { UIElement } from "../Elements/UIElement";
import type { UILayer } from "../Layers/UILayer";
import {
  addUIConstraintSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  removeUIConstraintSymbol,
} from "../Miscellaneous/symbols";
import type { UIOrientation } from "../Miscellaneous/UIOrientation";

export abstract class UIConstraint {
  public name = "";

  constructor(
    public readonly layer: UILayer,
    elements: Set<UIElement>,
  ) {
    this.layer[addUIConstraintSymbol](this, elements);
  }

  public destroy(): void {
    this.layer[removeUIConstraintSymbol](this);
  }

  public abstract [disableConstraintSymbol](orientation: UIOrientation): void;
  public abstract [enableConstraintSymbol](orientation: UIOrientation): void;
}
