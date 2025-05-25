import type { WebGLRenderer } from "three";
import { CanvasTexture, Mesh } from "three";
import { UIMaterial } from "../Effects/UIMaterial";
import type { UILayer } from "../Layers/UILayer";
import {
  heightSymbol,
  renderSymbol,
  suggestVariableSymbol,
} from "../Miscellaneous/symbols";
import {
  calculateTextBlockSize,
  measureTextChunk,
  renderTextLines,
  resolvePadding,
  resolveTextStyle,
  splitText,
  wrapTextLines,
} from "../Miscellaneous/textTools";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";
import type {
  UITextChunk,
  UITextPadding,
  UITextSize,
  UITextSpan,
  UITextStyle,
} from "./UITextInterfaces";
export interface UITextParameters {
  maxWidth: number;
  padding: Partial<UITextPadding>;
  defaultStyle: Partial<UITextStyle>;
}

export class UIText extends UIElement {
  private readonly material: UIMaterial;
  private readonly texture: CanvasTexture;

  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private readonly textBlockSize: UITextSize;
  private readonly padding: UITextPadding;
  private lastSuggestedAspect = 0;

  constructor(
    layer: UILayer,
    spans: (UITextSpan | string)[],
    parameters: Partial<UITextParameters> = {},
  ) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create canvas context");
    }

    const chunks: UITextChunk[] = [];

    for (const span of spans) {
      const isSpanString = typeof span === "string";
      const spanText = isSpanString ? span : span.text;
      const style = resolveTextStyle(
        isSpanString ? undefined : span.style,
        parameters.defaultStyle,
      );

      for (const text of splitText(spanText)) {
        const metrics = measureTextChunk(context, text, style);
        chunks.push({ text, style, metrics });
      }
    }

    const wrappedLines = wrapTextLines(parameters.maxWidth ?? 1024, chunks);
    const textBlockSize = calculateTextBlockSize(wrappedLines);

    const padding = resolvePadding(parameters.padding);

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
    this.flushTransform();
  }

  public override destroy(): void {
    this.material.dispose();
    this.texture.dispose();
    this.canvas.remove();
    super.destroy();
  }

  public override flushTransform(): void {
    super.flushTransform();

    const currentAspect = this.width / this.height;
    if (this.lastSuggestedAspect !== currentAspect) {
      this.lastSuggestedAspect = currentAspect;

      const targetAspect =
        (this.textBlockSize.width + this.padding.left + this.padding.right) /
        (this.textBlockSize.height + this.padding.top + this.padding.bottom);

      this.layer[suggestVariableSymbol](
        this,
        this[heightSymbol],
        this.width / targetAspect,
      );
    }
  }

  public [renderSymbol](renderer: WebGLRenderer): void {
    this.flushTransform();
    this.material.map = this.composer.render(renderer, this.texture);
  }
}
