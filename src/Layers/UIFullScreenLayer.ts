import type { WebGLRenderer } from "three";
import { readVariablesSymbol, resizeSymbol } from "../Miscellaneous/symbols";
import { UIOrientation } from "../Miscellaneous/UIOrientation";
import { UILayer } from "./UILayer";

export class UIFullScreenLayer extends UILayer {
  public render(renderer: WebGLRenderer): void {
    this.solver.updateVariables();
    for (const element of this.elements.keys()) {
      element[readVariablesSymbol]();
    }

    renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number): void {
    this.applyCameraSize(width, height);
    this.buildConstraints();

    const lastOrientation = this.orientationPrivate;
    this.orientationPrivate =
      width > height ? UIOrientation.LANDSCAPE : UIOrientation.PORTRAIT;

    if (lastOrientation !== this.orientationPrivate) {
      for (const constraint of this.constraints.keys()) {
        constraint[resizeSymbol](this.orientationPrivate);
      }
    }
  }
}
