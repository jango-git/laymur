import { Matrix3, Texture, Vector2 } from "three";
import {
  DUMMY_DEFAULT_HEIGHT,
  DUMMY_DEFAULT_WIDTH,
} from "../../elements/UIDummy.Internal";
import type { UITextureConfig, UITextureTrim } from "./UITexture.Internal";
import {
  TEXTURE_DEFAULT_ROTATED,
  TEXTURE_DEFAULT_SCALE,
  TEXTURE_DEFAULT_TEXTURE,
} from "./UITexture.Internal";

export class UITexture {
  private textureInternal: Texture = TEXTURE_DEFAULT_TEXTURE;
  private readonly min = new Vector2(0, 0);
  private readonly max = new Vector2(1, 1);
  private rotatedInternal = false;
  private scaleInternal = 1;
  private trim: UITextureTrim = { left: 0, right: 0, top: 0, bottom: 0 };

  private dirtyInternal = false;

  constructor(config?: UITextureConfig) {
    this.set(config);
  }

  public get texture(): Texture {
    return this.textureInternal;
  }

  public get minX(): number {
    return this.min.x;
  }

  public get minY(): number {
    return this.min.y;
  }

  public get maxX(): number {
    return this.max.x;
  }

  public get maxY(): number {
    return this.max.y;
  }

  public get trimLeft(): number {
    return this.trim.left;
  }

  public get trimRight(): number {
    return this.trim.right;
  }

  public get trimTop(): number {
    return this.trim.top;
  }

  public get trimBottom(): number {
    return this.trim.bottom;
  }

  public get rotated(): boolean {
    return this.rotatedInternal;
  }

  public get scale(): number {
    return this.scaleInternal;
  }

  public get originalWidth(): number {
    return (this.maxX - this.minX) / this.scaleInternal;
  }

  public get originalHeight(): number {
    return (this.maxY - this.minY) / this.scaleInternal;
  }

  /** @internal */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  public set texture(value: Texture) {
    if (this.textureInternal !== value) {
      this.textureInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set minX(value: number) {
    if (this.min.x !== value) {
      this.min.x = value;
      this.dirtyInternal = true;
    }
  }

  public set minY(value: number) {
    if (this.min.y !== value) {
      this.min.y = value;
      this.dirtyInternal = true;
    }
  }

  public set maxX(value: number) {
    if (this.max.x !== value) {
      this.max.x = value;
      this.dirtyInternal = true;
    }
  }

  public set maxY(value: number) {
    if (this.max.y !== value) {
      this.max.y = value;
      this.dirtyInternal = true;
    }
  }

  public set trimLeft(value: number) {
    if (this.trim.left !== value) {
      this.trim.left = value;
      this.dirtyInternal = true;
    }
  }

  public set trimRight(value: number) {
    if (this.trim.right !== value) {
      this.trim.right = value;
      this.dirtyInternal = true;
    }
  }

  public set trimTop(value: number) {
    if (this.trim.top !== value) {
      this.trim.top = value;
      this.dirtyInternal = true;
    }
  }

  public set trimBottom(value: number) {
    if (this.trim.bottom !== value) {
      this.trim.bottom = value;
      this.dirtyInternal = true;
    }
  }

  public set rotated(value: boolean) {
    if (this.rotatedInternal !== value) {
      this.rotatedInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set scale(value: number) {
    if (this.scaleInternal !== value) {
      this.scaleInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /** @internal */
  public calculateTransform(result = new Matrix3()): Matrix3 {
    const w = this.textureInternal.image?.naturalWidth ?? DUMMY_DEFAULT_WIDTH;
    const h = this.textureInternal.image?.naturalHeight ?? DUMMY_DEFAULT_HEIGHT;

    const minX = this.min.x / w;
    const minY = this.min.y / h;
    const maxX = this.max.x / w;
    const maxY = this.max.y / h;

    if (this.rotatedInternal) {
      // Rotated 90° clockwise in atlas
      // UV: (u, v) -> (minX + v * (maxX - minX), minY + (1 - u) * (maxY - minY))
      const scaleX = maxX - minX;
      const scaleY = maxY - minY;
      result.set(0, scaleX, minX, -scaleY, 0, minY + scaleY, 0, 0, 1);
    } else {
      // Normal case
      const scaleX = maxX - minX;
      const scaleY = maxY - minY;
      result.set(scaleX, 0, minX, 0, scaleY, minY, 0, 0, 1);
    }

    return result;
  }

  public set(config?: UITextureConfig): void {
    if (config instanceof Texture) {
      this.textureInternal = config;
      this.min.set(0, 0);
      this.max.set(
        config.image?.naturalWidth ?? DUMMY_DEFAULT_WIDTH,
        config.image?.naturalHeight ?? DUMMY_DEFAULT_HEIGHT,
      );
      this.trim = { left: 0, right: 0, top: 0, bottom: 0 };
    } else if (config !== undefined) {
      this.textureInternal = config.texture;
      this.min.set(config.min.x, config.min.y);
      this.max.set(config.max.x, config.max.y);
      this.rotatedInternal = config.rotated ?? TEXTURE_DEFAULT_ROTATED;
      this.scaleInternal = config.scale ?? TEXTURE_DEFAULT_SCALE;
      this.trim = config.padding ?? { left: 0, right: 0, top: 0, bottom: 0 };
    } else {
      this.textureInternal = TEXTURE_DEFAULT_TEXTURE;
      this.min.set(0, 0);
      this.max.set(DUMMY_DEFAULT_WIDTH, DUMMY_DEFAULT_HEIGHT);
      this.trim = { left: 0, right: 0, top: 0, bottom: 0 };
    }

    this.dirtyInternal = true;
  }
}
