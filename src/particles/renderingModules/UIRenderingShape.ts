import { assertValidUnitNumber } from "../../core/miscellaneous/asserts.js";
import type { UIProperty } from "../../core/miscellaneous/generic-plane/shared.js";
import { toGLSLFloat } from "../miscellaneous/miscellaneous.js";
import { buildShapeSource } from "../shaders/UIRenderingShape.js";
import { UIRenderingModule } from "./UIRenderingModule.js";

/** Shapes of `UIRenderingShape`, each filling the particle quad */
export enum UIParticleShape {
  /** Disc touching the quad edges */
  CIRCLE = 0,
  /** Ring whose outer edge touches the quad edges */
  RING = 1,
  /** Four-point star with concave sides, its points at the quad edge centers */
  SPARKLE = 2,
}

/** Configuration options for UIRenderingShape */
export interface UIRenderingShapeOptions {
  /** Part of the shape that fades out toward its edge, from 0 (hard edge) to 1 */
  softness: number;
  /** Ring width as a part of the radius, from 0 to 1 */
  thickness: number;
}

/** Smallest softness: smoothstep is undefined for equal edges */
const SHAPE_MIN_SOFTNESS = 0.001;
/** Smallest ring thickness: the ring distance divides by it */
const SHAPE_MIN_THICKNESS = 0.001;
const SHAPE_DEFAULT_SOFTNESS = 0.2;
const SHAPE_DEFAULT_THICKNESS = 0.25;

/**
 * Renders particles as a white shape computed in the shader, without a texture. Color modules
 * tint it: the colors of all rendering modules are multiplied.
 */
export class UIRenderingShape extends UIRenderingModule {
  public readonly requiredUniforms: Record<string, UIProperty> = {};
  public readonly source: string;

  /**
   * @param shape - Shape to draw
   * @param options - Edge softness and ring thickness
   */
  constructor(shape: UIParticleShape, options: Partial<UIRenderingShapeOptions> = {}) {
    super();
    const softness = options.softness ?? SHAPE_DEFAULT_SOFTNESS;
    assertValidUnitNumber(softness, "UIRenderingShape.constructor.softness");
    const thickness = options.thickness ?? SHAPE_DEFAULT_THICKNESS;
    assertValidUnitNumber(thickness, "UIRenderingShape.constructor.thickness");
    this.source = buildShapeSource(
      buildDistanceExpression(shape, Math.max(thickness, SHAPE_MIN_THICKNESS)),
      Math.max(softness, SHAPE_MIN_SOFTNESS),
    );
  }
}

/** GLSL expression of the shape distance in `p`, 1 on the edge */
function buildDistanceExpression(shape: UIParticleShape, thickness: number): string {
  switch (shape) {
    case UIParticleShape.CIRCLE:
      return "length(p)";
    case UIParticleShape.RING: {
      // Distance from the ring's middle line, in half widths
      const halfWidth = toGLSLFloat(thickness / 2);
      return `abs(length(p) - (1.0 - ${halfWidth})) / ${halfWidth}`;
    }
    case UIParticleShape.SPARKLE:
      // sqrt|x| + sqrt|y| = 1 is an astroid-like star with its points on the axes
      return "sqrt(abs(p.x)) + sqrt(abs(p.y))";
  }
}
