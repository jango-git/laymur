import type { Matrix3, WebGLRenderer } from "three";
import type { UILayer } from "../../layers/UILayer";
import { assertValidPositiveNumber } from "../../miscellaneous/asserts";
import { UIColor } from "../../miscellaneous/color/UIColor";
import { computeTrimmedTransformMatrix } from "../../miscellaneous/computeTransform";
import { UITextureView } from "../../miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../miscellaneous/texture/UITextureView.Internal";
import { UITextureViewEvent } from "../../miscellaneous/texture/UITextureView.Internal";
import source from "../../shaders/UIImage.glsl";
import { UIElement } from "../UIElement/UIElement";
import type { UIAnimatedImageOptions } from "./UIAnimatedImage.Internal";
import {
  ANIMATED_IMAGE_DEFAULT_FRAME_RATE,
  ANIMATED_IMAGE_DEFAULT_LOOP,
  UIAnimatedImageEvent,
} from "./UIAnimatedImage.Internal";

/** Frame-based texture animation element */
export class UIAnimatedImage extends UIElement {
  /** Multiplicative tint. Alpha channel controls opacity. */
  public readonly color: UIColor;

  private readonly sequenceInternal: UITextureView[];

  private frameRateInternal: number;
  private loopInternal: boolean;
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

    this.sequenceInternal = uiTextures;
    this.textureTransform = textureTransform;
    this.frameRateInternal =
      options.frameRate ?? ANIMATED_IMAGE_DEFAULT_FRAME_RATE;
    this.loopInternal = options.loop ?? ANIMATED_IMAGE_DEFAULT_LOOP;
    this.color = color;

    this.subscribeSequenceEvents();

    if (options.playByDefault === true) {
      this.play();
    }
  }

  /** Animation frames as readonly array */
  public get sequence(): readonly UITextureView[] {
    return this.sequenceInternal;
  }

  /** Animation speed in frames per second */
  public get frameRate(): number {
    return this.frameRateInternal;
  }

  /** Whether animation repeats after completion */
  public get loop(): boolean {
    return this.loopInternal;
  }

  /** Total animation duration in seconds */
  public get duration(): number {
    return this.sequenceInternal.length / this.frameRateInternal;
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

  /** Animation speed in frames per second */
  public set frameRate(value: number) {
    assertValidPositiveNumber(value, "UIAnimatedImage.frameRate");
    this.frameRateInternal = value;
  }

  /** Whether animation repeats after completion */
  public set loop(value: boolean) {
    this.loopInternal = value;
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
    if (this.isPlaying) {
      this.accumulatedTime += deltaTime;
      const frameDuration = 1 / this.frameRateInternal;

      while (this.accumulatedTime >= frameDuration) {
        this.accumulatedTime -= frameDuration;
        this.sequenceFrameIndex += 1;

        if (this.loopInternal) {
          this.sequenceFrameIndex %= this.sequenceInternal.length;
        } else if (this.sequenceFrameIndex >= this.sequenceInternal.length) {
          this.sequenceFrameIndex = this.sequenceInternal.length - 1;
          this.isPlaying = false;
          this.emit(UIAnimatedImageEvent.PAUSED);
          break;
        }

        this.currentFrameIndexDirty = true;
      }
    }

    super.onWillRender(renderer, deltaTime);
  }

  protected override setPlaneTransform(): void {
    const frame = this.sequenceInternal[this.sequenceFrameIndex];

    if (this.color.dirty || this.currentFrameIndexDirty) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: frame.texture,
        textureTransform: frame.calculateUVTransform(this.textureTransform),
        color: this.color,
      });

      this.color.setDirtyFalse();
    }

    if (
      this.currentFrameIndexDirty ||
      frame.textureDirty ||
      frame.uvTransformDirty ||
      frame.trimDirty ||
      this.micro.dirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty
    ) {
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

      this.micro.setDirtyFalse();
      frame.setTextureDirtyFalse();
      frame.setUVTransformDirtyFalse();
      frame.setTrimDirtyFalse();
      this.currentFrameIndexDirty = false;
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
