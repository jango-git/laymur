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
  addConstraintSymbol,
  addElementSymbol,
  addRawConstraintSymbol,
  addVariableSymbol,
  heightSymbol,
  readVariablesSymbol,
  removeConstraintSymbol,
  removeElementSymbol,
  removeRawConstraintSymbol,
  removeVariableSymbol,
  resizeSymbol,
  suggestVariableSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";

export class UILayer {
  public readonly [xSymbol]: Variable = new Variable();
  public readonly [ySymbol]: Variable = new Variable();
  public readonly [widthSymbol]: Variable = new Variable();
  public readonly [heightSymbol]: Variable = new Variable();

  private readonly solver: Solver = new Solver();
  private constraintX?: Constraint;
  private constraintY?: Constraint;
  private constraintW?: Constraint;
  private constraintH?: Constraint;
  private isUpdateVariablesRequired = false;
  private isNeedToResize = false;

  private orientationPrivate: UIConstraintOrientation =
    UIConstraintOrientation.portrait;

  private readonly scene: Scene = new Scene();
  private readonly camera: OrthographicCamera = new OrthographicCamera();
  private readonly elements: UIElement[] = [];
  private readonly constraints: UIConstraint[] = [];

  private addConstraintQueue: Set<Constraint> = new Set();
  private removeConstraintQueue: Set<Constraint> = new Set();

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

  [addElementSymbol](element: UIElement, object: Object3D): void {
    const index = this.elements.indexOf(element);
    if (index === -1) {
      this.elements.push(element);
      this.scene.add(object);
    }
  }

  [removeElementSymbol](element: UIElement, raw: Object3D): void {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
      this.scene.remove(raw);
    }
  }

  [addConstraintSymbol](constraint: UIConstraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index === -1) this.constraints.push(constraint);
  }

  [removeConstraintSymbol](constraint: UIConstraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index !== -1) this.constraints.splice(index, 1);
  }

  [addRawConstraintSymbol](constraint: Constraint): void {
    if (this.removeConstraintQueue.has(constraint)) {
      this.removeConstraintQueue.delete(constraint);
    } else {
      this.addConstraintQueue.add(constraint);
      this.isUpdateVariablesRequired = true;
    }
  }

  [removeRawConstraintSymbol](constraint: Constraint): void {
    if (this.addConstraintQueue.has(constraint)) {
      this.addConstraintQueue.delete(constraint);
    } else {
      this.removeConstraintQueue.add(constraint);
      this.isUpdateVariablesRequired = true;
    }
  }

  [addVariableSymbol](variable: Variable, strength: number): void {
    this.solver.addEditVariable(variable, strength);
    this.isUpdateVariablesRequired = true;
  }

  [removeVariableSymbol](variable: Variable): void {
    this.solver.removeEditVariable(variable);
    this.isUpdateVariablesRequired = true;
  }

  [suggestVariableSymbol](variable: Variable, value: number): void {
    this.solver.suggestValue(variable, value);
    this.isUpdateVariablesRequired = true;
  }

  public resize(width: number, height: number): void {
    assertSize(width, height);

    this.camera.near = -1025;
    this.camera.far = 1026;
    this.camera.bottom = 0;
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();

    this.rebuildConstraints();
    this.flushConstraints();

    const lastOrientation = this.orientationPrivate;
    this.orientationPrivate =
      width > height
        ? UIConstraintOrientation.landscape
        : UIConstraintOrientation.portrait;

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

  private rebuildConstraints(): void {
    if (this.constraintX) this[removeRawConstraintSymbol](this.constraintX);
    if (this.constraintY) this[removeRawConstraintSymbol](this.constraintY);
    if (this.constraintW) this[removeRawConstraintSymbol](this.constraintW);
    if (this.constraintH) this[removeRawConstraintSymbol](this.constraintH);

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
      new Expression(this[widthSymbol]),
      Operator.Eq,
      this.camera.right,
      Strength.required,
    );

    this.constraintH = new Constraint(
      new Expression(this[heightSymbol]),
      Operator.Eq,
      this.camera.top,
      Strength.required,
    );

    this[addRawConstraintSymbol](this.constraintX);
    this[addRawConstraintSymbol](this.constraintY);
    this[addRawConstraintSymbol](this.constraintW);
    this[addRawConstraintSymbol](this.constraintH);
  }
}
