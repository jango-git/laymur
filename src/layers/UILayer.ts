import { Eventail } from "eventail";
import type { WebGLRenderer } from "three";
import type { UIPlaneElement } from "../miscellaneous/asserts";

import { isUIModeVisible } from "../miscellaneous/UIMode";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import { UIPriority } from "../miscellaneous/UIPriority";
import { UIInputWrapper } from "../wrappers/UIInputWrapper";
import type { UIInputWrapperInterface } from "../wrappers/UIInputWrapper.Internal";
import { UISceneWrapper } from "../wrappers/UISceneWrapper";
import type { UISceneWrapperInterface } from "../wrappers/UISceneWrapper.Internal";
import { UISolverWrapper } from "../wrappers/UISolverWrapper";
import type { UISolverWrapperInterface } from "../wrappers/UISolverWrapper.Internal";
import type { UILayerMode, UILayerOrientation } from "./UILayer.Internal";
import { UILayerEvent } from "./UILayer.Internal";

export abstract class UILayer extends Eventail implements UIPlaneElement {
  public name = "";
  public readonly xVariable: number;
  public readonly yVariable: number;
  public readonly wVariable: number;
  public readonly hVariable: number;

  protected readonly solverWrapperInternal = new UISolverWrapper();
  protected readonly sceneWrapperInternal: UISceneWrapper;
  protected readonly inputWrapperInternal = new UIInputWrapper();

  protected modeInternal: UILayerMode;
  protected orientationInternal: UILayerOrientation;

  constructor(w: number, h: number, mode: UILayerMode) {
    super();
    this.sceneWrapperInternal = new UISceneWrapper(w, h);
    this.modeInternal = mode;
    this.orientationInternal =
      w > h ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;

    this.xVariable = this.solverWrapperInternal.createVariable(
      0,
      UIPriority.P0,
    );
    this.yVariable = this.solverWrapperInternal.createVariable(
      0,
      UIPriority.P0,
    );
    this.wVariable = this.solverWrapperInternal.createVariable(
      w,
      UIPriority.P0,
    );
    this.hVariable = this.solverWrapperInternal.createVariable(
      h,
      UIPriority.P0,
    );
  }

  /** @internal */
  public get sceneWrapper(): UISceneWrapperInterface {
    return this.sceneWrapperInternal;
  }

  /** @internal */
  public get solverWrapper(): UISolverWrapperInterface {
    return this.solverWrapperInternal;
  }

  /** @internal */
  public get inputWrapper(): UIInputWrapperInterface {
    return this.inputWrapperInternal;
  }

  public get x(): number {
    return this.solverWrapperInternal.readVariableValue(this.xVariable);
  }

  public get y(): number {
    return this.solverWrapperInternal.readVariableValue(this.yVariable);
  }

  public get width(): number {
    return this.solverWrapperInternal.readVariableValue(this.wVariable);
  }

  public get height(): number {
    return this.solverWrapperInternal.readVariableValue(this.hVariable);
  }

  public get mode(): UILayerMode {
    return this.modeInternal;
  }

  public get orientation(): UILayerOrientation {
    return this.orientationInternal;
  }

  public set mode(value: UILayerMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      this.emit(UILayerEvent.MODE_CHANGED, this.modeInternal, this);
    }
  }

  protected resizeInternal(width: number, height: number): void {
    this.solverWrapperInternal.suggestVariableValue(this.wVariable, width);
    this.solverWrapperInternal.suggestVariableValue(this.hVariable, height);
    this.sceneWrapperInternal.resize(width, height);

    const orientation =
      width > height ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;

    if (orientation !== this.orientationInternal) {
      this.orientationInternal = orientation;
      this.emit(
        UILayerEvent.ORIENTATION_CHANGED,
        this.orientationInternal,
        this,
      );
    }
  }

  protected renderInternal(renderer: WebGLRenderer, deltaTime: number): void {
    if (isUIModeVisible(this.mode)) {
      this.emit(UILayerEvent.RENDERING, renderer, deltaTime, this);
      this.sceneWrapperInternal.render(renderer);
    }

    this.solverWrapperInternal.dirty = false;
    this.inputWrapperInternal.dirty = false;
  }
}
