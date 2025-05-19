import { CanvasTexture, FrontSide, Mesh, MeshBasicMaterial } from "three";
import { UILayer } from "../Layers/UILayer";
import { applyMicroTransformations } from "../Miscellaneous/microTransformationTools";
import {
  addElementSymbol,
  heightSymbol,
  readMicroSymbol,
  readVariablesSymbol,
  removeElementSymbol,
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
import {
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
  protected readonly object: Mesh;

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private texture: CanvasTexture;
  private size: UITextSize;
  private padding: UITextPadding;
  private lastSuggestedAspect = 0;

  public constructor(
    layer: UILayer,
    spans: (UITextSpan | string)[],
    parameters: Partial<UITextParameters> = {},
  ) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

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

    super(layer, 0, 0, textBlockSize.width, textBlockSize.height);

    this.size = textBlockSize;
    this.padding = resolvePadding(parameters.padding);

    canvas.width = textBlockSize.width + this.padding.left + this.padding.right;
    canvas.height =
      textBlockSize.height + this.padding.top + this.padding.bottom;

    this.canvas = canvas;
    this.context = context;

    this.texture = new CanvasTexture(this.canvas);

    const material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: FrontSide,
    });

    this.object = new Mesh(geometry, material);
    this.layer[addElementSymbol](this, this.object);

    renderTextLines(
      this.padding.top,
      this.padding.left,
      wrappedLines,
      this.context,
    );
    this.texture.needsUpdate = true;
    this[readVariablesSymbol]();
  }

  public destroy(): void {
    super.destroy();
    this.layer[removeElementSymbol](this, this.object);
    this.texture.dispose();
  }

  public [readVariablesSymbol](): void {
    applyMicroTransformations(
      this.object,
      this.micro,
      this.x,
      this.y,
      this.width,
      this.height,
    );

    const currentAspect = this.width / this.height;
    if (this.lastSuggestedAspect !== currentAspect) {
      this.lastSuggestedAspect = currentAspect;
      const targetAspect =
        (this.size.width + this.padding.left + this.padding.right) /
        (this.size.height + this.padding.top + this.padding.bottom);
      this.layer[suggestVariableSymbol](
        this[heightSymbol],
        this.width / targetAspect,
      );
    }
  }

  public [readMicroSymbol](): void {
    this[readVariablesSymbol]();
  }
}
