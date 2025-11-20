import {
  MathUtils,
  type Camera,
  type Vector3,
  type WebGLRenderer,
} from "three";
import { assertValidNumber } from "../miscellaneous/asserts";
import type { UIResizePolicy } from "../miscellaneous/resizePolicies";
import { UIResizePolicyNone } from "../miscellaneous/resizePolicies";
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
  public resizePolicy: UIResizePolicy = new UIResizePolicyNone();

  /**
   * Creates a fullscreen layer and sets up window event listeners.
   */
  constructor() {
    super(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onClick);
    this.onResize();
  }

  /**
   * Removes window event listeners. The layer should not be used after this.
   */
  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onClick);
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
    const projectedPosition = position.project(camera);
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
   * Handles window resize. Updates layer dimensions according to resize policy.
   */
  private readonly onResize = (): void => {
    const scale = this.resizePolicy.calculateScaleInternal(
      window.innerWidth,
      window.innerHeight,
    );
    this.resizeInternal(window.innerWidth * scale, window.innerHeight * scale);
  };

  /**
   * Handles pointer down. Converts browser coordinates to layer space.
   * Y-coordinate is flipped to match UI coordinate system.
   *
   * @param event - Browser pointer event
   */
  private readonly onClick = (event: PointerEvent): void => {
    const rect =
      event.target instanceof HTMLElement
        ? event.target.getBoundingClientRect()
        : null;

    const x = rect ? event.clientX - rect.left : event.clientX;
    const y = rect
      ? rect.bottom - event.clientY
      : window.innerHeight - event.clientY;

    const scale = this.resizePolicy.calculateScaleInternal(
      window.innerWidth,
      window.innerHeight,
    );
    this.pointerClickInternal(x * scale, y * scale);
  };
}
