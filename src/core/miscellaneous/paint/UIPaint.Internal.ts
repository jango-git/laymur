import type { UIColorConfig } from "../color/UIColor.Internal.js";
import type { UIGradient } from "./UIGradient.js";

/** Fill of text, a stroke or a shape, either a color or a gradient. A string is a `UIColor` name or a CSS color. */
export type UIPaintConfig = UIColorConfig | UIGradient;

/** Paint as it is stored, a CSS color string or a gradient */
export type UIPaint = string | UIGradient;

/** How the corners of a stroke are joined */
export type UILineJoin = "round" | "bevel" | "miter";

/** How the open ends of a stroke look */
export type UILineCap = "butt" | "round" | "square";

/** Box a gradient is laid over, in canvas coordinates */
export interface UIPaintBox {
  /** Left edge */
  x: number;
  /** Top edge */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
}
