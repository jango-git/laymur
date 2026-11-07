import type { IUniform, WebGLRenderer } from "three";
import { GLSL3, Material, RawShaderMaterial, ShaderMaterial, Vector3, Vector4 } from "three";
import maskSource from "../../shaders/UIMask.js";
import type { UIMask } from "./UIMask.js";
import {
  MASK_DATA_MODE_OFFSET,
  MASK_DATA_ROW0_OFFSET,
  MASK_DATA_ROW1_OFFSET,
  MASK_DATA_SHAPE_OFFSET,
  MASK_MODE_DISABLED,
} from "./UIMask.Internal.js";

/** The part of the three.js shader object the patch rewrites */
interface PatchedShader {
  uniforms: Record<string, IUniform>;
  vertexShader: string;
  fragmentShader: string;
}

type CompileCallback = (shader: PatchedShader, renderer: WebGLRenderer) => void;

interface MaskUniforms {
  laymurMaskRow0: IUniform<Vector3>;
  laymurMaskRow1: IUniform<Vector3>;
  laymurMaskShape: IUniform<Vector4>;
  laymurMaskMode: IUniform<number>;
}

/**
 * Patch state of a material, kept for the life of the material. The uniforms belong to the
 * material: three.js binds them once per compiled program, and reuses cached programs without
 * calling onBeforeCompile again.
 */
interface MaterialState {
  /** Patch updating the uniforms; null once removed, with the mask turned off */
  owner: UIMaskMaterialPatch | null;
  uniforms: MaskUniforms;
  /** The callback installed as onBeforeCompile, to notice when it is replaced */
  patchedCompile: CompileCallback;
  /** customProgramCacheKey of the material before it was patched */
  baseCacheKey: () => string;
}

/** Matches `void main()` and `void main(void)` */
const MAIN_PATTERN = /\bvoid\s+main\s*\(\s*(?:void)?\s*\)/g;

const ORIGINAL_MAIN = "void laymurMaskOriginalMain()";

const VERTEX_HEADER = `
uniform vec3 laymurMaskRow0;
uniform vec3 laymurMaskRow1;
varying vec2 laymurMaskLocal;
`;

const VERTEX_FOOTER = `
void main() {
    laymurMaskOriginalMain();
    vec3 laymurMaskPoint = vec3((modelMatrix * vec4(position, 1.0)).xy, 1.0);
    laymurMaskLocal = vec2(
        dot(laymurMaskRow0, laymurMaskPoint),
        dot(laymurMaskRow1, laymurMaskPoint)
    );
}
`;

const FRAGMENT_HEADER = `
uniform vec4 laymurMaskShape;
uniform float laymurMaskMode;
varying vec2 laymurMaskLocal;
${maskSource}
`;

const FRAGMENT_FOOTER = `
void main() {
    laymurMaskOriginalMain();
    if (laymurMaskMode > -0.5) {
        float laymurCoverage = laymurMaskCoverage(laymurMaskLocal, laymurMaskShape, laymurMaskMode);
        #ifdef OPAQUE
            // Without blending the edge cannot fade, so it is cut in the middle
            if (laymurCoverage < 0.5) discard;
        #else
            if (laymurCoverage <= 0.0) discard;
            #ifdef PREMULTIPLIED_ALPHA
                gl_FragColor *= laymurCoverage;
            #else
                gl_FragColor.a *= laymurCoverage;
            #endif
        #endif
    }
}
`;

const CACHE_KEY_SUFFIX = "|laymur-mask";

const MATERIAL_STATES = new WeakMap<Material, MaterialState>();

function countMains(code: string): number {
  return code.match(MAIN_PATTERN)?.length ?? 0;
}

function renameMain(code: string, subject: string): string {
  if (countMains(code) !== 1) {
    throw new Error(`${subject}: expected exactly one main() function in the shader`);
  }
  return code.replace(MAIN_PATTERN, ORIGINAL_MAIN);
}

function assertPatchable(material: Material, subject: string): void {
  if (material instanceof RawShaderMaterial) {
    throw new Error(`${subject}: RawShaderMaterial has no three.js prefix to rely on`);
  }
  if (material instanceof ShaderMaterial) {
    if (material.glslVersion === GLSL3) {
      throw new Error(`${subject}: GLSL3 shaders are not supported, use the default version`);
    }
    if (countMains(material.vertexShader) !== 1 || countMains(material.fragmentShader) !== 1) {
      throw new Error(`${subject}: expected exactly one main() function in each shader`);
    }
  }
}

function createUniforms(): MaskUniforms {
  return {
    laymurMaskRow0: { value: new Vector3() },
    laymurMaskRow1: { value: new Vector3() },
    laymurMaskShape: { value: new Vector4() },
    laymurMaskMode: { value: MASK_MODE_DISABLED },
  };
}

/**
 * Wraps the current onBeforeCompile of the material.
 * @returns The installed callback
 */
function install(
  material: Material,
  uniforms: MaskUniforms,
  baseCacheKey: () => string,
): CompileCallback {
  const previousCompile: CompileCallback = material.onBeforeCompile;

  const patchedCompile: CompileCallback = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      VERTEX_HEADER +
      renameMain(shader.vertexShader, "UIMaskMaterialPatch.vertexShader") +
      VERTEX_FOOTER;
    shader.fragmentShader =
      FRAGMENT_HEADER +
      renameMain(shader.fragmentShader, "UIMaskMaterialPatch.fragmentShader") +
      FRAGMENT_FOOTER;
  };

  material.onBeforeCompile = patchedCompile;
  // The default key is the source of onBeforeCompile, which would now be the same wrapper for
  // materials patched over different callbacks; keep the key they had before
  material.customProgramCacheKey = (): string =>
    (baseCacheKey === Material.prototype.customProgramCacheKey
      ? previousCompile.toString()
      : baseCacheKey.call(material)) + CACHE_KEY_SUFFIX;

  if (material instanceof ShaderMaterial) {
    // fwidth on WebGL1 (three.js before r163); built-in materials fall back to world units
    material.extensions.derivatives = true;
    material.defines = { ...material.defines };
    material.defines["LAYMUR_MASK_DERIVATIVES"] = "";
  }

  material.needsUpdate = true;
  return patchedCompile;
}

/**
 * Applies a UIMask to three.js materials that laymur does not build itself, such as those of a
 * Spine skeleton or a custom object placed among the planes.
 *
 * The patch wraps the main() functions of the shaders: the vertex shader computes the
 * mask-local position from the model matrix and the position attribute, the fragment shader
 * scales the output by the mask coverage (all of it for premultiplied alpha, alpha only
 * otherwise; opaque materials are cut at the middle of the edge). One {@link update} per
 * frame serves every material of the patch.
 *
 * A patched shader stays patched for the life of the material: {@link remove} only turns its
 * mask off, so nothing is recompiled. Not supported: RawShaderMaterial, GLSL3 shaders, and
 * GPU-side vertex transforms such as InstancedMesh, skinning or morphing, since the mask is
 * evaluated at the position attribute; Spine skeletons are deformed on the CPU and work.
 *
 * ```ts
 * const patch = new UIMaskMaterialPatch();
 * patch.apply(material);       // once per material, safe to repeat
 * patch.update(element.mask);  // every frame, before rendering
 * patch.destroy();             // turns the mask off on every material
 * ```
 */
export class UIMaskMaterialPatch {
  private readonly materials = new Set<Material>();
  private appliedMask: UIMask | null = null;
  private appliedVersion = -1;

  /**
   * Patches the material. Does nothing if this patch already patched it, unless its
   * onBeforeCompile was replaced since, in which case the new one is wrapped as well.
   * @param material Material whose shaders get the mask
   * @throws If another patch owns the material, or the material is not supported
   */
  public apply(material: Material): void {
    const subject = "UIMaskMaterialPatch.apply.material";
    const state = MATERIAL_STATES.get(material);

    if (state === undefined) {
      assertPatchable(material, subject);
      const uniforms = createUniforms();
      const baseCacheKey = material.customProgramCacheKey;
      MATERIAL_STATES.set(material, {
        owner: this,
        uniforms,
        patchedCompile: install(material, uniforms, baseCacheKey),
        baseCacheKey,
      });
    } else {
      if (state.owner !== null && state.owner !== this) {
        throw new Error(`${subject}: owned by another UIMaskMaterialPatch`);
      }
      if (material.onBeforeCompile !== state.patchedCompile) {
        assertPatchable(material, subject);
        state.patchedCompile = install(material, state.uniforms, state.baseCacheKey);
      }
      state.owner = this;
    }

    if (!this.materials.has(material)) {
      this.materials.add(material);
      // The material gets the current mask on the next update
      this.appliedVersion = -1;
    }
  }

  /**
   * Turns the mask off on the material and stops updating it. The shader stays patched, so
   * another patch can take the material over without a recompile.
   * Does nothing if this patch does not own the material.
   */
  public remove(material: Material): void {
    const state = MATERIAL_STATES.get(material);
    if (state?.owner !== this) {
      return;
    }

    state.owner = null;
    state.uniforms.laymurMaskMode.value = MASK_MODE_DISABLED;
    this.materials.delete(material);
  }

  /**
   * Writes the mask into the uniforms of every patched material; null turns masking off.
   * Call it every frame before rendering: the mask follows its source.
   */
  public update(mask: UIMask | null): void {
    if (mask !== this.appliedMask) {
      this.appliedMask = mask;
      this.appliedVersion = -1;
    }

    if (mask === null || mask.destroyed) {
      for (const material of this.materials) {
        this.resolveUniforms(material).laymurMaskMode.value = MASK_MODE_DISABLED;
      }
      return;
    }

    mask.resolve();
    if (mask.version === this.appliedVersion) {
      return;
    }
    this.appliedVersion = mask.version;

    const data = mask.data;
    for (const material of this.materials) {
      const uniforms = this.resolveUniforms(material);
      uniforms.laymurMaskRow0.value.fromArray(data, MASK_DATA_ROW0_OFFSET);
      uniforms.laymurMaskRow1.value.fromArray(data, MASK_DATA_ROW1_OFFSET);
      uniforms.laymurMaskShape.value.fromArray(data, MASK_DATA_SHAPE_OFFSET);
      uniforms.laymurMaskMode.value = data[MASK_DATA_MODE_OFFSET];
    }
  }

  /** Turns the mask off on every material of the patch */
  public destroy(): void {
    for (const material of [...this.materials]) {
      this.remove(material);
    }
    this.appliedMask = null;
  }

  private resolveUniforms(material: Material): MaskUniforms {
    const state = MATERIAL_STATES.get(material);
    if (state === undefined) {
      throw new Error(`UIMaskMaterialPatch.resolveUniforms.material: material is not patched`);
    }
    return state.uniforms;
  }
}
