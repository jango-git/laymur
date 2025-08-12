export class UIExpression {
  public constant: number;
  private readonly terms: Map<number, number>;

  constructor(constant = 0, terms?: [number, number][]) {
    this.constant = constant;
    this.terms = terms ? new Map(terms) : new Map();
  }

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

  public plus(variableIndex: number, coefficient: number): this {
    this.terms.set(
      variableIndex,
      (this.terms.get(variableIndex) ?? 0) + coefficient,
    );
    return this;
  }

  public minus(variableIndex: number, coefficient: number): this {
    return this.plus(variableIndex, -coefficient);
  }

  public multiply(value: number): this {
    this.constant *= value;
    for (const [variableIndex, coefficient] of this.terms) {
      this.terms.set(variableIndex, coefficient * value);
    }
    return this;
  }

  public divide(value: number): this {
    return this.multiply(1 / value);
  }

  public hasTerm(variableIndex: number): boolean {
    return this.terms.has(variableIndex);
  }

  public copy(expression: UIExpression): this {
    this.constant = expression.constant;
    this.terms.clear();
    for (const [variableIndex, coefficient] of expression.terms) {
      this.terms.set(variableIndex, coefficient);
    }
    return this;
  }

  public clone(): UIExpression {
    return new UIExpression(this.constant, Array.from(this.terms.entries()));
  }

  protected ["prepareTermsInternal"](): [number, number][] {
    return Array.from(this.terms.entries());
  }
}
