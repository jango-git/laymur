import type { FerrsignView0, FerrsignView2 } from "ferrsign";
import { Ferrsign0, Ferrsign2 } from "ferrsign";
import type { Matrix3, WebGLRenderer } from "three";

import type { UILayer } from "../../layers/UILayer/UILayer.js";
import {
  assertValidNonNegativeInteger,
  assertValidNumber,
  assertValidPositiveNumber,
} from "../../miscellaneous/asserts.js";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import { UIColor } from "../../miscellaneous/color/UIColor.js";
import { computeTrimmedTransformMatrix, scaleTrim } from "../../miscellaneous/computeTransform.js";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared.js";
import type { UITextureConfig } from "../../miscellaneous/texture/UITextureView.Internal.js";
import { UITextureView } from "../../miscellaneous/texture/UITextureView.js";
import source from "../../shaders/UIImage.js";
import { UIElement } from "../UIElement/UIElement.js";
import type { UIAnimatedImageOptions } from "./UIAnimatedImage.Internal.js";
import {
  ANIMATED_IMAGE_DEFAULT_FRAME_RATE,
  ANIMATED_IMAGE_DEFAULT_LOOP_MODE,
  ANIMATED_IMAGE_DEFAULT_TIME_SCALE,
  UIAnimatedImageLoopMode,
} from "./UIAnimatedImage.Internal.js";

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

  private readonly signalPlayedInternal = new Ferrsign0();
  private readonly signalPausedInternal = new Ferrsign0();
  private readonly signalStoppedInternal = new Ferrsign0();
  private readonly signalFrameChangedInternal = new Ferrsign2<number, UIAnimatedImage>();

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
    assertNonEmptySequence(sequence, "UIAnimatedImage.constructor.sequence");
    const color = new UIColor(options.color);
    const uiTextures = sequence.map((textureConfig) => new UITextureView(textureConfig));

    const frame = uiTextures[0];
    // A copy: the caller may pass the same options to several elements
    options = {
      ...options,
      width: options.width ?? frame.width,
      height: options.height ?? frame.height,
    };

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
    this.frameRateInternal = options.frameRate ?? ANIMATED_IMAGE_DEFAULT_FRAME_RATE;
    this.timeScaleInternal = options.timeScale ?? ANIMATED_IMAGE_DEFAULT_TIME_SCALE;
    this.loopModeInternal = options.loopMode ?? ANIMATED_IMAGE_DEFAULT_LOOP_MODE;

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

  /** Index of the displayed frame in the sequence */
  public get frameIndex(): number {
    return this.sequenceFrameIndex;
  }

  /** Playback speed multiplier. Can be negative for reverse playback. */
  public get timeScale(): number {
    return this.timeScaleInternal;
  }

  /** Signal fired when animation starts or resumes */
  public get signalPlayed(): FerrsignView0 {
    return this.signalPlayedInternal;
  }

  /** Signal fired when animation pauses */
  public get signalPaused(): FerrsignView0 {
    return this.signalPausedInternal;
  }

  /** Signal fired when animation stops and resets */
  public get signalStopped(): FerrsignView0 {
    return this.signalStoppedInternal;
  }

  /**
   * Signal fired with the new frame index when the displayed frame changes. Playback fires it
   * at most once per layer frame, on `UILayer.signalRendering`, so a mask frame set from it is
   * drawn together with the new frame.
   */
  public get signalFrameChanged(): FerrsignView2<number, UIAnimatedImage> {
    return this.signalFrameChangedInternal;
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
    assertNonEmptySequence(sequence, "UIAnimatedImage.sequence");
    this.stop();

    const newLength = sequence.length;
    const currentLength = this.sequenceInternal.length;

    // Kept subscribed while set, so that the element follows the size of the new first frame
    for (let i = 0; i < Math.min(newLength, currentLength); i++) {
      this.sequenceInternal[i].set(sequence[i]);
    }

    if (newLength < currentLength) {
      for (let i = newLength; i < currentLength; i++) {
        this.sequenceInternal[i].signalDimensionsChanged.off(this.onTextureDimensionsChanged);
      }
      this.sequenceInternal.length = newLength;
    } else if (newLength > currentLength) {
      for (let i = currentLength; i < newLength; i++) {
        const frame = new UITextureView(sequence[i]);
        frame.signalDimensionsChanged.on(this.onTextureDimensionsChanged);
        this.sequenceInternal.push(frame);
      }
    }
  }

  /**
   * Index of the displayed frame in the sequence. Playback goes on from this frame, its time
   * within the frame reset.
   * @throws If the index is not an integer within the sequence
   */
  public set frameIndex(value: number) {
    assertValidNonNegativeInteger(value, "UIAnimatedImage.frameIndex");
    if (value >= this.sequenceInternal.length) {
      throw new Error(
        `UIAnimatedImage.frameIndex: index ${value} is out of the sequence of ${this.sequenceInternal.length} frames`,
      );
    }
    this.accumulatedTime = 0;
    this.setFrameIndex(value);
  }

  /** Playback speed multiplier. Can be negative for reverse playback. */
  public set timeScale(value: number) {
    assertValidNumber(value, "UIAnimatedImage.timeScale");
    this.timeScaleInternal = value;
  }

  /** Starts or resumes animation playback */
  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.signalPlayedInternal.emit();
    }
  }

  /** Pauses animation at current frame */
  public pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.signalPausedInternal.emit();
    }
  }

  /** Stops animation and resets to first frame */
  public stop(): void {
    if (this.isPlaying || this.accumulatedTime > 0 || this.sequenceFrameIndex > 0) {
      this.isPlaying = false;
      this.accumulatedTime = 0;
      this.setFrameIndex(0);
      this.signalStoppedInternal.emit();
    }
  }

  /** Frees resources of the animated image */
  protected override destroyInternal(): void {
    this.unsubscribeSequenceEvents();
    super.destroyInternal();
  }

  protected override onWillRender(renderer: WebGLRenderer, deltaTime: number): void {
    const previousFrameIndex = this.sequenceFrameIndex;

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
            } else if (this.loopModeInternal === UIAnimatedImageLoopMode.PING_PONG) {
              this.sequenceFrameIndex = lastFrameIndex;
              this.timeScaleInternal = -this.timeScaleInternal;
            } else {
              this.sequenceFrameIndex = lastFrameIndex;
              this.isPlaying = false;
              this.signalPausedInternal.emit();
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
            } else if (this.loopModeInternal === UIAnimatedImageLoopMode.PING_PONG) {
              this.sequenceFrameIndex = 0;
              this.timeScaleInternal = -this.timeScaleInternal;
            } else {
              this.sequenceFrameIndex = 0;
              this.isPlaying = false;
              this.signalPausedInternal.emit();
              break;
            }
          }

          this.currentFrameIndexDirty = true;
        }
      }
    }

    if (this.sequenceFrameIndex !== previousFrameIndex) {
      this.signalFrameChangedInternal.emit(this.sequenceFrameIndex, this);
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
      properties["textureTransform"] = frame.calculateUVTransform(this.textureTransform);
      frame.setUVTransformDirtyFalse();
    }

    if (properties) {
      this.sceneWrapper.setProperties(this.planeHandler, properties);
    }

    const isTransformDirty =
      this.currentFrameIndexDirty || this.micro.dirty || frame.trimDirty || this.placementDirty;

    if (isTransformDirty) {
      const micro = this.micro;
      const textureTrim = scaleTrim(frame.trim, this.width, this.height, frame.width, frame.height);

      this.sceneWrapper.setTransform(
        this.planeHandler,
        computeTrimmedTransformMatrix(
          this.x,
          this.y,
          this.width,
          this.height,
          this.renderDepth,
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
      this.setPlacementDirtyFalse();
    }
  }

  private setFrameIndex(value: number): void {
    if (value !== this.sequenceFrameIndex) {
      this.sequenceFrameIndex = value;
      this.currentFrameIndexDirty = true;
      this.signalFrameChangedInternal.emit(value, this);
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
      frame.signalDimensionsChanged.on(this.onTextureDimensionsChanged);
    }
  }

  private unsubscribeSequenceEvents(): void {
    for (const frame of this.sequenceInternal) {
      frame.signalDimensionsChanged.off(this.onTextureDimensionsChanged);
    }
  }
}

function assertNonEmptySequence(sequence: UITextureConfig[], subject: string): void {
  if (sequence.length === 0) {
    throw new Error(`${subject}: sequence must have at least one frame`);
  }
}
