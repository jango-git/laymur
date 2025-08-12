import type { WebGLRenderer } from "three";
import { CanvasTexture, Mesh } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIMaterial } from "../materials/UIMaterial";
import type {
  UITextContent,
  UITextSize,
} from "../miscellaneous/textInterfaces";
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

const DEFAULT_MAX_LINE_WIDTH = 1024;

export interface UITextOptions {
  maxLineWidth: number;
  padding: Partial<UITextPadding>;
  commonStyle: Partial<UITextStyle>;
}

export class UIText extends UIElement<Mesh> {
  private readonly material: UIMaterial;
  private readonly texture: CanvasTexture;

  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private readonly contentInternal: UITextContent;
  private readonly textSize: UITextSize;
  private readonly padding: UITextPadding;
  private readonly maxLineWidth: number;
  private readonly commonStyle: Partial<UITextStyle>;

  private readonly targetAspectRatio: number = 0;
  private lastAspectRatio = 0;

  constructor(
    layer: UILayer,
    content: UITextContent,
    options: Partial<UITextOptions> = {},
    x = 0,
    y = 0,
  ) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create canvas context");
    }

    const maxLineWidth = options.maxLineWidth ?? DEFAULT_MAX_LINE_WIDTH;
    const commonStyle = options.commonStyle ?? {};

    const { lines, size } = calculateTextContentParameters(
      context,
      content,
      maxLineWidth,
      commonStyle,
    );

    const padding = resolvePadding(options.padding);
    canvas.width = size.width + padding.left + padding.right;
    canvas.height = size.height + padding.top + padding.bottom;

    const texture = new CanvasTexture(canvas);
    const material = new UIMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, x, y, size.width, size.height, object);

    this.material = material;
    this.texture = texture;

    this.canvas = canvas;
    this.context = context;

    this.contentInternal = content;
    this.textSize = size;
    this.padding = padding;
    this.maxLineWidth = maxLineWidth;
    this.commonStyle = commonStyle;

    this.targetAspectRatio =
      (this.textSize.width + this.padding.left + this.padding.right) /
      (this.textSize.height + this.padding.top + this.padding.bottom);

    renderTextLines(this.padding.top, this.padding.left, lines, this.context);
    this.texture.needsUpdate = true;
  }

  public get color(): number {
    return this.material.getColor();
  }

  public get opacity(): number {
    return this.material.getOpacity();
  }

  public get transparency(): boolean {
    return this.material.getTransparency();
  }

  public get content(): UITextContent {
    return this.contentInternal;
  }

  public set color(value: number) {
    this.material.setColor(value);
  }

  public set opacity(value: number) {
    this.material.setOpacity(value);
  }

  public set transparency(value: boolean) {
    this.material.setTransparency(value);
  }

  public set content(value: UITextContent) {
    const { lines, size } = calculateTextContentParameters(
      this.context,
      value,
      this.maxLineWidth,
      this.commonStyle,
    );

    this.canvas.width = size.width + this.padding.left + this.padding.right;
    this.canvas.height = size.height + this.padding.top + this.padding.bottom;

    renderTextLines(this.padding.top, this.padding.left, lines, this.context);
    this.texture.needsUpdate = true;
  }

  public override destroy(): void {
    this.material.dispose();
    this.texture.dispose();
    this.canvas.remove();
    super.destroy();
  }

  protected override ["onBeforeRenderInternal"](
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter required by parent
    renderer: WebGLRenderer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter required by parent
    deltaTime: number,
  ): void {
    if (this.lastAspectRatio !== this.width / this.height) {
      this.lastAspectRatio = this.targetAspectRatio;
      this.height = this.width / this.targetAspectRatio;
    }
  }
}
