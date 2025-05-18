import { resizeSymbol } from "../Miscellaneous/symbols";
import { UIConstraintOrientation } from "./UIConstraintOrientation";

export abstract class UIConstraint {
  abstract [resizeSymbol](orientation: UIConstraintOrientation): void;
}
