import type { UIPropertyType } from "../generic-plane/shared";

export abstract class UIProgressMaskFunction {
  protected dirtyInternal = false;

  protected constructor(public readonly source: string) {}

  /** @internal */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /** @internal */
  public abstract enumerateProperties(): Record<string, UIPropertyType>;
}
