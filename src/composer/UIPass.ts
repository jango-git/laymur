// import type { Texture, WebGLRenderer } from "three";

// /**
//  * Options passed to a UIPass when rendering
//  */
// export interface UIPassRenderOptions {
//   /** Width of the render target in pixels (without padding) */
//   width: number;
//   /** Height of the render target in pixels (without padding) */
//   height: number;
//   /** Current horizontal padding used for the render target */
//   paddingHorizontal: number;
//   /** Current vertical padding used for the render target */
//   paddingVertical: number;
// }

// /**
//  * Abstract base class for all UI composition passes
//  *
//  * UI passes are used to apply post-processing effects to the rendered UI
//  * Each pass can be chained together in a UIComposer to create complex effects
//  */
// export abstract class UIPass {
//   /**
//    * The amount of horizontal padding in pixels this pass requires
//    * The compositor will use the maximum padding value from all passes
//    */
//   public abstract get paddingHorizontal(): number;

//   /**
//    * The amount of vertical padding in pixels this pass requires
//    * The compositor will use the maximum padding value from all passes
//    */
//   public abstract get paddingVertical(): number;

//   /**
//    * Whether this pass needs to be updated in the next frame
//    * Set to true when properties change to trigger a re-render
//    */
//   public abstract get needsUpdate(): boolean;

//   /**
//    * Whether this pass contributes a meaningful effect
//    * Passes that are not valuable may be skipped during composition
//    */
//   public abstract get isValuable(): boolean;

//   /**
//    * Renders this pass
//    *
//    * @param renderer - The WebGL renderer to use
//    * @param texture - The input texture from the previous pass
//    * @param options - Render options including dimensions and padding
//    */
//   public abstract render(
//     renderer: WebGLRenderer,
//     texture: Texture,
//     options: UIPassRenderOptions,
//   ): void;
// }
