import type { WebGLRenderer } from "three";
import { CanvasTexture } from "three";
import { type UILayer } from "../layers/UILayer";
import type { UITextContent } from "../miscellaneous/textInterfaces";
import {
  calculateTextContentParameters,
  renderTextLines,
} from "../miscellaneous/textTools";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import {
  resolveTextPadding,
  type UITextPadding,
} from "../miscellaneous/UITextPadding";
import { type UITextStyle } from "../miscellaneous/UITextStyle";
import source from "../shaders/UIDefaultShader.glsl";
import { UIElement } from "./UIElement";

/** Default maximum width for text elements in pixels. */
const DEFAULT_MAX_WIDTH = 1024;

/**
 * Configuration options for UIText element creation.
 *
 * @public
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
  padding: Partial<UITextPadding>;
  /** Common style properties applied to all text content. */
  commonStyle: Partial<UITextStyle>;
}

/**
 * UI element that renders text using canvas-based rendering.
 *
 * Renders text content to an HTML5 Canvas and displays it as a texture.
 * Supports basic text formatting, wrapping, padding, and resizing based
 * on content.
 *
 * @public
 */
export class UIText extends UIElement {
  /** @internal */
  private readonly canvas: OffscreenCanvas;

  /** @internal */
  private readonly context: OffscreenCanvasRenderingContext2D;

  /** @internal */
  private readonly texture: CanvasTexture;

  /** @internal */
  private readonly colorInternal: UIColor;

  /** @internal */
  private contentInternal: UITextContent;

  /** @internal */
  private maxWidthInternal: number;

  /** @internal */
  private paddingInternal: UITextPadding;

  /** @internal */
  private commonStyleInternal: Partial<UITextStyle>;

  /** @internal */
  private targetAspectRatio = 1;

  /** @internal */
  private lastAspectRatio = 1;

  /**
   * Creates a UIText element.
   *
   * Automatically sizes itself based on content. Creates a canvas for rendering
   * text, which is then used as a texture.
   *
   * @param layer - UI layer to contain this element
   * @param content - Text content to display
   * @param options - Configuration options
   * @throws Error when canvas context creation fails
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
      map: texture,
      color,
    });

    this.canvas = canvas;
    this.context = context;
    this.texture = texture;
    this.colorInternal = color;

    this.contentInternal = content;
    this.maxWidthInternal = options.maxWidth ?? DEFAULT_MAX_WIDTH;
    this.paddingInternal = resolveTextPadding(options.padding);
    this.commonStyleInternal = options.commonStyle ?? {};

    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);
    this.rebuildText();
  }

  /**
   * Gets the color tint.
   *
   * @returns Color tint
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Gets the text content.
   *
   * @returns Current text content
   */
  public get content(): UITextContent {
    return this.contentInternal;
  }

  /**
   * Gets the maximum width before text wrapping.
   *
   * @returns Maximum width in pixels
   */
  public get maxWidth(): number {
    return this.maxWidthInternal;
  }

  /**
   * Gets the padding configuration.
   *
   * @returns Padding configuration for all sides
   */
  public get padding(): UITextPadding {
    return this.paddingInternal;
  }

  /**
   * Gets the common style properties.
   *
   * @returns Partial text style configuration
   */
  public get commonStyle(): Partial<UITextStyle> {
    return this.commonStyleInternal;
  }

  /**
   * Sets the color tint.
   *
   * @param value - Color tint
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Sets the text content and triggers a rebuild.
   *
   * @param value - New text content
   */
  public set content(value: UITextContent) {
    this.contentInternal = value;
    this.rebuildText();
  }

  /**
   * Sets the maximum width and triggers a rebuild.
   *
   * @param value - New maximum width in pixels
   */
  public set maxWidth(value: number) {
    this.maxWidthInternal = value;
    this.rebuildText();
  }

  /**
   * Sets the padding configuration and triggers a rebuild.
   *
   * @param value - New padding configuration
   */
  public set padding(value: UITextPadding) {
    this.paddingInternal = value;
    this.rebuildText();
  }

  /**
   * Sets the common style properties and triggers a rebuild.
   *
   * @param value - New partial text style configuration
   */
  public set commonStyle(value: Partial<UITextStyle>) {
    this.commonStyleInternal = value;
    this.rebuildText();
  }

  /**
   * Destroys the element and cleans up resources.
   */
  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    this.texture.dispose();
    super.destroy();
  }

  /**
   * Maintains proper text aspect ratio before rendering.
   *
   * @param renderer - WebGL renderer
   * @param deltaTime - Time since last frame
   * @internal
   */
  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    super.onWillRender(renderer, deltaTime);
    if (this.lastAspectRatio !== this.width / this.height) {
      this.lastAspectRatio = this.targetAspectRatio;
      this.height = this.width / this.targetAspectRatio;
    }
  }

  /**
   * Rebuilds the text canvas and texture based on current settings.
   *
   * @internal
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

  /** @internal */
  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };
}
