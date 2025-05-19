import {
  Constraint,
  Expression,
  Operator,
  Solver,
  Strength,
  Variable,
} from "kiwi.js";
import { Object3D, OrthographicCamera, Scene, WebGLRenderer } from "three";
import { UIConstraint } from "../Constraints/UIConstraint";
import { UIConstraintOrientation } from "../Constraints/UIConstraintOrientation";
import { UIElement } from "../Elements/UIElement";
import { assertSize } from "../Miscellaneous/asserts";
import {
  addConstraint,
  addElement,
  addRawConstraint,
  addVariable,
  hSymbol,
  readVariablesSymbol,
  removeConstraint,
  removeElement,
  removeRawConstraint,
  removeVariable,
  resizeSymbol,
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

  private orientationPrivate: UIConstraintOrientation =
    UIConstraintOrientation.portrait;

  private readonly scene: Scene = new Scene();
  private readonly camera: OrthographicCamera = new OrthographicCamera();
  private readonly elements: UIElement[] = [];
  private readonly constraints: UIConstraint[] = [];

  private addConstraintQueue: Constraint[] = [];
  private removeConstraintQueue: Constraint[] = [];

  public get orientation(): UIConstraintOrientation {
    return this.orientationPrivate;
  }

  public destroy(): void {
    for (const element of this.elements) {
      element.destroy();
    }
  }

  public render(renderer: WebGLRenderer): void {
    if (this.isUpdateVariablesRequired) {
      this.isUpdateVariablesRequired = false;

      this.flushConstraints();
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
    }
  }

  [removeElement](element: UIElement, raw: Object3D): void {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
      this.scene.remove(raw);
    }
  }

  [addConstraint](constraint: UIConstraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index === -1) this.constraints.push(constraint);
  }

  [removeConstraint](constraint: UIConstraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index !== -1) this.constraints.splice(index, 1);
  }

  [addRawConstraint](constraint: Constraint): void {
    this.addConstraintQueue.push(constraint);
    this.isUpdateVariablesRequired = true;
  }

  [removeRawConstraint](constraint: Constraint): void {
    this.removeConstraintQueue.push(constraint);
    this.isUpdateVariablesRequired = true;
  }

  [addVariable](variable: Variable, strength: number): void {
    this.solver.addEditVariable(variable, strength);
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
    assertSize(width, height);
    this.flushConstraints();

    this.camera.near = -1025;
    this.camera.far = 1026;
    this.camera.bottom = 0;
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();

    this.rebuildConstraints();

    const lastOrientation = this.orientationPrivate;
    this.orientationPrivate =
      width > height
        ? UIConstraintOrientation.landscape
        : UIConstraintOrientation.portrait;

    if (lastOrientation !== this.orientationPrivate) {
      for (const constraint of this.constraints) {
        constraint[resizeSymbol](this.orientationPrivate);
      }
    }
  }

  private flushConstraints(): void {
    for (const constraint of this.removeConstraintQueue) {
      this.solver.removeConstraint(constraint);
    }

    for (const constraint of this.addConstraintQueue) {
      this.solver.addConstraint(constraint);
    }

    this.removeConstraintQueue = [];
    this.addConstraintQueue = [];
  }

  private rebuildConstraints(): void {
    if (this.constraintX) this[removeRawConstraint](this.constraintX);
    if (this.constraintY) this[removeRawConstraint](this.constraintY);
    if (this.constraintW) this[removeRawConstraint](this.constraintW);
    if (this.constraintH) this[removeRawConstraint](this.constraintH);

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

    this[addRawConstraint](this.constraintX);
    this[addRawConstraint](this.constraintY);
    this[addRawConstraint](this.constraintW);
    this[addRawConstraint](this.constraintH);
  }
}
