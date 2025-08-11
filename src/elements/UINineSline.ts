// import type { Texture, WebGLRenderer } from "three";
// import { Mesh } from "three";
// import type { UILayer } from "../layers/UILayer";
// import { UINineSliceMaterial } from "../materials/UINineSliceMaterial";
// import { geometry } from "../miscellaneous/threeInstances";
// import { UIElement } from "./UIElement";

// export class UINineSlice extends UIElement<Mesh> {
//   private readonly material: UINineSliceMaterial;
//   private readonly textureInternal: Texture;

//   constructor(layer: UILayer, texture: Texture, x = 0, y = 0) {
//     const w = texture.image.width;
//     const h = texture.image.height;

//     const material = new UINineSliceMaterial(texture);
//     const object = new Mesh(geometry, material);

//     super(layer, x, y, w, h, object);

//     this.material = material;
//     this.textureInternal = texture;
//   }

//   public override destroy(): void {
//     this.material.dispose();
//     super.destroy();
//   }

//   protected override ["onBeforeRenderInternal"](
//     renderer: WebGLRenderer,
//     deltaTime: number,
//   ): void {
//     void renderer;
//     void deltaTime;
//     this.material.setQuadSize(
//       this.width * this.micro.scaleX,
//       this.height * this.micro.scaleY,
//     );
//   }
// }
