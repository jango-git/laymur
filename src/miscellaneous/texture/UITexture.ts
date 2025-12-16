import { Eventail } from "eventail";
import { Matrix3, Texture, Vector2 } from "three";
import type {
  UITextureAtlasConfig,
  UITextureConfig,
  UITextureTrim,
} from "./UITexture.Internal";
import {
  TEXTURE_DEFAULT_SIZE,
  TEXTURE_DEFAULT_TEXTURE,
  UITextureEvent,
} from "./UITexture.Internal";

/** Texture with atlas and trim support */
export class UITexture extends Eventail {
  private textureInternal: Texture = TEXTURE_DEFAULT_TEXTURE;
  private rotatedInternal = false;

  private frameX = 0;
  private frameY = 0;
  private frameWidth = TEXTURE_DEFAULT_SIZE;
  private frameHeight = TEXTURE_DEFAULT_SIZE;

  private sourceWidth = TEXTURE_DEFAULT_SIZE;
  private sourceHeight = TEXTURE_DEFAULT_SIZE;

  private trimLeft = 0;
  private trimRight = 0;
  private trimTop = 0;
  private trimBottom = 0;

  private scaleInternal = 1;
  private dirtyInternal = false;

  /** @param config Texture or atlas configuration */
  constructor(config?: UITextureConfig) {
    super();
    if (config !== undefined) {
      this.set(config);
    }
  }

  /** Original width before trimming in world units */
  public get width(): number {
    return this.sourceWidth / this.scaleInternal;
  }

  /** Original height before trimming in world units */
  public get height(): number {
    return this.sourceHeight / this.scaleInternal;
  }

  /** Visible width after trimming in world units */
  public get trimmedWidth(): number {
    const frameSize = this.rotatedInternal ? this.frameHeight : this.frameWidth;
    return frameSize / this.scaleInternal;
  }

  /** Visible height after trimming in world units */
  public get trimmedHeight(): number {
    const frameSize = this.rotatedInternal ? this.frameWidth : this.frameHeight;
    return frameSize / this.scaleInternal;
  }

  /** Underlying Three.js texture */
  public get texture(): Texture {
    return this.textureInternal;
  }

  /** Whether sprite is rotated in atlas */
  public get rotated(): boolean {
    return this.rotatedInternal;
  }

  /** Scale factor for resolution independence */
  public get scale(): number {
    return this.scaleInternal;
  }

  /** Transparent padding around visible content */
  public get trim(): Readonly<UITextureTrim> {
    const s = this.scaleInternal;
    return {
      left: this.trimLeft / s,
      right: this.trimRight / s,
      top: this.trimTop / s,
      bottom: this.trimBottom / s,
    };
  }

  /** Whether texture has been modified since last check */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  /** Marks texture as clean. @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /**
   * Calculates UV transform matrix for shader sampling.
   * @param result Matrix to store result in
   * @returns UV transform matrix
   */
  public calculateUVTransform(result = new Matrix3()): Matrix3 {
    const atlasWidth =
      this.textureInternal.image?.naturalWidth ?? TEXTURE_DEFAULT_SIZE;
    const atlasHeight =
      this.textureInternal.image?.naturalHeight ?? TEXTURE_DEFAULT_SIZE;

    if (this.rotatedInternal) {
      const physicalWidth = this.frameHeight;
      const physicalHeight = this.frameWidth;

      const u0 = this.frameX / atlasWidth;
      const v0 = (atlasHeight - this.frameY - physicalHeight) / atlasHeight;
      const uSize = physicalWidth / atlasWidth;
      const vSize = physicalHeight / atlasHeight;

      result.set(0, uSize, u0, -vSize, 0, v0 + vSize, 0, 0, 1);
    } else {
      const u0 = this.frameX / atlasWidth;
      const v0 = (atlasHeight - this.frameY - this.frameHeight) / atlasHeight;
      const uSize = this.frameWidth / atlasWidth;
      const vSize = this.frameHeight / atlasHeight;

      result.set(uSize, 0, u0, 0, vSize, v0, 0, 0, 1);
    }

    return result;
  }

  /**
   * Gets original dimensions before trimming.
   * @param result Vector to store result in
   * @returns Width and height in world units
   */
  public getResolution(result = new Vector2()): Vector2 {
    return result.set(this.width, this.height);
  }

  /**
   * Replaces texture with new configuration.
   * @param config Texture or atlas configuration
   */
  public set(config: UITextureConfig): void {
    const previousWidth = this.width;
    const previousHeight = this.height;

    if (config instanceof Texture) {
      this.setFromTexture(config);
    } else {
      this.setFromAtlasConfig(config);
    }

    this.dirtyInternal = true;

    if (this.width !== previousWidth || this.height !== previousHeight) {
      this.emit(
        UITextureEvent.DIMENSIONS_CHANGED,
        this.width,
        this.height,
        this,
      );
    }
  }

  /** Resets to default empty texture */
  public reset(): void {
    const previousWidth = this.width;
    const previousHeight = this.height;

    this.textureInternal = new Texture();
    this.frameX = 0;
    this.frameY = 0;
    this.frameWidth = TEXTURE_DEFAULT_SIZE;
    this.frameHeight = TEXTURE_DEFAULT_SIZE;
    this.rotatedInternal = false;
    this.sourceWidth = TEXTURE_DEFAULT_SIZE;
    this.sourceHeight = TEXTURE_DEFAULT_SIZE;
    this.trimLeft = 0;
    this.trimRight = 0;
    this.trimTop = 0;
    this.trimBottom = 0;
    this.scaleInternal = 1;
    this.dirtyInternal = true;

    if (this.width !== previousWidth || this.height !== previousHeight) {
      this.emit(UITextureEvent.DIMENSIONS_CHANGED, this.width, this.height);
    }
  }

  private setFromTexture(texture: Texture): void {
    const width = texture.image?.naturalWidth ?? TEXTURE_DEFAULT_SIZE;
    const height = texture.image?.naturalHeight ?? TEXTURE_DEFAULT_SIZE;

    this.textureInternal = texture;
    this.frameX = 0;
    this.frameY = 0;
    this.frameWidth = width;
    this.frameHeight = height;
    this.rotatedInternal = false;
    this.sourceWidth = width;
    this.sourceHeight = height;
    this.trimLeft = 0;
    this.trimRight = 0;
    this.trimTop = 0;
    this.trimBottom = 0;
    this.scaleInternal = 1;
  }

  private setFromAtlasConfig(config: UITextureAtlasConfig): void {
    this.textureInternal = config.texture;
    this.frameX = config.frame.x;
    this.frameY = config.frame.y;
    this.frameWidth = config.frame.w;
    this.frameHeight = config.frame.h;
    this.rotatedInternal = config.rotated ?? false;
    this.sourceWidth = config.sourceSize.w;
    this.sourceHeight = config.sourceSize.h;
    this.scaleInternal = config.scale ?? 1;

    const spriteSource = config.spriteSourceSize;
    this.trimLeft = spriteSource.x;
    this.trimTop = spriteSource.y;
    this.trimRight = this.sourceWidth - spriteSource.x - spriteSource.w;
    this.trimBottom = this.sourceHeight - spriteSource.y - spriteSource.h;
  }
}
