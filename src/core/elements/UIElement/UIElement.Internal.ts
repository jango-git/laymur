import type { UIMicroConfig } from "../../miscellaneous/micro/UIMicro.Internal";
import { UITransparencyMode } from "../../miscellaneous/UITransparencyMode";
import type { UIDummyOptions } from "../UIDummy/UIDummy.Internal";

/** Configuration options for UIElement */
export interface UIElementOptions extends UIDummyOptions {
  /** Transforms that don't affect constraints */
  micro: Partial<UIMicroConfig>;
  /** Alpha blending mode */
  transparencyMode: UITransparencyMode;
}

export const ELEMENT_DEFAULT_TRANSPARENCY_MODE = UITransparencyMode.BLEND;
