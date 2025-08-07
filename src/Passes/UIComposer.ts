import type { Material, WebGLRenderer } from "three";
import {
  LinearFilter,
  NoBlending,
  RGBAFormat,
  UnsignedByteType,
  WebGLRenderTarget,
} from "three";
import { UIMaterial } from "../materials/UIMaterial";
import { UIFullScreenQuad } from "./UIFullScreenQuad";
import type { UIPass } from "./UIPass";

/**
 * UI composition system for applying post-processing effects to rendered UI
 * The system manages render targets and passes to create complex visual effects
 */

/**
 * Internal implementation of the UI composition system
 * Handles the actual rendering and composition of passes
 */
export class UIComposerInternal {
  /** Collection of all registered composition passes */
  public readonly passes: UIPass[] = [];

  /** Source render target used during ping-pong rendering */
  private fromRenderTarget: WebGLRenderTarget;
  /** Destination render target used during ping-pong rendering */
  private toRenderTarget: WebGLRenderTarget;

  /** Default material used to render the final result */
  private readonly defaultMaterial = new UIMaterial();
  /** Full-screen quad used for rendering */
  private readonly screen = new UIFullScreenQuad();

  /** Whether the composition needs to be updated */
  private needsUpdateInternal = false;
  /** Whether the padding has changed since last frame */
  private paddingHasChangedInternal = false;
  /** Current padding value in pixels */
  private paddingInternal = 0;

  /**
   * Creates a new UI composer with initial render targets
   */
  constructor() {
    const options = {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.fromRenderTarget = new WebGLRenderTarget(1, 1, options);
    this.toRenderTarget = new WebGLRenderTarget(1, 1, options);
    this.fromRenderTarget.texture.generateMipmaps = false;
    this.toRenderTarget.texture.generateMipmaps = false;
  }

  /**
   * Whether the composition needs to be updated in the next frame
   * True when either the composer or any valuable passes need update
   */
  public get needsUpdate(): boolean {
    return (
      (this.needsUpdateInternal && this.hasValuablePasses()) ||
      this.hasPassesNeedingUpdate()
    );
  }

  /**
   * Whether the padding has changed since the last frame
   * Used to trigger layout updates when padding changes
   */
  public get paddingHasChanged(): boolean {
    return this.paddingHasChangedInternal;
  }

  /**
   * Current padding in pixels used for the composition
   * Calculated as the maximum padding required by all passes
   */
  public get padding(): number {
    return this.paddingInternal;
  }

  /**
   * Requests an update for the next frame
   * Will trigger a re-composition of all passes
   */
  public requestUpdate(): void {
    this.needsUpdateInternal = true;
  }

  /**
   * Composes all registered passes to create the final result
   *
   * @param renderer - WebGL renderer to use for composition
   * @param width - Width of the render target in pixels
   * @param height - Height of the render target in pixels
   * @param material - Input material containing the initial texture
   * @param canOverrideBlending - Whether blending can be overridden on the input material
   * @returns Material to use for rendering the composed result
   */
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

    for (const pass of this.passes) {
      if (pass.needsUpdate || pass.isValuable) {
        this.reverseRenderTargets();
        renderer.setRenderTarget(this.toRenderTarget);
        renderer.clear(true, false, false);
        pass.render(renderer, this.fromRenderTarget.texture, options);
      }
    }

    this.needsUpdateInternal = false;
    this.defaultMaterial.setTexture(this.toRenderTarget.texture);
    return this.defaultMaterial;
  }

  /**
   * Cleans up resources used by the composer
   * Should be called when the composer is no longer needed
   */
  public destroy(): void {
    this.fromRenderTarget.dispose();
    this.toRenderTarget.dispose();
  }

  /**
   * Checks if any passes are valuable (contribute meaningful effects)
   * @returns True if at least one pass is valuable
   */
  private hasValuablePasses(): boolean {
    return this.passes.some((p) => p.isValuable);
  }

  /**
   * Checks if any passes need an update
   * @returns True if at least one pass needs update
   */
  private hasPassesNeedingUpdate(): boolean {
    return this.passes.some((p) => p.needsUpdate);
  }

  /**
   * Calculates the maximum padding required by all passes
   * @returns Maximum padding value in pixels
   */
  private calculatePadding(): number {
    return this.passes.reduce((a, p) => Math.max(a, p.padding), 0);
  }

  /**
   * Updates the screen quad's padding based on dimensions
   *
   * @param width - Width of the render target in pixels
   * @param height - Height of the render target in pixels
   * @param padding - Padding value in pixels
   */
  private setScreenPadding(
    width: number,
    height: number,
    padding: number,
  ): void {
    this.screen.paddingHorizontal = padding / width;
    this.screen.paddingVertical = padding / height;
  }

  /**
   * Swaps the from and to render targets
   * Used for ping-pong rendering between passes
   */
  private reverseRenderTargets(): void {
    const fromRenderTarget = this.fromRenderTarget;
    this.fromRenderTarget = this.toRenderTarget;
    this.toRenderTarget = fromRenderTarget;
  }
}

/**
 * Public interface for the UI composition system
 * Provides a simplified API for managing UI passes
 */
export class UIComposer {
  /**
   * Creates a new UI composer
   *
   * @param raw - Internal implementation that handles actual rendering
   */
  constructor(private readonly raw: UIComposerInternal) {}

  /**
   * Collection of all registered composition passes
   * Add passes to this collection to apply effects to the UI
   */
  public get passes(): UIPass[] {
    return this.raw.passes;
  }
}
