import { UILayer } from "../Layers/UILayer";
import { resizeSymbol } from "../Miscellaneous/symbols";
import { UIOrientation } from "../Miscellaneous/UIOrientation";

export abstract class UIConstraint {
  public constructor(protected readonly layer: UILayer) {}
  public abstract destroy(): void;
  public abstract [resizeSymbol](orientation: UIOrientation): void;
  protected abstract buildConstraints(): void;
  protected abstract destroyConstraints(): void;
}
