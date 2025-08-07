import type { WebGLRenderer } from "three";
import { CanvasTexture, Mesh } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIMaterial } from "../materials/UIMaterial";
import {
  calculateTextBlockSize,
  measureTextChunk,
  renderTextLines,
  resolvePadding,
  resolveTextStyle,
  splitText,
  wrapTextLines,
} from "../miscellaneous/textTools";
import { geometry } from "../miscellaneous/threeInstances";
import type {
  UITextChunk,
  UITextPadding,
  UITextSize,
  UITextSpan,
  UITextStyle,
} from "../miscellaneous/UITextInterfaces";
import { UIElement } from "./UIElement";

/**
 * Options for customizing the UIText element.
 */
export interface UITextOptions {
  /** Maximum width of the text block before wrapping occurs */
  maxWidth: number;
  /** Padding around the text */
  padding: Partial<UITextPadding>;
  /** Default style to apply to text spans that don't specify their own style */
  defaultStyle: Partial<UITextStyle>;
}

/** Default maximum line width for text if not otherwise specified */
const DEFAULT_LINE_SIZE = 1024;

/**
 * A UI element that displays formatted text.
 * Renders text to a canvas and displays it as a texture on a mesh.
 */
export class UIText extends UIElement {
  /** Material used to render the text */
  private readonly material: UIMaterial;
  /** Texture containing the rendered text */
  private readonly texture: CanvasTexture;

  /** Canvas element used to render the text */
  private readonly canvas: HTMLCanvasElement;
  /** 2D rendering context for the canvas */
  private readonly context: CanvasRenderingContext2D;

  /** Size of the text block without padding */
  private readonly textBlockSize: UITextSize;
  /** Padding values applied around the text */
  private readonly padding: UITextPadding;
  /** Cached aspect ratio for performance optimization */
  private suggestedAspect = 0;

  /**
   * Creates a new text UI element.
   *
   * @param layer - The UI layer that contains this element
   * @param spans - Text content to display, either as a string, text span, or array of text spans/strings
   * @param options - Options to customize the text rendering
   * @throws Error if canvas context creation fails
   */
  constructor(
    layer: UILayer,
    spans: (UITextSpan | string)[] | UITextSpan | string,
    options: Partial<UITextOptions> = {},
  ) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create canvas context");
    }

    const chunks: UITextChunk[] = [];
    const processedSpans = Array.isArray(spans) ? spans : [spans];

    for (const span of processedSpans) {
      const isSpanString = typeof span === "string";
      const spanText = isSpanString ? span : span.text;
      const style = resolveTextStyle(
        isSpanString ? undefined : span.style,
        options.defaultStyle,
      );

      for (const text of splitText(spanText)) {
        const metrics = measureTextChunk(context, text, style);
        chunks.push({ text, style, metrics });
      }
    }

    const wrappedLines = wrapTextLines(
      options.maxWidth ?? DEFAULT_LINE_SIZE,
      chunks,
    );
    const textBlockSize = calculateTextBlockSize(wrappedLines);

    const padding = resolvePadding(options.padding);

    canvas.width = textBlockSize.width + padding.left + padding.right;
    canvas.height = textBlockSize.height + padding.top + padding.bottom;

    const texture = new CanvasTexture(canvas);

    const material = new UIMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, object, 0, 0, textBlockSize.width, textBlockSize.height);

    this.material = material;
    this.texture = texture;

    this.canvas = canvas;
    this.context = context;

    this.textBlockSize = textBlockSize;
    this.padding = padding;

    renderTextLines(
      this.padding.top,
      this.padding.left,
      wrappedLines,
      this.context,
    );

    this.texture.needsUpdate = true;
    this.applyTransformations();
  }

  /** Gets the color tint applied to the text */
  public get color(): number {
    return this.material.getColor();
  }

  /** Gets the opacity of the text */
  public get opacity(): number {
    return this.material.getOpacity();
  }

  /**
   * Sets the color tint applied to the text
   * @param value - Color in hexadecimal format
   */
  public set color(value: number) {
    this.material.setColor(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the opacity of the text
   * @param value - Opacity value between 0 (transparent) and 1 (opaque)
   */
  public set opacity(value: number) {
    this.material.setOpacity(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Destroys the text element, disposing of all resources and removing it from the layer.
   * This should be called when the element is no longer needed.
   */
  public override destroy(): void {
    this.material.dispose();
    this.texture.dispose();
    this.canvas.remove();
    super.destroy();
  }

  /**
   * Applies transformations to the text element, ensuring the aspect ratio
   * matches the rendered text to prevent distortion.
   *
   * This overrides the base implementation to maintain the correct aspect ratio.
   */
  public override applyTransformations(): void {
    super.applyTransformations();

    const currentAspect = this.width / this.height;
    if (this.suggestedAspect !== currentAspect) {
      this.suggestedAspect = currentAspect;

      const targetAspect =
        (this.textBlockSize.width + this.padding.left + this.padding.right) /
        (this.textBlockSize.height + this.padding.top + this.padding.bottom);

      this.height = this.width / targetAspect;
    }
  }

  /**
   * Renders the text element.
   *
   * @param renderer - The WebGL renderer
   */
  protected override render(renderer: WebGLRenderer): void {
    (this.object as Mesh).material = this.composerInternal.compose(
      renderer,
      this.texture.image.width,
      this.texture.image.height,
      this.material,
    );
    this.applyTransformations();
  }
}
