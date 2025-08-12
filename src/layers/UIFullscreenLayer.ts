import type { WebGLRenderer } from "three";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../miscellaneous/asserts";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import { UILayer } from "./UILayer";

export class UIFullscreenLayer extends UILayer {
  private fixedWidthInternal?: number;
  private fixedHeightInternal?: number;

  constructor(fixedWidth: number | undefined, fixedHeight: number | undefined) {
    if (fixedWidth !== undefined) {
      assertValidPositiveNumber(fixedWidth, "UIFullscreenLayer.fixedWidth");
    }
    if (fixedHeight !== undefined) {
      assertValidPositiveNumber(fixedHeight, "UIFullscreenLayer.fixedHeight");
    }

    super(1, 1);
    this.fixedWidthInternal = fixedWidth;
    this.fixedHeightInternal = fixedHeight;
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onClick);
    this.onResize();
  }

  public get fixedWidth(): number | undefined {
    return this.fixedWidthInternal;
  }

  public get fixedHeight(): number | undefined {
    return this.fixedHeightInternal;
  }

  public set fixedWidth(value: number | undefined) {
    if (value !== undefined) {
      assertValidPositiveNumber(value, "UIFullscreenLayer.fixedWidth");
    }

    if (value !== this.fixedWidthInternal) {
      this.fixedWidthInternal = value;
      this.onResize();
    }
  }

  public set fixedHeight(value: number | undefined) {
    if (value !== undefined) {
      assertValidPositiveNumber(value, "UIFullscreenLayer.fixedHeight");
    }

    if (value !== this.fixedHeightInternal) {
      this.fixedHeightInternal = value;
      this.onResize();
    }
  }

  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onClick);
  }

  public render(renderer: WebGLRenderer, deltaTime: number): void {
    assertValidNumber(deltaTime, "UIFullscreenLayer.deltaTime");
    renderer.clear(false, true, true);
    super.renderInternal(renderer, deltaTime);
  }

  private calculateScale(): number {
    if (this.orientation === UIOrientation.HORIZONTAL) {
      if (this.fixedWidth !== undefined) {
        return this.fixedWidth / window.innerWidth;
      } else if (this.fixedHeight !== undefined) {
        return this.fixedHeight / window.innerHeight;
      } else {
        return 1;
      }
    } else {
      if (this.fixedHeight !== undefined) {
        return this.fixedHeight / window.innerHeight;
      } else if (this.fixedWidth !== undefined) {
        return this.fixedWidth / window.innerWidth;
      } else {
        return 1;
      }
    }
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
