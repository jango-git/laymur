/**
 * Pointer callbacks of an input catcher. Positions are in layer coordinates.
 *
 * A catcher that catches a press captures the pointer: until it is released or cancelled, the
 * moves, the release and the cancel of that pointer go to this catcher only, wherever they are,
 * and exactly one release or cancel ends the capture.
 */
export interface UIInputCatcherCallbacks {
  /** Returns true to catch the press: catchers below do not get it, and the pointer is captured */
  catchPointerDown: (x: number, y: number, identifier: number) => boolean;
  /** Returns true to stop the event for catchers below; ignored for a captured pointer */
  catchPointerMove: (x: number, y: number, identifier: number) => boolean;
  /** Returns true to stop the event for catchers below; ignored for a captured pointer */
  catchPointerUp: (x: number, y: number, identifier: number) => boolean;
  /**
   * The pointer is gone for this catcher: drop what is known of it. Called when a pressed
   * pointer is cancelled (by the browser or by the layer), on the catcher that captured it, or
   * on every active catcher if nobody did, since a cancel is not hit-tested; on every other
   * active catcher when one captures the pointer; and on the catchers below one that catches a
   * move or release of a pointer nobody captured. No position: the browser reports none worth
   * using, and the catcher knows the last one it saw.
   */
  catchPointerCancel: (identifier: number) => void;
}

export interface UIInputWrapperView {
  /** Bumped by every change to the draw order; compare with the last seen value */
  readonly version: number;
  createInputCatcher(callbacks: UIInputCatcherCallbacks, zIndex: number): number;
  destroyInputCatcher(handler: number): void;
  getZIndex(handler: number): number;
  getDepth(handler: number): number;
  setZIndex(handler: number, zIndex: number): void;
  getActive(handler: number): boolean;
  setActive(handler: number, active: boolean): void;
}

export interface UIInputWrapperCatcher extends UIInputCatcherCallbacks {
  handler: number;
  /** Order requested by the user; equal values keep the order of creation */
  zIndex: number;
  /** Unique position in the sorted order, used as the rendering depth */
  depth: number;
  active: boolean;
}

/** A pressed pointer, not released or cancelled yet */
export interface UIInputWrapperPointer {
  /** Catcher that caught the press and holds the pointer; null if none did */
  catcher: UIInputWrapperCatcher | null;
  /** Last known position, reported when the layer cancels the pointer */
  x: number;
  y: number;
}
