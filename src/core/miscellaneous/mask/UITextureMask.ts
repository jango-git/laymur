import type { Texture } from "three";
import { Matrix3 } from "three";

import type { UIDummy } from "../../elements/UIDummy/UIDummy.js";
import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { assertNotDestroyed, assertValidNonNegativeNumber, assertValidNumber } from "../asserts.js";
import type { UITextureConfig } from "../texture/UITextureView.Internal.js";
import { UITextureView } from "../texture/UITextureView.js";
import { MASK_EMPTY_OFFSET } from "./UIMask.Internal.js";
import { UIMask } from "./UIMask.js";
import type { UITextureMaskChannel, UITextureMaskOptions } from "./UITextureMask.Internal.js";
import {
  TEXTURE_MASK_DATA_PARAMETERS_OFFSET,
  TEXTURE_MASK_DATA_ROW0_OFFSET,
  TEXTURE_MASK_DATA_ROW1_OFFSET,
  TEXTURE_MASK_DATA_UV_ROW0_OFFSET,
  TEXTURE_MASK_DATA_UV_ROW1_OFFSET,
  TEXTURE_MASK_DEFAULT_CHANNEL,
  TEXTURE_MASK_DEFAULT_SOFTNESS,
  TEXTURE_MASK_DEFAULT_THRESHOLD,
  TEXTURE_MASK_PROGRAM,
} from "./UITextureMask.Internal.js";

const TEMP_UV_TRANSFORM = new Matrix3();

/**
 * Mask taken from a texture or an atlas frame, stretched over the rectangle of the source as
 * an image of the source size would be, micro transform included. The frame can be replaced
 * at any time through `texture.set`, and elements masked by frames of the same atlas keep
 * batching together. Input is not clipped.
 */
export class UITextureMask extends UIMask {
  /** Texture or atlas frame holding the mask */
  public readonly texture: UITextureView;

  private channelInternal: UITextureMaskChannel;
  private thresholdInternal: number;
  private softnessInternal: number;

  /**
   * Creates a new UITextureMask instance.
   *
   * @param source - Element or layer whose rectangle the mask follows
   * @param texture - Texture or atlas frame holding the mask
   * @param options - Configuration options
   * @throws If the source is destroyed
   */
  constructor(
    source: UIDummy | UILayer,
    texture: UITextureConfig,
    options: Partial<UITextureMaskOptions> = {},
  ) {
    const threshold = options.threshold ?? TEXTURE_MASK_DEFAULT_THRESHOLD;
    const softness = options.softness ?? TEXTURE_MASK_DEFAULT_SOFTNESS;
    assertValidNumber(threshold, "UITextureMask.constructor.options.threshold");
    assertValidNonNegativeNumber(softness, "UITextureMask.constructor.options.softness");

    super(source, TEXTURE_MASK_PROGRAM, options);

    this.texture = new UITextureView(texture);
    this.channelInternal = options.channel ?? TEXTURE_MASK_DEFAULT_CHANNEL;
    this.thresholdInternal = threshold;
    this.softnessInternal = softness;
  }

  /** Texture channel holding the mask */
  public get channel(): UITextureMaskChannel {
    return this.channelInternal;
  }

  /** Mask value at the middle of the edge */
  public get threshold(): number {
    return this.thresholdInternal;
  }

  /** Width of the edge in mask values, centered on the threshold */
  public get softness(): number {
    return this.softnessInternal;
  }

  /** Texture channel holding the mask */
  public set channel(value: UITextureMaskChannel) {
    assertNotDestroyed(this, "mask", "UITextureMask.channel");
    this.channelInternal = value;
  }

  /** Mask value at the middle of the edge */
  public set threshold(value: number) {
    assertNotDestroyed(this, "mask", "UITextureMask.threshold");
    assertValidNumber(value, "UITextureMask.threshold");
    this.thresholdInternal = value;
  }

  /** Width of the edge in mask values, centered on the threshold */
  public set softness(value: number) {
    assertNotDestroyed(this, "mask", "UITextureMask.softness");
    assertValidNonNegativeNumber(value, "UITextureMask.softness");
    this.softnessInternal = value;
  }

  protected computeData(data: Float32Array): Texture | null {
    data[TEXTURE_MASK_DATA_PARAMETERS_OFFSET] = this.channelInternal;
    data[TEXTURE_MASK_DATA_PARAMETERS_OFFSET + 1] = this.thresholdInternal;
    data[TEXTURE_MASK_DATA_PARAMETERS_OFFSET + 2] = this.softnessInternal;
    data[TEXTURE_MASK_DATA_PARAMETERS_OFFSET + 3] = this.inverted ? 1 : 0;

    const view = this.texture;
    const frame = this.computeSourceFrame();
    const determinant =
      frame === null ? 0 : frame.axisXx * frame.axisYy - frame.axisYx * frame.axisXy;

    // A source with no area puts every point outside of the frame
    if (frame === null || Math.abs(determinant) < Number.EPSILON) {
      data.fill(0, 0, TEXTURE_MASK_DATA_PARAMETERS_OFFSET);
      data[TEXTURE_MASK_DATA_ROW0_OFFSET + 2] = MASK_EMPTY_OFFSET;
      data[TEXTURE_MASK_DATA_ROW1_OFFSET + 2] = MASK_EMPTY_OFFSET;
      return view.texture;
    }

    const { originX, originY, axisXx, axisXy, axisYx, axisYy } = frame;

    // The inverse of origin + u * axisX + v * axisY maps the layer onto the unit square of the
    // source. The trimmed frame spans [left, 1 - right] x [bottom, 1 - top] of that square and is
    // rescaled onto a unit square of its own.
    const trim = view.trim;
    const frameLeft = trim.left / view.width;
    const frameBottom = trim.bottom / view.height;
    const frameScaleU = 1 / (1 - (trim.left + trim.right) / view.width);
    const frameScaleV = 1 / (1 - (trim.top + trim.bottom) / view.height);

    const frameUPerX = (axisYy / determinant) * frameScaleU;
    const frameUPerY = (-axisYx / determinant) * frameScaleU;
    const frameUOffset = -(frameUPerX * originX + frameUPerY * originY) - frameLeft * frameScaleU;
    const frameVPerX = (-axisXy / determinant) * frameScaleV;
    const frameVPerY = (axisXx / determinant) * frameScaleV;
    const frameVOffset = -(frameVPerX * originX + frameVPerY * originY) - frameBottom * frameScaleV;

    data[TEXTURE_MASK_DATA_ROW0_OFFSET] = frameUPerX;
    data[TEXTURE_MASK_DATA_ROW0_OFFSET + 1] = frameUPerY;
    data[TEXTURE_MASK_DATA_ROW0_OFFSET + 2] = frameUOffset;
    data[TEXTURE_MASK_DATA_ROW1_OFFSET] = frameVPerX;
    data[TEXTURE_MASK_DATA_ROW1_OFFSET + 1] = frameVPerY;
    data[TEXTURE_MASK_DATA_ROW1_OFFSET + 2] = frameVOffset;

    // The UV transform of the frame (column-major elements) composed with the map above
    const uv = view.calculateUVTransform(TEMP_UV_TRANSFORM).elements;
    data[TEXTURE_MASK_DATA_UV_ROW0_OFFSET] = uv[0] * frameUPerX + uv[3] * frameVPerX;
    data[TEXTURE_MASK_DATA_UV_ROW0_OFFSET + 1] = uv[0] * frameUPerY + uv[3] * frameVPerY;
    data[TEXTURE_MASK_DATA_UV_ROW0_OFFSET + 2] =
      uv[0] * frameUOffset + uv[3] * frameVOffset + uv[6];
    data[TEXTURE_MASK_DATA_UV_ROW1_OFFSET] = uv[1] * frameUPerX + uv[4] * frameVPerX;
    data[TEXTURE_MASK_DATA_UV_ROW1_OFFSET + 1] = uv[1] * frameUPerY + uv[4] * frameVPerY;
    data[TEXTURE_MASK_DATA_UV_ROW1_OFFSET + 2] =
      uv[1] * frameUOffset + uv[4] * frameVOffset + uv[7];

    return view.texture;
  }
}
