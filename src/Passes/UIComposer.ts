import type { Material, WebGLRenderer } from "three";
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

export class UIComposerInternal {
  public readonly passes: UIPass[] = [];

  private fromRenderTarget: WebGLRenderTarget;
  private toRenderTarget: WebGLRenderTarget;

  private readonly defaultMaterial = new UIMaterial();
  private readonly screen = new UIFullScreenQuad();

  private needsUpdateInternal = false;
  private paddingHasChangedInternal = false;
  private paddingInternal = 0;

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

  public get paddingHasChanged(): boolean {
    return this.paddingHasChangedInternal;
  }

  public get padding(): number {
    return this.paddingInternal;
  }

  public requestUpdate(): void {
    this.needsUpdateInternal = true;
  }

  public compose(
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
        this.paddingHasChangedInternal = this.paddingInternal !== 0;
        this.paddingInternal = 0;
      }
      this.needsUpdateInternal = false;
      return hasValuablePasses ? this.defaultMaterial : material;
    }

    const padding = this.calculatePadding();
    this.paddingHasChangedInternal = this.paddingInternal !== padding;
    this.paddingInternal = padding;

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

export class UIComposer {
  constructor(private readonly raw: UIComposerInternal) {}

  public get passes(): UIPass[] {
    return this.raw.passes;
  }
}
