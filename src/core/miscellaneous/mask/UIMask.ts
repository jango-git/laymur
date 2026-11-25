import type { Texture } from "three";
import { Matrix4 } from "three";

import type { UIDummy } from "../../elements/UIDummy/UIDummy.js";
import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { assertNotDestroyed } from "../asserts.js";
import type { MaskSourceFrame, UIMaskOptions, UIMaskProgram } from "./UIMask.Internal.js";
import { MASK_DEFAULT_INVERTED, MASK_DEFAULT_USE_MICRO } from "./UIMask.Internal.js";

const TEMP_TRANSFORM = new Matrix4();
const TEMP_FRAME: MaskSourceFrame = {
  originX: 0,
  originY: 0,
  axisXx: 0,
  axisXy: 0,
  axisYx: 0,
  axisYy: 0,
};

/**
 * Tells an element from a layer without importing UIDummy as a value, which would also fail
 * for an element of another copy of laymur
 */
function isElementSource(source: UIDummy | UILayer): source is UIDummy {
  return "computeVisualTransform" in source;
}

/**
 * Base of the masks that follow the rectangle of a source element or layer.
 *
 * Elements are masked by assigning the mask to their `mask` property; one mask can serve any
 * number of elements of the same layer. The mask is computed in the shader, so masked elements
 * keep batching together and no stencil buffer is needed.
 *
 * Lifetime follows the rules of constraints: destroying the source destroys the mask, and a
 * destroyed mask is taken off every element it masked.
 */
export abstract class UIMask {
  /** Layer of the source; only elements of this layer can use the mask */
  public readonly layer: UILayer;

  /**
   * How the mask is evaluated on a plane.
   * @internal
   */
  public readonly program: UIMaskProgram;

  private invertedInternal: boolean;
  private useMicroInternal: boolean;

  private readonly consumers = new Set<UIDummy>();
  private readonly dataInternal: Float32Array;
  private readonly nextData: Float32Array;
  private samplerTextureInternal: Texture | null = null;
  private versionInternal = 0;
  private destroyedInternal = false;

  /**
   * @param source - Element or layer whose rectangle the mask follows
   * @param program - How the mask is evaluated on a plane
   * @param options - Configuration options
   * @throws If the source is destroyed
   */
  protected constructor(
    public readonly source: UIDummy | UILayer,
    program: UIMaskProgram,
    options: Partial<UIMaskOptions>,
  ) {
    if (source.destroyed) {
      throw new Error(`UIMask.constructor.source: source is destroyed`);
    }

    this.layer = isElementSource(source) ? source.layer : source;
    this.program = program;
    this.dataInternal = new Float32Array(program.dataSize);
    this.nextData = new Float32Array(program.dataSize);
    this.invertedInternal = options.inverted ?? MASK_DEFAULT_INVERTED;
    this.useMicroInternal = options.useMicro ?? MASK_DEFAULT_USE_MICRO;

    this.layer.addMask(this);
  }

  /** Whether the mask is destroyed, by its own `destroy` or together with its source */
  public get destroyed(): boolean {
    return this.destroyedInternal;
  }

  /** Whether the mask keeps what is outside instead of what is inside */
  public get inverted(): boolean {
    return this.invertedInternal;
  }

  /** Whether the micro transform of the source moves the mask */
  public get useMicro(): boolean {
    return this.useMicroInternal;
  }

  /** Elements masked by this mask */
  public get elements(): readonly UIDummy[] {
    return [...this.consumers];
  }

  /**
   * Incremented whenever the packed data or the sampled texture changes.
   * @internal
   */
  public get version(): number {
    return this.versionInternal;
  }

  /**
   * Packed mask data laid out by the program, valid after {@link resolve}.
   * @internal
   */
  public get data(): Readonly<Float32Array> {
    return this.dataInternal;
  }

  /**
   * Texture the program samples, valid after {@link resolve}. Null for a program without one.
   * @internal
   */
  public get samplerTexture(): Texture | null {
    return this.samplerTextureInternal;
  }

  /** Whether the mask keeps what is outside instead of what is inside */
  public set inverted(value: boolean) {
    assertNotDestroyed(this, "mask", "UIMask.inverted");
    this.invertedInternal = value;
  }

  /** Whether the micro transform of the source moves the mask */
  public set useMicro(value: boolean) {
    assertNotDestroyed(this, "mask", "UIMask.useMicro");
    this.useMicroInternal = value;
  }

  /**
   * Takes the mask off every element and removes it from its layer.
   * Does nothing if the mask is already destroyed.
   */
  public destroy(): void {
    if (this.destroyedInternal) {
      return;
    }
    this.destroyedInternal = true;

    for (const consumer of [...this.consumers]) {
      consumer.releaseMask(this);
    }
    this.consumers.clear();
    this.layer.removeMask(this);
  }

  /**
   * Brings the packed data and the sampled texture up to date with the source, bumping the
   * version on a change. Cheap enough to be done by every masked element every frame, so it is
   * never a frame late.
   * @internal
   */
  public resolve(): void {
    const data = this.nextData;
    const samplerTexture = this.computeData(data);

    let changed = samplerTexture !== this.samplerTextureInternal;
    for (let i = 0; !changed && i < data.length; i++) {
      changed = !Object.is(this.dataInternal[i], data[i]);
    }

    if (changed) {
      this.dataInternal.set(data);
      this.samplerTextureInternal = samplerTexture;
      this.versionInternal++;
    }
  }

  /**
   * Whether a point in layer coordinates may reach a masked element.
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Overridden by masks that clip input
  public acceptsInputAt(x: number, y: number): boolean {
    return true;
  }

  /** @internal */
  public attach(consumer: UIDummy): void {
    this.consumers.add(consumer);
  }

  /** @internal */
  public detach(consumer: UIDummy): void {
    this.consumers.delete(consumer);
  }

  /**
   * Reads the rectangle of the source as drawn, with its micro transform if `useMicro` is set.
   * @returns The rectangle, valid until the next call, or null if the source has no area
   */
  protected computeSourceFrame(): Readonly<MaskSourceFrame> | null {
    const source = this.source;
    const width = source.width;
    const height = source.height;

    if (!(width > 0 && height > 0)) {
      return null;
    }

    const result = TEMP_FRAME;
    if (isElementSource(source)) {
      const e = source.computeVisualTransform(this.useMicroInternal, TEMP_TRANSFORM).elements;
      result.axisXx = e[0];
      result.axisXy = e[1];
      result.axisYx = e[4];
      result.axisYy = e[5];
      result.originX = e[12];
      result.originY = e[13];
    } else {
      result.axisXx = width;
      result.axisXy = 0;
      result.axisYx = 0;
      result.axisYy = height;
      result.originX = source.x;
      result.originY = source.y;
    }
    return result;
  }

  /**
   * Writes the packed data of the current state.
   * @returns Texture the program samples, null for a program without one
   */
  protected abstract computeData(data: Float32Array): Texture | null;
}
