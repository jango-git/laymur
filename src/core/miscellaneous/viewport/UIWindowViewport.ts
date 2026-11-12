import { UIViewport } from "./UIViewport.js";

/** The whole browser window */
export class UIWindowViewport extends UIViewport {
  constructor() {
    super();
    window.addEventListener("resize", this.onResize);
  }

  public get width(): number {
    return window.innerWidth;
  }

  public get height(): number {
    return window.innerHeight;
  }

  public toLocal<T extends { x: number; y: number }>(
    clientX: number,
    clientY: number,
    result: T,
  ): T {
    result.x = clientX;
    result.y = window.innerHeight - clientY;
    return result;
  }

  protected destroyInternal(): void {
    window.removeEventListener("resize", this.onResize);
  }

  private readonly onResize = (): void => {
    this.signalResizedInternal.emit();
  };
}
