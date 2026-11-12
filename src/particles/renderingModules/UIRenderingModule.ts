import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared.js";

/**
 * Base class for particle rendering modules.
 *
 * The source defines `vec4 draw()`; the colors of all rendering modules are multiplied. It reads
 * `p_uv`, uniforms and properties as `p_<name>`, and builtin values through the `PARTICLE_*`
 * macros, which are cheaper than reading `p_builtin` as a whole. Uniforms belong to the module:
 * the emitter renames them per module, so modules of one type keep their own values.
 */
export abstract class UIRenderingModule {
  /** Per-particle properties the source reads, by name and type */
  public readonly requiredProperties?: Record<string, UIPropertyName>;
  /** Uniforms the source reads, as `p_<name>`; names must be GLSL identifiers */
  public abstract readonly requiredUniforms: Record<string, UIProperty>;
  /** GLSL source defining `vec4 draw()` */
  public abstract readonly source: string;

  public destroy?(): void;
}
