import type { FerrsignView1 } from "ferrsign";
import { Ferrsign1 } from "ferrsign";
import type { WebGLRenderer } from "three";

import type { UILayer } from "../../layers/UILayer/UILayer.js";
import {
  calculateRasterScale,
  UICanvasSurface,
} from "../../miscellaneous/canvas-surface/UICanvasSurface.js";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import { UIColor } from "../../miscellaneous/color/UIColor.js";
import type { UIInsetsConfig } from "../../miscellaneous/insets/UIInsets.Internal.js";
import { UIInsets } from "../../miscellaneous/insets/UIInsets.js";
import type { UIContentAspectElement } from "../../miscellaneous/shared.js";
import { UITextSpan } from "../../miscellaneous/text-span/UITextSpan.js";
import { UITextStyle } from "../../miscellaneous/text-style/UITextStyle.js";
import { UIAffineMatrix3 } from "../../miscellaneous/UIAffineMatrix3.js";
import source from "../../shaders/UIImage.js";
import { UIElement } from "../UIElement/UIElement.js";
import { detectIsRTL } from "./UIText.Bidi.js";
import type { UITextChunk, UITextContent, UITextLine, UITextSize } from "./UIText.Interfaces.js";
import type { UITextLineBox, UITextOptions } from "./UIText.Internal.js";
import {
  TEXT_DEFAULT_DIRECTION,
  TEXT_DEFAULT_LINE_BOX,
  TEXT_DEFAULT_MAX_LINE_WIDTH,
  TEXT_DEFAULT_RESIZE_MODE,
  UITextDirection,
  UITextResizeMode,
} from "./UIText.Internal.js";
import { buildTextChunks, calculateTextContentParameters } from "./UIText.Measuring.js";
import { renderTextLines } from "./UIText.Rendering.js";

/** Smallest width and height of the element, kept by empty and whitespace-only text */
const TEXT_MIN_DIMENSION = 1;

/**
 * Canvas-based text rendering element. The text is laid out in pixels of its style and drawn at
 * the size the element takes on the screen, so it stays sharp when constraints enlarge it and on
 * high-DPI screens. Micro transforms do not redraw it.
 */
export class UIText extends UIElement implements UIContentAspectElement {
  /** Default style applied to all text spans */
  public readonly commonStyle: UITextStyle;

  private readonly colorInternal: UIColor;
  private readonly paddingInternal: UIInsets;
  private autoPaddingInternal: boolean;
  /** Padding last set by auto padding; any other value means it was changed by hand */
  private lastAutoPadding = 0;
  private readonly surface: UICanvasSurface;

  private contentInternal: UITextSpan[] = [];
  private contentDirty = false;

  private maxLineWidthInternal: number;
  private maxLineWidthDirty = false;

  private resizeModeInternal: UITextResizeMode;
  private resizeModeDirty = false;

  private directionInternal: UITextDirection;
  private directionDirty = false;
  private isRTL = false;

  private lineBoxInternal: UITextLineBox;
  private lineBoxDirty = false;

  private lastWidth: number;
  private lastHeight: number;

  private textChunks: UITextChunk[] = [];
  private textLines: UITextLine[] = [];
  /** Size of the laid out text with its padding, in pixels of the style */
  private contentWidth = TEXT_MIN_DIMENSION;
  private contentHeight = TEXT_MIN_DIMENSION;
  private contentAspectInternal = 1;
  private readonly signalContentAspectChangedInternal = new Ferrsign1<number>();

  /** Raster scale the canvas holds, NaN before the first drawing */
  private rasterScale = Number.NaN;
  private rasterPixelDensity = Number.NaN;

  /**
   * Creates a new UIText instance.
   *
   * @param layer - Layer containing this element
   * @param content - Text content as string or styled spans
   * @param options - Configuration options
   */
  constructor(layer: UILayer, content: UITextContent, options: Partial<UITextOptions> = {}) {
    const surface = new UICanvasSurface("UIText.constructor");
    const color = new UIColor(options.color);

    super(
      layer,
      source,
      {
        texture: surface.texture,
        textureTransform: new UIAffineMatrix3(),
        color,
      },
      options,
    );

    this.colorInternal = color;
    this.paddingInternal = new UIInsets(options.padding);
    this.autoPaddingInternal = options.padding === undefined;
    this.commonStyle = new UITextStyle(options.commonStyle);
    this.maxLineWidthInternal = options.maxLineWidth ?? TEXT_DEFAULT_MAX_LINE_WIDTH;
    this.resizeModeInternal = options.resizeMode ?? TEXT_DEFAULT_RESIZE_MODE;
    this.directionInternal = options.direction ?? TEXT_DEFAULT_DIRECTION;
    this.lineBoxInternal = options.lineBox ?? TEXT_DEFAULT_LINE_BOX;

    this.surface = surface;
    this.content = content;

    this.lastWidth = this.width;
    this.lastHeight = this.height;

    this.layout(false);
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /** Text content as array of styled spans */
  public get content(): UITextSpan[] {
    return this.contentInternal;
  }

  /** Maximum line width before wrapping in pixels */
  public get maxLineWidth(): number {
    return this.maxLineWidthInternal;
  }

  /** Text padding in world units */
  public get padding(): UIInsets {
    return this.paddingInternal;
  }

  /**
   * Whether the padding follows the outlines and shadows of the styles. On by default, off once
   * the padding is set by hand.
   */
  public get autoPadding(): boolean {
    return this.autoPaddingInternal;
  }

  /** Controls how text adapts to element size */
  public get resizeMode(): UITextResizeMode {
    return this.resizeModeInternal;
  }

  /** Base direction used for bidirectional text reordering */
  public get direction(): UITextDirection {
    return this.directionInternal;
  }

  /** What sets the height of a line */
  public get lineBox(): UITextLineBox {
    return this.lineBoxInternal;
  }

  /**
   * Aspect of the text laid out at `maxLineWidth` with its padding. A `UIAspectConstraint`
   * created without an aspect follows it as the text changes.
   */
  public get contentAspect(): number {
    return this.contentAspectInternal;
  }

  /** Signal fired with the new aspect when the content aspect changes */
  public get signalContentAspectChanged(): FerrsignView1<number> {
    return this.signalContentAspectChangedInternal;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public set color(value: UIColorConfig) {
    this.colorInternal.set(value);
  }

  /**
   * Text content as string, span config, or array. Text without visible characters keeps the
   * element at least 1 world unit wide and high.
   */
  public set content(value: UITextContent) {
    if (this.contentInternal !== value) {
      if (typeof value === "string") {
        this.contentInternal = [new UITextSpan({ text: value, style: new UITextStyle() })];
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
    }
  }

  /** Maximum line width before wrapping in pixels */
  public set maxLineWidth(value: number) {
    if (this.maxLineWidthInternal !== value) {
      this.maxLineWidthInternal = value;
      this.maxLineWidthDirty = true;
    }
  }

  /** Text padding in world units. Turns auto padding off. */
  public set padding(value: UIInsetsConfig) {
    this.autoPaddingInternal = false;
    this.paddingInternal.set(value);
  }

  /**
   * Whether the padding follows the outlines and shadows of the styles. On by default, off once
   * the padding is set by hand.
   */
  public set autoPadding(value: boolean) {
    if (this.autoPaddingInternal !== value) {
      this.autoPaddingInternal = value;
      if (value) {
        this.lastAutoPadding = Number.NaN;
        this.updateAutoPadding();
      }
    }
  }

  /** Controls how text adapts to size constraints */
  public set resizeMode(value: UITextResizeMode) {
    if (this.resizeModeInternal !== value) {
      this.resizeModeInternal = value;
      this.resizeModeDirty = true;
    }
  }

  /** Base direction used for bidirectional text reordering */
  public set direction(value: UITextDirection) {
    if (this.directionInternal !== value) {
      this.directionInternal = value;
      this.directionDirty = true;
    }
  }

  /** What sets the height of a line */
  public set lineBox(value: UITextLineBox) {
    if (this.lineBoxInternal !== value) {
      this.lineBoxInternal = value;
      this.lineBoxDirty = true;
    }
  }

  /** Frees resources of the text */
  protected override destroyInternal(): void {
    this.surface.dispose();
    super.destroyInternal();
  }

  protected override onWillRender(renderer: WebGLRenderer, deltaTime: number): void {
    const layoutChanged = this.consumeLayoutChange();
    const laidOut = this.layout(layoutChanged);
    const pixelDensity = this.layer.pixelDensity;

    if (laidOut || layoutChanged || pixelDensity !== this.rasterPixelDensity) {
      this.rasterPixelDensity = pixelDensity;
      const rasterScale = calculateRasterScale(
        this.contentWidth,
        this.contentHeight,
        pixelDensity * Math.max(this.width / this.contentWidth, this.height / this.contentHeight),
      );
      if (laidOut || rasterScale !== this.rasterScale) {
        this.rasterScale = rasterScale;
        this.draw();
      }
    }

    if (this.colorInternal.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, { color: this.colorInternal });
      this.colorInternal.setDirtyFalse();
    }

    super.onWillRender(renderer, deltaTime);
  }

  /**
   * Lays the text out again when anything it depends on changed.
   * @param layoutChanged Whether the solver changed the layout since the last call
   * @returns True when the text was laid out again
   */
  private layout(layoutChanged: boolean): boolean {
    if (this.checkContentDirty()) {
      this.updateAutoPadding();
    }

    const laidOut =
      this.resizeModeInternal === UITextResizeMode.SCALE
        ? this.layoutScaleMode(layoutChanged)
        : this.layoutBreakMode(layoutChanged);

    if (laidOut) {
      this.resizeModeDirty = false;
      this.directionDirty = false;
      this.maxLineWidthDirty = false;
      this.lineBoxDirty = false;
      this.paddingInternal.setDirtyFalse();
      this.setDimensionsDirtyFalse();
      this.setContentDirtyFalse();
    }

    return laidOut;
  }

  private layoutScaleMode(layoutChanged: boolean): boolean {
    if (
      !this.resizeModeDirty &&
      !this.directionDirty &&
      !this.maxLineWidthDirty &&
      !this.lineBoxDirty &&
      !this.paddingInternal.dirty &&
      !(
        layoutChanged &&
        this.lastWidth / this.lastHeight !== Math.round(this.width) / Math.round(this.height)
      ) &&
      !this.checkContentDirty()
    ) {
      return false;
    }

    const textChunks = this.buildTextChunks();

    const { lines, size } = calculateTextContentParameters(
      textChunks,
      this.maxLineWidthInternal,
      this.isRTL,
    );

    const { width: desiredWidth, height: desiredHeight } = this.elementSize(size);
    this.updateContentAspect(desiredWidth / desiredHeight);

    this.width = desiredWidth;
    this.height = (desiredHeight / desiredWidth) * Math.round(this.width);
    this.width = (desiredWidth / desiredHeight) * Math.round(this.height);

    this.setContent(lines, desiredWidth, desiredHeight);
    return true;
  }

  private layoutBreakMode(layoutChanged: boolean): boolean {
    if (
      !this.resizeModeDirty &&
      !this.directionDirty &&
      !this.maxLineWidthDirty &&
      !this.lineBoxDirty &&
      !this.paddingInternal.dirty &&
      !(
        layoutChanged &&
        (this.lastWidth !== Math.round(this.width) || this.lastHeight !== Math.round(this.height))
      ) &&
      !this.checkContentDirty()
    ) {
      return false;
    }

    const textChunks = this.buildTextChunks();

    const { size: desiredTextSize } = calculateTextContentParameters(
      textChunks,
      this.maxLineWidthInternal,
      this.isRTL,
    );

    const desiredSize = this.elementSize(desiredTextSize);
    this.updateContentAspect(desiredSize.width / desiredSize.height);
    this.height = desiredSize.height;
    this.width = desiredSize.width;

    const { lines: realTextLines, size: realTextSize } = calculateTextContentParameters(
      textChunks,
      Math.round(this.width) - this.paddingInternal.left - this.paddingInternal.right,
      this.isRTL,
    );

    const realSize = this.elementSize(realTextSize);
    this.height = realSize.height;
    this.width = realSize.width;

    this.setContent(realTextLines, this.width, this.height);
    return true;
  }

  /**
   * Reports a new content aspect. Called before the element suggests its size, so constraints
   * following the aspect are updated by then.
   * @param aspect Aspect of the text laid out at `maxLineWidth`
   */
  private updateContentAspect(aspect: number): void {
    if (aspect !== this.contentAspectInternal) {
      this.contentAspectInternal = aspect;
      this.signalContentAspectChangedInternal.emit(aspect);
    }
  }

  /**
   * Keeps the result of a layout.
   * @param lines Laid out lines
   * @param width Width of the content with its padding in pixels
   * @param height Height of the content with its padding in pixels
   */
  private setContent(lines: UITextLine[], width: number, height: number): void {
    this.textLines = lines;
    this.contentWidth = Math.max(Math.round(width), TEXT_MIN_DIMENSION);
    this.contentHeight = Math.max(Math.round(height), TEXT_MIN_DIMENSION);
  }

  /** Draws the laid out text at the current raster scale */
  private draw(): void {
    const textureReplaced = this.surface.begin(
      this.contentWidth,
      this.contentHeight,
      this.rasterScale,
    );

    renderTextLines(
      this.surface.context,
      this.textLines,
      this.isRTL,
      this.paddingInternal.top,
      this.paddingInternal.left,
      { x: this.surface.scaleX, y: this.surface.scaleY },
    );

    if (textureReplaced) {
      this.sceneWrapper.setProperties(this.planeHandler, { texture: this.surface.texture });
    }
  }

  /** The element size for a text size: the padding added, at least the minimum each way */
  private elementSize(textSize: UITextSize): UITextSize {
    const { left, right, top, bottom } = this.paddingInternal;
    return {
      width: Math.max(textSize.width + left + right, TEXT_MIN_DIMENSION),
      height: Math.max(textSize.height + top + bottom, TEXT_MIN_DIMENSION),
    };
  }

  private updateAutoPadding(): void {
    if (!this.autoPaddingInternal) {
      return;
    }

    const { left, right, top, bottom } = this.paddingInternal;
    const last = this.lastAutoPadding;
    if (
      !Number.isNaN(last) &&
      (left !== last || right !== last || top !== last || bottom !== last)
    ) {
      this.autoPaddingInternal = false;
      return;
    }

    const padding = this.content.reduce(
      (result, span) => Math.max(result, span.style.calculatePadding(this.commonStyle)),
      this.commonStyle.calculatePadding(),
    );
    this.paddingInternal.setUnified(padding);
    this.lastAutoPadding = padding;
  }

  private buildTextChunks(): UITextChunk[] {
    if (this.directionDirty || this.lineBoxDirty || this.checkContentDirty()) {
      this.isRTL =
        this.directionInternal === UITextDirection.AUTO
          ? detectIsRTL(this.contentInternal)
          : this.directionInternal === UITextDirection.RTL;

      this.textChunks = buildTextChunks(
        this.surface.context,
        this.contentInternal,
        this.commonStyle,
        this.isRTL,
        this.lineBoxInternal,
      );
    }

    return this.textChunks;
  }

  private setDimensionsDirtyFalse(): void {
    this.lastWidth = Math.round(this.width);
    this.lastHeight = Math.round(this.height);
  }

  private checkContentDirty(): boolean {
    return (
      this.contentDirty ||
      this.commonStyle.dirty ||
      this.content.some((span): boolean => span.dirty)
    );
  }

  private setContentDirtyFalse(): void {
    this.contentDirty = false;
    this.commonStyle.setDirtyFalse();
    for (const span of this.content) {
      span.setDirtyFalse();
    }
  }
}
