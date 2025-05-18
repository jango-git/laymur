import {
  Constraint,
  Expression,
  Operator,
  Solver,
  Strength,
  Variable,
} from "kiwi.js";
import { Object3D, OrthographicCamera, Scene, WebGLRenderer } from "three";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraint,
  addElement,
  addVariable,
  hSymbol,
  readVariablesSymbol,
  removeConstraint,
  removeElement,
  removeVariable,
  suggestVariable,
  wSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";

export class UILayer {
  public readonly [xSymbol]: Variable = new Variable();
  public readonly [ySymbol]: Variable = new Variable();
  public readonly [wSymbol]: Variable = new Variable();
  public readonly [hSymbol]: Variable = new Variable();

  private readonly solver: Solver = new Solver();
  private constraintX?: Constraint;
  private constraintY?: Constraint;
  private constraintW?: Constraint;
  private constraintH?: Constraint;
  private isUpdateVariablesRequired = false;

  private readonly scene: Scene = new Scene();
  private readonly camera: OrthographicCamera = new OrthographicCamera();
  private readonly elements: UIElement[] = [];

  public destroy(): void {
    for (const element of this.elements) {
      element.destroy();
    }
  }

  public render(renderer: WebGLRenderer): void {
    if (this.isUpdateVariablesRequired) {
      this.isUpdateVariablesRequired = false;
      this.solver.updateVariables();

      for (const element of this.elements) {
        element[readVariablesSymbol]();
      }
    }

    renderer.render(this.scene, this.camera);
  }

  [addElement](element: UIElement, object: Object3D): void {
    const index = this.elements.indexOf(element);
    if (index === -1) {
      this.elements.push(element);
      this.scene.add(object);
      this.isUpdateVariablesRequired = true;
    }
  }

  [removeElement](element: UIElement, raw: Object3D): void {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
      this.scene.remove(raw);
      this.isUpdateVariablesRequired = true;
    }
  }

  [addConstraint](constraint: Constraint): void {
    this.solver.addConstraint(constraint);
    this.isUpdateVariablesRequired = true;
  }

  [removeConstraint](constraint: Constraint): void {
    this.solver.removeConstraint(constraint);
    this.isUpdateVariablesRequired = true;
  }

  [addVariable](variable: Variable, strength: Strength): void {
    this.solver.addEditVariable(variable, strength as number);
    this.isUpdateVariablesRequired = true;
  }

  [removeVariable](variable: Variable): void {
    this.solver.removeEditVariable(variable);
    this.isUpdateVariablesRequired = true;
  }

  [suggestVariable](variable: Variable, value: number): void {
    this.solver.suggestValue(variable, value);
    this.isUpdateVariablesRequired = true;
  }

  public resize(width: number, height: number): void {
    this.camera.near = 0;
    this.camera.far = 1024;
    this.camera.bottom = 0;
    this.camera.left = 0;
    this.camera.right = Math.max(width, 8);
    this.camera.top = Math.max(height, 8);
    this.camera.updateProjectionMatrix();
    this.rebuildConstraints();
  }

  private rebuildConstraints(): void {
    if (this.constraintX) this.solver.removeConstraint(this.constraintX);
    if (this.constraintY) this.solver.removeConstraint(this.constraintY);
    if (this.constraintW) this.solver.removeConstraint(this.constraintW);
    if (this.constraintH) this.solver.removeConstraint(this.constraintH);

    this.constraintX = new Constraint(
      new Expression(this[xSymbol]),
      Operator.Eq,
      0,
      Strength.required,
    );

    this.constraintY = new Constraint(
      new Expression(this[ySymbol]),
      Operator.Eq,
      0,
      Strength.required,
    );

    this.constraintW = new Constraint(
      new Expression(this[wSymbol]),
      Operator.Eq,
      this.camera.right,
      Strength.required,
    );

    this.constraintH = new Constraint(
      new Expression(this[hSymbol]),
      Operator.Eq,
      this.camera.top,
      Strength.required,
    );

    this.solver.addConstraint(this.constraintX);
    this.solver.addConstraint(this.constraintY);
    this.solver.addConstraint(this.constraintW);
    this.solver.addConstraint(this.constraintH);

    this.isUpdateVariablesRequired = true;
  }
}
