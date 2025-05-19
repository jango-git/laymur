import { Constraint, Variable } from "kiwi.js";
import { Object3D, WebGLRenderer } from "three";
import { UIConstraint } from "../Constraints/UIConstraint";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraintSymbol,
  addElementSymbol,
  addRawConstraintSymbol,
  addVariableSymbol,
  readVariablesSymbol,
  removeConstraintSymbol,
  removeElementSymbol,
  removeRawConstraintSymbol,
  removeVariableSymbol,
  resizeSymbol,
  suggestVariableSymbol,
} from "../Miscellaneous/symbols";
import { UIOrientation } from "../Miscellaneous/UIOrientation";
import { UILayer } from "./UILayer";

export class UIFullScreenLayer extends UILayer {
  private readonly elements: UIElement[] = [];
  private readonly constraints: UIConstraint[] = [];

  private isUpdateVariablesRequired = false;
  private isNeedToResize = false;

  private addConstraintQueue: Set<Constraint> = new Set();
  private removeConstraintQueue: Set<Constraint> = new Set();

  public destroy(): void {
    for (const element of this.elements) {
      element.destroy();
    }
  }

  public render(renderer: WebGLRenderer): void {
    if (this.isUpdateVariablesRequired) {
      this.isUpdateVariablesRequired = false;
      if (this.isNeedToResize) {
        this.isNeedToResize = false;
        for (const constraint of this.constraints) {
          constraint[resizeSymbol](this.orientationPrivate);
        }
      }

      this.flushConstraints();
      this.solver.updateVariables();

      for (const element of this.elements) {
        element[readVariablesSymbol]();
      }
    }

    renderer.render(this.scene, this.camera);
  }

  public [addElementSymbol](element: UIElement, object: Object3D): void {
    const index = this.elements.indexOf(element);
    if (index === -1) {
      this.elements.push(element);
      this.scene.add(object);
    }
  }

  public [removeElementSymbol](element: UIElement, raw: Object3D): void {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
      this.scene.remove(raw);
    }
  }

  public [addConstraintSymbol](constraint: UIConstraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index === -1) this.constraints.push(constraint);
  }

  public [removeConstraintSymbol](constraint: UIConstraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index !== -1) this.constraints.splice(index, 1);
  }

  public [addRawConstraintSymbol](constraint: Constraint): void {
    if (this.removeConstraintQueue.has(constraint)) {
      this.removeConstraintQueue.delete(constraint);
    } else {
      this.addConstraintQueue.add(constraint);
      this.isUpdateVariablesRequired = true;
    }
  }

  public [removeRawConstraintSymbol](constraint: Constraint): void {
    if (this.addConstraintQueue.has(constraint)) {
      this.addConstraintQueue.delete(constraint);
    } else {
      this.removeConstraintQueue.add(constraint);
      this.isUpdateVariablesRequired = true;
    }
  }

  public [addVariableSymbol](variable: Variable, strength: number): void {
    this.solver.addEditVariable(variable, strength);
    this.isUpdateVariablesRequired = true;
  }

  public [removeVariableSymbol](variable: Variable): void {
    this.solver.removeEditVariable(variable);
    this.isUpdateVariablesRequired = true;
  }

  public [suggestVariableSymbol](variable: Variable, value: number): void {
    this.solver.suggestValue(variable, value);
    this.isUpdateVariablesRequired = true;
  }

  public resize(width: number, height: number): void {
    this.applyCameraSize(width, height);
    this.buildConstraints();
    this.flushConstraints();

    const lastOrientation = this.orientationPrivate;
    this.orientationPrivate =
      width > height ? UIOrientation.landscape : UIOrientation.portrait;

    if (lastOrientation !== this.orientationPrivate) {
      this.isNeedToResize = true;
    }
  }

  private flushConstraints(): void {
    for (const constraint of this.removeConstraintQueue) {
      this.solver.removeConstraint(constraint);
    }

    for (const constraint of this.addConstraintQueue) {
      this.solver.addConstraint(constraint);
    }

    this.removeConstraintQueue = new Set();
    this.addConstraintQueue = new Set();
  }

  private buildConstraints(): void {
    if (this.constraintX) this[removeRawConstraintSymbol](this.constraintX);
    if (this.constraintY) this[removeRawConstraintSymbol](this.constraintY);
    if (this.constraintW) this[removeRawConstraintSymbol](this.constraintW);
    if (this.constraintH) this[removeRawConstraintSymbol](this.constraintH);

    this.fillConstraints();

    if (this.constraintX) this[addRawConstraintSymbol](this.constraintX);
    if (this.constraintY) this[addRawConstraintSymbol](this.constraintY);
    if (this.constraintW) this[addRawConstraintSymbol](this.constraintW);
    if (this.constraintH) this[addRawConstraintSymbol](this.constraintH);
  }
}
