import type { Material, Texture, WebGLRenderer } from "three";
import {
  LinearFilter,
  NoBlending,
  RGBAFormat,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";
import { UIMaterial } from "../Materials/UIMaterial";
import { UIFullScreenQuad } from "./UIFullScreenQuad";
import type { UIPass } from "./UIPass";

export class UIComposer {
  public readonly passes: UIPass[] = [];

  private fromRenderTarget: WebGLRenderTarget;
  private toRenderTarget: WebGLRenderTarget;

  private readonly defaultMaterial = new UIMaterial();
  private readonly screen = new UIFullScreenQuad();

  private needsUpdateInternal = false;
  private lastPaddingHasChangedInternal = false;
  private lastPaddingInternal = 0;

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
    this.fromRenderTarget.texture.generateMipmaps = false;
    this.toRenderTarget.texture.generateMipmaps = false;
  }

  public get needsUpdate(): boolean {
    return (
      (this.needsUpdateInternal && this.hasValuablePasses()) ||
      this.hasPassesNeedingUpdate()
    );
  }

  public get lastPaddingHasChanged(): boolean {
    return this.lastPaddingHasChangedInternal;
  }

  public get lastPadding(): number {
    return this.lastPaddingInternal;
  }

  public requestUpdate(): void {
    this.needsUpdateInternal = true;
  }

  public renderByMaterial(
    renderer: WebGLRenderer,
    width: number,
    height: number,
    material: Material,
    canOverrideBlending = true,
  ): Material {
    const hasValuablePasses = this.hasValuablePasses();
    if (
      (!this.needsUpdateInternal || !hasValuablePasses) &&
      !this.hasPassesNeedingUpdate()
    ) {
      if (!hasValuablePasses) {
        this.lastPaddingHasChangedInternal = this.lastPaddingInternal !== 0;
        this.lastPaddingInternal = 0;
      }
      this.needsUpdateInternal = false;
      return hasValuablePasses ? this.defaultMaterial : material;
    }

    const padding = this.calculatePadding();
    this.lastPaddingHasChangedInternal = this.lastPaddingInternal !== padding;
    this.lastPaddingInternal = padding;

    const widthWithPadding = width + padding * 2;
    const heightWithPadding = height + padding * 2;

    this.fromRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.toRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.setScreenPadding(width, height, padding);

    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(this.toRenderTarget);
    renderer.clear(true, false, false);

    const originalBlending = material.blending;
    if (canOverrideBlending) {
      material.blending = NoBlending;
    }
    this.screen.render(renderer, material);
    material.blending = originalBlending;

    const options = { width, height, padding };

    for (let i = 0; i < this.passes.length; i++) {
      const pass = this.passes[i];
      if (pass.needsUpdate || pass.isValuable) {
        this.reverseRenderTargets();
        renderer.setRenderTarget(this.toRenderTarget);
        renderer.clear(true, false, false);
        this.passes[i].render(renderer, this.fromRenderTarget.texture, options);
      }
    }

    this.needsUpdateInternal = false;
    this.defaultMaterial.setTexture(this.toRenderTarget.texture);
    return this.defaultMaterial;
  }

  public renderByTexture(renderer: WebGLRenderer, texture: Texture): Texture {
    const hasValuablePasses = this.hasValuablePasses();
    if (
      (!this.needsUpdateInternal || !hasValuablePasses) &&
      !this.hasPassesNeedingUpdate()
    ) {
      if (!hasValuablePasses) {
        this.lastPaddingHasChangedInternal = this.lastPaddingInternal !== 0;
        this.lastPaddingInternal = 0;
      }
      this.needsUpdateInternal = false;
      return hasValuablePasses ? this.toRenderTarget.texture : texture;
    }

    const padding = this.calculatePadding();
    this.lastPaddingHasChangedInternal = this.lastPaddingInternal !== padding;
    this.lastPaddingInternal = padding;

    const width = texture.image.width;
    const height = texture.image.height;

    const widthWithPadding = width + padding * 2;
    const heightWithPadding = height + padding * 2;

    this.fromRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.toRenderTarget.setSize(widthWithPadding, heightWithPadding);
    this.setScreenPadding(width, height, padding);

    renderer.setClearColor(0x000000, 0);
    const options = { width, height, padding };

    for (let i = 0; i < this.passes.length; i++) {
      const pass = this.passes[i];
      if (pass.needsUpdate || pass.isValuable) {
        this.reverseRenderTargets();
        renderer.setRenderTarget(this.toRenderTarget);
        renderer.clear(true, false, false);
        this.passes[i].render(
          renderer,
          i === 0 ? texture : this.fromRenderTarget.texture,
          options,
        );
      }
    }

    this.needsUpdateInternal = false;
    return this.toRenderTarget.texture;
  }

  public destroy(): void {
    this.fromRenderTarget.dispose();
    this.toRenderTarget.dispose();
  }

  private hasValuablePasses(): boolean {
    return this.passes.some((p) => p.isValuable);
  }

  private hasPassesNeedingUpdate(): boolean {
    return this.passes.some((p) => p.needsUpdate);
  }

  private calculatePadding(): number {
    return this.passes.reduce((a, p) => Math.max(a, p.padding), 0);
  }

  private setScreenPadding(
    width: number,
    height: number,
    padding: number,
  ): void {
    this.screen.paddingHorizontal = padding / width;
    this.screen.paddingVertical = padding / height;
  }

  private reverseRenderTargets(): void {
    const fromRenderTarget = this.fromRenderTarget;
    this.fromRenderTarget = this.toRenderTarget;
    this.toRenderTarget = fromRenderTarget;
  }
}
