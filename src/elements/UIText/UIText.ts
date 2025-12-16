import type { WebGLRenderer } from "three";
import { CanvasTexture, Matrix3 } from "three";
import type { UILayer } from "../../layers/UILayer";
import { UIColor } from "../../miscellaneous/color/UIColor";
import { UIPadding } from "../../miscellaneous/padding/UIPadding";
import { UITextSpan } from "../../miscellaneous/text-span/UITextSpan";
import { UITextStyle } from "../../miscellaneous/text-style/UITextStyle";
import source from "../../shaders/UIImage.glsl";
import { UIElement } from "../UIElement";
import type { UITextChunk, UITextContent } from "./UIText.Interfaces";
import type { UITextOptions } from "./UIText.Internal";
import {
  TEXT_DEFAULT_MAX_LINE_WIDTH,
  TEXT_DEFAULT_RESIZE_MODE,
  UITextResizeMode,
} from "./UIText.Internal";
import {
  buildTextChunks,
  calculateTextContentParameters,
} from "./UIText.Measuring";
import { renderTextLines } from "./UIText.Rendering";

/** Canvas-based text rendering element */
export class UIText extends UIElement {
  /** Multiplicative tint. Alpha channel controls opacity. */
  public readonly color: UIColor;
  /** Text padding in world units */
  public readonly padding: UIPadding;
  /** Default style applied to all text spans */
  public readonly commonStyle: UITextStyle;

  private readonly canvas: OffscreenCanvas;
  private readonly context: OffscreenCanvasRenderingContext2D;
  private texture: CanvasTexture;

  private contentInternal: UITextSpan[] = [];
  private contentDirty = false;

  private maxLineWidthInternal: number;
  private maxLineWidthDirty = false;

  private resizeModeInternal: UITextResizeMode;
  private resizeModeDirty = false;

  private lastWidth: number;
  private lastHeight: number;

  private textChunks: UITextChunk[] = [];
  private textChunksDirty = false;

  /**
   * Creates a new UIText instance.
   *
   * @param layer - Layer containing this element
   * @param content - Text content as string or styled spans
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    content: UITextContent,
    options: Partial<UITextOptions> = {},
  ) {
    const canvas = new OffscreenCanvas(2, 2);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("UIText.constructor: failed to create canvas context");
    }

    const texture = new CanvasTexture(canvas);
    const color = new UIColor(options.color);

    super(layer, source, {
      texture: texture,
      textureTransform: new Matrix3(),
      color,
    });

    this.color = color;
    this.padding = new UIPadding(options.padding);
    this.commonStyle = new UITextStyle(options.commonStyle);
    this.maxLineWidthInternal =
      options.maxLineWidth ?? TEXT_DEFAULT_MAX_LINE_WIDTH;
    this.resizeModeInternal = options.resizeMode ?? TEXT_DEFAULT_RESIZE_MODE;

    this.canvas = canvas;
    this.context = context;
    this.texture = texture;
    this.content = content;

    this.lastWidth = this.width;
    this.lastHeight = this.height;

    if (options.padding === undefined) {
      this.padding.setUnified(
        this.content.reduce(
          (a, b) => Math.max(a, b.style.calculatePadding()),
          this.commonStyle.calculatePadding(),
        ),
      );
    }

    switch (this.resizeModeInternal) {
      case UITextResizeMode.SCALE:
        this.tryToRenderTextScaleMode();
        break;

      case UITextResizeMode.BREAK:
        this.tryToRenderTextBreakMode();
        break;
    }
  }

  /** Text content as array of styled spans */
  public get content(): UITextSpan[] {
    return this.contentInternal;
  }

  /** Maximum line width before wrapping in pixels */
  public get maxLineWidth(): number {
    return this.maxLineWidthInternal;
  }

  /** Controls how text adapts to element size */
  public get resizeMode(): UITextResizeMode {
    return this.resizeModeInternal;
  }

  /** Text content as string, span config, or array */
  public set content(value: UITextContent) {
    if (this.contentInternal !== value) {
      if (typeof value === "string") {
        this.contentInternal = [
          new UITextSpan({ text: value, style: new UITextStyle() }),
        ];
      } else if (Array.isArray(value)) {
        this.contentInternal = value.map((span) =>
          typeof span === "string"
            ? new UITextSpan({ text: span, style: new UITextStyle() })
            : new UITextSpan({
                text: span.text,
                style: new UITextStyle(span.style),
              }),
        );
      } else {
        this.contentInternal = [
          new UITextSpan({
            text: value.text,
            style: new UITextStyle(value.style),
          }),
        ];
      }
      this.contentDirty = true;
      this.textChunksDirty = true;
    }
  }

  /** Maximum line width before wrapping in pixels */
  public set maxLineWidth(value: number) {
    if (this.maxLineWidthInternal !== value) {
      this.maxLineWidthInternal = value;
      this.maxLineWidthDirty = true;
    }
  }

  /** Controls how text adapts to size constraints */
  public set resizeMode(value: UITextResizeMode) {
    if (this.resizeModeInternal !== value) {
      this.resizeModeInternal = value;
      this.resizeModeDirty = true;
    }
  }

  /** Removes element and frees resources */
  public override destroy(): void {
    this.texture.dispose();
    super.destroy();
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (this.color.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, { color: this.color });
      this.color.setDirtyFalse();
    }

    switch (this.resizeModeInternal) {
      case UITextResizeMode.SCALE:
        this.tryToRenderTextScaleMode();
        break;

      case UITextResizeMode.BREAK:
        this.tryToRenderTextBreakMode();
        break;
    }

    super.onWillRender(renderer, deltaTime);
  }

  private tryToRenderTextScaleMode(): void {
    if (
      !this.resizeModeDirty &&
      !this.maxLineWidthDirty &&
      !this.padding.dirty &&
      !(
        this.solverWrapper.dirty &&
        this.lastWidth / this.lastHeight !==
          Math.round(this.width) / Math.round(this.height)
      ) &&
      !this.checkContentDirty()
    ) {
      return;
    }

    const textChunks = this.buildTextChunks();

    const { lines, size } = calculateTextContentParameters(
      textChunks,
      this.maxLineWidthInternal,
    );

    const paddingV = this.padding.top + this.padding.bottom;
    const paddingH = this.padding.left + this.padding.right;

    const desiredHeight = size.height + paddingV;
    const desiredWidth = size.width + paddingH;

    // Two calculation passes are required to cover both cases -
    // when the width is specified by a constraint and cannot be changed,
    // or when the height is specified by a constraint and cannot be changed,
    // but the width still has priority, because it is specified first and last.
    this.width = desiredWidth;
    this.height = (desiredHeight / desiredWidth) * Math.round(this.width);
    this.width = (desiredWidth / desiredHeight) * Math.round(this.height);

    const resolutionDirty =
      this.lastWidth !== desiredHeight || this.lastHeight !== desiredWidth;

    if (resolutionDirty) {
      this.canvas.height = desiredHeight;
      this.canvas.width = desiredWidth;
    }

    renderTextLines(this.padding.top, this.padding.left, lines, this.context);

    if (resolutionDirty) {
      this.rebuildTexture();
    }

    this.resizeModeDirty = false;
    this.maxLineWidthDirty = false;
    this.padding.setDirtyFalse();
    this.setDimensionsDirtyFalse();
    this.setContentDirtyFalse();
  }

  private tryToRenderTextBreakMode(): void {
    if (
      !this.resizeModeDirty &&
      !this.maxLineWidthDirty &&
      !this.padding.dirty &&
      !this.checkDimensionsDirty() &&
      !this.checkContentDirty()
    ) {
      return;
    }

    const textChunks = this.buildTextChunks();

    // Two passes of text size calculation are needed to first
    // suggest the desired sizes to the solver, and then
    // adjust our expectations based on the result obtained.

    const { size: desiredTextSize } = calculateTextContentParameters(
      textChunks,
      this.maxLineWidthInternal,
    );

    const paddingV = this.padding.top + this.padding.bottom;
    const paddingH = this.padding.left + this.padding.right;

    this.height = desiredTextSize.height + paddingV;
    this.width = desiredTextSize.width + paddingH; // Width should remain a priority, so it is set last.

    const { lines: realTextLines, size: realTextSize } =
      calculateTextContentParameters(
        textChunks,
        Math.round(this.width) - paddingH,
      );

    this.height = realTextSize.height + paddingV;
    this.width = realTextSize.width + paddingH;

    const safeWidth = Math.max(Math.round(this.width), 2);
    const safeHeight = Math.max(Math.round(this.height), 2);

    const resolutionDirty =
      this.lastWidth !== safeWidth || this.lastHeight !== safeHeight;

    if (resolutionDirty) {
      this.canvas.width = safeWidth;
      this.canvas.height = safeHeight;
    }

    renderTextLines(
      this.padding.top,
      this.padding.left,
      realTextLines,
      this.context,
    );

    if (resolutionDirty) {
      this.rebuildTexture();
    }

    this.resizeModeDirty = false;
    this.maxLineWidthDirty = false;
    this.padding.setDirtyFalse();
    this.setDimensionsDirtyFalse();
    this.setContentDirtyFalse();
  }

  private rebuildTexture(): void {
    this.texture.dispose();
    this.texture = new CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;
    this.sceneWrapper.setProperties(this.planeHandler, {
      texture: this.texture,
    });
  }

  private buildTextChunks(): UITextChunk[] {
    if (this.textChunksDirty) {
      this.textChunks = buildTextChunks(
        this.context,
        this.contentInternal,
        this.commonStyle,
      );
      this.textChunksDirty = false;
    }

    return this.textChunks;
  }

  private checkDimensionsDirty(): boolean {
    return (
      this.solverWrapper.dirty &&
      (this.lastWidth !== Math.round(this.width) ||
        this.lastHeight !== Math.round(this.height))
    );
  }

  private setDimensionsDirtyFalse(): void {
    this.lastWidth = Math.round(this.width);
    this.lastHeight = Math.round(this.height);
  }

  private checkContentDirty(): boolean {
    return (
      this.contentDirty || this.content.some((span): boolean => span.dirty)
    );
  }

  private setContentDirtyFalse(): void {
    this.contentDirty = false;
    for (const span of this.content) {
      span.setDirtyFalse();
    }
  }
}
