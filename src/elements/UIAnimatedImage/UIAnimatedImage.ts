import type { Matrix3, WebGLRenderer } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../../miscellaneous/asserts";
import { UIColor } from "../../miscellaneous/color/UIColor";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import { computeTrimmedTransformMatrix } from "../../miscellaneous/computeTransform";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared";
import { UITextureView } from "../../miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../miscellaneous/texture/UITextureView.Internal";
import { UITextureViewEvent } from "../../miscellaneous/texture/UITextureView.Internal";
import source from "../../shaders/UIImage.glsl";
import { UIElement } from "../UIElement/UIElement";
import type { UIAnimatedImageOptions } from "./UIAnimatedImage.Internal";
import {
  ANIMATED_IMAGE_DEFAULT_FRAME_RATE,
  ANIMATED_IMAGE_DEFAULT_LOOP_MODE,
  ANIMATED_IMAGE_DEFAULT_TIME_SCALE,
  UIAnimatedImageEvent,
  UIAnimatedImageLoopMode,
} from "./UIAnimatedImage.Internal";

/** Frame-based texture animation element */
export class UIAnimatedImage extends UIElement {
  private readonly colorInternal: UIColor;
  private readonly sequenceInternal: UITextureView[];

  private frameRateInternal: number;
  private timeScaleInternal: number;
  private loopModeInternal: UIAnimatedImageLoopMode;
  private readonly textureTransform: Matrix3;

  private isPlaying = false;
  private sequenceFrameIndex = 0;
  private currentFrameIndexDirty = false;
  private accumulatedTime = 0;

  /**
   * Creates a new UIAnimatedImage instance.
   *
   * Defaults size to first frame dimensions if width and height not provided.
   *
   * @param layer - Layer containing this element
   * @param sequence - Array of textures forming animation
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    sequence: UITextureConfig[],
    options: Partial<UIAnimatedImageOptions> = {},
  ) {
    const color = new UIColor(options.color);
    const uiTextures = sequence.map(
      (textureConfig) => new UITextureView(textureConfig),
    );

    const frame = uiTextures[0];
    options.width = options.width ?? frame.width;
    options.height = options.height ?? frame.height;

    const textureTransform = frame.calculateUVTransform();

    super(
      layer,
      source,
      {
        texture: frame.texture,
        textureTransform: textureTransform,
        color,
      },
      options,
    );

    this.colorInternal = color;
    this.sequenceInternal = uiTextures;
    this.textureTransform = textureTransform;
    this.frameRateInternal =
      options.frameRate ?? ANIMATED_IMAGE_DEFAULT_FRAME_RATE;
    this.timeScaleInternal =
      options.timeScale ?? ANIMATED_IMAGE_DEFAULT_TIME_SCALE;
    this.loopModeInternal =
      options.loopMode ?? ANIMATED_IMAGE_DEFAULT_LOOP_MODE;

    this.subscribeSequenceEvents();

    if (options.playByDefault === true) {
      this.play();
    }
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /** Total animation duration in seconds */
  public get duration(): number {
    return this.sequenceInternal.length / this.frameRateInternal;
  }

  /** Animation speed in frames per second */
  public get frameRate(): number {
    return this.frameRateInternal;
  }

  /** Loop behavior */
  public get loopMode(): UIAnimatedImageLoopMode {
    return this.loopModeInternal;
  }

  /** Animation frames as readonly array */
  public get sequence(): readonly UITextureView[] {
    return this.sequenceInternal;
  }

  /** Playback speed multiplier. Can be negative for reverse playback. */
  public get timeScale(): number {
    return this.timeScaleInternal;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public set color(value: UIColorConfig) {
    this.colorInternal.set(value);
  }

  /** Animation speed in frames per second */
  public set frameRate(value: number) {
    assertValidPositiveNumber(value, "UIAnimatedImage.frameRate");
    this.frameRateInternal = value;
  }

  /** Loop behavior */
  public set loopMode(value: UIAnimatedImageLoopMode) {
    this.loopModeInternal = value;
  }

  /** Replaces animation frames. Stops playback. */
  public set sequence(sequence: UITextureConfig[]) {
    this.stop();
    this.unsubscribeSequenceEvents();

    const newLength = sequence.length;
    const currentLength = this.sequenceInternal.length;

    for (let i = 0; i < Math.min(newLength, currentLength); i++) {
      this.sequenceInternal[i].set(sequence[i]);
    }

    if (newLength < currentLength) {
      this.sequenceInternal.length = newLength;
    } else if (newLength > currentLength) {
      for (let i = currentLength; i < newLength; i++) {
        this.sequenceInternal.push(new UITextureView(sequence[i]));
      }
    }

    this.subscribeSequenceEvents();
  }

  /** Playback speed multiplier. Can be negative for reverse playback. */
  public set timeScale(value: number) {
    assertValidNumber(value, "UIAnimatedImage.timeScale");
    this.timeScaleInternal = value;
  }

  /** Removes element and frees resources */
  public override destroy(): void {
    this.unsubscribeSequenceEvents();
    super.destroy();
  }

  /** Starts or resumes animation playback */
  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.emit(UIAnimatedImageEvent.PLAYED);
    }
  }

  /** Pauses animation at current frame */
  public pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.emit(UIAnimatedImageEvent.PAUSED);
    }
  }

  /** Stops animation and resets to first frame */
  public stop(): void {
    if (
      this.isPlaying ||
      this.accumulatedTime > 0 ||
      this.sequenceFrameIndex > 0
    ) {
      this.isPlaying = false;
      this.accumulatedTime = 0;
      this.sequenceFrameIndex = 0;
      this.currentFrameIndexDirty = true;
      this.emit(UIAnimatedImageEvent.STOPPED);
    }
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (this.isPlaying && this.timeScaleInternal !== 0) {
      this.accumulatedTime += deltaTime * this.timeScaleInternal;
      const frameDuration = 1 / this.frameRateInternal;
      const sequenceLength = this.sequenceInternal.length;
      const lastFrameIndex = sequenceLength - 1;

      if (this.timeScaleInternal > 0) {
        while (this.accumulatedTime >= frameDuration) {
          this.accumulatedTime -= frameDuration;
          this.sequenceFrameIndex += 1;

          if (this.sequenceFrameIndex >= sequenceLength) {
            if (this.loopModeInternal === UIAnimatedImageLoopMode.LOOP) {
              this.sequenceFrameIndex = 0;
            } else if (
              this.loopModeInternal === UIAnimatedImageLoopMode.PING_PONG
            ) {
              this.sequenceFrameIndex = lastFrameIndex;
              this.timeScaleInternal = -this.timeScaleInternal;
            } else {
              this.sequenceFrameIndex = lastFrameIndex;
              this.isPlaying = false;
              this.emit(UIAnimatedImageEvent.PAUSED);
              break;
            }
          }

          this.currentFrameIndexDirty = true;
        }
      } else {
        while (this.accumulatedTime <= -frameDuration) {
          this.accumulatedTime += frameDuration;
          this.sequenceFrameIndex -= 1;

          if (this.sequenceFrameIndex < 0) {
            if (this.loopModeInternal === UIAnimatedImageLoopMode.LOOP) {
              this.sequenceFrameIndex = lastFrameIndex;
            } else if (
              this.loopModeInternal === UIAnimatedImageLoopMode.PING_PONG
            ) {
              this.sequenceFrameIndex = 0;
              this.timeScaleInternal = -this.timeScaleInternal;
            } else {
              this.sequenceFrameIndex = 0;
              this.isPlaying = false;
              this.emit(UIAnimatedImageEvent.PAUSED);
              break;
            }
          }

          this.currentFrameIndexDirty = true;
        }
      }
    }

    super.onWillRender(renderer, deltaTime);
  }

  protected override setPlaneTransform(): void {
    let properties: Record<string, UIProperty> | undefined;

    if (this.colorInternal.dirty) {
      properties ??= {};
      properties["color"] = this.colorInternal;
      this.colorInternal.setDirtyFalse();
    }

    const frame = this.sequenceInternal[this.sequenceFrameIndex];
    if (frame.textureDirty || this.currentFrameIndexDirty) {
      properties ??= {};
      properties["texture"] = frame.texture;
      frame.setTextureDirtyFalse();
    }

    if (frame.uvTransformDirty || this.currentFrameIndexDirty) {
      properties ??= {};
      properties["textureTransform"] = frame.calculateUVTransform(
        this.textureTransform,
      );
      frame.setUVTransformDirtyFalse();
    }

    if (properties) {
      this.sceneWrapper.setProperties(this.planeHandler, properties);
    }

    const isTransformDirty =
      this.currentFrameIndexDirty ||
      this.micro.dirty ||
      frame.trimDirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty;

    if (isTransformDirty) {
      const micro = this.micro;
      const textureTrim = frame.trim;

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

      this.currentFrameIndexDirty = false;
      this.micro.setDirtyFalse();
      frame.setTrimDirtyFalse();
    }
  }

  private readonly onTextureDimensionsChanged = (
    width: number,
    height: number,
    texture: UITextureView,
  ): void => {
    if (this.sequenceInternal[this.sequenceFrameIndex] === texture) {
      this.width = width;
      this.height = height;
    }
  };

  private subscribeSequenceEvents(): void {
    for (const frame of this.sequenceInternal) {
      frame.on(
        UITextureViewEvent.DIMENSIONS_CHANGED,
        this.onTextureDimensionsChanged,
      );
    }
  }

  private unsubscribeSequenceEvents(): void {
    for (const frame of this.sequenceInternal) {
      frame.off(
        UITextureViewEvent.DIMENSIONS_CHANGED,
        this.onTextureDimensionsChanged,
      );
    }
  }
}
