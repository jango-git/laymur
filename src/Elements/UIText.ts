import { CanvasTexture, FrontSide, Mesh, MeshBasicMaterial } from "three";
import { UILayer } from "../Layers/UILayer";
import { applyMicroTransformations } from "../Miscellaneous/microTransformationTools";
import {
  addElement,
  hSymbol,
  layerSymbol,
  readMicroSymbol,
  readVariablesSymbol,
  removeElement,
  suggestVariable,
} from "../Miscellaneous/symbols";
import {
  calculateTextBlockSize,
  measureTextChunk,
  resolvePadding,
  resolveTextStyle,
  splitText,
  wrapTextLines,
} from "../Miscellaneous/textTools";
import { geometry } from "../Miscellaneous/threeInstances";
import {
  UIMicroTransformable,
  UIMicroTransformations,
} from "../Miscellaneous/UIMicroTransformations";
import { UIElement } from "./UIElement";
import {
  UITextChunk,
  UITextLine,
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

export class UIText extends UIElement implements UIMicroTransformable {
  private readonly micro: UIMicroTransformations;

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private readonly object: Mesh;
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
    this.micro = new UIMicroTransformations(this);

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
    this[layerSymbol][addElement](this, this.object);

    this.renderTextLines(wrappedLines);
    this[readVariablesSymbol]();
  }

  public get zIndex(): number {
    return this.object.position.z;
  }

  public set zIndex(value: number) {
    this.object.position.z = value;
  }

  public destroy(): void {
    this[layerSymbol][removeElement](this, this.object);
    this.texture.dispose();
  }

  [readVariablesSymbol](): void {
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
      this[layerSymbol][suggestVariable](
        this[hSymbol],
        this.width / targetAspect,
      );
    }
  }

  [readMicroSymbol](): void {
    this[readVariablesSymbol]();
  }

  private renderText(
    x: number,
    y: number,
    text: string,
    style: UITextStyle,
  ): void {
    this.context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;

    if (style.enableShadow) {
      this.context.shadowOffsetX = style.shadowOffsetX;
      this.context.shadowOffsetY = style.shadowOffsetY;
      this.context.shadowBlur = style.shadowBlur;
      this.context.shadowColor = style.shadowColor;
    }

    if (style.enableStroke) {
      this.context.strokeStyle = style.strokeColor;
      this.context.lineWidth = style.strokeWidth;
      this.context.strokeText(text, x, y);
    }

    this.context.fillStyle = style.color;
    this.context.fillText(text, x, y);
  }

  private renderTextLines(lines: UITextLine[]): void {
    let currentY = this.padding.top;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let currentX = this.padding.left;
      currentY += i === 0 ? line.height : line.lineHeight;

      for (const chunk of line.chunks) {
        this.renderText(currentX, currentY, chunk.text, chunk.style);
        currentX += chunk.metrics.width;
      }
    }

    this.texture.needsUpdate = true;
  }
}
