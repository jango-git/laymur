import type { FerrsignView1 } from "ferrsign";
import { Ferrsign1 } from "ferrsign";
import type { Camera, Vector2, WebGLRenderer } from "three";
import { MathUtils, Ray, Vector3 } from "three";

import { assertValidNumber } from "../../miscellaneous/asserts.js";
import type { UIResizePolicy } from "../../miscellaneous/resize-policy/UIResizePolicy.js";
import { isUIModeInteractive } from "../../miscellaneous/UIMode.js";
import type { UIViewport } from "../../miscellaneous/viewport/UIViewport.js";
import { UIWindowViewport } from "../../miscellaneous/viewport/UIWindowViewport.js";
import { UILayer } from "../UILayer/UILayer.js";
import type {
  UIViewportLayerInputEventData,
  UIViewportLayerOptions,
} from "./UIViewportLayer.Internal.js";
import { VIEWPORT_LAYER_DEFAULT_RESIZE_POLICY } from "./UIViewportLayer.Internal.js";

const TEMP_RAY_NEAR = new Vector3();
const TEMP_RAY_FAR = new Vector3();

/**
 * Layer covering a part of the page given by its viewport, the whole window by default. Follows
 * the viewport size through the resize policy and takes pointer input from the window, relative
 * to the viewport.
 */
export class UIViewportLayer extends UILayer {
  private readonly viewportInternal: UIViewport;
  private readonly ownsViewport: boolean;
  private resizePolicyInternal: UIResizePolicy;
  /** Policy version the layer was last sized by; -1 forces a resize */
  private appliedPolicyVersion: number;

  /** Pointers the layer cancelled while pressed: their late release is not reported */
  private readonly abandonedPointers = new Set<number>();

  private readonly signalPointerPressedInternal = new Ferrsign1<UIViewportLayerInputEventData>();
  private readonly signalPointerMovedInternal = new Ferrsign1<UIViewportLayerInputEventData>();
  private readonly signalPointerReleasedInternal = new Ferrsign1<UIViewportLayerInputEventData>();
  private readonly signalPointerCancelledInternal = new Ferrsign1<UIViewportLayerInputEventData>();

  constructor(options?: Partial<UIViewportLayerOptions>) {
    const resizePolicy = options?.resizePolicy ?? VIEWPORT_LAYER_DEFAULT_RESIZE_POLICY;
    const viewport = options?.viewport ?? new UIWindowViewport();
    if (viewport.destroyed) {
      throw new Error("UIViewportLayer.constructor.options.viewport: viewport is destroyed");
    }

    // A viewport not laid out yet has no size: the layer starts with the default one and
    // resizes once the viewport gets its size
    const hasSize = viewport.width > 0 && viewport.height > 0;
    const scale = hasSize ? resizePolicy.calculateScale(viewport.width, viewport.height) : 1;

    super({
      ...(hasSize ? { width: viewport.width * scale, height: viewport.height * scale } : {}),
      ...options,
    });

    this.viewportInternal = viewport;
    this.ownsViewport = options?.viewport === undefined;
    this.resizePolicyInternal = resizePolicy;
    this.appliedPolicyVersion = hasSize ? resizePolicy.version : -1;
    viewport.signalResized.on(this.onResize);
    window.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerCancel);
    window.addEventListener("blur", this.onFocusLost);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  /** Part of the page the layer covers */
  public get viewport(): UIViewport {
    return this.viewportInternal;
  }

  /** Current resize policy */
  public get resizePolicy(): UIResizePolicy {
    return this.resizePolicyInternal;
  }

  /** Signal fired when pointer is pressed */
  public get signalPointerPressed(): FerrsignView1<UIViewportLayerInputEventData> {
    return this.signalPointerPressedInternal;
  }

  /** Signal fired when pointer is moved */
  public get signalPointerMoved(): FerrsignView1<UIViewportLayerInputEventData> {
    return this.signalPointerMovedInternal;
  }

  /** Signal fired when pointer is released */
  public get signalPointerReleased(): FerrsignView1<UIViewportLayerInputEventData> {
    return this.signalPointerReleasedInternal;
  }

  /**
   * Signal fired when a pressed pointer is cancelled and no release follows: by the browser (a
   * system gesture, scrolling, a popup), or by the layer when the page is hidden or the window
   * loses focus, since the browser may then never report the release. The position is the last
   * known one and may be meaningless.
   */
  public get signalPointerCancelled(): FerrsignView1<UIViewportLayerInputEventData> {
    return this.signalPointerCancelledInternal;
  }

  /** Updates resize policy */
  public set resizePolicy(value: UIResizePolicy) {
    if (this.resizePolicyInternal !== value) {
      this.resizePolicyInternal = value;
      this.appliedPolicyVersion = -1;
    }
  }

  /**
   * Removes event listeners and destroys the layer with its elements and constraints. The
   * viewport is destroyed too, unless it was passed in the options.
   */
  public override destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.viewportInternal.signalResized.off(this.onResize);
    if (this.ownsViewport) {
      this.viewportInternal.destroy();
    }
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerCancel);
    window.removeEventListener("blur", this.onFocusLost);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.abandonedPointers.clear();
    super.destroy();
  }

  /**
   * Renders layer and all visible elements
   * @param renderer Three.js WebGL renderer
   * @param deltaTime Time since last frame in seconds
   */
  public render(renderer: WebGLRenderer, deltaTime: number): void {
    assertValidNumber(deltaTime, "UIViewportLayer.render.deltaTime");
    if (this.destroyed) {
      return;
    }
    if (this.resizePolicy.version !== this.appliedPolicyVersion) {
      this.onResize();
    }
    super.renderInternal(renderer, deltaTime);
  }

  /**
   * Projects 3D world position to 2D layer coordinates
   * @param position World position
   * @param camera Three.js camera
   * @param result Reusable vector instance
   * @returns Layer coordinates
   */
  public projectWorldPosition(position: Vector3, camera: Camera, result = new Vector3()): Vector3 {
    result.copy(position).project(camera);
    result.x = MathUtils.mapLinear(result.x, -1, 1, this.x, this.oppositeX);
    result.y = MathUtils.mapLinear(result.y, -1, 1, this.y, this.oppositeY);
    return result;
  }

  /**
   * Projects 2D layer coordinates to 3D world position
   * @param position Layer coordinates
   * @param camera Three.js camera
   * @param z Depth coordinate
   * @param result Reusable vector instance
   * @returns World position
   */
  public projectLayerPosition(
    position: Vector2,
    camera: Camera,
    z = -1,
    result = new Vector3(),
  ): Vector3 {
    return result
      .set(
        MathUtils.mapLinear(position.x, this.x, this.oppositeX, -1, 1),
        MathUtils.mapLinear(position.y, this.y, this.oppositeY, -1, 1),
        z,
      )
      .unproject(camera);
  }

  /**
   * Builds ray from layer position through camera
   * @param position Layer coordinates
   * @param camera Three.js camera
   * @param result Reusable ray instance
   * @returns Ray from near to far plane
   */
  public buildRay(position: Vector2, camera: Camera, result = new Ray()): Ray {
    const near = this.projectLayerPosition(position, camera, -1, TEMP_RAY_NEAR);
    const far = this.projectLayerPosition(position, camera, 1, TEMP_RAY_FAR);
    return result.set(near, far.sub(near).normalize());
  }

  protected override reportPointerCancelledByLayer(x: number, y: number, identifier: number): void {
    this.abandonedPointers.add(identifier);
    this.signalPointerCancelledInternal.emit({ x, y, identifier, layer: this });
  }

  private readonly onResize = (): void => {
    const { width, height } = this.viewportInternal;
    if (width <= 0 || height <= 0) {
      // Hidden or not laid out: keep the last size until the viewport gets one. Input is
      // ignored meanwhile, so a press held now would never end
      this.cancelPointers();
      return;
    }
    const scale = this.resizePolicy.calculateScale(width, height);
    this.appliedPolicyVersion = this.resizePolicy.version;
    this.resizeInternal(width * scale, height * scale);
  };

  /**
   * The release of a pointer pressed when the page is hidden or the window loses focus is often
   * never reported, leaving it captured: such pointers are cancelled right away
   */
  private readonly onFocusLost = (): void => {
    this.cancelPointers();
  };

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.onFocusLost();
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.abandonedPointers.delete(event.pointerId);
    const position = this.reportPointer(event, this.signalPointerPressedInternal);
    if (position !== null) {
      this.inputWrapperInternal.onPointerDown(position.x, position.y, event.pointerId);
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    // A cancelled press stays cancelled until it ends: its moves would bring it back over the
    // elements, while its release is not reported. A move with no button down means the press
    // ended unseen, as when released outside the window
    if (this.abandonedPointers.has(event.pointerId)) {
      if (event.buttons !== 0) {
        return;
      }
      this.abandonedPointers.delete(event.pointerId);
    }
    const position = this.reportPointer(event, this.signalPointerMovedInternal);
    if (position !== null) {
      this.inputWrapperInternal.onPointerMove(position.x, position.y, event.pointerId);
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (this.abandonedPointers.delete(event.pointerId)) {
      return;
    }
    const position = this.reportPointer(event, this.signalPointerReleasedInternal);
    if (position !== null) {
      this.inputWrapperInternal.onPointerUp(position.x, position.y, event.pointerId);
    }
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    if (this.abandonedPointers.delete(event.pointerId)) {
      return;
    }
    if (this.reportPointer(event, this.signalPointerCancelledInternal) !== null) {
      this.inputWrapperInternal.onPointerCancel(event.pointerId);
    }
  };

  /**
   * Fires the layer signal of a window pointer event, if the layer takes input
   * @returns Position in layer coordinates, to pass on to the elements; null if ignored
   */
  private reportPointer(
    event: PointerEvent,
    signal: Ferrsign1<UIViewportLayerInputEventData>,
  ): { x: number; y: number } | null {
    // Relative to the viewport, not to event.target: an HTML element over the canvas (a store
    // button, an ad network overlay) would shift the position by its own offset
    const viewport = this.viewportInternal;
    if (viewport.width <= 0 || viewport.height <= 0 || !isUIModeInteractive(this.mode)) {
      return null;
    }
    // A new object: a signal handler may cause another pointer event before it is passed on
    const position = viewport.toLocal(event.clientX, event.clientY, { x: 0, y: 0 });
    // Reading the box may have resized the viewport
    if (viewport.width <= 0 || viewport.height <= 0) {
      return null;
    }
    position.x *= this.width / viewport.width;
    position.y *= this.height / viewport.height;
    signal.emit({ x: position.x, y: position.y, identifier: event.pointerId, layer: this });
    // A handler may have turned input off or destroyed the layer
    if (this.destroyed || !isUIModeInteractive(this.mode)) {
      return null;
    }
    return position;
  }
}
