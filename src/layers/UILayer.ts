import { Eventail } from "eventail";
import type { WebGLRenderer } from "three";
import { UIMode } from "../miscellaneous/UIMode";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import { UIPriority } from "../miscellaneous/UIPriority";
import { UISceneWrapper } from "../wrappers/UISceneWrapper";
import { UISolverWrapper } from "../wrappers/UISolverWrapper";

export enum UILayerEvent {
  ORIENTATION_CHANGE = "orientation_change",
  MODE_CHANGE = "mode_change",
}

export abstract class UILayer extends Eventail {
  public name = "";

  public readonly xVariable: number;
  public readonly yVariable: number;
  public readonly wVariable: number;
  public readonly hVariable: number;

  protected readonly solverWrapper = new UISolverWrapper();
  protected readonly sceneWrapper: UISceneWrapper;

  protected modeInternal: UIMode = UIMode.VISIBLE;
  protected orientationInternal: UIOrientation;

  constructor(w: number, h: number) {
    super();
    this.sceneWrapper = new UISceneWrapper(w, h);
    this.xVariable = this.solverWrapper.createVariable(0, UIPriority.P0);
    this.yVariable = this.solverWrapper.createVariable(0, UIPriority.P0);
    this.wVariable = this.solverWrapper.createVariable(w, UIPriority.P0);
    this.hVariable = this.solverWrapper.createVariable(h, UIPriority.P0);
    this.orientationInternal =
      w > h ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;
  }

  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  public get mode(): UIMode {
    return this.modeInternal;
  }

  public get orientation(): UIOrientation {
    return this.orientationInternal;
  }

  public set mode(value: UIMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      this.emit(UILayerEvent.MODE_CHANGE, this.modeInternal, this);
    }
  }

  protected resizeInternal(width: number, height: number): void {
    this.solverWrapper.suggestVariableValue(this.wVariable, width);
    this.solverWrapper.suggestVariableValue(this.hVariable, height);
    this.sceneWrapper.resize(width, height);

    const orientation =
      width > height ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;

    if (orientation !== this.orientationInternal) {
      this.orientationInternal = orientation;
      this.emit(
        UILayerEvent.ORIENTATION_CHANGE,
        this.orientationInternal,
        this,
      );
    }
  }

  protected renderInternal(renderer: WebGLRenderer, deltaTime: number): void {
    if (this.mode !== UIMode.HIDDEN) {
      this.sceneWrapper.render(renderer, deltaTime);
    }
  }

  protected clickInternal(x: number, y: number): void {
    if (this.mode === UIMode.INTERACTIVE) {
      for (const element of this.sceneWrapper.getSortedVisibleElements()) {
        if (element["onClickInternal"](x, y)) {
          return;
        }
      }
    }
  }

  protected ["getSolverWrapperInternal"](): UISolverWrapper {
    return this.solverWrapper;
  }

  protected ["getSceneWrapperInternal"](): UISceneWrapper {
    return this.sceneWrapper;
  }
}
