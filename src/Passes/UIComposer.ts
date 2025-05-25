import type { Texture, WebGLRenderer } from "three";
import {
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";
import { UIDrawPass } from "./UIDrawPass";
import type { UIPass } from "./UIPass";

export class UIComposer {
  public readonly passes: UIPass[] = [];
  private readonly drawPass = new UIDrawPass();
  private fromRenderTarget: WebGLRenderTarget;
  private toRenderTarget: WebGLRenderTarget;

  constructor() {
    const parameters = {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.fromRenderTarget = new WebGLRenderTarget(1, 1, parameters);
    this.toRenderTarget = new WebGLRenderTarget(1, 1, parameters);
  }

  public calculatePadding(): number {
    return this.passes.reduce((a, p) => Math.max(a, p.padding), 0);
  }

  public render(renderer: WebGLRenderer, texture: Texture): Texture {
    if (this.passes.length === 0) {
      return texture;
    }

    if (this.passes.every((p) => !p.needsUpdate)) {
      return this.fromRenderTarget.texture;
    }

    const padding = this.calculatePadding();

    const width = texture.image.width;
    const height = texture.image.height;

    const widthWithPadding = width + padding * 2;
    const heightWithPadding = height + padding * 2;

    this.fromRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.toRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.drawPass.setPadding(width, height, padding);

    renderer.setClearColor(0x000000, 0);

    renderer.setRenderTarget(this.fromRenderTarget);
    renderer.clearColor();

    renderer.setRenderTarget(this.toRenderTarget);
    renderer.clearColor();

    this.drawPass.render(renderer, texture);
    this.reverseTargets();

    for (const pass of this.passes) {
      renderer.setRenderTarget(this.toRenderTarget);
      renderer.clearColor();
      pass.render(renderer, this.fromRenderTarget.texture, {
        width,
        height,
        padding,
      });
      this.reverseTargets();
    }

    return this.fromRenderTarget.texture;
  }

  public destroy(): void {
    this.drawPass.destroy();
    this.fromRenderTarget.dispose();
    this.toRenderTarget.dispose();
  }

  private reverseTargets(): void {
    const fromRenderTarget = this.fromRenderTarget;
    this.fromRenderTarget = this.toRenderTarget;
    this.toRenderTarget = fromRenderTarget;
  }
}
