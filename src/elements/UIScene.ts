// import type { Camera, WebGLRenderer } from "three";
// import {
//   LinearFilter,
//   Mesh,
//   PerspectiveCamera,
//   RGBAFormat,
//   Scene,
//   UnsignedByteType,
//   WebGLRenderTarget,
// } from "three";
// import type { UILayer } from "../layers/UILayer";
// import { UIMaterial } from "../materials/UIMaterial";
// import { assertTextureSize } from "../miscellaneous/asserts";
// import { geometry } from "../miscellaneous/threeInstances";
// import { UIElement } from "./UIElement";

// /**
//  * Defines when a UIScene should be rendered/updated.
//  */
// export enum UISceneUpdateMode {
//   /** Scene is rendered on every frame */
//   ALWAYS = "always",
//   /** Scene is rendered when any property changes */
//   PROPERTY_CHANGED = "property_changed",
//   /** Scene is only rendered when explicitly requested */
//   MANUAL = "manual",
// }

// /** Default factor for reducing render target resolution (0.5 = half resolution) */
// const DEFAULT_RESOLUTION_FACTOR = 0.5;
// /** Minimum allowed resolution factor */
// const MIN_RESOLUTION_FACTOR = 0.1;
// /** Maximum allowed resolution factor */
// const MAX_RESOLUTION_FACTOR = 8;
// /** Default width for the scene if not specified */
// const DEFAULT_WIDTH = 512;
// /** Default height for the scene if not specified */
// const DEFAULT_HEIGHT = 512;
// /** Default field of view for the perspective camera in degrees */
// const DEFAULT_FOV = 75;
// /** Default near plane distance for the perspective camera */
// const DEFAULT_NEAR = 0.1;
// /** Default far plane distance for the perspective camera */
// const DEFAULT_FAR = 100;
// /** Default update mode for the scene */
// const DEFAULT_UPDATE_MODE = UISceneUpdateMode.PROPERTY_CHANGED;
// /** Default clear color (black) */
// const DEFAULT_CLEAR_COLOR = 0x000000;
// /** Default clear alpha (fully transparent) */
// const DEFAULT_CLEAR_ALPHA = 0;
// /** Whether the scene is rendered immediately by default */
// const DEFAULT_RENDERED_BY_DEFAULT = false;
// /** Whether to use a depth buffer by default */
// const DEFAULT_USE_DEPTH = true;

// /**
//  * Options for customizing the UIScene element.
//  */
// export interface UISceneOptions {
//   /** Three.js scene to render */
//   scene: Scene;
//   /** Camera to use for rendering the scene */
//   camera: Camera;
//   /** Width of the scene viewport in pixels */
//   width: number;
//   /** Height of the scene viewport in pixels */
//   height: number;
//   /** Resolution scaling factor for performance optimization */
//   resolutionFactor: number;
//   /** Whether the scene should be rendered immediately after creation */
//   renderedByDefault: boolean;
//   /** Whether to use a depth buffer for rendering */
//   useDepth: boolean;
//   /** Color to clear the scene with before rendering */
//   clearColor: number;
//   /** Alpha value for the clear color (0-1) */
//   clearAlpha: number;
//   /** When the scene should be automatically re-rendered */
//   updateBehavior: UISceneUpdateMode;
// }

// /**
//  * A UI element that renders a Three.js scene as a texture.
//  * This allows 3D content to be integrated into the 2D UI system.
//  */
// export class UIScene extends UIElement {
//   /** Material used to render the scene's render target */
//   private readonly material: UIMaterial;
//   /** WebGL render target where the scene is rendered */
//   private readonly renderTarget: WebGLRenderTarget;

//   /** Color to clear the scene with before rendering */
//   private clearColorInternal: number;
//   /** Alpha value for the clear color */
//   private clearAlphaInternal: number;

//   /** Whether the scene needs to be re-rendered on the next frame */
//   private needsRenderInternal = false;
//   /** When the scene should be automatically re-rendered */
//   private readonly updateModeInternal: UISceneUpdateMode;
//   /** Resolution scaling factor for performance optimization */
//   private resolutionFactorInternal: number;

//   /** The Three.js scene being rendered */
//   private sceneInternal: Scene;
//   /** The camera used for rendering the scene */
//   private cameraInternal: Camera;

//   /**
//    * Creates a new scene UI element.
//    *
//    * @param layer - The UI layer that contains this element
//    * @param options - Options to customize the scene
//    * @throws Error if resolution factor is out of valid range or dimensions are invalid
//    */
//   constructor(layer: UILayer, options: Partial<UISceneOptions> = {}) {
//     const resolutionFactor =
//       options.resolutionFactor ?? DEFAULT_RESOLUTION_FACTOR;

//     if (
//       resolutionFactor < MIN_RESOLUTION_FACTOR ||
//       resolutionFactor > MAX_RESOLUTION_FACTOR
//     ) {
//       throw new Error(
//         `Invalid resolution factor: ${resolutionFactor}. Must be between ${MIN_RESOLUTION_FACTOR} and ${MAX_RESOLUTION_FACTOR}.`,
//       );
//     }

//     const width = options.width ?? DEFAULT_WIDTH;
//     const height = options.height ?? DEFAULT_HEIGHT;

//     assertTextureSize(
//       width,
//       height,
//       `Invalid width or height: ${width}x${height}. Must be positive.`,
//     );

//     const renderTarget = new WebGLRenderTarget(
//       width * resolutionFactor,
//       height * resolutionFactor,
//       {
//         format: RGBAFormat,
//         minFilter: LinearFilter,
//         magFilter: LinearFilter,
//         type: UnsignedByteType,
//         depthBuffer: options.useDepth ?? DEFAULT_USE_DEPTH,
//         stencilBuffer: false,
//       },
//     );

//     const material = new UIMaterial(renderTarget.texture);
//     const object = new Mesh(geometry, material);

//     super(layer, object, 0, 0, width, height);

//     this.sceneInternal = options.scene ?? new Scene();
//     this.cameraInternal =
//       options.camera ??
//       new PerspectiveCamera(
//         DEFAULT_FOV,
//         width / height,
//         DEFAULT_NEAR,
//         DEFAULT_FAR,
//       );

//     this.resolutionFactorInternal = resolutionFactor;

//     this.updateModeInternal = options.updateBehavior ?? DEFAULT_UPDATE_MODE;

//     if (options.renderedByDefault ?? DEFAULT_RENDERED_BY_DEFAULT) {
//       this.needsRenderInternal = true;
//     }

//     this.clearColorInternal = options.clearColor ?? DEFAULT_CLEAR_COLOR;
//     this.clearAlphaInternal = options.clearAlpha ?? DEFAULT_CLEAR_ALPHA;

//     this.renderTarget = renderTarget;
//     this.material = material;

//     this.applyTransformations();
//   }

//   /** Gets whether the scene needs to be re-rendered on the next frame */
//   public get needsRender(): boolean {
//     return this.needsRenderInternal;
//   }

//   /** Gets the color tint applied to the rendered scene */
//   public get color(): number {
//     return this.material.getColor();
//   }

//   /** Gets the opacity of the rendered scene */
//   public get opacity(): number {
//     return this.material.getOpacity();
//   }

//   /** Gets the Three.js scene being rendered */
//   public get scene(): Scene {
//     return this.sceneInternal;
//   }

//   /** Gets the camera used for rendering the scene */
//   public get camera(): Camera {
//     return this.cameraInternal;
//   }

//   /** Gets the color used to clear the scene before rendering */
//   public get clearColor(): number {
//     return this.clearColorInternal;
//   }

//   /** Gets the alpha value for the clear color */
//   public get clearAlpha(): number {
//     return this.clearAlphaInternal;
//   }

//   /** Gets the resolution scaling factor */
//   public get resolutionFactor(): number {
//     return this.resolutionFactorInternal;
//   }

//   /**
//    * Sets the color tint applied to the rendered scene
//    * @param value - Color in hexadecimal format
//    */
//   public set color(value: number) {
//     this.material.setColor(value);
//     this.composerInternal.requestUpdate();
//   }

//   /**
//    * Sets the opacity of the rendered scene
//    * @param value - Opacity value between 0 (transparent) and 1 (opaque)
//    */
//   public set opacity(value: number) {
//     this.material.setOpacity(value);
//     this.composerInternal.requestUpdate();
//   }

//   /**
//    * Sets the Three.js scene to be rendered
//    * @param value - Scene to render
//    */
//   public set scene(value: Scene) {
//     if (this.sceneInternal !== value) {
//       this.sceneInternal = value;
//       if (this.updateModeInternal === UISceneUpdateMode.PROPERTY_CHANGED) {
//         this.requestRender();
//       }
//     }
//   }

//   /**
//    * Sets the camera used for rendering the scene
//    * @param value - Camera to use
//    */
//   public set camera(value: Camera) {
//     if (this.cameraInternal !== value) {
//       this.cameraInternal = value;
//       if (this.updateModeInternal === UISceneUpdateMode.PROPERTY_CHANGED) {
//         this.requestRender();
//       }
//     }
//   }

//   /**
//    * Sets the color used to clear the scene before rendering
//    * @param value - Clear color in hexadecimal format
//    */
//   public set clearColor(value: number) {
//     if (this.clearColorInternal !== value) {
//       this.clearColorInternal = value;
//       if (this.updateModeInternal === UISceneUpdateMode.PROPERTY_CHANGED) {
//         this.requestRender();
//       }
//     }
//   }

//   /**
//    * Sets the alpha value for the clear color
//    * @param value - Alpha value between 0 (transparent) and 1 (opaque)
//    */
//   public set clearAlpha(value: number) {
//     if (this.clearAlphaInternal !== value) {
//       this.clearAlphaInternal = value;
//       if (this.updateModeInternal === UISceneUpdateMode.PROPERTY_CHANGED) {
//         this.requestRender();
//       }
//     }
//   }

//   /**
//    * Sets the resolution scaling factor
//    * @param value - Resolution factor (e.g., 0.5 for half resolution)
//    */
//   public set resolutionFactor(value: number) {
//     if (this.resolutionFactorInternal !== value) {
//       this.resolutionFactorInternal = value;
//       this.renderTarget.setSize(
//         this.width * this.resolutionFactorInternal,
//         this.height * this.resolutionFactorInternal,
//       );
//       if (this.updateModeInternal === UISceneUpdateMode.PROPERTY_CHANGED) {
//         this.requestRender();
//       }
//     }
//   }

//   /**
//    * Destroys the scene element, disposing of all resources and removing it from the layer.
//    * This should be called when the element is no longer needed.
//    */
//   public override destroy(): void {
//     this.material.dispose();
//     this.renderTarget.dispose();
//     super.destroy();
//   }

//   /**
//    * Requests that the scene be re-rendered on the next frame.
//    * This is used when the scene is in MANUAL update mode or when properties change.
//    */
//   public requestRender(): void {
//     this.needsRenderInternal = true;
//     this.composerInternal.requestUpdate();
//   }

//   /**
//    * Renders the scene element.
//    * This will render the Three.js scene to a texture if needed,
//    * then apply that texture to the mesh.
//    *
//    * @param renderer - The WebGL renderer
//    */
//   protected override render(renderer: WebGLRenderer): void {
//     if (
//       this.needsRenderInternal ||
//       this.updateModeInternal === UISceneUpdateMode.ALWAYS
//     ) {
//       this.needsRenderInternal = false;
//       this.renderTarget.setSize(
//         this.width * this.resolutionFactorInternal,
//         this.height * this.resolutionFactorInternal,
//       );
//       renderer.setClearColor(this.clearColorInternal, this.clearAlpha);
//       renderer.setRenderTarget(this.renderTarget);
//       renderer.clear(true, true, false);
//       renderer.render(this.sceneInternal, this.cameraInternal);
//     }

//     (this.object as Mesh).material = this.composerInternal.compose(
//       renderer,
//       this.width * this.resolutionFactorInternal,
//       this.height * this.resolutionFactorInternal,
//       this.material,
//     );
//     this.applyTransformations();
//   }
// }
