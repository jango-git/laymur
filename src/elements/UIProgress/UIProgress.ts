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
  private dirty = false;

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
      this.dirty = true;
    }
  }

  protected override updatePlaneTransform(): void {
    if (
      this.dirty ||
      this.texture.dirty ||
      this.color.dirty ||
      this.maskFunction.dirty
    ) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: this.texture.texture,
        textureTransform: this.texture.calculateUVTransform(
          this.textureTransform,
        ),
        textureResolution: this.texture.getResolution(this.textureResolution),
        color: this.color,
        progress: this.progressInternal,
      });

      this.dirty = false;
      this.color.setDirtyFalse();
      this.maskFunction.setDirtyFalse();
    }

    if (
      this.solverWrapper.dirty ||
      this.inputWrapper.dirty ||
      this.texture.dirty ||
      this.micro.dirty
    ) {
      this.sceneWrapper.setTransform(
        this.planeHandler,
        computeTrimmedTransformMatrix(
          this.x,
          this.y,
          this.width,
          this.height,
          this.zIndex,
          this.micro.x,
          this.micro.y,
          this.micro.anchorX,
          this.micro.anchorY,
          this.micro.scaleX,
          this.micro.scaleY,
          this.micro.rotation,
          this.micro.anchorMode,
          this.texture.trim.left,
          this.texture.trim.right,
          this.texture.trim.top,
          this.texture.trim.bottom,
        ),
      );

      this.texture.setDirtyFalse();
      this.micro.setDirtyFalse();
    }
  }

  private readonly onTextureDimensionsChanged = (
    width: number,
    height: number,
  ): void => {
    this.width = width;
    this.height = height;
  };
}
