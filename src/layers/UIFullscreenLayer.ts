import type { Vector2 } from "three";
import { MathUtils, Vector3, type Camera, type WebGLRenderer } from "three";
import { assertValidNumber } from "../miscellaneous/asserts";
import type { UIResizePolicy } from "../miscellaneous/resize-policy/UIResizePolicy";
import { UIResizePolicyEvent } from "../miscellaneous/resize-policy/UIResizePolicy";
import { UIResizePolicyNone } from "../miscellaneous/resize-policy/UIResizePolicyNone";
import { UIInputEvent } from "../miscellaneous/UIInputEvent";
import { UIMode } from "../miscellaneous/UIMode";
import { UILayer } from "./UILayer";

/**
 * UI layer that covers the full browser window.
 *
 * Handles window resize and pointer events automatically. Scaling is controlled
 * by the assigned resize policy.
 *
 * @see {@link UILayer}
 * @see {@link UIResizePolicy}
 */
export class UIFullscreenLayer extends UILayer {
  private resizePolicyInternal: UIResizePolicy;

  /**
   * Creates a fullscreen layer and sets up window event listeners.
   */
  constructor(
    resizePolicy: UIResizePolicy = new UIResizePolicyNone(),
    mode: UIMode = UIMode.VISIBLE,
  ) {
    super(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    this.mode = mode;
    this.resizePolicyInternal = resizePolicy;
    this.resizePolicyInternal.on(UIResizePolicyEvent.CHANGE, this.onResize);
    this.onResize();
  }

  /**
   * Gets the current resize policy.
   */
  public get resizePolicy(): UIResizePolicy {
    return this.resizePolicyInternal;
  }

  /**
   * Sets a new resize policy. Unsubscribes from old policy and subscribes to new one.
   */
  public set resizePolicy(value: UIResizePolicy) {
    if (this.resizePolicyInternal !== value) {
      this.resizePolicyInternal.off(UIResizePolicyEvent.CHANGE, this.onResize);
      this.resizePolicyInternal = value;
      this.resizePolicyInternal.on(UIResizePolicyEvent.CHANGE, this.onResize);
      this.onResize();
    }
  }

  /**
   * Removes window event listeners. The layer should not be used after this.
   */
  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    this.resizePolicyInternal.off(UIResizePolicyEvent.CHANGE, this.onResize);
  }

  /**
   * Renders the layer.
   *
   * @param renderer - WebGL renderer
   * @param deltaTime - Time since last frame in seconds
   */
  public render(renderer: WebGLRenderer, deltaTime: number): void {
    assertValidNumber(deltaTime, "UIFullscreenLayer.deltaTime");
    super.renderInternal(renderer, deltaTime);
  }

  /**
   * Projects 3D world position to 2D layer coordinates.
   *
   * @param position - 3D world position
   * @param camera - Camera for projection
   * @returns 2D position in layer space
   */
  public projectWorldPosition(position: Vector3, camera: Camera): Vector3 {
    const projectedPosition = position.clone().project(camera);
    projectedPosition.x = MathUtils.mapLinear(
      projectedPosition.x,
      -1,
      1,
      this.x,
      this.width,
    );
    projectedPosition.y = MathUtils.mapLinear(
      projectedPosition.y,
      -1,
      1,
      this.y,
      this.height,
    );
    return projectedPosition;
  }

  /**
   * Projects 2D layer position to 3D world coordinates.
   *
   * @param position - 2D position in layer space
   * @param camera - Camera for unprojection
   * @param z - z in NDC space (defaults to -1)
   * @returns 3D position in world space
   */
  public projectLayerPosition(
    position: Vector2,
    camera: Camera,
    z = -1,
  ): Vector3 {
    return new Vector3(
      MathUtils.mapLinear(position.x, this.x, this.width, -1, 1),
      MathUtils.mapLinear(position.y, this.y, this.height, -1, 1),
      z,
    ).unproject(camera);
  }

  /**
   * Handles window resize. Updates layer dimensions according to resize policy.
   */
  private readonly onResize = (): void => {
    const scale = this.resizePolicyInternal["calculateScaleInternal"](
      window.innerWidth,
      window.innerHeight,
    );
    this.resizeInternal(window.innerWidth * scale, window.innerHeight * scale);
  };

  private readonly onDown = (event: PointerEvent): void => {
    this.handleWindowInput(event, "onPointerDownInternal", UIInputEvent.DOWN);
  };

  private readonly onMove = (event: PointerEvent): void => {
    this.handleWindowInput(event, "onPointerMoveInternal", UIInputEvent.MOVE);
  };

  private readonly onUp = (event: PointerEvent): void => {
    this.handleWindowInput(event, "onPointerUpInternal", UIInputEvent.UP);
  };

  private handleWindowInput(
    event: PointerEvent,
    pointerFunctionName:
      | "onPointerDownInternal"
      | "onPointerMoveInternal"
      | "onPointerUpInternal",
    inputEvent: UIInputEvent,
  ): void {
    const rect =
      event.target instanceof HTMLElement
        ? event.target.getBoundingClientRect()
        : null;

    const x = rect ? event.clientX - rect.left : event.clientX;
    const y = rect
      ? rect.bottom - event.clientY
      : window.innerHeight - event.clientY;

    const scale = this.resizePolicyInternal["calculateScaleInternal"](
      window.innerWidth,
      window.innerHeight,
    );
    const scaledX = x * scale;
    const scaledY = y * scale;

    if (this.mode === UIMode.INTERACTIVE) {
      this.emit(inputEvent, scaledX, scaledY, event.pointerId);
    }

    this[pointerFunctionName](scaledX, scaledY, event.pointerId);
  }
}
