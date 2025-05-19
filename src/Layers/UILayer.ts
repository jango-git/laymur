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
import { UIElement } from "../Elements/UIElement";
import { assertSize } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  addElementSymbol,
  addRawConstraintSymbol,
  addVariableSymbol,
  heightSymbol,
  removeConstraintSymbol,
  removeElementSymbol,
  removeRawConstraintSymbol,
  removeVariableSymbol,
  suggestVariableSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import { UIOrientation } from "../Miscellaneous/UIOrientation";

export abstract class UILayer {
  public readonly [xSymbol]: Variable = new Variable();
  public readonly [ySymbol]: Variable = new Variable();
  public readonly [widthSymbol]: Variable = new Variable();
  public readonly [heightSymbol]: Variable = new Variable();

  protected readonly scene = new Scene();
  protected readonly camera = new OrthographicCamera();
  protected readonly solver = new Solver();

  protected constraintX?: Constraint;
  protected constraintY?: Constraint;
  protected constraintW?: Constraint;
  protected constraintH?: Constraint;

  protected orientationPrivate = UIOrientation.portrait;

  public get orientation(): UIOrientation {
    return this.orientationPrivate;
  }

  protected fillConstraints(): void {
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

  public abstract destroy(): void;
  public abstract render(renderer: WebGLRenderer): void;

  public abstract [addElementSymbol](
    element: UIElement,
    object: Object3D,
  ): void;

  public abstract [removeElementSymbol](
    element: UIElement,
    raw: Object3D,
  ): void;

  public abstract [addConstraintSymbol](constraint: UIConstraint): void;

  public abstract [removeConstraintSymbol](constraint: UIConstraint): void;

  public abstract [addRawConstraintSymbol](constraint: Constraint): void;

  public abstract [removeRawConstraintSymbol](constraint: Constraint): void;

  public abstract [addVariableSymbol](
    variable: Variable,
    strength: number,
  ): void;

  public abstract [removeVariableSymbol](variable: Variable): void;

  public abstract [suggestVariableSymbol](
    variable: Variable,
    value: number,
  ): void;
}
