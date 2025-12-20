import type { Matrix3 } from "three";
import { Vector4 } from "three";
import type { UILayer } from "../../layers/UILayer";
import { UIColor } from "../../miscellaneous/color/UIColor";
import { computeTrimmedTransformMatrix } from "../../miscellaneous/computeTransform";
import { UIInsets } from "../../miscellaneous/insets/UIInsets";
import { UITextureView } from "../../miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../miscellaneous/texture/UITextureView.Internal";
import source from "../../shaders/UINineSlice.glsl";
import { UIElement } from "../UIElement/UIElement";
import type { UINineSliceOptions } from "./UINineSlice.Internal";
import {
  NINE_SLICE_DEFAULT_BORDER,
  NINE_SLICE_DEFAULT_REGION_MODE,
  UINineSliceRegionMode,
} from "./UINineSlice.Internal";

/** Scalable textured image preserving border regions */
export class UINineSlice extends UIElement {
  /** Texture displayed by this element */
  public readonly texture: UITextureView;
  /** Multiplicative tint. Alpha channel controls opacity. */
  public readonly color: UIColor;
  /** Border size in normalized texture coordinates (0 to 1) */
  public readonly sliceBorders: UIInsets;
  /** Region size. Interpretation depends on regionMode. */
  public readonly sliceRegions: UIInsets;

  private regionModeInternal: UINineSliceRegionMode;
  private regionModeDirty = false;

  private readonly textureTransform: Matrix3;
  private readonly sliceBordersVector = new Vector4();
  private readonly sliceRegionsVector = new Vector4();

  private lastWidth: number;
  private lastHeight: number;

  /**
   * Creates a new UINineSlice instance.
   *
   * Defaults size to texture dimensions if width and height not provided.
   *
   * @param layer - Layer containing this element
   * @param texture - Texture to display
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    texture: UITextureConfig,
    options: Partial<UINineSliceOptions> = {},
  ) {
    const color = new UIColor(options.color);
    const textureView = new UITextureView(texture);
    const textureTransform = textureView.calculateUVTransform();

    options.width = options.width ?? textureView.width;
    options.height = options.height ?? textureView.height;

    const sliceBorders = new UIInsets(
      options.sliceBorders ?? NINE_SLICE_DEFAULT_BORDER,
    );
    const sliceRegions = new UIInsets(
      options.sliceRegions ?? NINE_SLICE_DEFAULT_BORDER,
    );

    const regionMode = options.regionMode ?? NINE_SLICE_DEFAULT_REGION_MODE;

    const sliceBordersVector = new Vector4();
    const sliceRegionsVector = new Vector4();

    super(
      layer,
      source,
      {
        texture: textureView.texture,
        textureTransform: textureTransform,
        color,
        sliceBorders: sliceBordersVector,
        sliceRegions: sliceRegionsVector,
      },
      options,
    );

    this.texture = textureView;
    this.textureTransform = textureTransform;
    this.color = color;
    this.sliceBorders = sliceBorders;
    this.sliceRegions = sliceRegions;
    this.regionModeInternal = regionMode;

    this.sliceBordersVector = sliceBordersVector;
    this.sliceRegionsVector = sliceRegionsVector;

    this.lastWidth = this.width;
    this.lastHeight = this.height;
  }

  /** Controls how sliceRegions values are interpreted */
  public get regionMode(): UINineSliceRegionMode {
    return this.regionModeInternal;
  }

  /** Controls how sliceRegions values are interpreted */
  public set regionMode(value: UINineSliceRegionMode) {
    if (this.regionModeInternal !== value) {
      this.regionModeInternal = value;
      this.regionModeDirty = true;
    }
  }

  protected override updatePlaneTransform(): void {
    if (
      this.regionModeDirty ||
      this.texture.dirty ||
      this.color.dirty ||
      this.sliceBorders.dirty ||
      this.sliceRegions.dirty ||
      (this.regionModeInternal === UINineSliceRegionMode.WORLD &&
        this.checkDimensionsDirty())
    ) {
      this.calculateSliceBordersForShader(this.sliceBordersVector);
      this.calculateSliceRegionsForShader(this.sliceRegionsVector);

      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: this.texture.texture,
        textureTransform: this.texture.calculateUVTransform(
          this.textureTransform,
        ),
        color: this.color,
        sliceBorders: this.sliceBordersVector,
        sliceRegions: this.sliceRegionsVector,
      });

      this.regionModeDirty = false;
      this.color.setDirtyFalse();
      this.sliceBorders.setDirtyFalse();
      this.sliceRegions.setDirtyFalse();
      this.setDimensionsDirtyFalse();
    }

    if (
      this.texture.dirty ||
      this.micro.dirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty
    ) {
      const trim = this.texture.trim;
      const micro = this.micro;
      this.sceneWrapper.setTransform(
        this.planeHandler,
        computeTrimmedTransformMatrix(
          this.x,
          this.y,
          this.width,
          this.height,
          this.zIndex,
          micro.x,
          micro.y,
          micro.anchorX,
          micro.anchorY,
          micro.scaleX,
          micro.scaleY,
          micro.rotation,
          micro.anchorMode,
          trim.left,
          trim.right,
          trim.top,
          trim.bottom,
        ),
      );
      this.texture.setDirtyFalse();
      this.micro.setDirtyFalse();
    }
  }

  private calculateSliceBordersForShader(result: Vector4): Vector4 {
    const sourceWidth = this.texture.width;
    const sourceHeight = this.texture.height;
    const trim = this.texture.trim;

    const trimmedWidth = sourceWidth - trim.left - trim.right;
    const trimmedHeight = sourceHeight - trim.top - trim.bottom;

    const trimNLeft = trim.left / sourceWidth;
    const trimNRight = trim.right / sourceWidth;
    const trimNTop = trim.top / sourceHeight;
    const trimNBottom = trim.bottom / sourceHeight;

    const trimmedWidthNorm = trimmedWidth / sourceWidth;
    const trimmedHeightNorm = trimmedHeight / sourceHeight;

    const srcLeft = this.sliceBorders.left;
    const srcRight = this.sliceBorders.right;
    const srcTop = this.sliceBorders.top;
    const srcBottom = this.sliceBorders.bottom;

    const left = Math.max(0, srcLeft - trimNLeft) / trimmedWidthNorm;
    const right = Math.max(0, srcRight - trimNRight) / trimmedWidthNorm;
    const top = Math.max(0, srcTop - trimNTop) / trimmedHeightNorm;
    const bottom = Math.max(0, srcBottom - trimNBottom) / trimmedHeightNorm;

    return result.set(
      Math.min(1, left),
      Math.min(1, right),
      Math.min(1, top),
      Math.min(1, bottom),
    );
  }

  private calculateSliceRegionsForShader(result: Vector4): Vector4 {
    if (this.regionModeInternal === UINineSliceRegionMode.NORMALIZED) {
      return result.set(
        this.sliceRegions.left,
        this.sliceRegions.right,
        this.sliceRegions.top,
        this.sliceRegions.bottom,
      );
    }

    const width = this.width;
    const height = this.height;

    return result.set(
      this.sliceRegions.left / width,
      this.sliceRegions.right / width,
      this.sliceRegions.top / height,
      this.sliceRegions.bottom / height,
    );
  }

  private checkDimensionsDirty(): boolean {
    return (
      this.solverWrapper.dirty &&
      (this.lastWidth !== Math.round(this.width) ||
        this.lastHeight !== Math.round(this.height))
    );
  }

  private setDimensionsDirtyFalse(): void {
    this.lastWidth = Math.round(this.width);
    this.lastHeight = Math.round(this.height);
  }
}
