import { UIResizePolicy } from "./UIResizePolicy";

/**
 * No scaling applied, always returns 1:1 scale.
 */
export class UIResizePolicyNone extends UIResizePolicy {
  protected calculateScaleInternal(width: number, height: number): number {
    void width;
    void height;
    return 1;
  }
}
