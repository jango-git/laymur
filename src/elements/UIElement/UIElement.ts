import type { WebGLRenderer } from "three";
import { Matrix4 } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import { computeTransformMatrix } from "../../miscellaneous/computeTransform";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared";
import { UIMicro } from "../../miscellaneous/micro/UIMicro";
import type { UIMode } from "../../miscellaneous/UIMode";
import { isUIModeVisible } from "../../miscellaneous/UIMode";
import type { UITransparencyMode } from "../../miscellaneous/UITransparencyMode";
import type { UISceneWrapperInterface } from "../../wrappers/UISceneWrapper/UISceneWrapper.Internal";
import { UIInputDummy } from "../UIInputDummy/UIInputDummy";
import type { UIElementOptions } from "./UIElement.Internal";
import { ELEMENT_DEFAULT_TRANSPARENCY_MODE } from "./UIElement.Internal";

/** Base class for renderable UI elements */
export abstract class UIElement extends UIInputDummy {
  /** Transforms that don't affect constraints */
  public readonly micro: UIMicro;

  protected readonly sceneWrapper: UISceneWrapperInterface;
  protected planeHandler: number;

  private transparencyModeInternal: UITransparencyMode;
  private transparencyModeDirty = false;
  private visibilityDirty = false;

  /**
   * Creates a new UIElement instance.
   *
   * @param layer - Layer containing this element
   * @param source - GLSL shader source code
   * @param properties - Shader uniform properties
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    source: string,
    properties: Record<string, UIProperty>,
    options?: Partial<UIElementOptions>,
  ) {
    super(layer, options);
    this.micro = new UIMicro(options?.micro);

    this.transparencyModeInternal =
      options?.transparencyMode ?? ELEMENT_DEFAULT_TRANSPARENCY_MODE;

    this.sceneWrapper = this.layer.sceneWrapper;
    this.planeHandler = this.sceneWrapper.createPlane(
      source,
      properties,
      new Matrix4().identity(),
      isUIModeVisible(options?.mode ?? this.mode),
      this.transparencyModeInternal,
    );

    this.layer.signalRendering.on(this.handleWillRender);
  }

  /** Alpha blending mode */
  public get transparencyMode(): UITransparencyMode {
    return this.transparencyModeInternal;
  }

  /** Alpha blending mode */
  public set transparencyMode(value: UITransparencyMode) {
    if (this.transparencyModeInternal !== value) {
      this.transparencyModeInternal = value;
      this.transparencyModeDirty = true;
    }
  }

  public override set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      this.visibilityDirty =
        isUIModeVisible(this.modeInternal) !== isUIModeVisible(value);
      super.mode = value;
    }
  }

  /** Removes element and frees resources */
  public override destroy(): void {
    this.layer.signalRendering.off(this.handleWillRender);
    this.sceneWrapper.destroyPlane(this.planeHandler);
    super.destroy();
  }

  protected setPlaneTransform(): void {
    if (
      this.micro.dirty ||
      this.inputWrapper.dirty ||
      this.solverWrapper.dirty
    ) {
      this.sceneWrapper.setTransform(
        this.planeHandler,
        computeTransformMatrix(
          this.x,
          this.y,
          this.width,
          this.height,
          this.zIndex,
          this.micro.x,
          this.micro.y,
          this.micro.anchorX,
          this.micro.anchorY,
          this.micro.scaleX,
          this.micro.scaleY,
          this.micro.rotation,
          this.micro.anchorMode,
        ),
      );
      this.micro.setDirtyFalse();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by UILayer event interface but not used in base implementation
  protected onWillRender(renderer: WebGLRenderer, deltaTime: number): void {
    if (this.transparencyModeDirty) {
      this.sceneWrapper.setTransparency(
        this.planeHandler,
        this.transparencyModeInternal,
      );
      this.transparencyModeDirty = false;
    }

    if (this.visibilityDirty) {
      this.sceneWrapper.setVisibility(
        this.planeHandler,
        isUIModeVisible(this.modeInternal),
      );
      this.visibilityDirty = false;
    }

    this.setPlaneTransform();
  }

  private readonly handleWillRender = (
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void => {
    this.onWillRender(renderer, deltaTime);
  };
}
