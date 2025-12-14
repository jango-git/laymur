import type { WebGLRenderer } from "three";
import { CanvasTexture, Matrix3 } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import { UIPadding } from "../miscellaneous/padding/UIPadding";
import { UITextSpan } from "../miscellaneous/text-span/UITextSpan";
import { UITextStyle } from "../miscellaneous/text-style/UITextStyle";
import type { UITextContent } from "../miscellaneous/UIText.Interfaces";

import { calculateTextContentParameters } from "../miscellaneous/UIText.Measuring";
import { renderTextLines } from "../miscellaneous/UIText.Rendering";
import source from "../shaders/UIImage.glsl";
import { UIElement } from "./UIElement";
import { TEXT_DEFAULT_WIDTH, type UITextOptions } from "./UIText.Internal";

export class UIText extends UIElement {
  public readonly color: UIColor;
  public readonly padding: UIPadding;
  public readonly commonStyle: UITextStyle;

  private readonly canvas: OffscreenCanvas;
  private readonly context: OffscreenCanvasRenderingContext2D;
  private texture: CanvasTexture;
  private contentInternal: UITextSpan[] = [];

  private targetAspectRatio = 1;
  private dirty = false;

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
    const color = new UIColor(options.color);

    options.width = options.width ?? TEXT_DEFAULT_WIDTH;

    super(layer, source, {
      texture: texture,
      textureTransform: new Matrix3(),
      color,
    });

    this.color = color;
    this.padding = new UIPadding(options.padding);
    this.commonStyle = new UITextStyle(options.commonStyle);

    this.canvas = canvas;
    this.context = context;
    this.texture = texture;
    this.content = content;
  }

  /**
   * Gets the current text content being displayed.
   * @returns The current text content structure
   */
  public get content(): UITextSpan[] {
    return this.contentInternal;
  }

  /**
   * Sets new text content and triggers a rebuild.
   * @param value - The new text content structure
   */
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
      this.dirty = true;
    }
  }

  /**
   * Destroys the text element by cleaning up all associated resources.
   *
   * This method disposes of the texture resources and calls the parent destroy method
   * to clean up the underlying UI element. After calling this method,
   * the text element should not be used anymore.
   */
  public override destroy(): void {
    this.texture.dispose();
    super.destroy();
  }

  /**
   * Called before each render frame to maintain proper text aspect ratio.
   * Adjusts the height based on the target aspect ratio calculated from text content.
   * @param renderer - The WebGL renderer
   * @param deltaTime - Time since last frame in seconds
   */
  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (this.color.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        color: this.color,
      });
      this.color.setDirtyFalse();
    }

    const aspectRatio = this.width / this.height;
    if (aspectRatio !== this.targetAspectRatio || this.dirty) {
      const { lines } = calculateTextContentParameters(
        this.context,
        this.content,
        this.commonStyle,
        this.width - this.padding.left - this.padding.right,
      );

      this.canvas.width = Math.max(this.width, 2);
      this.canvas.height = Math.max(this.height, 2);

      renderTextLines(this.padding.top, this.padding.left, lines, this.context);

      this.texture.dispose();
      this.texture = new CanvasTexture(this.canvas);
      this.texture.needsUpdate = true;
      this.sceneWrapper.setProperties(this.planeHandler, {
        texture: this.texture,
      });

      this.targetAspectRatio = aspectRatio;
    }
    super.onWillRender(renderer, deltaTime);
  }
}
