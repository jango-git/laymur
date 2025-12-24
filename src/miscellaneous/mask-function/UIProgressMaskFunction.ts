import type { UIProperty } from "../generic-plane/shared";

/** Base class for progress bar fill functions */
export abstract class UIProgressMaskFunction {
  protected dirtyInternal = false;

  protected constructor(
    /** GLSL shader source code defining fill behavior */
    public readonly source: string,
  ) {}

  /** @internal */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /** @internal */
  public abstract enumerateProperties(): Record<string, UIProperty>;
}
