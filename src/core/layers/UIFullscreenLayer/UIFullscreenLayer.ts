import type { FerrsignView1 } from "ferrsign";
import { Ferrsign1 } from "ferrsign";
import type { Camera, Vector2, WebGLRenderer } from "three";
import { MathUtils, Ray, Vector3 } from "three";
import { assertValidNumber } from "../../miscellaneous/asserts";
import type { UIResizePolicy } from "../../miscellaneous/resize-policy/UIResizePolicy";
import { isUIModeInteractive } from "../../miscellaneous/UIMode";
import { UILayer } from "../UILayer/UILayer";
import type {
  UIFullscreenLayerInputEventData,
  UIFullscreenLayerOptions,
} from "./UIFullscreenLayer.Internal";
import { FULLSCREEN_LAYER_DEFAULT_RESIZE_POLICY } from "./UIFullscreenLayer.Internal";

/** Layer that automatically handles browser window resizing and input events */
export class UIFullscreenLayer extends UILayer {
  private resizePolicyInternal: UIResizePolicy;
  private resizePolicyDirty = false;

  private readonly signalPointerPressedInternal =
    new Ferrsign1<UIFullscreenLayerInputEventData>();
  private readonly signalPointerMovedInternal =
    new Ferrsign1<UIFullscreenLayerInputEventData>();
  private readonly signalPointerReleasedInternal =
    new Ferrsign1<UIFullscreenLayerInputEventData>();

  constructor(options?: Partial<UIFullscreenLayerOptions>) {
    const resizePolicy =
      options?.resizePolicy ?? FULLSCREEN_LAYER_DEFAULT_RESIZE_POLICY;

    const scale = resizePolicy.calculateScale(
      window.innerWidth,
      window.innerHeight,
    );

    super({
      width: window.innerWidth * scale,
      height: window.innerHeight * scale,
      ...options,
    });

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

  /** Signal fired when pointer is pressed */
  public get signalPointerPressed(): FerrsignView1<UIFullscreenLayerInputEventData> {
    return this.signalPointerPressedInternal;
  }

  /** Signal fired when pointer is moved */
  public get signalPointerMoved(): FerrsignView1<UIFullscreenLayerInputEventData> {
    return this.signalPointerMovedInternal;
  }

  /** Signal fired when pointer is released */
  public get signalPointerReleased(): FerrsignView1<UIFullscreenLayerInputEventData> {
    return this.signalPointerReleasedInternal;
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
   * @param result Reusable vector instance
   * @returns Layer coordinates
   */
  public projectWorldPosition(
    position: Vector3,
    camera: Camera,
    result = new Vector3(),
  ): Vector3 {
    result.copy(position).project(camera);
    result.x = MathUtils.mapLinear(result.x, -1, 1, this.x, this.width);
    result.y = MathUtils.mapLinear(result.y, -1, 1, this.y, this.height);
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
        MathUtils.mapLinear(position.x, this.x, this.width, -1, 1),
        MathUtils.mapLinear(position.y, this.y, this.height, -1, 1),
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
    this.handleWindowInput(
      event,
      "onPointerDown",
      this.signalPointerPressedInternal,
    );
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.handleWindowInput(
      event,
      "onPointerMove",
      this.signalPointerMovedInternal,
    );
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.handleWindowInput(
      event,
      "onPointerUp",
      this.signalPointerReleasedInternal,
    );
  };

  private handleWindowInput(
    event: PointerEvent,
    pointerFunctionName: "onPointerDown" | "onPointerMove" | "onPointerUp",
    signal: Ferrsign1<UIFullscreenLayerInputEventData>,
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
      signal.emit({
        x: scaledX,
        y: scaledY,
        identifier: event.pointerId,
        layer: this,
      });
      this.inputWrapperInternal[pointerFunctionName](
        scaledX,
        scaledY,
        event.pointerId,
      );
    }
  }
}
