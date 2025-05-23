import { UILayer } from "./UILayer";

export class UIManualLayer extends UILayer {
  public click(x: number, y: number): void {
    this.clickInternal(x, y);
  }

  public resize(width: number, height: number): void {
    this.resizeInternal(width, height);
  }
}
