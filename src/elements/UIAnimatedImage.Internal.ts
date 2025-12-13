export enum UIAnimatedImageEvent {
  PLAY = 0,
  PAUSE = 1,
  STOP = 2,
}

export type UIAnimatedImageSequence =
  | { texture: Texture; transforms: Matrix3[] }
  | Texture[];

/**
 * Configuration options for creating a UIAnimatedImage element.
 */
export interface UIAnimatedImageOptions extends UIElementCommonOptions {
  /** Frame rate for animation */
  frameRate: number;
  /** Whether animation should loop */
  loop: boolean;
}

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

  /** Internal storage for the current texture */
  private readonly sequence: { texture: Texture; transform: Matrix3 }[];

  private frameRateInternal: number;
  private loopInternal: boolean;

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
    sequence: UIAnimatedImageSequence,
    options: Partial<UIAnimatedImageOptions> = {},
  ) {
    const w = options.width ?? 256;
    const h = options.height ?? 256;
    const color = new UIColor(options.color);

    const mappedSequence = Array.isArray(sequence)
      ? sequence.map((texture) => ({
          texture,
          transform: texture.matrix,
        }))
      : sequence.transforms.map((transform) => ({
          texture: sequence.texture,
          transform: transform,
        }));

    super(layer, options.x ?? 0, options.y ?? 0, w, h, source, {
      texture: mappedSequence[0].texture,
      textureTransform: mappedSequence[0].transform,
      color,
    });

    this.color = color;
    this.mode = options.mode ?? this.mode;

    this.sequence = mappedSequence;
    this.frameRateInternal = options.frameRate ?? 24;
    this.loopInternal = options.loop ?? true;
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
    return this.sequence.length / this.frameRateInternal;
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
          this.sequenceFrameIndex %= this.sequence.length;
        } else if (this.sequenceFrameIndex >= this.sequence.length) {
          this.sequenceFrameIndex = this.sequence.length - 1;
          this.isPlaying = false;
          this.emit(UIAnimatedImageEvent.PAUSE);
          break;
        }

        this.currentFrameIndexDirty = true;
      }
    }

    if (this.color.dirty || this.currentFrameIndexDirty) {
      const frame = this.sequence[this.sequenceFrameIndex];
      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: frame.texture,
        textureTransform: frame.transform,
        color: this.color,
      });

      this.color.dirty = false;
      this.currentFrameIndexDirty = false;
    }
    super.onWillRender(renderer, deltaTime);
  }
}
