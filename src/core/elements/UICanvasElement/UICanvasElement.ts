import type { WebGLRenderer } from "three";

import type { UILayer } from "../../layers/UILayer/UILayer.js";
import type { UICanvasRenderingContext2D } from "../../miscellaneous/canvas.js";
import {
  calculateRasterScale,
  UICanvasSurface,
} from "../../miscellaneous/canvas-surface/UICanvasSurface.js";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import { UIColor } from "../../miscellaneous/color/UIColor.js";
import { UIAffineMatrix3 } from "../../miscellaneous/UIAffineMatrix3.js";
import source from "../../shaders/UIImage.js";
import type { UIElementOptions } from "../UIElement/UIElement.Internal.js";
import { UIElement } from "../UIElement/UIElement.js";

/**
 * Element showing content drawn on a canvas. The content is drawn in content units and
 * rasterized at the size the element takes on the screen, so it stays sharp when constraints
 * enlarge the element and on high-DPI screens. The canvas is drawn again when the content changes
 * or when the needed raster scale crosses a step. Micro transforms and the tint do not redraw it.
 */
export abstract class UICanvasElement extends UIElement {
  /** Canvas the content is drawn on, also usable for measuring between drawings */
  protected readonly surface: UICanvasSurface;

  private readonly colorInternal: UIColor;
  /** Raster scale the canvas holds, NaN before the first drawing */
  private rasterScale = Number.NaN;
  /** Pixel density of the layer the raster scale was calculated for */
  private rasterPixelDensity = Number.NaN;

  /** Width of the content in content units */
  protected abstract readonly contentWidth: number;
  /** Height of the content in content units */
  protected abstract readonly contentHeight: number;

  /**
   * @param layer - Layer containing this element
   * @param subject - Name of the subclass constructor, used in errors
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    subject: string,
    options?: Partial<UIElementOptions> & { color?: UIColorConfig },
  ) {
    const surface = new UICanvasSurface(subject);
    const color = new UIColor(options?.color);

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

    this.surface = surface;
    this.colorInternal = color;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public set color(value: UIColorConfig) {
    this.colorInternal.set(value);
  }

  /** Frees the canvas texture */
  protected override destroyInternal(): void {
    this.surface.dispose();
    super.destroyInternal();
  }

  protected override onWillRender(renderer: WebGLRenderer, deltaTime: number): void {
    const layoutChanged = this.consumeLayoutChange();
    const contentChanged = this.updateContent(layoutChanged);
    const pixelDensity = this.layer.pixelDensity;

    if (contentChanged || layoutChanged || pixelDensity !== this.rasterPixelDensity) {
      this.rasterPixelDensity = pixelDensity;
      const width = this.contentWidth;
      const height = this.contentHeight;
      const rasterScale = calculateRasterScale(
        width,
        height,
        pixelDensity * Math.max(this.width / width, this.height / height),
      );
      if (contentChanged || rasterScale !== this.rasterScale) {
        this.rasterScale = rasterScale;
        const textureReplaced = this.surface.begin(width, height, rasterScale);
        this.drawContent(this.surface.context);
        if (textureReplaced) {
          this.sceneWrapper.setProperties(this.planeHandler, { texture: this.surface.texture });
        }
      }
    }

    if (this.colorInternal.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, { color: this.colorInternal });
      this.colorInternal.setDirtyFalse();
    }

    super.onWillRender(renderer, deltaTime);
  }

  /**
   * Brings the content up to date before a frame.
   * @param layoutChanged - Whether the solver changed the layout since the last frame
   * @returns True when the content changed and has to be drawn again
   */
  protected abstract updateContent(layoutChanged: boolean): boolean;

  /**
   * Draws the content on the cleared canvas. The context transform maps content units onto the
   * canvas.
   * @param context - Canvas context
   */
  protected abstract drawContent(context: UICanvasRenderingContext2D): void;
}
