import type { UIInputWrapperCatcher, UIInputWrapperInterface } from "./UIInputWrapper.Internal";

export class UIInputWrapper implements UIInputWrapperInterface {
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
      active: true,
    });
    this.zIndicesDirty = true;
    this.dirty = true;
    return handler;
  }

  public destroyInputCatcher(handler: number): void {
    const index = this.catchers.findIndex((item) => item.handler === handler);
    if (index === -1) {
      throw new Error("UIInputWrapper.destroyInputCatcher.handler: handler not found");
    }
    this.catchers.splice(index, 1);
  }

  public getZIndex(handler: number): number {
    this.ensureSorted();
    const found = this.catchers.find((item) => item.handler === handler);
    if (!found) {
      throw new Error("UIInputWrapper.getZIndex.handler: handler not found");
    }
    return found.zIndex;
  }

  public setZIndex(handler: number, zIndex: number): void {
    const found = this.catchers.find((item) => item.handler === handler);
    if (!found) {
      throw new Error("UIInputWrapper.setZIndex.handler: handler not found");
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
      throw new Error("UIInputWrapper.getActive.handler: handler not found");
    }
    return found.active;
  }

  public setActive(handler: number, active: boolean): void {
    const found = this.catchers.find((item) => item.handler === handler);
    if (!found) {
      throw new Error("UIInputWrapper.setActive.handler: handler not found");
    }
    if (found.active !== active) {
      found.active = active;
    }
  }

  /** @internal */
  public onPointerDown(x: number, y: number, identifier: number): void {
    this.ensureSorted();
    for (let index = this.catchers.length - 1; index >= 0; index--) {
      const item = this.catchers[index];
      if (item.active && item.catchPointerDown(x, y, identifier)) {
        break;
      }
    }
  }

  /** @internal */
  public onPointerMove(x: number, y: number, identifier: number): void {
    this.ensureSorted();
    for (let index = this.catchers.length - 1; index >= 0; index--) {
      const item = this.catchers[index];
      if (item.active && item.catchPointerMove(x, y, identifier)) {
        break;
      }
    }
  }

  /** @internal */
  public onPointerUp(x: number, y: number, identifier: number): void {
    this.ensureSorted();
    for (let index = this.catchers.length - 1; index >= 0; index--) {
      const item = this.catchers[index];
      if (item.active && item.catchPointerUp(x, y, identifier)) {
        break;
      }
    }
  }

  private ensureSorted(): void {
    if (this.zIndicesDirty) {
      this.catchers.sort((a, b) => a.zIndex - b.zIndex);

      const count = this.catchers.length;
      const step = count < 1024 ? 1 : 1024 / count;
      for (let index = 0; index < count; index++) {
        this.catchers[index].zIndex = index * step;
      }

      this.zIndicesDirty = false;
    }
  }
}
