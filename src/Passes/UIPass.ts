import type { Texture, WebGLRenderer } from "three";

export interface UIPassRenderOptions {
  width: number;
  height: number;
  padding: number;
}

export abstract class UIPass {
  public abstract get padding(): number;
  public abstract get needsUpdate(): boolean;
  public abstract render(
    renderer: WebGLRenderer,
    texture: Texture,
    parameters: UIPassRenderOptions,
  ): void;
}
