import type { FerrsignView0 } from "ferrsign";
import { Ferrsign0 } from "ferrsign";
import type { WebGLRenderer } from "three";

const MONITORS = new WeakMap<WebGLRenderer, UIContextMonitor>();

/**
 * Tracks whether the WebGL context of a renderer is lost. One monitor per renderer, shared by
 * every layer drawn with it.
 *
 * The renderer subscribes to the canvas events in its constructor, before any monitor exists, so
 * by the time `signalRestored` fires the renderer has already recreated its GL state. Resources
 * that live on the GPU only, such as render target contents, still have to be redrawn.
 *
 * The listeners stay on the canvas for its lifetime: the monitor holds no reference to the
 * renderer and is collected together with the canvas.
 * @internal
 */
export class UIContextMonitor {
  private lostInternal: boolean;
  private readonly signalLostInternal = new Ferrsign0();
  private readonly signalRestoredInternal = new Ferrsign0();

  private constructor(renderer: WebGLRenderer) {
    this.lostInternal = renderer.getContext().isContextLost();
    renderer.domElement.addEventListener("webglcontextlost", this.onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", this.onContextRestored);
  }

  /** Whether the context is lost: nothing drawn until it is restored */
  public get lost(): boolean {
    return this.lostInternal;
  }

  /** Signal fired when the context is lost */
  public get signalLost(): FerrsignView0 {
    return this.signalLostInternal;
  }

  /** Signal fired when the context is restored, after the renderer has recreated its GL state */
  public get signalRestored(): FerrsignView0 {
    return this.signalRestoredInternal;
  }

  /**
   * Monitor of the renderer, created on first request.
   * @param renderer Renderer to monitor
   * @returns The monitor shared by all users of the renderer
   */
  public static for(renderer: WebGLRenderer): UIContextMonitor {
    let monitor = MONITORS.get(renderer);
    if (monitor === undefined) {
      monitor = new UIContextMonitor(renderer);
      MONITORS.set(renderer, monitor);
    }
    return monitor;
  }

  private readonly onContextLost = (): void => {
    if (!this.lostInternal) {
      this.lostInternal = true;
      this.signalLostInternal.emit();
    }
  };

  private readonly onContextRestored = (): void => {
    if (this.lostInternal) {
      this.lostInternal = false;
      this.signalRestoredInternal.emit();
    }
  };
}
