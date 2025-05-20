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
import {
  addConstraintSymbol,
  addUIConstraintSymbol,
  addUIElementSymbol,
  addVariableSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  heightSymbol,
  readVariablesSymbol,
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

const MAX_Z_INDEX = 1000;

interface VariableDescription {
  strength: number;
  suggestedValue: number;
}

interface UIElementDependencies {
  object: Object3D;
  variables: Map<Variable, VariableDescription>;
  constraints: Set<UIConstraint>;
}

interface UIConstraintDependencies {
  elements: Set<UIElement>;
  variables: Map<Variable, VariableDescription>;
  constraints: Set<Constraint>;
}

export abstract class UILayer {
  public readonly [xSymbol]: Variable = new Variable();
  public readonly [ySymbol]: Variable = new Variable();
  public readonly [widthSymbol]: Variable = new Variable();
  public readonly [heightSymbol]: Variable = new Variable();

  protected readonly scene = new Scene();
  protected readonly camera = new OrthographicCamera();
  protected solver? = new Solver();

  protected elements = new Map<UIElement, UIElementDependencies>();
  protected constraints = new Map<UIConstraint, UIConstraintDependencies>();

  protected constraintX?: Constraint;
  protected constraintY?: Constraint;
  protected constraintW?: Constraint;
  protected constraintH?: Constraint;

  protected orientationPrivate = UIOrientation.PORTRAIT;
  protected needsRecalculation = false;

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
      variables: new Map(),
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
      variables: new Map(),
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
    this.solver?.addConstraint(constraint);
    this.needsRecalculation = true;
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
    this.solver?.removeConstraint(constraint);
    this.needsRecalculation = true;
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

    dependencies.variables.set(variable, {
      strength,
      suggestedValue: variable.value(),
    });
    this.solver?.addEditVariable(variable, strength);
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
    this.solver?.removeEditVariable(variable);
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

    const description = dependencies.variables.get(variable);

    if (!description) {
      throw new Error("Variable does not exist");
    }

    if (description.suggestedValue !== value) {
      description.suggestedValue = value;
      this.solver?.suggestValue(variable, value);
      this.needsRecalculation = true;
    }
  }

  public render(renderer: WebGLRenderer): void {
    if (this.needsRecalculation) {
      this.needsRecalculation = false;
      this.solver?.updateVariables();

      for (const element of this.elements.keys()) {
        element[readVariablesSymbol]();
      }
    }

    renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number): void {
    this.applyCameraSize(width, height);
    this.rebuildLayerConstraints(width, height);
    this.updateOrientation(width, height);
    this.needsRecalculation = true;
  }

  protected applyCameraSize(width: number, height: number): void {
    this.camera.near = -MAX_Z_INDEX;
    this.camera.far = 0;
    this.camera.bottom = 0;
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();
  }

  protected rebuildLayerConstraints(width: number, height: number): void {
    if (this.constraintX) {
      this.solver?.removeConstraint(this.constraintX);
      this.constraintX = undefined;
    }
    if (this.constraintY) {
      this.solver?.removeConstraint(this.constraintY);
      this.constraintY = undefined;
    }
    if (this.constraintW) {
      this.solver?.removeConstraint(this.constraintW);
      this.constraintW = undefined;
    }
    if (this.constraintH) {
      this.solver?.removeConstraint(this.constraintH);
      this.constraintH = undefined;
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
      width,
      Strength.required,
    );

    this.constraintH = new Constraint(
      new Expression(this[heightSymbol]),
      Operator.Eq,
      height,
      Strength.required,
    );

    this.solver?.addConstraint(this.constraintX);
    this.solver?.addConstraint(this.constraintY);
    this.solver?.addConstraint(this.constraintW);
    this.solver?.addConstraint(this.constraintH);
  }

  protected updateOrientation(width: number, height: number): void {
    const lastOrientation = this.orientationPrivate;
    this.orientationPrivate =
      width > height ? UIOrientation.LANDSCAPE : UIOrientation.PORTRAIT;

    if (lastOrientation !== this.orientationPrivate) {
      this.solver = undefined;

      for (const constraint of this.constraints.keys()) {
        constraint[enableConstraintSymbol](this.orientationPrivate);
      }
      for (const constraint of this.constraints.keys()) {
        constraint[disableConstraintSymbol](this.orientationPrivate);
      }

      this.solver = new Solver();
      const descriptions = [
        ...this.elements.values(),
        ...this.constraints.values(),
      ];

      for (const description of descriptions) {
        for (const [key, value] of description.variables.entries()) {
          this.solver.addEditVariable(key, value.strength);
          this.solver.suggestValue(key, value.suggestedValue);
        }
      }

      if (this.constraintX) {
        this.solver.addConstraint(this.constraintX);
      }
      if (this.constraintY) {
        this.solver.addConstraint(this.constraintY);
      }
      if (this.constraintW) {
        this.solver.addConstraint(this.constraintW);
      }
      if (this.constraintH) {
        this.solver.addConstraint(this.constraintH);
      }

      for (const dependency of this.constraints.values()) {
        for (const constraint of dependency.constraints.values()) {
          this.solver.addConstraint(constraint);
        }
      }
    }
  }
}
