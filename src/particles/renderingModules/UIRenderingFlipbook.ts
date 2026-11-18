import { assertValidPositiveNumber } from "../../core/miscellaneous/asserts.js";
import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared.js";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal.js";
import { UITextureView } from "../../core/miscellaneous/texture/UITextureView.js";
import {
  assertValidNonNegativeInteger,
  buildIndexExpression,
  toGLSLFloat,
} from "../miscellaneous/miscellaneous.js";
import { buildFlipbookSource } from "../shaders/UIRenderingFlipbook.js";
import { UIRenderingModule } from "./UIRenderingModule.js";

/** How `UIRenderingFlipbook` picks the frame of a particle */
export enum UIFlipbookMode {
  /** Plays all frames once over the particle's life */
  LIFE = 0,
  /** Plays frames at a frame rate, looped */
  RATE = 1,
  /** One random frame for the whole life */
  RANDOM = 2,
}

const FLIPBOOK_DEFAULT_FRAME_RATE = 24;

/** Configuration options for UIRenderingFlipbook */
export interface UIRenderingFlipbookOptions {
  /** Number of frames, if the last row is not full. All cells by default. */
  frameCount: number;
  /** How the frame is picked */
  mode: UIFlipbookMode;
  /** Frames per second in RATE mode, 24 by default */
  frameRate: number;
  /** Whether each particle starts RATE playback at a random frame */
  randomStartFrame: boolean;
}

/**
 * Renders particles with frames of a sprite sheet: a grid of equal cells in one texture or atlas
 * region, read row by row from the top left.
 *
 * The frame is computed in the shader, so the number of frames costs no uniforms.
 */
export class UIRenderingFlipbook extends UIRenderingModule {
  public override readonly requiredProperties: Record<string, UIPropertyName> = {
    builtin: "Matrix4",
  };
  public readonly requiredUniforms: Record<string, UIProperty>;
  public readonly source: string;

  /**
   * @param config - Texture or atlas region holding the sheet
   * @param columns - Cells per row
   * @param rows - Rows of cells
   * @param options - Frame count and playback
   */
  constructor(
    config: UITextureConfig,
    columns: number,
    rows: number,
    options: Partial<UIRenderingFlipbookOptions> = {},
  ) {
    super();
    assertValidNonNegativeInteger(columns, "UIRenderingFlipbook.constructor.columns");
    assertValidPositiveNumber(columns, "UIRenderingFlipbook.constructor.columns");
    assertValidNonNegativeInteger(rows, "UIRenderingFlipbook.constructor.rows");
    assertValidPositiveNumber(rows, "UIRenderingFlipbook.constructor.rows");

    const frameCount = options.frameCount ?? columns * rows;
    assertValidNonNegativeInteger(frameCount, "UIRenderingFlipbook.constructor.frameCount");
    assertValidPositiveNumber(frameCount, "UIRenderingFlipbook.constructor.frameCount");
    if (frameCount > columns * rows) {
      throw new Error(
        `UIRenderingFlipbook.constructor.frameCount: ${frameCount} frames do not fit ${columns}x${rows} cells`,
      );
    }

    const frameRate = options.frameRate ?? FLIPBOOK_DEFAULT_FRAME_RATE;
    assertValidPositiveNumber(frameRate, "UIRenderingFlipbook.constructor.frameRate");

    const view = new UITextureView(config);
    this.requiredUniforms = {
      texture: view.texture,
      textureTransform: view.calculateUVTransform(),
    };
    this.source = buildFlipbookSource(
      buildFrameExpression(
        options.mode ?? UIFlipbookMode.LIFE,
        frameCount,
        frameRate,
        options.randomStartFrame === true,
      ),
      columns,
      rows,
    );
  }
}

/** GLSL expression of the frame number, a whole float in [0, frameCount) */
function buildFrameExpression(
  mode: UIFlipbookMode,
  frameCount: number,
  frameRate: number,
  randomStartFrame: boolean,
): string {
  switch (mode) {
    case UIFlipbookMode.LIFE:
      return buildIndexExpression("clamp(PARTICLE_AGE / PARTICLE_LIFETIME, 0.0, 1.0)", frameCount);
    case UIFlipbookMode.RANDOM:
      return buildIndexExpression("PARTICLE_RANDOM", frameCount);
    case UIFlipbookMode.RATE: {
      const count = toGLSLFloat(frameCount);
      const start = randomStartFrame ? ` + PARTICLE_RANDOM * ${count}` : "";
      // Frames played so far, wrapped. mod divides, and at mediump precision a quotient just
      // below a whole number gives the count itself, hence the clamp.
      return `floor(min(mod(floor(PARTICLE_AGE * ${toGLSLFloat(frameRate)}${start}), ${count}), ${count} - 0.5))`;
    }
  }
}
