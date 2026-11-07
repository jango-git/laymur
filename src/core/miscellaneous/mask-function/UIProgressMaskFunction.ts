import type { UIProperty } from "../generic-plane/shared.js";

/**
 * Base class for progress bar fill functions.
 *
 * The GLSL source must define `float calculateMask()`, returning the fill (0..1) of the current
 * fragment; it can read `p_uv`, `p_progress`, `p_textureResolution` and every property returned
 * by {@link enumerateProperties} as `p_<name>`. Set `dirtyInternal` when a property changes.
 */
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

  /** Shader properties of the function, read in GLSL as `p_<name>` */
  public abstract enumerateProperties(): Record<string, UIProperty>;
}
