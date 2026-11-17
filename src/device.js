import { UIViewport } from "laymur";
import { WebGLRenderer } from "three";

import { camera, space, updateSpace } from "./space.js";

export const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
window.addEventListener("resize", () => renderer.setSize(window.innerWidth, window.innerHeight));

/**
 * The screen of the simulated device. Its size is the size of the device in CSS pixels, while on
 * the page it is drawn scaled into `rect`, so input positions are scaled back.
 */
export class DeviceViewport extends UIViewport {
  constructor(width, height) {
    super();
    this.widthInternal = width;
    this.heightInternal = height;
    this.rect = { left: 0, top: 0, width, height };
  }

  get width() {
    return this.widthInternal;
  }

  get height() {
    return this.heightInternal;
  }

  resize(width, height) {
    if (width !== this.widthInternal || height !== this.heightInternal) {
      this.widthInternal = width;
      this.heightInternal = height;
      this.signalResizedInternal.emit();
    }
  }

  toLocal(clientX, clientY, result) {
    const { left, top, width, height } = this.rect;
    result.x = ((clientX - left) / width) * this.widthInternal;
    result.y = ((top + height - clientY) / height) * this.heightInternal;
    return result;
  }

  destroyInternal() {}
}

export function renderDevice(viewport, layer, deltaTime) {
  const { left, top, width, height } = viewport.rect;
  const bottom = window.innerHeight - top - height;
  updateSpace(deltaTime, width / height);
  renderer.setViewport(left, bottom, width, height);
  renderer.setScissor(left, bottom, width, height);
  renderer.setScissorTest(true);
  renderer.setClearColor(0x000000);
  renderer.clear();
  renderer.render(space, camera);
  layer.render(renderer, deltaTime);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
}
