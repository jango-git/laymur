import type { WebGLRenderer } from "three";
import { CanvasTexture, Matrix3 } from "three";
import { type UILayer } from "../layers/UILayer";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import type { UIMode } from "../miscellaneous/UIMode";
import { resolvePadding, type UIPadding } from "../miscellaneous/UIPadding";
import type { UITextContent } from "../miscellaneous/UIText.Interfaces";
import {
  calculateTextContentParameters,
  renderTextLines,
} from "../miscellaneous/UIText.Tools";
import { type UITextStyle } from "../miscellaneous/UITextStyle";
import source from "../shaders/UIDefaultShader.glsl";
import { UIElement } from "./UIElement";

/** Default maximum width for text elements in pixels. */
const DEFAULT_MAX_WIDTH = 1024;

/**
 * Configuration options for UIText element creation.
 */
export interface UITextOptions {
  /** X-coordinate of the text element. */
  x: number;
  /** Y-coordinate of the text element. */
  y: number;
  /** Color tint applied to the text. */
  color: UIColor;
  /** Maximum width in pixels before text wrapping occurs. */
  maxWidth: number;
  /** Padding configuration for text content. */
  padding: Partial<UIPadding>;
  /** Common style properties applied to all text content. */
  commonStyle: Partial<UITextStyle>;
  /** Default UIMode */
  mode: UIMode;
}

/**
 * UI element for rendering dynamic text with canvas-based rendering.
 *
 * UIText is a concrete implementation of UIElement that renders text content
 * using HTML5 Canvas and displays it as a texture. It supports rich text
 * formatting, automatic text wrapping, padding, and dynamic resizing based
 * on content. The text is rendered to a canvas texture which is then applied
 * to a Three.js mesh for display in the 3D scene.
 *
 * @see {@link UIElement} - Base class providing UI element functionality
 * @see {@link UITextContent} - Text content structure
 * @see {@link UITextStyle} - Text styling options
 * @see {@link UIPadding} - Padding configuration
 */
export class UIText extends UIElement {
  /** The HTML canvas element used for text rendering. */
  private readonly canvas: OffscreenCanvas;

  /** The 2D rendering context for drawing text on the canvas. */
  private readonly context: OffscreenCanvasRenderingContext2D;

  /** The canvas texture containing the rendered text. */
  private texture: CanvasTexture;

  /** Internal storage for the color tint. */
  private readonly colorInternal: UIColor;

  /** Internal storage for the current text content. */
  private contentInternal: UITextContent;

  /** Internal storage for the maximum width before text wrapping. */
  private maxWidthInternal: number;

  /** Internal storage for the current padding configuration. */
  private paddingInternal: UIPadding;

  /** Internal storage for the common text style properties. */
  private commonStyleInternal: Partial<UITextStyle>;

  /** Target aspect ratio for the text element based on content. */
  private targetAspectRatio = 1;

  /**
   * Creates a new UIText instance with dynamic text rendering.
   *
   * The text element will automatically size itself based on the content
   * and specified options. A canvas is created for rendering the text,
   * which is then used as a texture for the 3D mesh.
   *
   * @param layer - The UI layer that contains this text element
   * @param content - The text content to display
   * @param options - Configuration options for text rendering
   * @throws Will throw an error if canvas context creation fails
   */
  constructor(
    layer: UILayer,
    content: UITextContent,
    options: Partial<UITextOptions> = {},
  ) {
    const canvas = new OffscreenCanvas(2, 2);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("UIText failed to create canvas context");
    }

    const texture = new CanvasTexture(canvas);
    const color = options.color ?? new UIColor();

    super(layer, options.x ?? 0, options.y ?? 0, 2, 2, source, {
      texture: texture,
      textureTransform: new Matrix3(),
      color,
    });

    this.canvas = canvas;
    this.context = context;
    this.texture = texture;

    this.contentInternal = content;
    this.maxWidthInternal = options.maxWidth ?? DEFAULT_MAX_WIDTH;
    this.paddingInternal = resolvePadding(options.padding);
    this.commonStyleInternal = options.commonStyle ?? {};

    this.colorInternal = color;
    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);
    this.rebuildText();

    if (options.mode !== undefined) {
      this.mode = options.mode;
    }
  }

  /**
   * Gets the current color tint applied to the text.
   * @returns The UIColor instance
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Gets the current text content being displayed.
   * @returns The current text content structure
   */
  public get content(): UITextContent {
    return this.contentInternal;
  }

  /**
   * Gets the maximum width before text wrapping occurs.
   * @returns The maximum width in pixels
   */
  public get maxWidth(): number {
    return this.maxWidthInternal;
  }

  /**
   * Gets the current padding configuration.
   * @returns The padding configuration for all sides
   */
  public get padding(): UIPadding {
    return this.paddingInternal;
  }

  /**
   * Gets the common style properties applied to the text.
   * @returns The partial text style configuration
   */
  public get commonStyle(): Partial<UITextStyle> {
    return this.commonStyleInternal;
  }

  /**
   * Sets the color tint applied to the text.
   * @param value - The UIColor instance
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Sets new text content and triggers a rebuild.
   * @param value - The new text content structure
   */
  public set content(value: UITextContent) {
    this.contentInternal = value;
    this.rebuildText();
  }

  /**
   * Sets the maximum width before text wrapping and triggers a rebuild.
   * @param value - The new maximum width in pixels
   */
  public set maxWidth(value: number) {
    this.maxWidthInternal = value;
    this.rebuildText();
  }

  /**
   * Sets new padding configuration and triggers a rebuild.
   * @param value - The new padding configuration
   */
  public set padding(value: UIPadding) {
    this.paddingInternal = value;
    this.rebuildText();
  }

  /**
   * Sets new common style properties and triggers a rebuild.
   * @param value - The new partial text style configuration
   */
  public set commonStyle(value: Partial<UITextStyle>) {
    this.commonStyleInternal = value;
    this.rebuildText();
  }

  /**
   * Destroys the text element by cleaning up all associated resources.
   *
   * This method disposes of the texture resources and calls the parent destroy method
   * to clean up the underlying UI element. After calling this method,
   * the text element should not be used anymore.
   */
  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    this.texture.dispose();
    super.destroy();
  }

  /**
   * Called before each render frame to maintain proper text aspect ratio.
   * Adjusts the height based on the target aspect ratio calculated from text content.
   * @param renderer - The WebGL renderer
   * @param deltaTime - Time since last frame in seconds
   */
  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    super.onWillRender(renderer, deltaTime);
    if (this.targetAspectRatio !== this.width / this.height) {
      this.height = this.width / this.targetAspectRatio;
    }
  }

  /**
   * Rebuilds the text canvas and texture based on current content and settings.
   *
   * This method calculates the text layout, resizes the canvas to fit the content
   * with padding, renders the text lines to the canvas, and updates the texture.
   * It also calculates and sets the target aspect ratio for proper display.
   */
  private rebuildText(): void {
    const { lines, size } = calculateTextContentParameters(
      this.context,
      this.content,
      this.maxWidthInternal,
      this.commonStyleInternal,
    );

    this.canvas.width =
      size.width + this.paddingInternal.left + this.paddingInternal.right;
    this.canvas.height =
      size.height + this.paddingInternal.top + this.paddingInternal.bottom;

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.targetAspectRatio = this.canvas.width / this.canvas.height;

    renderTextLines(
      this.paddingInternal.top,
      this.paddingInternal.left,
      lines,
      this.context,
    );

    this.texture.dispose();
    this.texture = new CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;
    this.sceneWrapper.setProperties(this.planeHandler, {
      texture: this.texture,
    });
  }

  /** Event handler for when the color changes */
  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setProperties(this.planeHandler, { color: color });
  };
}
