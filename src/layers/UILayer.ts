import { Eventail } from "eventail";
import type { WebGLRenderer } from "three";
import type { UIPlaneElement } from "../miscellaneous/shared";

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

/** Base layer for UI rendering and layout management */
export abstract class UILayer extends Eventail implements UIPlaneElement {
  /** Optional layer name */
  public name = "";
  /** Solver variable for x coordinate */
  public readonly xVariable: number;
  /** Solver variable for y coordinate */
  public readonly yVariable: number;
  /** Solver variable for width */
  public readonly wVariable: number;
  /** Solver variable for height */
  public readonly hVariable: number;

  protected readonly inputWrapperInternal = new UIInputWrapper();
  private readonly solverWrapperInternal = new UISolverWrapper();
  private readonly sceneWrapperInternal: UISceneWrapper;

  private modeInternal: UILayerMode;
  private orientationInternal: UILayerOrientation;

  /**
   * @param w Initial width in world units
   * @param h Initial height in world units
   * @param mode Initial visibility and interactivity mode
   */
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

  /** X coordinate in world units (always 0 for layers) */
  public get x(): number {
    return this.solverWrapperInternal.readVariableValue(this.xVariable);
  }

  /** Y coordinate in world units (always 0 for layers) */
  public get y(): number {
    return this.solverWrapperInternal.readVariableValue(this.yVariable);
  }

  /** Layer width in world units */
  public get width(): number {
    return this.solverWrapperInternal.readVariableValue(this.wVariable);
  }

  /** Layer height in world units */
  public get height(): number {
    return this.solverWrapperInternal.readVariableValue(this.hVariable);
  }

  /** Current visibility and interactivity mode */
  public get mode(): UILayerMode {
    return this.modeInternal;
  }

  /** Current orientation based on aspect ratio */
  public get orientation(): UILayerOrientation {
    return this.orientationInternal;
  }

  /** Updates visibility and interactivity mode */
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
