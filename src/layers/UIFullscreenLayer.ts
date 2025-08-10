import type { WebGLRenderer } from "three";
import { UILayer } from "./UILayer";

const DEFAULT_SCREEN_HEIGHT = 1920;

export class UIFullscreenLayer extends UILayer {
  private fixedHeightInternal?: number = DEFAULT_SCREEN_HEIGHT;

  constructor() {
    super(DEFAULT_SCREEN_HEIGHT, DEFAULT_SCREEN_HEIGHT);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onClick);
    this.onResize();
  }

  public get fixedHeight(): number | undefined {
    return this.fixedHeightInternal;
  }

  public set fixedHeight(value: number | undefined) {
    this.fixedHeightInternal = value;
    this.resizeInternal(window.innerWidth, window.innerHeight);
  }

  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onClick);
  }

  public render(renderer: WebGLRenderer, deltaTime: number): void {
    renderer.clear(false, true, true);
    super.renderInternal(renderer, deltaTime);
  }

  private calculateScale(): number {
    return this.fixedHeight === undefined
      ? window.innerHeight
      : this.fixedHeight / window.innerHeight;
  }

  private readonly onResize = (): void => {
    const scale = this.calculateScale();
    this.resizeInternal(window.innerWidth * scale, window.innerHeight * scale);
  };

  private readonly onClick = (event: PointerEvent): void => {
    const r =
      event.target instanceof HTMLElement
        ? event.target.getBoundingClientRect()
        : null;

    const x = r ? event.clientX - r.left : event.clientX;
    const y = r ? r.bottom - event.clientY : window.innerHeight - event.clientY;

    const scale = this.calculateScale();
    this.clickInternal(x * scale, y * scale);
  };
}
