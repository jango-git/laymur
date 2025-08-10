/**
 * Defines the visibility and interactivity state of UI elements.
 *
 * UI elements can be in one of three states:
 * - Hidden: Element is not visible and does not receive input
 * - Visible: Element is visible but does not receive input
 * - Interactive: Element is visible and can receive input events
 */
export enum UIMode {
  /**
   * Element is not rendered and does not receive input events.
   * Equivalent to setting `display: none` in CSS.
   */
  HIDDEN,

  /**
   * Element is rendered but does not receive input events.
   * Equivalent to setting `pointer-events: none` in CSS.
   */
  VISIBLE,

  /**
   * Element is rendered and can receive input events.
   * This is the fully active state for UI elements.
   */
  INTERACTIVE,
}
