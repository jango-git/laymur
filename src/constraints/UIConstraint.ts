import { type UILayer } from "../layers/UILayer";

import type { UISolverWrapper } from "../wrappers/UISolverWrapper";

export abstract class UIConstraint {
  public name = "";
  protected readonly solverWrapper: UISolverWrapper;

  constructor(public readonly layer: UILayer) {
    this.solverWrapper = this.layer["getSolverWrapperInternal"]();
  }
}
