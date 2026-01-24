import type { FerrsignView2, FerrsignView3 } from "ferrsign";
import { Ferrsign2, Ferrsign3 } from "ferrsign";
import type { WebGLRenderer } from "three";
import type { UIPlaneElement } from "../../miscellaneous/shared";

import { assertValidPositiveNumber } from "../../miscellaneous/asserts";
import { isUIModeVisible } from "../../miscellaneous/UIMode";
import { UIOrientation } from "../../miscellaneous/UIOrientation";
import { UIPriority } from "../../miscellaneous/UIPriority";
import { UIInputWrapper } from "../../wrappers/UIInputWrapper/UIInputWrapper";
import type { UIInputWrapperInterface } from "../../wrappers/UIInputWrapper/UIInputWrapper.Internal";
import { UISceneWrapper } from "../../wrappers/UISceneWrapper/UISceneWrapper";
import type { UISceneWrapperInterface } from "../../wrappers/UISceneWrapper/UISceneWrapper.Internal";
import { UISolverWrapper } from "../../wrappers/UISolverWrapper/UISolverWrapper";
import type { UISolverWrapperInterface } from "../../wrappers/UISolverWrapper/UISolverWrapper.Internal";
import type { UILayerMode, UILayerOptions, UILayerOrientation } from "./UILayer.Internal";
import { LAYER_DEFAULT_MODE, LAYER_DEFAULT_NAME, LAYER_DEFAULT_SIZE } from "./UILayer.Internal";

/** Base layer for UI rendering and layout management */
export abstract class UILayer implements UIPlaneElement {
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

  private readonly signalOrientationChangedInternal = new Ferrsign2<UILayerOrientation, UILayer>();
  private readonly signalModeChangedInternal = new Ferrsign2<UILayerMode, UILayer>();
  private readonly signalRenderingInternal = new Ferrsign3<WebGLRenderer, number, UILayer>();

  constructor(options: Partial<UILayerOptions>) {
    if (options.width !== undefined) {
      assertValidPositiveNumber(options.width, "UILayer.constructor.options.width");
    }

    if (options.height !== undefined) {
      assertValidPositiveNumber(options.height, "UILayer.constructor.options.height");
    }

    const width = options.width ?? LAYER_DEFAULT_SIZE;
    const height = options.height ?? LAYER_DEFAULT_SIZE;

    this.sceneWrapperInternal = new UISceneWrapper(width, height);
    this.name = options.name ?? LAYER_DEFAULT_NAME;
    this.modeInternal = options.mode ?? LAYER_DEFAULT_MODE;
    this.orientationInternal = width > height ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;

    this.xVariable = this.solverWrapperInternal.createVariable(0, UIPriority.P0);
    this.yVariable = this.solverWrapperInternal.createVariable(0, UIPriority.P0);
    this.wVariable = this.solverWrapperInternal.createVariable(width, UIPriority.P0);
    this.hVariable = this.solverWrapperInternal.createVariable(height, UIPriority.P0);
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

  /** Signal fired when orientation changes */
  public get signalOrientationChanged(): FerrsignView2<UILayerOrientation, UILayer> {
    return this.signalOrientationChangedInternal;
  }

  /** Signal fired when mode changes */
  public get signalModeChanged(): FerrsignView2<UILayerMode, UILayer> {
    return this.signalModeChangedInternal;
  }

  /** Signal fired during rendering */
  public get signalRendering(): FerrsignView3<WebGLRenderer, number, UILayer> {
    return this.signalRenderingInternal;
  }

  /** Updates visibility and interactivity mode */
  public set mode(value: UILayerMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      this.signalModeChangedInternal.emit(this.modeInternal, this);
    }
  }

  protected resizeInternal(width: number, height: number): void {
    this.solverWrapperInternal.suggestVariableValue(this.wVariable, width);
    this.solverWrapperInternal.suggestVariableValue(this.hVariable, height);
    this.sceneWrapperInternal.resize(width, height);

    const orientation = width > height ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;

    if (orientation !== this.orientationInternal) {
      this.orientationInternal = orientation;
      this.signalOrientationChangedInternal.emit(this.orientationInternal, this);
    }
  }

  protected renderInternal(renderer: WebGLRenderer, deltaTime: number): void {
    if (isUIModeVisible(this.mode)) {
      this.signalRenderingInternal.emit(renderer, deltaTime, this);
      this.sceneWrapperInternal.render(renderer);
    }

    this.solverWrapperInternal.dirty = false;
    this.inputWrapperInternal.dirty = false;
  }
}
