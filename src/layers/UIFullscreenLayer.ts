import type { Vector2, Camera, WebGLRenderer } from "three";
import { MathUtils, Ray, Vector3 } from "three";
import { assertValidNumber } from "../miscellaneous/asserts";
import type { UIResizePolicy } from "../miscellaneous/resize-policy/UIResizePolicy";
import { UIResizePolicyNone } from "../miscellaneous/resize-policy/UIResizePolicyNone";
import { UIInputEvent } from "../miscellaneous/UIInputEvent";
import { isUIModeInteractive, UIMode } from "../miscellaneous/UIMode";
import { UILayer } from "./UILayer";
import type { UILayerMode } from "./UILayer.Internal";

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
  private resizePolicyDirty = false;

  /**
   * Creates a fullscreen layer and sets up window event listeners.
   */
  constructor(
    resizePolicy: UIResizePolicy = new UIResizePolicyNone(),
    mode: UILayerMode = UIMode.VISIBLE,
  ) {
    const scale = resizePolicy.calculateScale(
      window.innerWidth,
      window.innerHeight,
    );
    super(window.innerWidth * scale, window.innerHeight * scale, mode);
    this.resizePolicyInternal = resizePolicy;
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  public get resizePolicy(): UIResizePolicy {
    return this.resizePolicyInternal;
  }

  public set resizePolicy(value: UIResizePolicy) {
    if (this.resizePolicyInternal !== value) {
      this.resizePolicyInternal = value;
      this.resizePolicyDirty = true;
    }
  }

  /**
   * Removes window event listeners. The layer should not be used after this.
   */
  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  /**
   * Renders the layer.
   *
   * @param renderer - WebGL renderer
   * @param deltaTime - Time since last frame in seconds
   */
  public render(renderer: WebGLRenderer, deltaTime: number): void {
    assertValidNumber(deltaTime, "UIFullscreenLayer.render.deltaTime");
    if (this.resizePolicy.dirty || this.resizePolicyDirty) {
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
   * Builds a ray from camera through the given layer position.
   *
   * @param position - 2D position in layer space
   * @param camera - Camera for ray origin and direction
   * @returns Ray in world space
   */
  public buildRay(position: Vector2, camera: Camera, result = new Ray()): Ray {
    const near = new Vector3(
      MathUtils.mapLinear(position.x, this.x, this.width, -1, 1),
      MathUtils.mapLinear(position.y, this.y, this.height, -1, 1),
      -1,
    ).unproject(camera);

    const far = new Vector3(
      MathUtils.mapLinear(position.x, this.x, this.width, -1, 1),
      MathUtils.mapLinear(position.y, this.y, this.height, -1, 1),
      1,
    ).unproject(camera);

    const direction = far.sub(near).normalize();
    return result.set(near, direction);
  }

  /**
   * Handles window resize. Updates layer dimensions according to resize policy.
   */
  private readonly onResize = (): void => {
    const scale = this.resizePolicy.calculateScale(
      window.innerWidth,
      window.innerHeight,
    );
    this.resizePolicy.dirty = false;
    this.resizePolicyDirty = false;
    this.resizeInternal(window.innerWidth * scale, window.innerHeight * scale);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.handleWindowInput(event, "onPointerDown", UIInputEvent.PRESSED);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.handleWindowInput(event, "onPointerMove", UIInputEvent.MOVED);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.handleWindowInput(event, "onPointerUp", UIInputEvent.RELEASED);
  };

  private handleWindowInput(
    event: PointerEvent,
    pointerFunctionName: "onPointerDown" | "onPointerMove" | "onPointerUp",
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

    if (isUIModeInteractive(this.mode)) {
      this.emit(inputEvent, scaledX, scaledY, event.pointerId);
      this.inputWrapperInternal[pointerFunctionName](
        scaledX,
        scaledY,
        event.pointerId,
      );
    }
  }
}
