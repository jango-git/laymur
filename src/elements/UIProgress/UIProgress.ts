import type { Matrix3, Texture, Vector2 } from "three";
import type { UILayer } from "../../layers/UILayer";
import { UIColor } from "../../miscellaneous/color/UIColor";
import { computeTrimmedTransformMatrix } from "../../miscellaneous/computeTransform";
import type { UIProgressMaskFunction } from "../../miscellaneous/mask-function/UIProgressMaskFunction";
import { UIProgressMaskFunctionDirectional } from "../../miscellaneous/mask-function/UIProgressMaskFunctionDirectional";
import { UITextureView } from "../../miscellaneous/texture/UITextureView";
import { UITextureViewEvent } from "../../miscellaneous/texture/UITextureView.Internal";
import source from "../../shaders/UIProgress.glsl";
import { UIElement } from "../UIElement/UIElement";
import type { UIProgressOptions } from "./UIProgress.Internal";
import {
  PROGRESS_DEFAULT_VALUE,
  PROGRESS_TEMP_PROPERTIES,
  simplifyGLSLSource,
} from "./UIProgress.Internal";

/** Progress bar with customizable fill direction */
export class UIProgress extends UIElement {
  /** Texture displayed by this element */
  public readonly texture: UITextureView;
  /** Multiplicative tint. Alpha channel controls opacity. */
  public readonly color: UIColor;
  /** Function controlling fill direction and shape */
  public readonly maskFunction: UIProgressMaskFunction;

  private readonly textureTransform: Matrix3;
  private readonly textureResolution: Vector2;

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
    const color = new UIColor(options.color);
    const textureView = new UITextureView(texture);
    const textureTransform = textureView.calculateUVTransform();
    const textureResolution = textureView.getResolution();

    options.width = options.width ?? textureView.width;
    options.height = options.height ?? textureView.height;

    const progress = options.progress ?? PROGRESS_DEFAULT_VALUE;

    const maskFunction =
      options.maskFunction ?? new UIProgressMaskFunctionDirectional();
    const simplifiedSource = simplifyGLSLSource(maskFunction.source + source);

    super(
      layer,
      simplifiedSource,
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
    this.color = color;
    this.progressInternal = progress;
    this.maskFunction = maskFunction;

    this.texture.on(
      UITextureViewEvent.DIMENSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
  }

  /** Progress from 0 (empty) to 1 (full) */
  public get progress(): number {
    return this.progressInternal;
  }

  /** Progress from 0 (empty) to 1 (full). Clamped by shader. */
  public set progress(value: number) {
    if (this.progressInternal !== value) {
      this.progressInternal = value;
      this.progressDirty = true;
    }
  }

  protected override setPlaneTransform(): void {
    if (this.color.dirty) {
      PROGRESS_TEMP_PROPERTIES["color"] = this.color;
      this.color.setDirtyFalse();
    } else {
      delete PROGRESS_TEMP_PROPERTIES["color"];
    }

    if (this.texture.textureDirty) {
      PROGRESS_TEMP_PROPERTIES["texture"] = this.texture.texture;
      this.texture.setTextureDirtyFalse();
    } else {
      delete PROGRESS_TEMP_PROPERTIES["texture"];
    }

    if (this.texture.uvTransformDirty) {
      PROGRESS_TEMP_PROPERTIES["textureTransform"] =
        this.texture.calculateUVTransform(this.textureTransform);
      this.texture.setUVTransformDirtyFalse();
    } else {
      delete PROGRESS_TEMP_PROPERTIES["textureTransform"];
    }

    if (this.texture.uvTransformDirty) {
      PROGRESS_TEMP_PROPERTIES["progress"] = this.progressInternal;
      this.progressDirty = false;
    } else {
      delete PROGRESS_TEMP_PROPERTIES["progress"];
    }

    if (this.textureResolutionDirty) {
      PROGRESS_TEMP_PROPERTIES["textureResolution"] =
        this.texture.getResolution(this.textureResolution);
      this.textureResolutionDirty = false;
    } else {
      delete PROGRESS_TEMP_PROPERTIES["textureResolution"];
    }

    if (this.maskFunction.dirty) {
      const properties = this.maskFunction.enumerateProperties();
      for (const key in properties) {
        PROGRESS_TEMP_PROPERTIES[key] = properties[key];
      }
      this.maskFunction.setDirtyFalse();
    } else {
      for (const key in this.maskFunction.enumerateProperties()) {
        delete PROGRESS_TEMP_PROPERTIES[key];
      }
    }

    this.sceneWrapper.setProperties(
      this.planeHandler,
      PROGRESS_TEMP_PROPERTIES,
    );

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
}
