import type { WebGLRenderer } from "three";
import { CanvasTexture, Mesh } from "three";
import type { UILayer } from "../layers/UILayer";
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

const DEFAULT_MAX_WIDTH = 1024;

export interface UITextOptions {
  maxWidth: number;
  padding: Partial<UITextPadding>;
  commonStyle: Partial<UITextStyle>;
}

export class UIText extends UIElement<Mesh> {
  private readonly material: UIMaterial;
  private readonly texture: CanvasTexture;

  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private contentInternal: UITextContent;
  private maxWidthInternal: number;
  private paddingInternal: UITextPadding;
  private commonStyleInternal: Partial<UITextStyle>;

  private targetAspectRatio = 1;
  private lastAspectRatio = 1;

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

    const texture = new CanvasTexture(canvas);
    const material = new UIMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, x, y, 2, 2, object);

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

  public get maxWidth(): number {
    return this.maxWidthInternal;
  }

  public get padding(): UITextPadding {
    return this.paddingInternal;
  }

  public get commonStyle(): Partial<UITextStyle> {
    return this.commonStyleInternal;
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
    this.contentInternal = value;
    this.rebuildText();
  }

  public set maxWidth(value: number) {
    this.maxWidthInternal = value;
    this.rebuildText();
  }

  public set padding(value: UITextPadding) {
    this.paddingInternal = value;
    this.rebuildText();
  }

  public set commonStyle(value: Partial<UITextStyle>) {
    this.commonStyleInternal = value;
    this.rebuildText();
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
