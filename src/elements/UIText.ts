import { CanvasTexture, Mesh } from "three";
import { UILayerEvent, type UILayer } from "../layers/UILayer";
import { UIMaterial } from "../materials/UIMaterial";
import type { UITextContent } from "../miscellaneous/textInterfaces";
import {
  calculateTextContentParameters,
  renderTextLines,
} from "../miscellaneous/textTools";
import { geometry } from "../miscellaneous/threeInstances";
import {
  resolvePadding,
  type UITextPadding,
} from "../miscellaneous/UITextPadding";
import { type UITextStyle } from "../miscellaneous/UITextStyle";
import { UIElement } from "./UIElement";

/** Default maximum width for text elements in pixels. */
const DEFAULT_MAX_WIDTH = 1024;

/**
 * Configuration options for UIText element creation.
 */
export interface UITextOptions {
  /** Maximum width in pixels before text wrapping occurs. */
  maxWidth: number;
  /** Padding configuration for text content. */
  padding: Partial<UITextPadding>;
  /** Common style properties applied to all text content. */
  commonStyle: Partial<UITextStyle>;
  /** X-coordinate of the text element. */
  x: number;
  /** Y-coordinate of the text element. */
  y: number;
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
 * @see {@link UITextPadding} - Padding configuration
 */
export class UIText extends UIElement<Mesh> {
  /** The material used for rendering the text texture. */
  private readonly material: UIMaterial;

  /** The canvas texture containing the rendered text. */
  private readonly texture: CanvasTexture;

  /** The HTML canvas element used for text rendering. */
  private readonly canvas: HTMLCanvasElement;

  /** The 2D rendering context for drawing text on the canvas. */
  private readonly context: CanvasRenderingContext2D;

  /** Internal storage for the current text content. */
  private contentInternal: UITextContent;

  /** Internal storage for the maximum width before text wrapping. */
  private maxWidthInternal: number;

  /** Internal storage for the current padding configuration. */
  private paddingInternal: UITextPadding;

  /** Internal storage for the common text style properties. */
  private commonStyleInternal: Partial<UITextStyle>;

  /** Target aspect ratio for the text element based on content. */
  private targetAspectRatio = 1;

  /** Last calculated aspect ratio for comparison during rendering. */
  private lastAspectRatio = 1;

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
   * @param x - Initial x-coordinate position (defaults to 0)
   * @param y - Initial y-coordinate position (defaults to 0)
   * @throws Will throw an error if canvas context creation fails
   */
  constructor(
    layer: UILayer,
    content: UITextContent,
    options: Partial<UITextOptions> = {},
  ) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create canvas context");
    }

    const texture = new CanvasTexture(canvas);
    const material = new UIMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, options.x ?? 0, options.y ?? 0, 2, 2, object);
    this.layer.on(UILayerEvent.WILL_RENDER, this.onWillRenderInternal);

    this.material = material;
    this.texture = texture;

    this.canvas = canvas;
    this.context = context;

    this.contentInternal = content;
    this.maxWidthInternal = options.maxWidth ?? DEFAULT_MAX_WIDTH;
    this.paddingInternal = resolvePadding(options.padding);
    this.commonStyleInternal = options.commonStyle ?? {};

    this.rebuildText();
  }

  /**
   * Gets the current color tint applied to the text.
   * @returns The color value as a number (e.g., 0xFFFFFF for white)
   */
  public get color(): number {
    return this.material.getColor();
  }

  /**
   * Gets the current opacity level of the text.
   * @returns The opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public get opacity(): number {
    return this.material.getOpacity();
  }

  /**
   * Gets whether transparency is enabled for the text.
   * @returns True if transparency is enabled, false otherwise
   */
  public get transparency(): boolean {
    return this.material.getTransparency();
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
  public get padding(): UITextPadding {
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
   * @param value - The color value as a number (e.g., 0xFFFFFF for white)
   */
  public set color(value: number) {
    this.material.setColor(value);
  }

  /**
   * Sets the opacity level of the text.
   * @param value - The opacity value between 0.0 (transparent) and 1.0 (opaque)
   */
  public set opacity(value: number) {
    this.material.setOpacity(value);
  }

  /**
   * Sets whether transparency is enabled for the text.
   * @param value - True to enable transparency, false to disable
   */
  public set transparency(value: boolean) {
    this.material.setTransparency(value);
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
  public set padding(value: UITextPadding) {
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
   * This method disposes of the material and texture resources, removes
   * the canvas element from the DOM, and calls the parent destroy method
   * to clean up the underlying UI element. After calling this method,
   * the text element should not be used anymore.
   */
  public override destroy(): void {
    this.layer.off(UILayerEvent.WILL_RENDER, this.onWillRenderInternal);
    this.material.dispose();
    this.texture.dispose();
    this.canvas.remove();
    super.destroy();
  }

  private readonly onWillRenderInternal = (): void => {
    if (this.lastAspectRatio !== this.width / this.height) {
      this.lastAspectRatio = this.targetAspectRatio;
      this.height = this.width / this.targetAspectRatio;
    }
  };

  /**
   * Rebuilds the text canvas and texture based on current content and settings.
   *
   * This method calculates the text layout, resizes the canvas to fit the content
   * with padding, renders the text lines to the canvas, and updates the texture.
   * It also calculates and sets the target aspect ratio for proper display.
   *
   * @private
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

    this.targetAspectRatio =
      (size.width + this.paddingInternal.left + this.paddingInternal.right) /
      (size.height + this.paddingInternal.top + this.paddingInternal.bottom);

    renderTextLines(
      this.paddingInternal.top,
      this.paddingInternal.left,
      lines,
      this.context,
    );
    this.texture.needsUpdate = true;
  }
}
