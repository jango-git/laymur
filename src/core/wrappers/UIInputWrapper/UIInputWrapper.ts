import type { UIInputWrapperCatcher, UIInputWrapperView } from "./UIInputWrapper.Internal.js";

export class UIInputWrapper implements UIInputWrapperView {
  /** @internal */
  public dirty = false;

  private zIndicesDirty = false;
  private readonly catchers: UIInputWrapperCatcher[] = [];
  private lastHandler = 0;

  public createInputCatcher(
    catchPointerDown: (x: number, y: number, identifier: number) => boolean,
    catchPointerMove: (x: number, y: number, identifier: number) => boolean,
    catchPointerUp: (x: number, y: number, identifier: number) => boolean,
    zIndex: number,
  ): number {
    const handler = this.lastHandler++;
    this.catchers.push({
      handler,
      catchPointerDown,
      catchPointerMove,
      catchPointerUp,
      zIndex,
      depth: 0,
      active: true,
    });
    this.zIndicesDirty = true;
    this.dirty = true;
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
    this.catchers.splice(index, 1);
    this.zIndicesDirty = true;
    this.dirty = true;
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
      this.dirty = true;
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
    }
  }

  /** @internal */
  public onPointerDown(x: number, y: number, identifier: number): void {
    this.dispatch(x, y, identifier, "catchPointerDown");
  }

  /** @internal */
  public onPointerMove(x: number, y: number, identifier: number): void {
    this.dispatch(x, y, identifier, "catchPointerMove");
  }

  /** @internal */
  public onPointerUp(x: number, y: number, identifier: number): void {
    this.dispatch(x, y, identifier, "catchPointerUp");
  }

  /**
   * Passes a pointer event from the top catcher down until one catches it. A handler may
   * destroy elements, so the catchers are walked over a copy and a destroyed one is skipped.
   */
  private dispatch(
    x: number,
    y: number,
    identifier: number,
    name: "catchPointerDown" | "catchPointerMove" | "catchPointerUp",
  ): void {
    this.ensureSorted();
    const catchers = this.catchers.slice();
    for (let index = catchers.length - 1; index >= 0; index--) {
      const item = catchers[index];
      if (item.active && item[name](x, y, identifier)) {
        break;
      }
    }
  }

  private ensureSorted(): void {
    if (this.zIndicesDirty) {
      this.catchers.sort((a, b) => a.zIndex - b.zIndex || a.handler - b.handler);

      const count = this.catchers.length;
      const step = count < 1024 ? 1 : 1024 / count;
      for (let index = 0; index < count; index++) {
        this.catchers[index].depth = index * step;
      }

      this.zIndicesDirty = false;
    }
  }
}
