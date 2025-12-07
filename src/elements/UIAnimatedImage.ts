import type { Matrix3, Texture } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import source from "../shaders/UIDefaultShader.glsl";
import { UIElement } from "./UIElement";

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
export interface UIAnimatedImageOptions {
  /** X position of the element */
  x: number;
  /** Y position of the element */
  y: number;
  /** Width of the element */
  width: number;
  /** Height of the element */
  height: number;
  /** Color tint applied to the image */
  color: UIColor;
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
  /** Internal storage for the current texture */
  private readonly sequenceInternal: {
    texture: Texture;
    uvTransform: Matrix3;
  }[];

  /** Internal storage for the color tint */
  private readonly colorInternal: UIColor;
  private frameRateInternal: number;
  private loopInternal: boolean;

  private intervalHandler?: ReturnType<typeof setInterval> = undefined;
  private currentFrameIndex = 0;

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
    const w = options.width ?? 100;
    const h = options.height ?? 100;
    const color = options.color ?? new UIColor();

    let tempSequence: {
      texture: Texture;
      uvTransform: Matrix3;
    }[];

    if (Array.isArray(sequence)) {
      tempSequence = sequence.map((texture) => {
        texture.updateMatrix();
        return {
          texture,
          uvTransform: texture.matrix,
        };
      });
    } else {
      tempSequence = sequence.transforms.map((transform) => {
        return {
          texture: sequence.texture,
          uvTransform: transform,
        };
      });
    }

    super(layer, options.x ?? 0, options.y ?? 0, w, h, source, {
      map: tempSequence[0].texture,
      uvTransform: tempSequence[0].uvTransform,
      color,
    });

    this.sequenceInternal = tempSequence;
    this.colorInternal = color;
    const defaultFrameRate = 24;
    this.frameRateInternal = options.frameRate ?? defaultFrameRate;
    this.loopInternal = options.loop ?? true;
    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);
  }

  /**
   * Gets the current color tint applied to the image.
   * @returns The UIColor instance
   */
  public get color(): UIColor {
    return this.colorInternal;
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

  /**
   * Sets the color tint applied to the image.
   * @param value - The UIColor instance
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Sets the frame rate for animation.
   * @param value - The frame rate in frames per second
   */
  public set frameRate(value: number) {
    if (value <= 0) {
      throw new Error("Frame rate must be greater than zero");
    }

    const wasPlaying = this.intervalHandler !== undefined;
    if (wasPlaying) {
      this.pause();
    }

    this.frameRateInternal = value;

    if (wasPlaying) {
      this.play();
    }
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
    if (this.intervalHandler !== undefined) {
      return;
    }

    this.intervalHandler = setInterval(() => {
      this.currentFrameIndex++;

      if (this.loopInternal) {
        this.currentFrameIndex %= this.sequenceInternal.length;
      } else if (this.currentFrameIndex >= this.sequenceInternal.length) {
        this.currentFrameIndex = this.sequenceInternal.length - 1;
        this.pause();
        return;
      }

      this.updateFrame();
    }, 1000 / this.frameRateInternal);
    this.emit(UIAnimatedImageEvent.PLAY);
  }

  /**
   * Pauses the animation at the current frame.
   */
  public pause(): void {
    if (this.intervalHandler === undefined) {
      return;
    }

    clearInterval(this.intervalHandler);
    this.intervalHandler = undefined;
    this.emit(UIAnimatedImageEvent.PAUSE);
  }

  /**
   * Stops the animation and resets to the first frame.
   */
  public stop(): void {
    if (this.intervalHandler !== undefined) {
      clearInterval(this.intervalHandler);
      this.intervalHandler = undefined;
    }

    this.currentFrameIndex = 0;
    this.updateFrame();
    this.emit(UIAnimatedImageEvent.STOP);
  }

  /**
   * Destroys the UI image by cleaning up color event listeners and all associated resources.
   */
  public override destroy(): void {
    this.stop();
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    super.destroy();
  }

  /** Event handler for when the color changes */
  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setProperties(this.planeHandler, { color: color });
  };

  private updateFrame(): void {
    const frame = this.sequenceInternal[this.currentFrameIndex];
    this.sceneWrapper.setProperties(this.planeHandler, {
      map: frame.texture,
      uvTransform: frame.uvTransform,
    });
  }
}
