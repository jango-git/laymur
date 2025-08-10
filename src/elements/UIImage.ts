import type { Texture } from "three";
import { Mesh } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIMaterial } from "../materials/UIMaterial";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { geometry } from "../miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export class UIImage extends UIElement<Mesh> {
  private readonly material: UIMaterial;
  private readonly textureInternal: Texture;

  constructor(layer: UILayer, texture: Texture, x = 0, y = 0) {
    const w = texture.image.width;
    const h = texture.image.height;

    const material = new UIMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, x, y, w, h, object);

    this.material = material;
    this.textureInternal = texture;
  }

  public get texture(): Texture {
    return this.textureInternal;
  }

  public get color(): number {
    return this.material.getColor();
  }

  public get opacity(): number {
    return this.material.getOpacity();
  }

  public get transparency(): boolean {
    return this.material.getTransparency();
  }

  public set texture(value: Texture) {
    const w = value.image.width;
    const h = value.image.height;

    assertValidPositiveNumber(w, "W");
    assertValidPositiveNumber(h, "H");

    this.material.setTexture(value);
    this.solverWrapper.suggestVariableValue(this.wVariable, w);
    this.solverWrapper.suggestVariableValue(this.hVariable, h);
  }

  public set color(value: number) {
    this.material.setColor(value);
  }

  public set opacity(value: number) {
    this.material.setOpacity(value);
  }

  public set transparency(value: boolean) {
    this.material.setTransparency(value);
  }

  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }
}
