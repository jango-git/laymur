import {
  UIAspectConstraint,
  UIHeightConstraint,
  UIHorizontalDistanceConstraint,
  UIHorizontalInterpolationConstraint,
  UIVerticalDistanceConstraint,
  UIVerticalInterpolationConstraint,
  UIWidthConstraint,
  type UILayer,
} from "../core";
import type { UIConstraint } from "../core/constraints/UIConstraint";
import { UIAspectDebug } from "./UIAspectDebug";
import type { UIConstraintDebug } from "./UIConstraintDebug";
import { UIHeightDebug } from "./UIHeightDebug";
import { UIHorizontalDistanceDebug } from "./UIHorizontalDistanceDebug";
import { UIHorizontalInterpolationDebug } from "./UIHorizontalInterpolationDebug";
import { UIVerticalDistanceDebug } from "./UIVerticalDistanceDebug";
import { UIVerticalInterpolationDebug } from "./UIVerticalInterpolationDebug";
import { UIWidthDebug } from "./UIWidthDebug";

export interface UILayerDebugOptions {
  showAspect: boolean;
  showHeight: boolean;
  showWidth: boolean;
  showHorizontalDistance: boolean;
  showHorizontalInterpolation: boolean;
  showVerticalDistance: boolean;
  showVerticalInterpolation: boolean;
}

export class UILayerDebug {
  private readonly debug: UIConstraintDebug[] = [];

  private showAspectInternal: boolean;
  private showHeightInternal: boolean;
  private showWidthInternal: boolean;
  private showHorizontalDistanceInternal: boolean;
  private showHorizontalInterpolationInternal: boolean;
  private showVerticalDistanceInternal: boolean;
  private showVerticalInterpolationInternal: boolean;

  constructor(
    public layer: UILayer,
    options?: Partial<UILayerDebugOptions>,
  ) {
    this.showAspectInternal = options?.showAspect ?? true;
    this.showHeightInternal = options?.showHeight ?? true;
    this.showWidthInternal = options?.showWidth ?? true;
    this.showHorizontalDistanceInternal = options?.showHorizontalDistance ?? true;
    this.showHorizontalInterpolationInternal = options?.showHorizontalInterpolation ?? true;
    this.showVerticalDistanceInternal = options?.showVerticalDistance ?? true;
    this.showVerticalInterpolationInternal = options?.showVerticalInterpolation ?? true;

    for (const constraint of this.layer.constraintRegistry) {
      this.addDebug(constraint);
    }

    this.layer.signalConstraintAdded.on(this.onConstraintAdded);
    this.layer.signalConstraintRemoved.on(this.onConstraintRemoved);
  }

  public set showAspect(value: boolean) {
    this.showAspectInternal = value;
    this.setVisibility(UIAspectConstraint, value);
  }

  public set showHeight(value: boolean) {
    this.showHeightInternal = value;
    this.setVisibility(UIHeightConstraint, value);
  }

  public set showWidth(value: boolean) {
    this.showWidthInternal = value;
    this.setVisibility(UIWidthConstraint, value);
  }

  public set showHorizontalDistance(value: boolean) {
    this.showHorizontalDistanceInternal = value;
    this.setVisibility(UIHorizontalDistanceConstraint, value);
  }

  public set showHorizontalInterpolation(value: boolean) {
    this.showHorizontalInterpolationInternal = value;
    this.setVisibility(UIHorizontalInterpolationConstraint, value);
  }

  public set showVerticalDistance(value: boolean) {
    this.showVerticalDistanceInternal = value;
    this.setVisibility(UIVerticalDistanceConstraint, value);
  }

  public set showVerticalInterpolation(value: boolean) {
    this.showVerticalInterpolationInternal = value;
    this.setVisibility(UIVerticalInterpolationConstraint, value);
  }

  public destroy(): void {
    this.layer.signalConstraintAdded.off(this.onConstraintAdded);
    this.layer.signalConstraintRemoved.off(this.onConstraintRemoved);

    for (const debug of this.debug) {
      debug.destroy();
    }
    this.debug.length = 0;
  }

  private addDebug(constraint: UIConstraint): void {
    let debug: UIConstraintDebug | null = null;

    if (constraint instanceof UIAspectConstraint) {
      debug = new UIAspectDebug(constraint);
      debug.visible = this.showAspectInternal;
    } else if (constraint instanceof UIHeightConstraint) {
      debug = new UIHeightDebug(constraint);
      debug.visible = this.showHeightInternal;
    } else if (constraint instanceof UIWidthConstraint) {
      debug = new UIWidthDebug(constraint);
      debug.visible = this.showWidthInternal;
    } else if (constraint instanceof UIHorizontalDistanceConstraint) {
      debug = new UIHorizontalDistanceDebug(constraint);
      debug.visible = this.showHorizontalDistanceInternal;
    } else if (constraint instanceof UIHorizontalInterpolationConstraint) {
      debug = new UIHorizontalInterpolationDebug(constraint);
      debug.visible = this.showHorizontalInterpolationInternal;
    } else if (constraint instanceof UIVerticalDistanceConstraint) {
      debug = new UIVerticalDistanceDebug(constraint);
      debug.visible = this.showVerticalDistanceInternal;
    } else if (constraint instanceof UIVerticalInterpolationConstraint) {
      debug = new UIVerticalInterpolationDebug(constraint);
      debug.visible = this.showVerticalInterpolationInternal;
    }

    if (debug) {
      this.debug.push(debug);
    }
  }

  private setVisibility<T extends UIConstraint>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is necessary here because the constraint class constructor signature is unknown
    constraintClass: new (...args: any[]) => T,
    visible: boolean,
  ): void {
    for (const debug of this.debug) {
      if (debug.constraint instanceof constraintClass) {
        debug.visible = visible;
      }
    }
  }

  private readonly onConstraintAdded = (layer: UILayer, constraint: UIConstraint): void => {
    this.addDebug(constraint);
  };

  private readonly onConstraintRemoved = (layer: UILayer, constraint: UIConstraint): void => {
    const index = this.debug.findIndex((d) => d.constraint === constraint);
    if (index !== -1) {
      this.debug[index].destroy();
      this.debug.splice(index, 1);
    }
  };
}
