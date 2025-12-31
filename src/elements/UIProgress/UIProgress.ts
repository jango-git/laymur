import type { Matrix3, Texture, Vector2 } from "three";
import { MathUtils } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import { assertValidNumber } from "../../miscellaneous/asserts";
import { UIColor } from "../../miscellaneous/color/UIColor";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import { computeTrimmedTransformMatrix } from "../../miscellaneous/computeTransform";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared";
import type { UIProgressMaskFunction } from "../../miscellaneous/mask-function/UIProgressMaskFunction";
import { UIProgressMaskFunctionDirectional } from "../../miscellaneous/mask-function/UIProgressMaskFunctionDirectional";
import { UITextureView } from "../../miscellaneous/texture/UITextureView";
import { UITextureViewEvent } from "../../miscellaneous/texture/UITextureView.Internal";
import { isUIModeVisible } from "../../miscellaneous/UIMode";
import source from "../../shaders/UIProgress.glsl";
import { UIElement } from "../UIElement/UIElement";
import type { UIProgressOptions } from "./UIProgress.Internal";
import { PROGRESS_DEFAULT_VALUE } from "./UIProgress.Internal";

/** Progress bar with customizable fill direction */
export class UIProgress extends UIElement {
  /** Texture displayed by this element */
  public readonly texture: UITextureView;

  private readonly colorInternal: UIColor;
  private readonly textureTransform: Matrix3;
  private readonly textureResolution: Vector2;

  private maskFunctionInternal: UIProgressMaskFunction;
  private progressInternal: number;
  private progressDirty = false;
  private textureResolutionDirty = false;

  /**
   * Creates a new UIProgress instance.
   *
   * Defaults size to texture dimensions if width and height not provided.
   *
   * @param layer - Layer containing this element
   * @param texture - Texture to display
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    texture: Texture,
    options: Partial<UIProgressOptions> = {},
  ) {
    if (options.progress !== undefined) {
      assertValidNumber(
        options.progress,
        "UIProgress.constructor.options.progress",
      );
    }

    const color = new UIColor(options.color);
    const textureView = new UITextureView(texture);
    const textureTransform = textureView.calculateUVTransform();
    const textureResolution = textureView.getResolution();

    options.width = options.width ?? textureView.width;
    options.height = options.height ?? textureView.height;

    const progress = MathUtils.clamp(
      options.progress ?? PROGRESS_DEFAULT_VALUE,
      0,
      1,
    );

    const maskFunction =
      options.maskFunction ?? new UIProgressMaskFunctionDirectional();

    super(
      layer,
      maskFunction.source + source,
      {
        texture: textureView.texture,
        textureTransform,
        textureResolution,
        color,
        progress,
        ...maskFunction.enumerateProperties(),
      },
      options,
    );

    this.texture = textureView;
    this.textureTransform = textureTransform;
    this.textureResolution = textureResolution;
    this.colorInternal = color;
    this.progressInternal = progress;
    this.maskFunctionInternal = maskFunction;

    this.texture.on(
      UITextureViewEvent.DIMENSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /** Function controlling fill direction and shape */
  public get maskFunction(): UIProgressMaskFunction {
    return this.maskFunctionInternal;
  }

  /** Progress from 0 (empty) to 1 (full) */
  public get progress(): number {
    return this.progressInternal;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public set color(value: UIColorConfig) {
    this.colorInternal.set(value);
  }

  /** Function controlling fill direction and shape */
  public set maskFunction(value: UIProgressMaskFunction) {
    if (this.maskFunctionInternal !== value) {
      this.maskFunctionInternal = value;
      this.rebuildPlane();
    }
  }

  /** Progress from 0 (empty) to 1 (full). Clamped. */
  public set progress(value: number) {
    assertValidNumber(value, "UIProgress.progress");
    value = MathUtils.clamp(value, 0, 1);
    if (this.progressInternal !== value) {
      this.progressInternal = value;
      this.progressDirty = true;
    }
  }

  protected override setPlaneTransform(): void {
    let properties: Record<string, UIProperty> | undefined;

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

    if (this.progressDirty) {
      properties ??= {};
      properties["progress"] = this.progressInternal;
      this.progressDirty = false;
    }

    if (this.textureResolutionDirty) {
      properties ??= {};
      properties["textureResolution"] = this.texture.getResolution(
        this.textureResolution,
      );
      this.textureResolutionDirty = false;
    }

    if (this.maskFunction.dirty) {
      properties ??= {};
      const maskProperties = this.maskFunction.enumerateProperties();
      for (const key in maskProperties) {
        properties[key] = maskProperties[key];
      }
      this.maskFunction.setDirtyFalse();
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

  private readonly onTextureDimensionsChanged = (
    width: number,
    height: number,
  ): void => {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.textureResolutionDirty = true;
    }
  };

  private rebuildPlane(): void {
    this.sceneWrapper.destroyPlane(this.planeHandler);

    const micro = this.micro;
    const textureTrim = this.texture.trim;

    this.planeHandler = this.sceneWrapper.createPlane(
      this.maskFunctionInternal.source + source,
      {
        texture: this.texture.texture,
        textureTransform: this.texture.calculateUVTransform(
          this.textureTransform,
        ),
        textureResolution: this.texture.getResolution(this.textureResolution),
        color: this.colorInternal,
        progress: this.progressInternal,
        ...this.maskFunctionInternal.enumerateProperties(),
      },
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
      isUIModeVisible(this.mode),
      this.transparencyMode,
    );

    this.colorInternal.setDirtyFalse();
    this.texture.setTextureDirtyFalse();
    this.texture.setUVTransformDirtyFalse();
    this.texture.setTrimDirtyFalse();
    this.progressDirty = false;
    this.textureResolutionDirty = false;
    this.maskFunctionInternal.setDirtyFalse();
    this.micro.setDirtyFalse();
  }
}
