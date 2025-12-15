import type { Matrix3, Texture, Vector2 } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import { computePaddingTransformMatrix } from "../miscellaneous/computeTransform";
import type { UIProgressMaskFunction } from "../miscellaneous/mask-function/UIProgressMaskFunction";
import { UIProgressMaskFunctionDirectional } from "../miscellaneous/mask-function/UIProgressMaskFunctionDirectional";
import { UITexture } from "../miscellaneous/texture/UITexture";
import { UITextureEvent } from "../miscellaneous/texture/UITexture.Internal";
import source from "../shaders/UIProgress.glsl";
import { UIElement } from "./UIElement";
import type { UIProgressOptions } from "./UIProgress.Internal";
import {
  PROGRESS_DEFAULT_VALUE,
  simplifyGLSLSource,
} from "./UIProgress.Internal";

/**
 * Progress bar UI element with customizable fill direction and appearance.
 *
 * UIProgress displays a progress bar that can be filled in various directions
 * (horizontal, vertical, or at custom angles). It supports separate background
 * and foreground textures with independent color tinting and opacity control.
 *
 * The progress value ranges from 0.0 (empty) to 1.0 (completely filled).
 * The fill direction can be controlled both by angle and forward/reverse direction.
 */
export class UIProgress extends UIElement {
  public readonly texture: UITexture;
  public readonly color: UIColor;
  public readonly maskFunction: UIProgressMaskFunction;

  private readonly textureTransform: Matrix3;
  private readonly textureResolution: Vector2;

  private progressInternal: number;
  private dirty = false;

  /**
   * Creates a new progress bar UI element.
   *
   * @param layer - The UI layer to add this element to
   * @param texture - The texture used for the progress fill
   * @param options - Configuration options for the progress bar
   */
  constructor(
    layer: UILayer,
    texture: Texture,
    options: Partial<UIProgressOptions> = {},
  ) {
    const color = new UIColor(options.color);
    const uiTexture = new UITexture(texture);
    const textureTransform = uiTexture.calculateTransform();
    const textureResolution = uiTexture.getResolution();

    options.width = options.width ?? uiTexture.width;
    options.height = options.height ?? uiTexture.height;

    const progress = options.progress ?? PROGRESS_DEFAULT_VALUE;

    const maskFunction =
      options.maskFunction ?? new UIProgressMaskFunctionDirectional();
    const simplifiedSource = simplifyGLSLSource(maskFunction.source + source);

    super(
      layer,
      simplifiedSource,
      {
        texture: uiTexture.texture,
        textureTransform,
        textureResolution,
        color,
        progress,
        ...maskFunction.enumerateProperties(),
      },
      options,
    );

    this.texture = uiTexture;
    this.textureTransform = textureTransform;
    this.textureResolution = textureResolution;
    this.color = color;
    this.progressInternal = progress;
    this.maskFunction = maskFunction;

    this.texture.on(
      UITextureEvent.DIMINSIONS_CHANGED,
      this.onTextureDimensionsChanged,
    );
  }

  /**
   * Gets the current progress value.
   * @returns Progress value between 0.0 (empty) and 1.0 (full)
   */
  public get progress(): number {
    return this.progressInternal;
  }

  /**
   * Sets the progress value.
   * @param value - Progress value between 0.0 (empty) and 1.0 (full)
   */
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
        textureTransform: this.texture.calculateTransform(
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
        computePaddingTransformMatrix(
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
