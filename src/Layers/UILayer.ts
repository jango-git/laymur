import { Eventail } from "eventail";
import {
  Constraint,
  Expression,
  Operator,
  Solver,
  Strength,
  Variable,
} from "kiwi.js";
import type { Object3D, WebGLRenderer } from "three";
import { Color, OrthographicCamera, Scene } from "three";
import type { UIConstraint } from "../Constraints/UIConstraint";
import { UIAnchor } from "../Elements/UIAnchor";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraintSymbol,
  addUIConstraintSymbol,
  addUIElementSymbol,
  addVariableSymbol,
  clickSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  heightSymbol,
  needsRecalculation,
  removeConstraintSymbol,
  removeUIConstraintSymbol,
  removeUIElementSymbol,
  removeVariableSymbol,
  renderSymbol,
  sortSymbol,
  suggestVariableSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import { UIMode } from "../Miscellaneous/UIMode";
import { UIOrientation } from "../Miscellaneous/UIOrientation";

const clearColor = new Color(0x000000);

interface VariableDescription {
  strength: number;
  suggestedValue: number;
}

interface UIElementDescription {
  object?: Object3D;
  variables: Map<Variable, VariableDescription>;
  constraints: Set<UIConstraint>;
}

interface UIConstraintDescription {
  elements: Set<UIElement | UIAnchor>;
  variables: Map<Variable, VariableDescription>;
  constraints: Set<Constraint>;
}

export enum UILayerEvent {
  ORIENTATION_CHANGED = "orientation_changed",
  CLICK = "click",
}

export abstract class UILayer extends Eventail {
  public mode = UIMode.VISIBLE;

  public readonly [xSymbol]: Variable = new Variable();
  public readonly [ySymbol]: Variable = new Variable();
  public readonly [widthSymbol]: Variable = new Variable();
  public readonly [heightSymbol]: Variable = new Variable();

  protected readonly scene = new Scene();
  protected readonly camera = new OrthographicCamera();
  protected solver? = new Solver();

  protected elements = new Map<UIElement | UIAnchor, UIElementDescription>();
  protected constraints = new Map<UIConstraint, UIConstraintDescription>();

  protected constraintX?: Constraint;
  protected constraintY?: Constraint;
  protected constraintW?: Constraint;
  protected constraintH?: Constraint;

  protected orientationPrivate = UIOrientation.PORTRAIT;
  protected needsRecalculation = false;

  public get orientation(): UIOrientation {
    return this.orientationPrivate;
  }

  public get width(): number {
    return this[widthSymbol].value();
  }

  public get height(): number {
    return this[heightSymbol].value();
  }

  public destroy(): void {
    this.solver = undefined;
    for (const constraint of this.constraints.keys()) {
      constraint.destroy();
    }
    for (const element of this.elements.keys()) {
      element.destroy();
    }
  }

  public [addUIElementSymbol](
    element: UIElement | UIAnchor,
    object?: Object3D,
    renderOrder?: number,
  ): void {
    if (this.elements.has(element)) {
      throw new Error("Element already added");
    }

    this.elements.set(element, {
      object,
      variables: new Map(),
      constraints: new Set(),
    });

    if (object) {
      const zIndex = renderOrder ?? this.scene.children.length;

      object.position.z = zIndex;
      object.renderOrder = zIndex;

      this.scene.add(object);
      this[sortSymbol]();
    }
  }

  public [removeUIElementSymbol](element: UIElement | UIAnchor): void {
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

    this.elements.delete(element);
    if (dependencies.object) {
      this.scene.remove(dependencies.object);
    }
  }

  public [addUIConstraintSymbol](
    constraint: UIConstraint,
    elements: Set<UIElement | UIAnchor>,
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
    try {
      this.solver?.addConstraint(constraint);
    } catch {
      this.rebuildSolver();
    }
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
    try {
      this.solver?.removeConstraint(constraint);
    } catch {
      this.rebuildSolver();
    }
    this.needsRecalculation = true;
  }

  public [addVariableSymbol](
    owner: UIElement | UIAnchor | UIConstraint,
    variable: Variable,
    strength: number,
  ): void {
    const dependencies =
      owner instanceof UIElement || owner instanceof UIAnchor
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

    try {
      this.solver?.addEditVariable(variable, strength);
    } catch {
      this.rebuildSolver();
    }
    this.needsRecalculation = true;
  }

  public [removeVariableSymbol](
    owner: UIElement | UIAnchor | UIConstraint,
    variable: Variable,
  ): void {
    const dependencies =
      owner instanceof UIElement || owner instanceof UIAnchor
        ? this.elements.get(owner)
        : this.constraints.get(owner);

    if (dependencies === undefined) {
      throw new Error("Before removing variable you need to add it's owner");
    }

    if (!dependencies.variables.has(variable)) {
      throw new Error("Variable does not exist");
    }

    dependencies.variables.delete(variable);
    try {
      this.solver?.removeEditVariable(variable);
    } catch {
      this.rebuildSolver();
    }
    this.needsRecalculation = true;
  }

  public [suggestVariableSymbol](
    owner: UIElement | UIAnchor | UIConstraint,
    variable: Variable,
    value: number,
  ): void {
    const dependencies =
      owner instanceof UIElement || owner instanceof UIAnchor
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
      try {
        this.solver?.suggestValue(variable, value);
      } catch {
        this.rebuildSolver();
      }
      this.needsRecalculation = true;
    }
  }

  public [sortSymbol](): void {
    this.scene.children.sort(
      (a: Object3D, b: Object3D) => a.position.z - b.position.z,
    );

    for (let i = 0; i < this.scene.children.length; i++) {
      const child = this.scene.children[i];
      child.position.z = i;
      child.renderOrder = i;
    }

    const gap = 1;

    this.camera.position.set(0, 0, this.scene.children.length + gap);
    this.camera.near = 1;
    this.camera.far = this.scene.children.length + gap + gap;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrix();
  }

  public render(renderer: WebGLRenderer, deltaTime: number): void {
    if (this.mode === UIMode.HIDDEN) {
      return;
    }

    const originalRenderTarget = renderer.getRenderTarget();
    const originalClearColor = renderer.getClearColor(clearColor);
    const originalClearAlpha = renderer.getClearAlpha();

    if (this.needsRecalculation) {
      this.needsRecalculation = false;
      this.solver?.updateVariables();

      for (const element of this.elements.keys()) {
        element[needsRecalculation] = true;
      }
    }

    for (const element of this.elements.keys()) {
      element[renderSymbol](renderer, deltaTime);
    }

    renderer.setRenderTarget(originalRenderTarget);
    renderer.setClearColor(originalClearColor);
    renderer.setClearAlpha(originalClearAlpha);
    renderer.render(this.scene, this.camera);
  }

  protected clickInternal(x: number, y: number): void {
    if (this.mode !== UIMode.INTERACTIVE) {
      return;
    }

    this.emit(UILayerEvent.CLICK, this, x, y);

    const elements = [...this.elements.keys()]
      .filter((e: UIElement | UIAnchor) => e instanceof UIElement)
      .filter((e: UIElement) => e.mode === UIMode.INTERACTIVE)
      .sort((a: UIElement, b: UIElement) => a.zIndex - b.zIndex);

    for (const element of elements) {
      if (element[clickSymbol](x, y)) {
        break;
      }
    }
  }

  protected resizeInternal(width: number, height: number): void {
    this.applyCameraSize(width, height);
    this.rebuildLayerConstraints(width, height);
    this.updateOrientation(width, height);
    this.needsRecalculation = true;
  }

  protected applyCameraSize(width: number, height: number): void {
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

      this.emit(UILayerEvent.ORIENTATION_CHANGED, this, this.orientation);
    }
  }

  private rebuildSolver(): void {
    try {
      this.solver = undefined;

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
    } catch (error) {
      throw error;
    }
  }
}
