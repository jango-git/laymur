import type { Texture, WebGLRenderer } from "three";
import { MathUtils, Mesh } from "three";
import type { UILayer } from "../Layers/UILayer";
import { UIProgressMaterial } from "../Materials/UIProgressMaterial";
import { assertSize } from "../Miscellaneous/asserts";
import { renderSymbol } from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export interface UIProgressOptions {
  progress: number;
  isForegroundDirection: boolean;
  angle: number;
  color: number;
  opacity: number;
  backgroundColor: number;
  foregroundColor: number;
  backgroundOpacity: number;
  foregroundOpacity: number;
}

export class UIProgress extends UIElement {
  private readonly material: UIProgressMaterial;
  private readonly imageWidth: number;
  private readonly imageHeight: number;

  constructor(
    layer: UILayer,
    textureForeground: Texture,
    textureBackground?: Texture,
    options: Partial<UIProgressOptions> = {},
  ) {
    const foregroundWidth = textureForeground.image?.width;
    const foregroundHeight = textureForeground.image?.height;

    assertSize(
      foregroundWidth,
      foregroundHeight,
      `Invalid image dimensions - texture "${textureForeground.name || "unnamed"}" has invalid width (${foregroundWidth}) or height (${foregroundHeight}). Image dimensions must be non-zero positive numbers.`,
    );

    const backgroundWidth = textureBackground?.image?.width;
    const backgroundHeight = textureBackground?.image?.height;

    if (textureBackground) {
      assertSize(
        backgroundWidth,
        backgroundHeight,
        `Invalid image dimensions - texture "${textureBackground.name || "unnamed"}" has invalid width (${backgroundWidth}) or height (${backgroundHeight}). Image dimensions must be non-zero positive numbers.`,
      );
    }

    const material = new UIProgressMaterial(
      textureForeground,
      textureBackground,
    );
    const object = new Mesh(geometry, material);

    if (options.progress) {
      material.setProgress(options.progress);
    }

    if (options.isForegroundDirection) {
      material.setIsForwardDirection(options.isForegroundDirection);
    }

    if (options.angle) {
      material.setAngle(MathUtils.degToRad(options.angle));
    }

    if (options.color) {
      material.setColor(options.color);
    }

    if (options.opacity) {
      material.setOpacity(options.opacity);
    }

    if (options.backgroundColor) {
      material.setBackgroundColor(options.backgroundColor);
    }

    if (options.foregroundColor) {
      material.setForegroundColor(options.foregroundColor);
    }

    if (options.backgroundOpacity) {
      material.setBackgroundOpacity(options.backgroundOpacity);
    }

    if (options.foregroundOpacity) {
      material.setForegroundOpacity(options.foregroundOpacity);
    }

    const imageWidth = backgroundWidth ?? foregroundWidth;
    const imageHeight = foregroundHeight ?? backgroundHeight;

    super(layer, object, 0, 0, imageWidth, imageHeight);

    this.material = material;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;

    this.flushTransform();
  }

  public get progress(): number {
    return this.material.getProgress();
  }

  public get backgroundTexture(): Texture | undefined {
    return this.material.getBackgroundTexture();
  }

  public get foregroundTexture(): Texture {
    return this.material.getForegroundTexture();
  }

  public get backgroundColor(): number {
    return this.material.getBackgroundColor();
  }

  public get foregroundColor(): number {
    return this.material.getForegroundColor();
  }

  public get color(): number {
    return this.material.getColor();
  }

  public get backgroundOpacity(): number {
    return this.material.getBackgroundOpacity();
  }

  public get foregroundOpacity(): number {
    return this.material.getForegroundOpacity();
  }

  public get opacity(): number {
    return this.material.getOpacity();
  }

  public get angle(): number {
    return MathUtils.radToDeg(this.material.getAngle());
  }

  public get isForwardDirection(): boolean {
    return this.material.getIsForwardDirection();
  }

  public set progress(value: number) {
    this.material.setProgress(value);
    this.composer.requestUpdate();
  }

  public set backgroundColor(value: number) {
    this.material.setBackgroundColor(value);
    this.composer.requestUpdate();
  }

  public set foregroundColor(value: number) {
    this.material.setForegroundColor(value);
    this.composer.requestUpdate();
  }

  public set color(value: number) {
    this.material.setColor(value);
    this.composer.requestUpdate();
  }

  public set backgroundOpacity(value: number) {
    this.material.setBackgroundOpacity(value);
    this.composer.requestUpdate();
  }

  public set foregroundOpacity(value: number) {
    this.material.setForegroundOpacity(value);
    this.composer.requestUpdate();
  }

  public set opacity(value: number) {
    this.material.setOpacity(value);
    this.composer.requestUpdate();
  }

  public set angle(value: number) {
    this.material.setAngle(MathUtils.degToRad(value));
    this.composer.requestUpdate();
  }

  public set isForwardDirection(value: boolean) {
    this.material.setIsForwardDirection(value);
    this.composer.requestUpdate();
  }

  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }

  public [renderSymbol](renderer: WebGLRenderer): void {
    (this.object as Mesh).material = this.composer.compose(
      renderer,
      this.imageWidth,
      this.imageHeight,
      this.material,
    );
    this.flushTransform();
  }
}
