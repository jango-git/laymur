import { Eventail } from "eventail";

export enum UIResizePolicyEvent {
  CHANGE = 0,
}

/**
 * Base class for UI resize policies.
 *
 * Calculates scale factors based on viewport dimensions. Different policies
 * implement different scaling strategies.
 */
export abstract class UIResizePolicy extends Eventail {
  /**
   * Calculates scale factor for given dimensions.
   *
   * @param width - Viewport width in pixels
   * @param height - Viewport height in pixels
   * @returns Scale factor to apply
   * @protected
   */
  protected abstract calculateScaleInternal(
    width: number,
    height: number,
  ): number;
}
