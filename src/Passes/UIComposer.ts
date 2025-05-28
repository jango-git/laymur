import type { Material, Texture, WebGLRenderer } from "three";
import {
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";
import { UIDefaultMaterial } from "../Materials/UIDefaultMaterial";
import { UIFullScreenQuad } from "./UIFullScreenQuad";
import type { UIPass } from "./UIPass";

export class UIComposer {
  public readonly passes: UIPass[] = [];

  private fromRenderTarget: WebGLRenderTarget;
  private toRenderTarget: WebGLRenderTarget;

  private readonly defaultMaterial = new UIDefaultMaterial();
  private readonly screen = new UIFullScreenQuad();

  private needsUpdateInternal = true;

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

  public get needsUpdate(): boolean {
    return this.needsUpdateInternal || this.passes.some((p) => p.needsUpdate);
  }

  public requestUpdate(): void {
    this.needsUpdateInternal = true;
  }

  public calculatePadding(): number {
    return this.passes.reduce((a, p) => Math.max(a, p.padding), 0);
  }

  public renderByMaterial(
    renderer: WebGLRenderer,
    width: number,
    height: number,
    material: Material,
  ): Material {
    if (!this.needsUpdate) {
      return this.passes.length > 0 ? this.defaultMaterial : material;
    }

    const padding = this.calculatePadding();

    const widthWithPadding = width + padding * 2;
    const heightWithPadding = height + padding * 2;

    this.fromRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.toRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.setPadding(width, height, padding);

    renderer.setClearColor(0x000000, 0);

    renderer.setRenderTarget(this.fromRenderTarget);
    renderer.clearColor();

    renderer.setRenderTarget(this.toRenderTarget);
    renderer.clearColor();

    this.screen.render(renderer, material);
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

    this.needsUpdateInternal = false;
    this.defaultMaterial.setTexture(this.fromRenderTarget.texture);
    return this.defaultMaterial;
  }

  public renderByTexture(renderer: WebGLRenderer, texture: Texture): Texture {
    if (!this.needsUpdate) {
      return this.passes.length > 0 ? this.fromRenderTarget.texture : texture;
    }

    const padding = this.calculatePadding();

    const width = texture.image.width;
    const height = texture.image.height;

    const widthWithPadding = width + padding * 2;
    const heightWithPadding = height + padding * 2;

    this.fromRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.toRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.setPadding(width, height, padding);

    renderer.setClearColor(0x000000, 0);

    renderer.setRenderTarget(this.fromRenderTarget);
    renderer.clearColor();

    renderer.setRenderTarget(this.toRenderTarget);
    renderer.clearColor();

    const options = { width, height, padding };

    for (let i = 0; i < this.passes.length; i++) {
      const currentTexture = i === 0 ? texture : this.fromRenderTarget.texture;
      renderer.setRenderTarget(this.toRenderTarget);
      renderer.clearColor();
      this.passes[i].render(renderer, currentTexture, options);
      this.reverseTargets();
    }

    this.needsUpdateInternal = false;
    return this.fromRenderTarget.texture;
  }

  public destroy(): void {
    this.fromRenderTarget.dispose();
    this.toRenderTarget.dispose();
  }

  private setPadding(width: number, height: number, padding: number): void {
    if (padding <= 0) {
      this.screen.paddingHorizontal = 0;
      this.screen.paddingVertical = 0;
    } else {
      this.screen.paddingHorizontal = padding / width;
      this.screen.paddingVertical = padding / height;
    }
  }

  private reverseTargets(): void {
    const fromRenderTarget = this.fromRenderTarget;
    this.fromRenderTarget = this.toRenderTarget;
    this.toRenderTarget = fromRenderTarget;
  }
}
