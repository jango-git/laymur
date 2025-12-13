import type { WebGLRenderer } from "three";
import type { UILayer } from "../layers/UILayer";
import { UILayerEvent } from "../layers/UILayer.Internal";
import { UIBorder } from "../miscellaneous/border/UIBorder";
import type { UIPropertyType } from "../miscellaneous/generic-plane/shared";
import { UIMicro } from "../miscellaneous/micro/UIMicro";
import type { UIMode } from "../miscellaneous/UIMode";
import { isUIModeVisible } from "../miscellaneous/UIMode";
import type { UITransparencyMode } from "../miscellaneous/UITransparencyMode";
import type { UISceneWrapperInterface } from "../wrappers/UISceneWrapper.Internal";
import { UIDummy } from "./UIDummy";
import type { UIElementOptions } from "./UIElement.Internal";
import {
  computeTransformMatrix,
  ELEMENT_DEFAULT_TRANSPARENCY_MODE,
} from "./UIElement.Internal";

/**
 * Base class for renderable UI elements.
 */
export abstract class UIElement extends UIDummy {
  public readonly micro: UIMicro;
  public readonly padding: UIBorder;

  protected readonly sceneWrapper: UISceneWrapperInterface;
  protected readonly planeHandler: number;

  private transparencyModeInternal: UITransparencyMode;
  private transparencyModeDirty = false;

  private visibilityDirty = false;

  constructor(
    layer: UILayer,
    source: string,
    properties: Record<string, UIPropertyType>,
    options?: Partial<UIElementOptions>,
  ) {
    super(layer, options);

    this.micro = new UIMicro(options?.micro);
    this.padding = new UIBorder(options?.padding);

    this.transparencyModeInternal =
      options?.transparencyMode ?? ELEMENT_DEFAULT_TRANSPARENCY_MODE;

    this.sceneWrapper = this.layer.sceneWrapper;
    this.planeHandler = this.sceneWrapper.createPlane(
      source,
      properties,
      this.transparencyModeInternal,
      false,
    );

    this.layer.on(UILayerEvent.WILL_RENDER, this.onWillRender, this);
  }

  public get transparencyMode(): UITransparencyMode {
    return this.transparencyModeInternal;
  }

  public set transparencyMode(value: UITransparencyMode) {
    if (this.transparencyModeInternal !== value) {
      this.transparencyModeInternal = value;
      this.transparencyModeDirty = true;
    }
  }

  public override set mode(value: UIMode) {
    if (this.modeInternal !== value) {
      const currentVisibility = isUIModeVisible(this.modeInternal);
      const newVisibility = isUIModeVisible(value);
      if (currentVisibility !== newVisibility) {
        this.visibilityDirty = true;
      }
      super.mode = value;
    }
  }

  public override destroy(): void {
    this.layer.off(UILayerEvent.WILL_RENDER, this.onWillRender, this);
    this.sceneWrapper.destroyPlane(this.planeHandler);
    super.destroy();
  }

  protected onWillRender(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by UILayer event interface but not used in base implementation
    renderer: WebGLRenderer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required by UILayer event interface but not used in base implementation
    deltaTime: number,
  ): void {
    if (this.transparencyModeDirty) {
      this.transparencyModeDirty = false;
      this.sceneWrapper.setTransparency(
        this.planeHandler,
        this.transparencyModeInternal,
      );
    }

    if (this.visibilityDirty) {
      this.visibilityDirty = false;
      this.sceneWrapper.setVisibility(
        this.planeHandler,
        isUIModeVisible(this.modeInternal),
      );
    }

    if (this.solverWrapper.dirty || this.micro.dirty) {
      const micro = this.micro;
      const matrix = computeTransformMatrix(
        this.x,
        this.y,
        this.width,
        this.height,
        this.zIndex,
        micro.x,
        micro.y,
        micro.anchorX,
        micro.anchorY,
        micro.scaleX,
        micro.scaleY,
        micro.rotation,
        micro.anchorMode,
      );

      micro.dirty = false;
      this.sceneWrapper.setTransform(this.planeHandler, matrix);
    }
  }
}
