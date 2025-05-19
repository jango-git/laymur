import {
  Constraint,
  Expression,
  Operator,
  Solver,
  Strength,
  Variable,
} from "kiwi.js";
import type { Object3D, WebGLRenderer } from "three";
import { OrthographicCamera, Scene } from "three";
import type { UIConstraint } from "../Constraints/UIConstraint";
import { UIElement } from "../Elements/UIElement";
import { assertSize } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  addUIConstraintSymbol,
  addUIElementSymbol,
  addVariableSymbol,
  heightSymbol,
  removeConstraintSymbol,
  removeUIConstraintSymbol,
  removeUIElementSymbol,
  removeVariableSymbol,
  suggestVariableSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import { UIOrientation } from "../Miscellaneous/UIOrientation";

interface UIElementDependencies {
  object: Object3D;
  variables: Set<Variable>;
  constraints: Set<UIConstraint>;
}

interface UIConstraintDependencies {
  elements: Set<UIElement>;
  variables: Set<Variable>;
  constraints: Set<Constraint>;
}

export abstract class UILayer {
  public readonly [xSymbol]: Variable = new Variable();
  public readonly [ySymbol]: Variable = new Variable();
  public readonly [widthSymbol]: Variable = new Variable();
  public readonly [heightSymbol]: Variable = new Variable();

  protected readonly scene = new Scene();
  protected readonly camera = new OrthographicCamera();
  protected readonly solver = new Solver();

  protected elements = new Map<UIElement, UIElementDependencies>();
  protected constraints = new Map<UIConstraint, UIConstraintDependencies>();

  protected constraintX?: Constraint;
  protected constraintY?: Constraint;
  protected constraintW?: Constraint;
  protected constraintH?: Constraint;

  protected orientationPrivate = UIOrientation.PORTRAIT;

  public get orientation(): UIOrientation {
    return this.orientationPrivate;
  }

  public destroy(): void {
    if (this.constraints.size > 0) {
      throw new Error("Constraints should be removed before destroying");
    }
    if (this.elements.size > 0) {
      throw new Error("Elements should be removed before destroying");
    }
  }

  public [addUIElementSymbol](element: UIElement, object: Object3D): void {
    if (this.elements.has(element)) {
      throw new Error("Element already added");
    }

    this.elements.set(element, {
      object,
      variables: new Set(),
      constraints: new Set(),
    });

    this.scene.add(object);
  }

  public [removeUIElementSymbol](element: UIElement): void {
    const dependencies = this.elements.get(element);
    if (dependencies === undefined) {
      throw new Error("Element not found");
    }

    if (dependencies.variables.size > 0) {
      throw new Error("Variables should be removed before removing element");
    }

    if (dependencies.constraints.size > 0) {
      throw new Error("Constraints should be removed before removing element");
    }

    this.scene.remove(dependencies.object);
    this.elements.delete(element);
  }

  public [addUIConstraintSymbol](
    constraint: UIConstraint,
    elements: Set<UIElement>,
  ): void {
    if (this.constraints.has(constraint)) {
      throw new Error("Constraint already added");
    }

    for (const element of elements) {
      const dependencies = this.elements.get(element);
      if (dependencies === undefined) {
        throw new Error("Element not found");
      }

      if (dependencies.constraints.has(constraint)) {
        throw new Error("Something went wrong");
      }

      dependencies.constraints.add(constraint);
    }

    this.constraints.set(constraint, {
      elements,
      variables: new Set(),
      constraints: new Set(),
    });
  }

  public [removeUIConstraintSymbol](constraint: UIConstraint): void {
    const dependencies = this.constraints.get(constraint);
    if (dependencies === undefined) {
      throw new Error("Constraint not found");
    }

    if (dependencies.variables.size > 0) {
      throw new Error("Variables should be removed before removing constraint");
    }

    if (dependencies.constraints.size > 0) {
      throw new Error(
        "Constraints should be removed before removing constraint",
      );
    }

    for (const element of dependencies.elements) {
      const dependencies = this.elements.get(element);
      if (dependencies === undefined) {
        throw new Error("Element not found");
      }

      if (!dependencies.constraints.has(constraint)) {
        throw new Error("Something went wrong");
      }

      dependencies.constraints.delete(constraint);
    }

    this.constraints.delete(constraint);
  }

  public [addConstraintSymbol](
    owner: UIConstraint,
    constraint: Constraint,
  ): void {
    const dependencies = this.constraints.get(owner);
    if (dependencies === undefined) {
      throw new Error("Before adding constraint you need to add it's owner");
    }

    if (dependencies.constraints.has(constraint)) {
      throw new Error("Constraint already exists");
    }

    dependencies.constraints.add(constraint);
    this.solver.addConstraint(constraint);
  }

  public [removeConstraintSymbol](
    owner: UIConstraint,
    constraint: Constraint,
  ): void {
    const dependencies = this.constraints.get(owner);
    if (dependencies === undefined) {
      throw new Error("Before removing constraint you need to add it's owner");
    }

    if (!dependencies.constraints.has(constraint)) {
      throw new Error("Constraint not found");
    }

    dependencies.constraints.delete(constraint);
    this.solver.removeConstraint(constraint);
  }

  public [addVariableSymbol](
    owner: UIElement | UIConstraint,
    variable: Variable,
    strength: number,
  ): void {
    const dependencies =
      owner instanceof UIElement
        ? this.elements.get(owner)
        : this.constraints.get(owner);

    if (dependencies === undefined) {
      throw new Error("Before adding variable you need to add it's owner");
    }

    if (dependencies.variables.has(variable)) {
      throw new Error("Variable already exists");
    }

    dependencies.variables.add(variable);
    this.solver.addEditVariable(variable, strength);
  }

  public [removeVariableSymbol](
    owner: UIElement | UIConstraint,
    variable: Variable,
  ): void {
    const dependencies =
      owner instanceof UIElement
        ? this.elements.get(owner)
        : this.constraints.get(owner);

    if (dependencies === undefined) {
      throw new Error("Before removing variable you need to add it's owner");
    }

    if (!dependencies.variables.has(variable)) {
      throw new Error("Variable does not exist");
    }

    dependencies.variables.delete(variable);
    this.solver.removeEditVariable(variable);
  }

  public [suggestVariableSymbol](
    owner: UIElement | UIConstraint,
    variable: Variable,
    value: number,
  ): void {
    const dependencies =
      owner instanceof UIElement
        ? this.elements.get(owner)
        : this.constraints.get(owner);

    if (dependencies === undefined) {
      throw new Error("Before suggesting variable you need to add it's owner");
    }

    if (!dependencies.variables.has(variable)) {
      throw new Error("Variable does not exist");
    }

    this.solver.suggestValue(variable, value);
  }

  protected buildConstraints(): void {
    if (this.constraintX) {
      this.solver.removeConstraint(this.constraintX);
    }
    if (this.constraintY) {
      this.solver.removeConstraint(this.constraintY);
    }
    if (this.constraintW) {
      this.solver.removeConstraint(this.constraintW);
    }
    if (this.constraintH) {
      this.solver.removeConstraint(this.constraintH);
    }

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

    this.solver.addConstraint(this.constraintX);
    this.solver.addConstraint(this.constraintY);
    this.solver.addConstraint(this.constraintW);
    this.solver.addConstraint(this.constraintH);
  }

  protected applyCameraSize(width: number, height: number): void {
    assertSize(width, height);

    this.camera.near = -1025;
    this.camera.far = 1026;
    this.camera.bottom = 0;
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();
  }

  public abstract render(renderer: WebGLRenderer): void;
}
