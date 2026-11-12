import { UIViewport } from "./UIViewport.js";

/**
 * An element of the page, usually the canvas of the renderer: for a canvas that does not fill
 * the window, such as an editor preview or a canvas with page margins. The size follows the
 * element's box as laid out, including CSS transforms.
 */
export class UIElementViewport extends UIViewport {
  private readonly elementInternal: Element;
  private readonly observer: ResizeObserver;
  private widthInternal: number;
  private heightInternal: number;

  /**
   * @param element Element whose box the viewport follows
   */
  constructor(element: Element) {
    super();
    this.elementInternal = element;

    const rect = element.getBoundingClientRect();
    this.widthInternal = rect.width;
    this.heightInternal = rect.height;

    this.observer = new ResizeObserver(this.onResize);
    this.observer.observe(element);
  }

  /** Element the viewport follows */
  public get element(): Element {
    return this.elementInternal;
  }

  public get width(): number {
    return this.widthInternal;
  }

  public get height(): number {
    return this.heightInternal;
  }

  /**
   * The box is read on every call: the element may move without resizing, as on scroll, or
   * change size through a CSS transform, which the resize observer does not report
   */
  public toLocal<T extends { x: number; y: number }>(
    clientX: number,
    clientY: number,
    result: T,
  ): T {
    const rect = this.elementInternal.getBoundingClientRect();
    this.applySize(rect);
    result.x = clientX - rect.left;
    result.y = rect.bottom - clientY;
    return result;
  }

  protected destroyInternal(): void {
    this.observer.disconnect();
  }

  private readonly onResize = (): void => {
    this.applySize(this.elementInternal.getBoundingClientRect());
  };

  private applySize(rect: DOMRect): void {
    if (rect.width !== this.widthInternal || rect.height !== this.heightInternal) {
      this.widthInternal = rect.width;
      this.heightInternal = rect.height;
      this.signalResizedInternal.emit();
    }
  }
}
