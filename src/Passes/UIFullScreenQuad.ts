import type { Material, WebGLRenderer } from "three";
import { Mesh, OrthographicCamera, Scene } from "three";
import { geometry } from "../Miscellaneous/threeInstances";

const scene = new Scene();
const mesh = new Mesh(geometry);
scene.add(mesh);

export class UIFullScreenQuad {
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor(
    private materialInternal?: Material,
    private paddingHorizontalInternal = 0,
    private paddingVerticalInternal = 0,
  ) {
    this.updateCameraTransform();
  }

  public get paddingHorizontal(): number {
    return this.paddingHorizontalInternal;
  }

  public get paddingVertical(): number {
    return this.paddingVerticalInternal;
  }

  public get material(): Material | undefined {
    return this.materialInternal;
  }

  public set paddingHorizontal(value: number) {
    if (this.paddingHorizontalInternal !== value) {
      this.paddingHorizontalInternal = value;
      this.updateCameraTransform();
    }
  }

  public set paddingVertical(value: number) {
    if (this.paddingVerticalInternal !== value) {
      this.paddingVerticalInternal = value;
      this.updateCameraTransform();
    }
  }

  public set material(value: Material) {
    this.materialInternal = value;
  }

  public render(renderer: WebGLRenderer, material?: Material): void {
    const currentMaterial = material ?? this.materialInternal;
    if (!currentMaterial) {
      throw new Error("You cannot render without a material");
    }

    mesh.material = currentMaterial;
    renderer.render(scene, this.camera);
  }

  private updateCameraTransform(): void {
    this.camera.left = -this.paddingHorizontalInternal;
    this.camera.right = 1 + this.paddingHorizontalInternal;
    this.camera.bottom = -this.paddingVerticalInternal;
    this.camera.top = 1 + this.paddingVerticalInternal;
    this.camera.updateProjectionMatrix();
  }
}
