import type { UIMicroConfig } from "../../miscellaneous/micro/UIMicro.Internal";
import { UITransparencyMode } from "../../miscellaneous/UITransparencyMode";
import type { UIInputDummyOptions } from "../UIInputDummy/UIInputDummy.Internal";

/** Configuration options for UIElement */
export interface UIElementOptions extends UIInputDummyOptions {
  /** Transforms that don't affect constraints */
  micro: UIMicroConfig;
  /** Alpha blending mode */
  transparencyMode: UITransparencyMode;
}

export const ELEMENT_DEFAULT_TRANSPARENCY_MODE = UITransparencyMode.BLEND;
