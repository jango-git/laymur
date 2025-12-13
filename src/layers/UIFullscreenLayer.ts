import type { Vector2 } from "three";
import { MathUtils, Vector3, type Camera, type WebGLRenderer } from "three";
import { assertValidNumber } from "../miscellaneous/asserts";
import type { UIResizePolicy } from "../miscellaneous/resize-policy/UIResizePolicy";
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
  /**
   * Creates a fullscreen layer and sets up window event listeners.
   */
  constructor(
    public resizePolicy: UIResizePolicy = new UIResizePolicyNone(),
    mode: UIMode = UIMode.VISIBLE,
  ) {
    const scale = resizePolicy.calculateScale(
      window.innerWidth,
      window.innerHeight,
    );
    super(window.innerWidth * scale, window.innerHeight * scale, mode);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
  }

  /**
   * Removes window event listeners. The layer should not be used after this.
   */
  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
  }

  /**
   * Renders the layer.
   *
   * @param renderer - WebGL renderer
   * @param deltaTime - Time since last frame in seconds
   */
  public render(renderer: WebGLRenderer, deltaTime: number): void {
    assertValidNumber(deltaTime, "UIFullscreenLayer.render.deltaTime");
    if (this.resizePolicy.dirty) {
      this.resizePolicy.dirty = false;
      this.onResize();
    }
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
    const scale = this.resizePolicy.calculateScale(
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

    const scale = this.resizePolicy.calculateScale(
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
