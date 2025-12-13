import type { UIMicroConfig } from "../miscellaneous/micro/UIMicro.Internal";
import { UITransparencyMode } from "../miscellaneous/UITransparencyMode";
import type { UIDummyOptions } from "./UIDummy.Internal";

export const ELEMENT_DEFAULT_TRANSPARENCY_MODE = UITransparencyMode.BLEND;

export interface UIElementOptions extends UIDummyOptions {
  micro: UIMicroConfig;
  transparencyMode: UITransparencyMode;
}
