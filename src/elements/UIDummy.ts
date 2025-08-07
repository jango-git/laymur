import { Object3D } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIElement } from "./UIElement";

/**
 * Default size for dummy elements when no dimensions are specified
 */
const DEFAULT_DUMMY_SIZE = 100;

/**
 * A minimal UI element with no visual representation.
 * Used as a placeholder, spacer, or container for other elements.
 */
export class UIDummy extends UIElement {
  /**
   * Creates a new dummy UI element.
   *
   * @param layer - The UI layer that contains this element
   * @param width - Width of the dummy element (defaults to DEFAULT_DUMMY_SIZE)
   * @param height - Height of the dummy element (defaults to DEFAULT_DUMMY_SIZE)
   */
  constructor(
    layer: UILayer,
    width = DEFAULT_DUMMY_SIZE,
    height = DEFAULT_DUMMY_SIZE,
  ) {
    super(layer, new Object3D(), 0, 0, width, height);
    this.applyTransformations();
  }

  /**
   * Renders the dummy element.
   * Since dummies have no visual representation, this only applies transformations.
   */
  protected override render(): void {
    this.applyTransformations();
  }
}
