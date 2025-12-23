import { assertValidNumber } from "./asserts";

/** Linear expression for constraint equations */
export class UIExpression {
  /** Constant term */
  public constant: number;
  /** Variable coefficients */
  private readonly terms: Map<number, number>;

  /**
   * @param constant Constant term
   * @param terms Variable-coefficient pairs
   */
  constructor(constant = 0, terms?: [number, number][]) {
    assertValidNumber(constant, "UIExpression.constructor.constant");
    this.constant = constant;
    this.terms = terms ? new Map(terms) : new Map();

    if (terms) {
      for (let i = 0; i < terms.length; i++) {
        assertValidNumber(
          terms[i][1],
          `UIExpression.constructor.terms[${i}][1]`,
        );
      }
    }
  }

  /**
   * Creates expression representing a + b.
   * @param a First expression
   * @param b Second expression
   * @returns Sum of expressions
   */
  public static plus(a: UIExpression, b: UIExpression): UIExpression {
    const result = new UIExpression(
      a.constant + b.constant,
      Array.from(a.terms.entries()),
    );
    for (const [variableIndex, coefficient] of b.terms) {
      result.plus(variableIndex, coefficient);
    }
    return result;
  }

  /**
   * Creates expression representing a - b.
   * @param a First expression
   * @param b Second expression
   * @returns Difference of expressions
   */
  public static minus(a: UIExpression, b: UIExpression): UIExpression {
    const result = new UIExpression(
      a.constant - b.constant,
      Array.from(a.terms.entries()),
    );
    for (const [variableIndex, coefficient] of b.terms) {
      result.minus(variableIndex, coefficient);
    }
    return result;
  }

  /**
   * Adds variable term to expression.
   * @param variableIndex Variable descriptor
   * @param coefficient Coefficient to add
   * @returns This instance for chaining
   */
  public plus(variableIndex: number, coefficient: number): this {
    assertValidNumber(coefficient, "UIExpression.plus.coefficient");
    this.terms.set(
      variableIndex,
      (this.terms.get(variableIndex) ?? 0) + coefficient,
    );
    return this;
  }

  /**
   * Subtracts variable term from expression.
   * @param variableIndex Variable descriptor
   * @param coefficient Coefficient to subtract
   * @returns This instance for chaining
   */
  public minus(variableIndex: number, coefficient: number): this {
    return this.plus(variableIndex, -coefficient);
  }

  /**
   * Multiplies all terms by scalar.
   * @param value Scalar multiplier
   * @returns This instance for chaining
   */
  public multiply(value: number): this {
    assertValidNumber(value, "UIExpression.multiply.value");
    this.constant *= value;
    for (const [variableIndex, coefficient] of this.terms) {
      this.terms.set(variableIndex, coefficient * value);
    }
    return this;
  }

  /**
   * Divides all terms by scalar.
   * @param value Scalar divisor
   * @returns This instance for chaining
   */
  public divide(value: number): this {
    assertValidNumber(value, "UIExpression.divide.value");
    if (value === 0) {
      throw new Error("UIExpression.divide.value: cannot divide by zero");
    }
    return this.multiply(1 / value);
  }

  /**
   * Checks if expression contains variable term.
   * @param variableIndex Variable descriptor
   * @returns True if variable has term
   */
  public hasTerm(variableIndex: number): boolean {
    return this.terms.has(variableIndex);
  }

  /**
   * Copies from another expression.
   * @param expression Source expression
   * @returns This instance for chaining
   */
  public copy(expression: UIExpression): this {
    this.constant = expression.constant;
    this.terms.clear();
    for (const [variableIndex, coefficient] of expression.terms) {
      this.terms.set(variableIndex, coefficient);
    }
    return this;
  }

  /**
   * Creates independent copy.
   * @returns New expression with same content
   */
  public clone(): UIExpression {
    return new UIExpression(this.constant, Array.from(this.terms.entries()));
  }

  /**
   * Prepares terms for solver.
   * @returns Variable-coefficient pairs
   * @internal
   */
  public prepareTerms(): [number, number][] {
    return Array.from(this.terms.entries());
  }
}
