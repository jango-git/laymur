import type { Matrix3 } from "three";
import { Vector4 } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import { UIColor } from "../../miscellaneous/color/UIColor";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import { computeTrimmedTransformMatrix } from "../../miscellaneous/computeTransform";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared";
import { UIInsets } from "../../miscellaneous/insets/UIInsets";
import type { UIInsetsConfig } from "../../miscellaneous/insets/UIInsets.Internal";
import { UITextureView } from "../../miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../miscellaneous/texture/UITextureView.Internal";
import { UITextureViewEvent } from "../../miscellaneous/texture/UITextureView.Internal";
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

  private readonly colorInternal: UIColor;
  private readonly sliceBordersInternal: UIInsets;
  private readonly sliceRegionsInternal: UIInsets;
  private regionModeInternal: UINineSliceRegionMode;
  private regionModeDirty = true;

  private readonly textureTransform: Matrix3;
  private readonly sliceBordersVector = new Vector4();
  private readonly sliceRegionsVector = new Vector4();

  private lastElementWidth: number;
  private lastElementHeight: number;

  private textureDimensionsDirty = true;

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
    this.colorInternal = color;
    this.sliceBordersInternal = sliceBorders;
    this.sliceRegionsInternal = sliceRegions;
    this.regionModeInternal = regionMode;

    this.sliceBordersVector = sliceBordersVector;
    this.sliceRegionsVector = sliceRegionsVector;

    this.lastElementWidth = this.width;
    this.lastElementHeight = this.height;

    this.texture.on(
      UITextureViewEvent.DIMENSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /** Controls how sliceRegions values are interpreted */
  public get regionMode(): UINineSliceRegionMode {
    return this.regionModeInternal;
  }

  /** Border size in normalized texture coordinates (0 to 1) */
  public get sliceBorders(): UIInsets {
    return this.sliceBordersInternal;
  }

  /** Region size. Interpretation depends on regionMode. */
  public get sliceRegions(): UIInsets {
    return this.sliceRegionsInternal;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public set color(value: UIColorConfig) {
    this.colorInternal.set(value);
  }

  /** Controls how sliceRegions values are interpreted */
  public set regionMode(value: UINineSliceRegionMode) {
    if (this.regionModeInternal !== value) {
      this.regionModeInternal = value;
      this.regionModeDirty = true;
    }
  }

  /** Border size in normalized texture coordinates (0 to 1) */
  public set sliceBorders(value: UIInsetsConfig) {
    this.sliceBordersInternal.set(value);
  }

  /** Region size. Interpretation depends on regionMode. */
  public set sliceRegions(value: UIInsetsConfig) {
    this.sliceRegionsInternal.set(value);
  }

  /** Removes nine slice and frees resources */
  public override destroy(): void {
    this.texture.off(
      UITextureViewEvent.DIMENSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
    super.destroy();
  }

  protected override setPlaneTransform(): void {
    let properties: Record<string, UIProperty> | undefined;

    const sliceBordersDirty =
      this.textureDimensionsDirty ||
      this.sliceBordersInternal.dirty ||
      this.texture.trimDirty;

    if (sliceBordersDirty) {
      properties ??= {};
      properties["sliceBorders"] = this.calculateSliceBordersForShader(
        this.sliceBordersVector,
      );
      this.sliceBordersInternal.setDirtyFalse();
      this.textureDimensionsDirty = false;
    }

    const sliceRegionsDirty =
      this.sliceRegionsInternal.dirty ||
      this.regionModeDirty ||
      (this.regionModeInternal === UINineSliceRegionMode.WORLD &&
        this.checkElementDimensionsDirty());

    if (sliceRegionsDirty) {
      properties ??= {};
      properties["sliceRegions"] = this.calculateSliceRegionsForShader(
        this.sliceRegionsVector,
      );
      this.sliceRegionsInternal.setDirtyFalse();
      this.regionModeDirty = false;
      this.setElementDimensionsDirtyFalse();
    }

    if (this.colorInternal.dirty) {
      properties ??= {};
      properties["color"] = this.colorInternal;
      this.colorInternal.setDirtyFalse();
    }

    if (this.texture.textureDirty) {
      properties ??= {};
      properties["texture"] = this.texture.texture;
      this.texture.setTextureDirtyFalse();
    }

    if (this.texture.uvTransformDirty) {
      properties ??= {};
      properties["textureTransform"] = this.texture.calculateUVTransform(
        this.textureTransform,
      );
      this.texture.setUVTransformDirtyFalse();
    }

    if (properties) {
      this.sceneWrapper.setProperties(this.planeHandler, properties);
    }

    const isTransformDirty =
      this.micro.dirty ||
      this.texture.trimDirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty;

    if (isTransformDirty) {
      const micro = this.micro;
      const textureTrim = this.texture.trim;

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
          textureTrim.left,
          textureTrim.right,
          textureTrim.top,
          textureTrim.bottom,
        ),
      );
      this.micro.setDirtyFalse();
      this.texture.setTrimDirtyFalse();
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

    const srcLeft = this.sliceBordersInternal.left;
    const srcRight = this.sliceBordersInternal.right;
    const srcTop = this.sliceBordersInternal.top;
    const srcBottom = this.sliceBordersInternal.bottom;

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
        this.sliceRegionsInternal.left,
        this.sliceRegionsInternal.right,
        this.sliceRegionsInternal.top,
        this.sliceRegionsInternal.bottom,
      );
    }

    const width = this.width;
    const height = this.height;

    return result.set(
      this.sliceRegionsInternal.left / width,
      this.sliceRegionsInternal.right / width,
      this.sliceRegionsInternal.top / height,
      this.sliceRegionsInternal.bottom / height,
    );
  }

  private checkElementDimensionsDirty(): boolean {
    return (
      this.solverWrapper.dirty &&
      (this.lastElementWidth !== Math.round(this.width) ||
        this.lastElementHeight !== Math.round(this.height))
    );
  }

  private setElementDimensionsDirtyFalse(): void {
    this.lastElementWidth = Math.round(this.width);
    this.lastElementHeight = Math.round(this.height);
  }

  private readonly onTextureDimensionsChanged = (): void => {
    this.textureDimensionsDirty = true;
  };
}
