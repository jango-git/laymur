import type { WebGLRenderer } from "three";
import { UIMode } from "../miscellaneous/UIMode";
import { UILayer } from "./UILayer";

const DEFAULT_SCREEN_HEIGHT = 1920;

export class UIFullscreenLayer extends UILayer {
  private targetHeightInternal?: number = DEFAULT_SCREEN_HEIGHT;

  constructor() {
    super();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onClick);
    this.onResize();
  }

  public get targetHeight(): number | undefined {
    return this.targetHeightInternal;
  }

  public set targetHeight(value: number | undefined) {
    this.targetHeightInternal = value;
    this.resizeInternal(window.innerWidth, window.innerHeight);
  }

  public override destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onClick);
    super.destroy();
  }

  public override render(renderer: WebGLRenderer, deltaTime: number): void {
    renderer.clear(false, true, true);
    super.render(renderer, deltaTime);
  }

  private calculateScale(): number {
    const targetHeight = this.targetHeight ?? window.innerHeight;
    return targetHeight / window.innerHeight;
  }

  private readonly onResize = (): void => {
    const scale = this.calculateScale();
    this.resizeInternal(window.innerWidth * scale, window.innerHeight * scale);
  };

  private readonly onClick = (event: PointerEvent): void => {
    if (this.mode === UIMode.INTERACTIVE) {
      const rect =
        event.target instanceof HTMLElement
          ? event.target.getBoundingClientRect()
          : null;

      const offsetX = rect ? event.clientX - rect.left : event.clientX;
      const offsetY = rect
        ? rect.bottom - event.clientY
        : window.innerHeight - event.clientY;

      const scale = this.calculateScale();
      this.clickInternal(offsetX * scale, offsetY * scale);
    }
  };
}
