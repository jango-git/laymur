import type { Object3D, WebGLRenderer } from "three";
import {
  Color,
  Matrix2,
  Matrix3,
  Matrix4,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import { UIColor } from "../miscellaneous/UIColor";
import type { UISceneWrapperClientAPI } from "../miscellaneous/UISceneWrapperClientAPI";
import { UITransparencyMode } from "../miscellaneous/UITransparencyMode";
import fragmentShader from "../shaders/UIPlane.fs";
import vertexShader from "../shaders/UIPlane.vs";

const DEFAULT_ALPHA_TEST = 0.25;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Constructor type needs to accept any arguments for generic type mapping
type Constructor = new (...args: any[]) => any;

const UNIFROM_TYPE_MAP = new Map<Constructor, string>([
  [UIColor, "vec4"],
  [Color, "vec3"],
  [Texture, "sampler2D"],
  [Vector2, "vec2"],
  [Vector3, "vec3"],
  [Vector4, "vec4"],
  [Matrix2, "mat2"],
  [Matrix3, "mat3"],
  [Matrix4, "mat4"],
]);

type UIPropertyType =
  | UIColor
  | Color
  | Texture
  | Vector2
  | Vector3
  | Vector4
  | Matrix2
  | Matrix3
  | Matrix4;

function buildUniformDeclaraction(name: string, value: unknown): string {
  if (typeof value === "number") {
    return `uniform float ${name};`;
  }
  for (const [objectType, glslType] of UNIFROM_TYPE_MAP) {
    if (value instanceof objectType) {
      return `uniform ${glslType} ${name};`;
    }
  }
  throw new Error(`Unsupported uniform type for key "${name}"`);
}

const Z_LIMIT = 1024;
const GEOMETRY_SIZE = 1;
const GEOMETRY_OFFSET = GEOMETRY_SIZE / 2;

export const geometry = new PlaneGeometry(
  GEOMETRY_SIZE,
  GEOMETRY_SIZE,
).translate(GEOMETRY_OFFSET, GEOMETRY_OFFSET, 0);

let originalClearColor: Color = new Color();
let originalClearAlpha = 0;
let originalAutoClear = false;
let originalAutoClearColor = false;
let originalAutoClearDepth = false;
let originalAutoClearStencil = false;

interface Descriptor {
  plane: Mesh;
  material: ShaderMaterial;
}

export class UISceneWrapper implements UISceneWrapperClientAPI {
  private readonly scene = new Scene();
  private readonly camera: OrthographicCamera;

  private readonly descriptors = new Map<number, Descriptor>();
  private lastPlaneIndex = 0;

  constructor(w: number, h: number) {
    this.camera = new OrthographicCamera(0, w, h, 0, -Z_LIMIT, Z_LIMIT);
  }

  public createPlane(
    source: string,
    uniforms: Record<string, UIPropertyType>,
  ): number {
    const entries = Object.entries(uniforms);
    const material = new ShaderMaterial({
      uniforms: {
        alphaTest: { value: DEFAULT_ALPHA_TEST },
        ...Object.fromEntries(
          entries.map(([k, v]) => [
            k,
            {
              value: v instanceof UIColor ? new Vector4(v.r, v.g, v.b, v.a) : v,
            },
          ]),
        ),
      },
      vertexShader,
      fragmentShader:
        fragmentShader +
        entries.map(([k, v]) => buildUniformDeclaraction(k, v)).join("\n") +
        source,
      transparent: false,
      alphaTest: DEFAULT_ALPHA_TEST,
      alphaHash: false,
      lights: false,
      fog: false,
      depthWrite: false,
      depthTest: true,
    });

    const plane = new Mesh(geometry, material);
    plane.frustumCulled = false;
    plane.matrixAutoUpdate = false;
    this.scene.add(plane);

    const index = this.lastPlaneIndex++;
    this.descriptors.set(index, { plane, material });

    return index;
  }

  public destroyPlane(handler: number): this {
    const descriptor = this.resolveDescriptor(handler);
    this.scene.remove(descriptor.plane);
    this.descriptors.delete(handler);
    return this;
  }

  public setTransform(handler: number, value: Matrix4): this {
    const descriptor = this.resolveDescriptor(handler);
    descriptor.plane.matrix.copy(value);
    descriptor.plane.matrixWorldNeedsUpdate = true;
    return this;
  }

  public setUniform(
    handler: number,
    uniform: string,
    value: UIPropertyType,
  ): this {
    const descriptor = this.resolveDescriptor(handler);
    if (!(uniform in descriptor.material.uniforms)) {
      throw new Error(`Uniform ${uniform} not found in material`);
    }
    if (value instanceof UIColor) {
      descriptor.material.uniforms[uniform].value.set(
        value.r,
        value.g,
        value.b,
        value.a,
      );
    } else {
      descriptor.material.uniforms[uniform].value = value;
    }
    return this;
  }

  public setTransparency(handler: number, mode: UITransparencyMode): this {
    const descriptor = this.resolveDescriptor(handler);
    if (mode === UITransparencyMode.BLEND) {
      descriptor.material.transparent = true;
      descriptor.material.alphaTest = 0;
      descriptor.material.uniforms["alphaTest"].value = 0;
      descriptor.material.alphaHash = false;
    } else if (mode === UITransparencyMode.CLIP) {
      descriptor.material.transparent = false;
      descriptor.material.alphaTest = DEFAULT_ALPHA_TEST;
      descriptor.material.uniforms["alphaTest"].value = DEFAULT_ALPHA_TEST;
      descriptor.material.alphaHash = false;
    } else {
      descriptor.material.transparent = false;
      descriptor.material.alphaTest = 0;
      descriptor.material.uniforms["alphaTest"].value = 0;
      descriptor.material.alphaHash = true;
    }
    descriptor.material.uniformsNeedUpdate = true;
    descriptor.material.needsUpdate = true;
    return this;
  }

  public setVisibility(handler: number, visible: boolean): this {
    const descriptor = this.resolveDescriptor(handler);
    descriptor.plane.visible = visible;
    return this;
  }

  public insertCustomObject(object: Object3D): this {
    this.scene.add(object);
    return this;
  }

  public removeCustomObject(object: Object3D): this {
    this.scene.remove(object);
    return this;
  }

  public resize(width: number, height: number): this {
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();
    return this;
  }

  public render(renderer: WebGLRenderer): this {
    originalClearColor = renderer.getClearColor(originalClearColor);
    originalClearAlpha = renderer.getClearAlpha();
    originalAutoClear = renderer.autoClear;
    originalAutoClearColor = renderer.autoClearColor;
    originalAutoClearDepth = renderer.autoClearDepth;
    originalAutoClearStencil = renderer.autoClearStencil;

    renderer.autoClear = false;
    renderer.autoClearColor = false;
    renderer.autoClearDepth = false;
    renderer.autoClearStencil = false;
    renderer.setClearColor(0x000000, 1);

    renderer.clear(false, true, true);
    renderer.render(this.scene, this.camera);

    renderer.setClearColor(originalClearColor);
    renderer.setClearAlpha(originalClearAlpha);
    renderer.autoClear = originalAutoClear;
    renderer.autoClearColor = originalAutoClearColor;
    renderer.autoClearDepth = originalAutoClearDepth;
    renderer.autoClearStencil = originalAutoClearStencil;
    return this;
  }

  private resolveDescriptor(handler: number): Descriptor {
    const descriptor = this.descriptors.get(handler);
    if (!descriptor) {
      throw new Error(`No descriptor found for handler ${handler}`);
    }
    return descriptor;
  }
}
