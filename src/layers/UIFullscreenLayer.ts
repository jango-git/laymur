import type { Camera, Vector2, WebGLRenderer } from "three";
import { MathUtils, Ray, Vector3 } from "three";
import { assertValidNumber } from "../miscellaneous/asserts";
import type { UIResizePolicy } from "../miscellaneous/resize-policy/UIResizePolicy";
import { UIResizePolicyNone } from "../miscellaneous/resize-policy/UIResizePolicyNone";
import { UIInputEvent } from "../miscellaneous/UIInputEvent";
import { isUIModeInteractive, UIMode } from "../miscellaneous/UIMode";
import { UILayer } from "./UILayer";
import type { UILayerMode } from "./UILayer.Internal";

/** Layer that automatically handles browser window resizing and input events */
export class UIFullscreenLayer extends UILayer {
  private resizePolicyInternal: UIResizePolicy;
  private resizePolicyDirty = false;

  /**
   * @param resizePolicy Strategy for handling window resize
   * @param mode Initial visibility and interactivity mode
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

  /** Current resize policy */
  public get resizePolicy(): UIResizePolicy {
    return this.resizePolicyInternal;
  }

  /** Updates resize policy */
  public set resizePolicy(value: UIResizePolicy) {
    if (this.resizePolicyInternal !== value) {
      this.resizePolicyInternal = value;
      this.resizePolicyDirty = true;
    }
  }

  /** Removes event listeners and frees resources */
  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  /**
   * Renders layer and all visible elements
   * @param renderer Three.js WebGL renderer
   * @param deltaTime Time since last frame in seconds
   */
  public render(renderer: WebGLRenderer, deltaTime: number): void {
    assertValidNumber(deltaTime, "UIFullscreenLayer.render.deltaTime");
    if (this.resizePolicy.dirty || this.resizePolicyDirty) {
      this.onResize();
    }
    super.renderInternal(renderer, deltaTime);
  }

  /**
   * Projects 3D world position to 2D layer coordinates
   * @param position World position
   * @param camera Three.js camera
   * @returns Layer coordinates
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
   * Projects 2D layer coordinates to 3D world position
   * @param position Layer coordinates
   * @param camera Three.js camera
   * @param z Depth coordinate
   * @returns World position
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
   * Builds ray from layer position through camera
   * @param position Layer coordinates
   * @param camera Three.js camera
   * @param result Reusable ray instance
   * @returns Ray from near to far plane
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
