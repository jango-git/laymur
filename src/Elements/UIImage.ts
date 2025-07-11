import type { Texture, WebGLRenderer } from "three";
import { Mesh } from "three";
import type { UILayer } from "../Layers/UILayer";
import { UIMaterial } from "../Materials/UIMaterial";
import { assertSize } from "../Miscellaneous/asserts";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIBlending } from "../Miscellaneous/UIBlending";
import { UIElement } from "./UIElement";

/**
 * A UI element that displays an image texture.
 * Renders a textured mesh using the provided texture.
 */

export class UIImage extends UIElement {
  /** Material used to render the image */
  private readonly material: UIMaterial;

  /** The texture displayed by this image */
  private readonly textureInternal: Texture;

  private blendingInternal: UIBlending = UIBlending.NORMAL;

  /**
   * Creates a new image UI element.
   *
   * @param layer - The UI layer that contains this element
   * @param texture - The texture to display
   * @throws Error if the texture has invalid dimensions
   */
  constructor(layer: UILayer, texture: Texture) {
    const width = texture.image?.width;
    const height = texture.image?.height;

    assertSize(
      width,
      height,
      `Invalid image dimensions - texture "${texture.name || "unnamed"}" has invalid width (${width}) or height (${height}). Image dimensions must be non-zero positive numbers.`,
    );

    const material = new UIMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, object, 0, 0, width, height);

    this.material = material;
    this.textureInternal = texture;

    this.applyTransformations();
  }

  /** Gets the texture displayed by this image */
  public get texture(): Texture {
    return this.textureInternal;
  }

  /** Gets the color tint applied to the image */
  public get color(): number {
    return this.material.getColor();
  }

  /** Gets the opacity of the image */
  public get opacity(): number {
    return this.material.getOpacity();
  }

  /** Gets the blending mode of the image */
  public get blending(): UIBlending {
    return this.blendingInternal;
  }

  /**
   * Sets the color tint applied to the image
   * @param value - Color in hexadecimal format
   */
  public set color(value: number) {
    this.material.setColor(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the opacity of the image
   * @param value - Opacity value between 0 (transparent) and 1 (opaque)
   */
  public set opacity(value: number) {
    this.material.setOpacity(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Sets the blending mode of the image
   * @param value - Blending mode to apply
   */
  public set blending(value: UIBlending) {
    this.blendingInternal = value;
    this.material.setBlending(value);
    this.composerInternal.requestUpdate();
  }

  /**
   * Destroys the image element, disposing of all resources and removing it from the layer.
   * This should be called when the element is no longer needed.
   */
  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }

  /**
   * Renders the image element.
   *
   * @param renderer - The WebGL renderer
   */
  protected override render(renderer: WebGLRenderer): void {
    (this.object as Mesh).material = this.composerInternal.compose(
      renderer,
      this.textureInternal.image.width,
      this.textureInternal.image.height,
      this.material,
    );
    this.applyTransformations();
  }
}
