import type { Matrix3, WebGLRenderer } from "three";
import type { UILayer } from "../layers/UILayer";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIColor } from "../miscellaneous/color/UIColor";
import { computeTrimmedTransformMatrix } from "../miscellaneous/computeTransform";
import { UITexture } from "../miscellaneous/texture/UITexture";
import {
  UITextureEvent,
  type UITextureConfig,
} from "../miscellaneous/texture/UITexture.Internal";
import source from "../shaders/UIImage.glsl";
import {
  ANIMATED_IMAGE_DEFAULT_FRAME_RATE,
  ANIMATED_IMAGE_DEFAULT_LOOP,
  UIAnimatedImageEvent,
  type UIAnimatedImageOptions,
} from "./UIAnimatedImage.Internal";
import { UIElement } from "./UIElement";

/**
 * UI element for displaying textured images.
 *
 * UIAnimatedImage is a concrete implementation of UIElement that renders a textured
 * image using shader-based planes. It automatically sizes itself
 * to match the texture dimensions and provides control over visual properties
 * such as color tinting.
 *
 * @see {@link UIElement} - Base class providing UI element functionality
 * @see {@link Texture} - Three.js texture for image data
 */
export class UIAnimatedImage extends UIElement {
  public readonly color: UIColor;

  private readonly sequenceInternal: UITexture[];

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
   * The image will automatically size itself to match the texture's dimensions.
   * All options have default values if not specified.
   *
   * @param layer - The UI layer that contains this image
   * @param texture - The Three.js texture to display
   * @param options - Configuration options for the image
   * @throws Will throw an error if the texture dimensions are not valid positive numbers
   */
  constructor(
    layer: UILayer,
    sequence: UITextureConfig[],
    options: Partial<UIAnimatedImageOptions> = {},
  ) {
    const color = new UIColor(options.color);
    const uiTextures = sequence.map(
      (textureConfig) => new UITexture(textureConfig),
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

  public get sequence(): readonly UITexture[] {
    return this.sequenceInternal;
  }

  /**
   * Gets the frame rate for animation.
   * @returns The frame rate in frames per second
   */
  public get frameRate(): number {
    return this.frameRateInternal;
  }

  /**
   * Gets whether the animation loops.
   * @returns True if animation loops
   */
  public get loop(): boolean {
    return this.loopInternal;
  }

  /**
   * Gets the total duration of the animation in seconds.
   * @returns The duration in seconds
   */
  public get duration(): number {
    return this.sequenceInternal.length / this.frameRateInternal;
  }

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
        this.sequenceInternal.push(new UITexture(sequence[i]));
      }
    }

    this.subscribeSequenceEvents();
  }

  /**
   * Sets the frame rate for animation.
   * @param value - The frame rate in frames per second
   */
  public set frameRate(value: number) {
    assertValidPositiveNumber(value, "UIAnimatedImage.frameRate");
    this.frameRateInternal = value;
  }

  /**
   * Sets whether the animation loops.
   * @param value - True to enable looping
   */
  public set loop(value: boolean) {
    this.loopInternal = value;
  }

  public override destroy(): void {
    this.unsubscribeSequenceEvents();
    super.destroy();
  }

  /**
   * Starts or resumes playback of the animation.
   */
  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.emit(UIAnimatedImageEvent.PLAY);
    }
  }

  /**
   * Pauses the animation at the current frame.
   */
  public pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.emit(UIAnimatedImageEvent.PAUSE);
    }
  }

  /**
   * Stops the animation and resets to the first frame.
   */
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
      this.emit(UIAnimatedImageEvent.STOP);
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
          this.emit(UIAnimatedImageEvent.PAUSE);
          break;
        }

        this.currentFrameIndexDirty = true;
      }
    }

    super.onWillRender(renderer, deltaTime);
  }

  protected override updatePlaneTransform(): void {
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
      frame.dirty ||
      this.micro.dirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty
    ) {
      const trim = frame.trim;
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

      frame.setDirtyFalse();
      this.currentFrameIndexDirty = false;
      this.micro.setDirtyFalse();
    }
  }

  private readonly onTextureDimensionsChanged = (
    width: number,
    height: number,
    texture: UITexture,
  ): void => {
    if (this.sequenceInternal[this.sequenceFrameIndex] === texture) {
      this.width = width;
      this.height = height;
    }
  };

  private subscribeSequenceEvents(): void {
    for (const frame of this.sequenceInternal) {
      frame.on(
        UITextureEvent.DIMENSIONS_CHANGED,
        this.onTextureDimensionsChanged,
      );
    }
  }

  private unsubscribeSequenceEvents(): void {
    for (const frame of this.sequenceInternal) {
      frame.off(
        UITextureEvent.DIMENSIONS_CHANGED,
        this.onTextureDimensionsChanged,
      );
    }
  }
}
