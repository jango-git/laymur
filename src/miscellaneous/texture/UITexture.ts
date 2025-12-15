import { Eventail } from "eventail";
import type { Vector2Like } from "three";
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
  UITextureEvent,
} from "./UITexture.Internal";

export class UITexture extends Eventail {
  private textureInternal: Texture = TEXTURE_DEFAULT_TEXTURE;
  private min: Vector2Like = { x: 0, y: 0 };
  private max: Vector2Like = { x: 1, y: 1 };
  private rotated = false;
  private scale = 1;
  private trimInternal: UITextureTrim = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };
  private dirtyInternal = false;

  constructor(config?: UITextureConfig) {
    super();
    this.set(config);
  }

  public get texture(): Texture {
    return this.textureInternal;
  }

  public get width(): number {
    return (
      (this.rotated ? this.max.y - this.min.y : this.max.x - this.min.x) /
      this.scale
    );
  }

  public get height(): number {
    return (
      (this.rotated ? this.max.x - this.min.x : this.max.y - this.min.y) /
      this.scale
    );
  }

  public get trim(): Readonly<UITextureTrim> {
    return this.trimInternal;
  }

  /** @internal */
  public get dirty(): boolean {
    return this.dirtyInternal;
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

    if (this.rotated) {
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

  public getResolution(result = new Vector2()): Vector2 {
    return result.set(this.width, this.height);
  }

  public set(config?: UITextureConfig): void {
    const currentW = this.width;
    const currentH = this.height;

    if (config instanceof Texture) {
      this.textureInternal = config;
      this.min = { x: 0, y: 0 };
      this.max = {
        x: config.image?.naturalWidth ?? DUMMY_DEFAULT_WIDTH,
        y: config.image?.naturalHeight ?? DUMMY_DEFAULT_HEIGHT,
      };
      this.trimInternal = { left: 0, right: 0, top: 0, bottom: 0 };
    } else if (config !== undefined) {
      this.textureInternal = config.texture;
      this.min = { x: config.min.x, y: config.min.y };
      this.max = { x: config.max.x, y: config.max.y };
      this.rotated = config.rotated ?? TEXTURE_DEFAULT_ROTATED;
      this.scale = config.scale ?? TEXTURE_DEFAULT_SCALE;
      this.trimInternal = config.padding ?? {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      };
    } else {
      this.textureInternal = TEXTURE_DEFAULT_TEXTURE;
      this.min = { x: 0, y: 0 };
      this.max = { x: DUMMY_DEFAULT_WIDTH, y: DUMMY_DEFAULT_HEIGHT };
      this.trimInternal = { left: 0, right: 0, top: 0, bottom: 0 };
    }

    this.dirtyInternal = true;
    if (this.width !== currentW || this.height !== currentH) {
      this.emit(UITextureEvent.DIMINSIONS_CHANGED, this.width, this.height);
    }
  }
}
