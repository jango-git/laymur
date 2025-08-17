// import type { Material, WebGLRenderer } from "three";
// import { Mesh, OrthographicCamera, Scene } from "three";
// import { geometry } from "../miscellaneous/threeInstances";

// /**
//  * Shared scene and mesh used by all UIFullScreenQuad instances
//  * This optimization avoids creating multiple meshes for rendering quads
//  */
// const scene = new Scene();
// const mesh = new Mesh(geometry);
// scene.add(mesh);

// /**
//  * Utility class for rendering a full-screen quad with optional padding
//  * Used by the UI composition system to render passes
//  */
// export class UIFullscreenQuad {
//   /**
//    * Orthographic camera configured for device coordinates
//    * Adjusted when padding changes to ensure correct rendering with padding
//    */
//   private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

//   /**
//    * Creates a new UIFullScreenQuad
//    *
//    * @param paddingHorizontalInternal - Initial horizontal padding
//    * @param paddingVerticalInternal - Initial vertical padding
//    */
//   constructor(
//     private paddingHorizontalInternal = 0,
//     private paddingVerticalInternal = 0,
//   ) {
//     this.updateCameraTransform();
//   }

//   /**
//    * Gets the current horizontal padding
//    */
//   public get paddingHorizontal(): number {
//     return this.paddingHorizontalInternal;
//   }

//   /**
//    * Gets the current vertical padding
//    */
//   public get paddingVertical(): number {
//     return this.paddingVerticalInternal;
//   }

//   /**
//    * Sets the horizontal padding
//    * Updates the camera projection when changed
//    */
//   public set paddingHorizontal(value: number) {
//     if (this.paddingHorizontalInternal !== value) {
//       this.paddingHorizontalInternal = value;
//       this.updateCameraTransform();
//     }
//   }

//   /**
//    * Sets the vertical padding
//    * Updates the camera projection when changed
//    */
//   public set paddingVertical(value: number) {
//     if (this.paddingVerticalInternal !== value) {
//       this.paddingVerticalInternal = value;
//       this.updateCameraTransform();
//     }
//   }

//   /**
//    * Renders the fullscreen quad with the provided material
//    *
//    * @param renderer - The WebGL renderer to use
//    * @param material - The material to apply to the fullscreen quad
//    */
//   public render(renderer: WebGLRenderer, material: Material): void {
//     mesh.material = material;
//     renderer.render(scene, this.camera);
//   }

//   /**
//    * Updates the camera projection matrix to account for padding
//    * Expands the camera frustum to include the padded area
//    */
//   private updateCameraTransform(): void {
//     this.camera.left = -this.paddingHorizontalInternal;
//     this.camera.right = 1 + this.paddingHorizontalInternal;
//     this.camera.bottom = -this.paddingVerticalInternal;
//     this.camera.top = 1 + this.paddingVerticalInternal;
//     this.camera.updateProjectionMatrix();
//   }
// }
