import type { CanvasTexture, WebGLRenderer } from "three";
import { Matrix3 } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer.js";
import type { UICanvas, UICanvasRenderingContext2D } from "../../miscellaneous/canvas.js";
import { createCanvas, createCanvasTexture } from "../../miscellaneous/canvas.js";
import { UIColor } from "../../miscellaneous/color/UIColor.js";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared.js";
import { UIInsets } from "../../miscellaneous/insets/UIInsets.js";
import type { UIInsetsConfig } from "../../miscellaneous/insets/UIInsets.Internal.js";
import { UITextSpan } from "../../miscellaneous/text-span/UITextSpan.js";
import { UITextStyle } from "../../miscellaneous/text-style/UITextStyle.js";
import source from "../../shaders/UIImage.js";
import { UIElement } from "../UIElement/UIElement.js";
import { detectIsRTL } from "./UIText.Bidi.js";
import type { UITextChunk, UITextContent } from "./UIText.Interfaces.js";
import type { UITextOptions } from "./UIText.Internal.js";
import {
  TEXT_DEFAULT_DIRECTION,
  TEXT_DEFAULT_MAX_LINE_WIDTH,
  TEXT_DEFAULT_RESIZE_MODE,
  UITextDirection,
  UITextResizeMode,
} from "./UIText.Internal.js";
import { buildTextChunks, calculateTextContentParameters } from "./UIText.Measuring.js";
import { renderTextLines } from "./UIText.Rendering.js";

/** Canvas-based text rendering element */
export class UIText extends UIElement {
  /** Default style applied to all text spans */
  public readonly commonStyle: UITextStyle;

  private readonly colorInternal: UIColor;
  private readonly paddingInternal: UIInsets;
  private autoPaddingInternal: boolean;
  /** Padding last set by auto padding; any other value means it was changed by hand */
  private lastAutoPadding = 0;
  private readonly canvas: UICanvas;
  private readonly context: UICanvasRenderingContext2D;
  private texture: CanvasTexture;

  private contentInternal: UITextSpan[] = [];
  private contentDirty = false;

  private maxLineWidthInternal: number;
  private maxLineWidthDirty = false;

  private resizeModeInternal: UITextResizeMode;
  private resizeModeDirty = false;

  private directionInternal: UITextDirection;
  private directionDirty = false;
  private isRTL = false;

  private lastWidth: number;
  private lastHeight: number;

  private textChunks: UITextChunk[] = [];

  /**
   * Creates a new UIText instance.
   *
   * @param layer - Layer containing this element
   * @param content - Text content as string or styled spans
   * @param options - Configuration options
   */
  constructor(layer: UILayer, content: UITextContent, options: Partial<UITextOptions> = {}) {
    const canvas = createCanvas(2, 2);
    const context = canvas.getContext("2d") as UICanvasRenderingContext2D | null;

    if (!context) {
      throw new Error("UIText.constructor: failed to create canvas context");
    }

    const texture = createCanvasTexture(canvas);
    texture.needsUpdate = true;
    const color = new UIColor(options.color);

    super(
      layer,
      source,
      {
        texture: texture,
        textureTransform: new Matrix3(),
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

    this.canvas = canvas;
    this.context = context;
    this.texture = texture;
    this.content = content;

    this.lastWidth = this.width;
    this.lastHeight = this.height;

    this.updateAutoPadding();

    switch (this.resizeModeInternal) {
      case UITextResizeMode.SCALE:
        this.tryToRenderTextScaleMode();
        break;

      case UITextResizeMode.BREAK:
        this.tryToRenderTextBreakMode();
        break;
    }
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
   * Whether the padding follows the stroke and shadow of the styles. On by default, off once
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

  /** Multiplicative tint. Alpha channel controls opacity. */
  public set color(value: UIColorConfig) {
    this.colorInternal.set(value);
  }

  /** Text content as string, span config, or array */
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
   * Whether the padding follows the stroke and shadow of the styles. On by default, off once
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

  /** Frees resources of the text */
  protected override destroyInternal(): void {
    this.texture.dispose();
    super.destroyInternal();
  }

  protected override onWillRender(renderer: WebGLRenderer, deltaTime: number): void {
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
    if (this.checkContentDirty()) {
      this.updateAutoPadding();
    }

    if (
      !this.colorInternal.dirty &&
      !this.resizeModeDirty &&
      !this.directionDirty &&
      !this.maxLineWidthDirty &&
      !this.paddingInternal.dirty &&
      !(
        this.solverWrapper.dirty &&
        this.lastWidth / this.lastHeight !== Math.round(this.width) / Math.round(this.height)
      ) &&
      !this.checkContentDirty()
    ) {
      return;
    }

    const textChunks = this.buildTextChunks();

    const { lines, size } = calculateTextContentParameters(
      textChunks,
      this.maxLineWidthInternal,
      this.isRTL,
    );

    const paddingV = this.paddingInternal.top + this.paddingInternal.bottom;
    const paddingH = this.paddingInternal.left + this.paddingInternal.right;

    const desiredHeight = size.height + paddingV;
    const desiredWidth = size.width + paddingH;

    this.width = desiredWidth;
    this.height = (desiredHeight / desiredWidth) * Math.round(this.width);
    this.width = (desiredWidth / desiredHeight) * Math.round(this.height);

    const safeWidth = Math.max(Math.round(desiredWidth), 2);
    const safeHeight = Math.max(Math.round(desiredHeight), 2);

    const resolutionDirty = this.canvas.width !== safeWidth || this.canvas.height !== safeHeight;

    if (resolutionDirty) {
      this.canvas.width = safeWidth;
      this.canvas.height = safeHeight;
    }

    renderTextLines(
      this.paddingInternal.top,
      this.paddingInternal.left,
      lines,
      this.isRTL,
      this.context,
    );

    this.updateProperties(resolutionDirty);

    this.resizeModeDirty = false;
    this.directionDirty = false;
    this.maxLineWidthDirty = false;
    this.paddingInternal.setDirtyFalse();
    this.setDimensionsDirtyFalse();
    this.setContentDirtyFalse();
  }

  private tryToRenderTextBreakMode(): void {
    if (this.checkContentDirty()) {
      this.updateAutoPadding();
    }

    if (
      !this.colorInternal.dirty &&
      !this.resizeModeDirty &&
      !this.directionDirty &&
      !this.maxLineWidthDirty &&
      !this.paddingInternal.dirty &&
      !this.checkDimensionsDirty() &&
      !this.checkContentDirty()
    ) {
      return;
    }

    const textChunks = this.buildTextChunks();

    const { size: desiredTextSize } = calculateTextContentParameters(
      textChunks,
      this.maxLineWidthInternal,
      this.isRTL,
    );

    const paddingV = this.paddingInternal.top + this.paddingInternal.bottom;
    const paddingH = this.paddingInternal.left + this.paddingInternal.right;

    this.height = desiredTextSize.height + paddingV;
    this.width = desiredTextSize.width + paddingH;

    const { lines: realTextLines, size: realTextSize } = calculateTextContentParameters(
      textChunks,
      Math.round(this.width) - paddingH,
      this.isRTL,
    );

    this.height = realTextSize.height + paddingV;
    this.width = realTextSize.width + paddingH;

    const safeWidth = Math.max(Math.round(this.width), 2);
    const safeHeight = Math.max(Math.round(this.height), 2);

    const resolutionDirty = this.canvas.width !== safeWidth || this.canvas.height !== safeHeight;

    if (resolutionDirty) {
      this.canvas.width = safeWidth;
      this.canvas.height = safeHeight;
    }

    renderTextLines(
      this.paddingInternal.top,
      this.paddingInternal.left,
      realTextLines,
      this.isRTL,
      this.context,
    );

    this.updateProperties(resolutionDirty);

    this.resizeModeDirty = false;
    this.directionDirty = false;
    this.maxLineWidthDirty = false;
    this.paddingInternal.setDirtyFalse();
    this.setDimensionsDirtyFalse();
    this.setContentDirtyFalse();
  }

  private updateProperties(resolutionDirty: boolean): void {
    let properties: Record<string, UIProperty> | undefined;

    if (this.colorInternal.dirty) {
      properties ??= {};
      properties["color"] = this.colorInternal;
      this.colorInternal.setDirtyFalse();
    }

    if (resolutionDirty) {
      this.texture.dispose();
      this.texture = createCanvasTexture(this.canvas);

      properties ??= {};
      properties["texture"] = this.texture;
    }

    this.texture.needsUpdate = true;

    if (properties) {
      this.sceneWrapper.setProperties(this.planeHandler, properties);
    }
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
    if (this.directionDirty || this.checkContentDirty()) {
      this.isRTL =
        this.directionInternal === UITextDirection.AUTO
          ? detectIsRTL(this.contentInternal)
          : this.directionInternal === UITextDirection.RTL;

      this.textChunks = buildTextChunks(
        this.context,
        this.contentInternal,
        this.commonStyle,
        this.isRTL,
      );
    }

    return this.textChunks;
  }

  private checkDimensionsDirty(): boolean {
    return (
      this.solverWrapper.dirty &&
      (this.lastWidth !== Math.round(this.width) || this.lastHeight !== Math.round(this.height))
    );
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
