import type { Camera, Object3D, WebGLRenderer } from "three";

/** Three r158 added `compileAsync`; the peer range still admits r157 */
type CompileAsync = (object: Object3D, camera: Camera) => Promise<unknown>;

/**
 * Compiles the programs of every material under an object. Three builds them during the call,
 * from the state of the renderer at that moment, such as the current render target.
 * @param renderer Renderer the object is drawn with
 * @param object Object to compile, with its descendants
 * @param camera Camera the object is drawn with
 * @returns Resolves once the programs are ready; on r157 it is resolved at once, after the
 *   synchronous build
 */
export function compileObject(
  renderer: WebGLRenderer,
  object: Object3D,
  camera: Camera,
): Promise<void> {
  const compileAsync = (renderer as { compileAsync?: CompileAsync }).compileAsync;
  if (compileAsync === undefined) {
    renderer.compile(object, camera);
    return Promise.resolve();
  }
  return compileAsync.call(renderer, object, camera).then(() => undefined);
}
