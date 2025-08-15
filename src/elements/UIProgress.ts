import type { Texture } from "three";
import { MathUtils, Mesh } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIProgressMaterial } from "../materials/UIProgressMaterial";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { geometry } from "../miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export interface UIProgressOptions {
  x: number;
  y: number;
  textureBackground: Texture;
  progress: number;
  isForegroundDirection: boolean;
  angle: number;
  backgroundColor: number;
  foregroundColor: number;
  backgroundOpacity: number;
  foregroundOpacity: number;
}

export class UIProgress extends UIElement<Mesh> {
  private readonly material: UIProgressMaterial;

  constructor(
    layer: UILayer,
    textureForeground: Texture,
    options: Partial<UIProgressOptions> = {},
  ) {
    const foregroundWidth = textureForeground.image?.width;
    const foregroundHeight = textureForeground.image?.height;

    assertValidPositiveNumber(
      foregroundWidth,
      "UIProgress foreground texture width",
    );
    assertValidPositiveNumber(
      foregroundHeight,
      "UIProgress foreground texture height",
    );

    const backgroundWidth = options.textureBackground?.image?.width;
    const backgroundHeight = options.textureBackground?.image?.height;

    if (options.textureBackground) {
      assertValidPositiveNumber(
        backgroundWidth,
        "UIProgress background texture width",
      );
      assertValidPositiveNumber(
        backgroundHeight,
        "UIProgress background texture height",
      );
    }

    const material = new UIProgressMaterial(
      textureForeground,
      options.textureBackground,
    );
    const object = new Mesh(geometry, material);

    if (options.progress !== undefined) {
      material.setProgress(options.progress);
    }

    if (options.isForegroundDirection !== undefined) {
      material.setIsForwardDirection(options.isForegroundDirection);
    }

    if (options.angle !== undefined) {
      material.setAngle(MathUtils.degToRad(options.angle));
    }

    if (options.backgroundColor !== undefined) {
      material.setBackgroundColor(options.backgroundColor);
    }

    if (options.foregroundColor !== undefined) {
      material.setForegroundColor(options.foregroundColor);
    }

    if (options.backgroundOpacity !== undefined) {
      material.setBackgroundOpacity(options.backgroundOpacity);
    }

    if (options.foregroundOpacity !== undefined) {
      material.setForegroundOpacity(options.foregroundOpacity);
    }

    const imageWidth = backgroundWidth ?? foregroundWidth;
    const imageHeight = foregroundHeight ?? backgroundHeight;

    super(
      layer,
      options.x ?? 0,
      options.y ?? 0,
      imageWidth,
      imageHeight,
      object,
    );

    this.material = material;
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

  public get backgroundOpacity(): number {
    return this.material.getBackgroundOpacity();
  }

  public get foregroundOpacity(): number {
    return this.material.getForegroundOpacity();
  }

  public get angle(): number {
    return MathUtils.radToDeg(this.material.getAngle());
  }

  public get isForwardDirection(): boolean {
    return this.material.getIsForwardDirection();
  }

  public set progress(value: number) {
    this.material.setProgress(value);
  }

  public set backgroundTexture(value: Texture | undefined) {
    if (value) {
      const width = value.image.width;
      const height = value.image.height;

      assertValidPositiveNumber(width, "UIElement background texture width");
      assertValidPositiveNumber(height, "UIElement background texture height");
    }

    this.material.setBackgroundTexture(value);
  }

  public set foregroundTexture(value: Texture) {
    const width = value.image.width;
    const height = value.image.height;

    assertValidPositiveNumber(width, "UIImage texture width");
    assertValidPositiveNumber(height, "UIImage texture height");

    this.material.setForegroundTexture(value);
    this.solverWrapper.suggestVariableValue(this.wVariable, width);
    this.solverWrapper.suggestVariableValue(this.hVariable, height);
  }

  public set backgroundColor(value: number) {
    this.material.setBackgroundColor(value);
  }

  public set foregroundColor(value: number) {
    this.material.setForegroundColor(value);
  }

  public set backgroundOpacity(value: number) {
    this.material.setBackgroundOpacity(value);
  }

  public set foregroundOpacity(value: number) {
    this.material.setForegroundOpacity(value);
  }

  public set angle(value: number) {
    this.material.setAngle(MathUtils.degToRad(value));
  }

  public set isForwardDirection(value: boolean) {
    this.material.setIsForwardDirection(value);
  }

  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }
}
