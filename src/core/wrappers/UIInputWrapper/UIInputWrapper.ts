import type {
  UIInputCatcherCallbacks,
  UIInputWrapperCatcher,
  UIInputWrapperPointer,
  UIInputWrapperView,
} from "./UIInputWrapper.Internal.js";

export class UIInputWrapper implements UIInputWrapperView {
  private versionInternal = 0;

  private zIndicesDirty = false;
  private readonly catchers: UIInputWrapperCatcher[] = [];
  /** Pressed pointers: the input wrapper is the one place that knows of them */
  private readonly pointers = new Map<number, UIInputWrapperPointer>();
  /** Pointers seen moving while not pressed, such as a hovering mouse */
  private readonly hoveringPointers = new Set<number>();
  private lastHandler = 0;

  /** Bumped by every change to the draw order, to compare with a value seen before */
  public get version(): number {
    return this.versionInternal;
  }

  public createInputCatcher(callbacks: UIInputCatcherCallbacks, zIndex: number): number {
    const handler = this.lastHandler++;
    this.catchers.push({
      handler,
      catchPointerDown: callbacks.catchPointerDown,
      catchPointerMove: callbacks.catchPointerMove,
      catchPointerUp: callbacks.catchPointerUp,
      catchPointerCancel: callbacks.catchPointerCancel,
      zIndex,
      depth: 0,
      active: true,
    });
    this.zIndicesDirty = true;
    this.versionInternal++;
    return handler;
  }

  public destroyInputCatcher(handler: number): void {
    const index = this.catchers.findIndex((item) => item.handler === handler);
    if (index === -1) {
      throw new Error(
        `UIInputWrapper.destroyInputCatcher.handler: handler ${handler} not found; its element may be destroyed`,
      );
    }
    this.catchers[index].active = false;
    this.releaseCaptures(this.catchers[index]);
    this.catchers.splice(index, 1);
    this.zIndicesDirty = true;
    this.versionInternal++;
  }

  public getZIndex(handler: number): number {
    const found = this.catchers.find((item) => item.handler === handler);
    if (!found) {
      throw new Error(
        `UIInputWrapper.getZIndex.handler: handler ${handler} not found; its element may be destroyed`,
      );
    }
    return found.zIndex;
  }

  public getDepth(handler: number): number {
    this.ensureSorted();
    const found = this.catchers.find((item) => item.handler === handler);
    if (!found) {
      throw new Error(
        `UIInputWrapper.getDepth.handler: handler ${handler} not found; its element may be destroyed`,
      );
    }
    return found.depth;
  }

  public setZIndex(handler: number, zIndex: number): void {
    const found = this.catchers.find((item) => item.handler === handler);
    if (!found) {
      throw new Error(
        `UIInputWrapper.setZIndex.handler: handler ${handler} not found; its element may be destroyed`,
      );
    }
    if (found.zIndex !== zIndex) {
      found.zIndex = zIndex;
      this.zIndicesDirty = true;
      this.versionInternal++;
    }
  }

  public getActive(handler: number): boolean {
    const found = this.catchers.find((item) => item.handler === handler);
    if (!found) {
      throw new Error(
        `UIInputWrapper.getActive.handler: handler ${handler} not found; its element may be destroyed`,
      );
    }
    return found.active;
  }

  public setActive(handler: number, active: boolean): void {
    const found = this.catchers.find((item) => item.handler === handler);
    if (!found) {
      throw new Error(
        `UIInputWrapper.setActive.handler: handler ${handler} not found; its element may be destroyed`,
      );
    }
    if (found.active !== active) {
      found.active = active;
      if (!active) {
        this.releaseCaptures(found);
      }
    }
  }

  /** @internal */
  public onPointerDown(x: number, y: number, identifier: number): void {
    // Pressed again without a release seen, as when released outside the page: the old press
    // ends as cancelled
    if (this.pointers.get(identifier)?.catcher) {
      this.onPointerCancel(identifier);
    }
    // Known before the dispatch, so that a handler cancelling the pointers of the layer cancels
    // this one too
    this.hoveringPointers.delete(identifier);
    const pointer: UIInputWrapperPointer = { catcher: null, x, y };
    this.pointers.set(identifier, pointer);
    const caught = this.dispatch(
      identifier,
      (catcher) => catcher.catchPointerDown(x, y, identifier),
      pointer,
    );
    if (this.pointers.get(identifier) !== pointer) {
      return;
    }
    // A handler may have deactivated or destroyed the catcher
    const catcher = caught?.active === true ? caught : null;
    pointer.catcher = catcher;
    if (catcher !== null) {
      // Catchers above that saw the press without catching it would never see the pointer
      // again: for them it is gone
      this.broadcastCancel(identifier, catcher);
    }
  }

  /** @internal */
  public onPointerMove(x: number, y: number, identifier: number): void {
    const pointer = this.pointers.get(identifier);
    if (pointer !== undefined) {
      pointer.x = x;
      pointer.y = y;
    }
    if (pointer?.catcher) {
      pointer.catcher.catchPointerMove(x, y, identifier);
      return;
    }
    if (pointer === undefined) {
      this.hoveringPointers.add(identifier);
    }
    this.cancelBelow(
      identifier,
      this.dispatch(identifier, (catcher) => catcher.catchPointerMove(x, y, identifier)),
    );
  }

  /**
   * @param hovering Whether the pointer stays over the page after the release, as a mouse does
   * @internal
   */
  public onPointerUp(x: number, y: number, identifier: number, hovering: boolean): void {
    const pointer = this.pointers.get(identifier);
    this.pointers.delete(identifier);
    if (hovering) {
      this.hoveringPointers.add(identifier);
    } else {
      this.hoveringPointers.delete(identifier);
    }
    if (pointer?.catcher) {
      pointer.catcher.catchPointerUp(x, y, identifier, hovering);
      return;
    }
    this.cancelBelow(
      identifier,
      this.dispatch(identifier, (catcher) => catcher.catchPointerUp(x, y, identifier, hovering)),
    );
  }

  /**
   * A captured pointer is cancelled at its catcher. Any other one goes to every active catcher,
   * top one first: the browser cancels a pointer for its own reasons (a system gesture,
   * scrolling, a popup) and reports no useful position, so there is no hit test, and each
   * catcher that tracks the pointer has to drop it.
   * @internal
   */
  public onPointerCancel(identifier: number): void {
    const pointer = this.pointers.get(identifier);
    this.pointers.delete(identifier);
    this.hoveringPointers.delete(identifier);
    if (pointer?.catcher) {
      pointer.catcher.catchPointerCancel(identifier);
      return;
    }
    this.broadcastCancel(identifier, null);
  }

  /**
   * Cancels every pressed pointer, for a layer that will not see their releases: it stops
   * taking input, or the page is hidden. Hovering pointers leave the catchers too.
   * @param onCancel Called for each pressed pointer before the catchers are, with its last
   * position
   * @internal
   */
  public cancelPointers(onCancel: (x: number, y: number, identifier: number) => void): void {
    for (const [identifier, pointer] of [...this.pointers]) {
      // A handler may have ended the pointer already
      if (this.pointers.get(identifier) === pointer) {
        onCancel(pointer.x, pointer.y, identifier);
        this.onPointerCancel(identifier);
      }
    }
    for (const identifier of [...this.hoveringPointers]) {
      this.onPointerCancel(identifier);
    }
  }

  /**
   * Passes a pointer event from the top catcher down until one catches it. A handler may
   * destroy elements, so the catchers are walked over a copy and a destroyed one is skipped.
   * @param catchEvent Passes the event to a catcher; true if it caught it
   * @param pointer Pressed pointer the event belongs to: the walk stops once a handler ends it
   * @returns The catcher that caught the event, or null
   */
  private dispatch(
    identifier: number,
    catchEvent: (catcher: UIInputWrapperCatcher) => boolean,
    pointer?: UIInputWrapperPointer,
  ): UIInputWrapperCatcher | null {
    this.ensureSorted();
    const catchers = this.catchers.slice();
    for (let index = catchers.length - 1; index >= 0; index--) {
      if (pointer !== undefined && this.pointers.get(identifier) !== pointer) {
        return null;
      }
      const item = catchers[index];
      if (item.active && catchEvent(item)) {
        return item;
      }
    }
    return null;
  }

  /**
   * Passes a cancel to the active catchers below one that caught an event: they did not see it,
   * and the pointer is over the catcher above them now, or released
   */
  private cancelBelow(identifier: number, caught: UIInputWrapperCatcher | null): void {
    if (caught === null) {
      return;
    }
    // By draw order rather than by position in the list: a handler may have destroyed the
    // catcher that caught the event
    const catchers = this.catchers.slice();
    for (let index = catchers.length - 1; index >= 0; index--) {
      const item = catchers[index];
      if (item.active && compareCatchers(item, caught) < 0) {
        item.catchPointerCancel(identifier);
      }
    }
  }

  /** Passes a cancel to every active catcher but one, top one first */
  private broadcastCancel(identifier: number, except: UIInputWrapperCatcher | null): void {
    this.ensureSorted();
    const catchers = this.catchers.slice();
    for (let index = catchers.length - 1; index >= 0; index--) {
      const item = catchers[index];
      if (item.active && item !== except) {
        item.catchPointerCancel(identifier);
      }
    }
  }

  /**
   * Frees the pointers held by a catcher that stops taking input; it resets its own state. The
   * pointers stay pressed, for the layer, with no catcher.
   */
  private releaseCaptures(catcher: UIInputWrapperCatcher): void {
    for (const pointer of this.pointers.values()) {
      if (pointer.catcher === catcher) {
        pointer.catcher = null;
      }
    }
  }

  private ensureSorted(): void {
    if (this.zIndicesDirty) {
      this.catchers.sort(compareCatchers);

      const count = this.catchers.length;
      const step = count < 1024 ? 1 : 1024 / count;
      for (let index = 0; index < count; index++) {
        this.catchers[index].depth = index * step;
      }

      this.zIndicesDirty = false;
    }
  }
}

/** Draw order of catchers, bottom first: by zIndex, then by creation */
function compareCatchers(a: UIInputWrapperCatcher, b: UIInputWrapperCatcher): number {
  return a.zIndex - b.zIndex || a.handler - b.handler;
}
