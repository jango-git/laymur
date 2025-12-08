import type { UIColor } from "./color/UIColor";
import type { UIMode } from "./UIMode";

export interface UIElementCommonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  color: UIColor;
  mode: UIMode;
}
