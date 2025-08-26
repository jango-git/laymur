/**
 * Mathematical expression builder for constraint equations.
 *
 * Represents linear expressions of the form:
 * constant + coefficient₁ × variable₁ + coefficient₂ × variable₂ + ...
 *
 * Used to build constraint equations for the Kiwi solver. Variables are
 * referenced by their numeric descriptors from the solver system.
 *
 * @public
 */
export class UIExpression {
  /** The constant term of the expression. */
  public constant: number;
  /** @internal */
  private readonly terms: Map<number, number>;

  /**
   * Creates a UIExpression instance.
   *
   * @param constant - Constant term of the expression (defaults to 0)
   * @param terms - Array of [variableDescriptor, coefficient] pairs
   */
  constructor(constant = 0, terms?: [number, number][]) {
    this.constant = constant;
    this.terms = terms ? new Map(terms) : new Map();
  }

  /**
   * Creates an expression representing the sum of two expressions.
   *
   * Performs mathematical addition: (a.constant + a.terms) + (b.constant + b.terms)
   * Coefficients for the same variables are combined.
   *
   * @param a - First expression
   * @param b - Second expression
   * @returns New expression representing a + b
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
   * Creates an expression representing the difference of two expressions.
   *
   * Performs mathematical subtraction: (a.constant + a.terms) - (b.constant + b.terms)
   * Coefficients for the same variables are combined with subtraction.
   *
   * @param a - First expression (minuend)
   * @param b - Second expression (subtrahend)
   * @returns New expression representing a - b
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
   * Adds a variable term to this expression (mutating operation).
   *
   * If the variable already exists, its coefficient is increased by the
   * specified amount. Otherwise, a new term is added.
   *
   * @param variableIndex - Variable descriptor from the solver
   * @param coefficient - Coefficient to add for this variable
   * @returns This expression instance for method chaining
   */
  public plus(variableIndex: number, coefficient: number): this {
    this.terms.set(
      variableIndex,
      (this.terms.get(variableIndex) ?? 0) + coefficient,
    );
    return this;
  }

  /**
   * Subtracts a variable term from this expression (mutating operation).
   *
   * If the variable already exists, its coefficient is decreased by the
   * specified amount. Otherwise, a new term with negative coefficient is added.
   *
   * @param variableIndex - Variable descriptor from the solver
   * @param coefficient - Coefficient to subtract for this variable
   * @returns This expression instance for method chaining
   */
  public minus(variableIndex: number, coefficient: number): this {
    return this.plus(variableIndex, -coefficient);
  }

  /**
   * Multiplies all terms by a scalar value (mutating operation).
   *
   * Both the constant term and all variable coefficients are multiplied
   * by the specified value.
   *
   * @param value - Scalar value to multiply by
   * @returns This expression instance for method chaining
   */
  public multiply(value: number): this {
    this.constant *= value;
    for (const [variableIndex, coefficient] of this.terms) {
      this.terms.set(variableIndex, coefficient * value);
    }
    return this;
  }

  /**
   * Divides all terms by a scalar value (mutating operation).
   *
   * Both the constant term and all variable coefficients are divided
   * by the specified value.
   *
   * @param value - Scalar value to divide by (must not be zero)
   * @returns This expression instance for method chaining
   */
  public divide(value: number): this {
    return this.multiply(1 / value);
  }

  /**
   * Checks if the expression contains a term for the specified variable.
   *
   * @param variableIndex - Variable descriptor to check for
   * @returns True if the expression has a term for this variable
   */
  public hasTerm(variableIndex: number): boolean {
    return this.terms.has(variableIndex);
  }

  /**
   * Copies the content of another expression into this expression (mutating operation).
   *
   * Replaces all terms and the constant with those from the source expression.
   *
   * @param expression - Source expression to copy from
   * @returns This expression instance for method chaining
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
   * Creates a deep copy of this expression.
   *
   * The returned expression is independent and can be modified without
   * affecting the original.
   *
   * @returns New UIExpression instance with the same content
   */
  public clone(): UIExpression {
    return new UIExpression(this.constant, Array.from(this.terms.entries()));
  }

  /**
   * Prepares variable terms for internal solver operations.
   *
   * @returns Array of [variableDescriptor, coefficient] pairs
   * @internal
   */
  protected ["prepareTermsInternal"](): [number, number][] {
    return Array.from(this.terms.entries());
  }
}
