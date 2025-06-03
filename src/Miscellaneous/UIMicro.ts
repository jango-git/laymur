import { MathUtils } from "three";
import type { UIElement } from "../Elements/UIElement";

const DEFAULT_POSITION = 0;
const DEFAULT_ANCHOR = 0.5;
const DEFAULT_SCALE = 1;
const DEFAULT_ROTATION = 0;

export class UIMicroInternal {
  public x = DEFAULT_POSITION;
  public y = DEFAULT_POSITION;
  public anchorX = DEFAULT_ANCHOR;
  public anchorY = DEFAULT_ANCHOR;
  public scaleX = DEFAULT_SCALE;
  public scaleY = DEFAULT_SCALE;
  public rotation = DEFAULT_ROTATION;
  public needsRecalculation = false;
}

export class UIMicro {
  constructor(
    private readonly raw: UIMicroInternal,
    private readonly owner: UIElement,
  ) {}

  public get x(): number {
    return this.raw.x;
  }

  public get y(): number {
    return this.raw.y;
  }

  public get anchorX(): number {
    return this.raw.anchorX;
  }

  public get anchorY(): number {
    return this.raw.anchorY;
  }

  public get scaleX(): number {
    return this.raw.scaleX;
  }

  public get scaleY(): number {
    return this.raw.scaleY;
  }

  public get angle(): number {
    return MathUtils.radToDeg(this.raw.rotation);
  }

  public get rotation(): number {
    return this.raw.rotation;
  }

  public set x(value: number) {
    if (value !== this.raw.x) {
      this.raw.x = value;
      this.raw.needsRecalculation = true;
    }
  }

  public set y(value: number) {
    if (value !== this.raw.y) {
      this.raw.y = value;
      this.raw.needsRecalculation = true;
    }
  }

  public set anchorX(value: number) {
    if (value !== this.raw.anchorX) {
      this.raw.anchorX = value;
      this.raw.needsRecalculation = true;
    }
  }

  public set anchorY(value: number) {
    if (value !== this.raw.anchorY) {
      this.raw.anchorY = value;
      this.raw.needsRecalculation = true;
    }
  }

  public set scaleX(value: number) {
    if (value !== this.raw.scaleX) {
      this.raw.scaleX = value;
      this.raw.needsRecalculation = true;
    }
  }

  public set scaleY(value: number) {
    if (value !== this.raw.scaleY) {
      this.raw.scaleY = value;
      this.raw.needsRecalculation = true;
    }
  }

  public set angle(value: number) {
    const convertedValue = MathUtils.degToRad(value);
    if (convertedValue !== this.raw.rotation) {
      this.raw.rotation = convertedValue;
      this.raw.needsRecalculation = true;
    }
  }

  public set rotation(value: number) {
    if (value !== this.raw.rotation) {
      this.raw.rotation = value;
      this.raw.needsRecalculation = true;
    }
  }

  public setAnchorByGlobalPosition(x: number, y: number): void {
    const deltaX = x - this.owner.x;
    const deltaY = y - this.owner.y;
    const newAnchorX = deltaX / this.owner.width;
    const newAnchorY = deltaY / this.owner.height;

    if (newAnchorX !== this.raw.anchorX || newAnchorY !== this.raw.anchorY) {
      this.raw.anchorX = newAnchorX;
      this.raw.anchorY = newAnchorY;
      this.raw.needsRecalculation = true;
    }
  }

  public reset(): void {
    if (
      this.raw.x !== DEFAULT_POSITION ||
      this.raw.y !== DEFAULT_POSITION ||
      this.raw.anchorX !== DEFAULT_ANCHOR ||
      this.raw.anchorY !== DEFAULT_ANCHOR ||
      this.raw.scaleX !== DEFAULT_SCALE ||
      this.raw.scaleY !== DEFAULT_SCALE ||
      this.raw.rotation !== DEFAULT_ROTATION
    ) {
      this.raw.x = DEFAULT_POSITION;
      this.raw.y = DEFAULT_POSITION;
      this.raw.anchorX = DEFAULT_ANCHOR;
      this.raw.anchorY = DEFAULT_ANCHOR;
      this.raw.scaleX = DEFAULT_SCALE;
      this.raw.scaleY = DEFAULT_SCALE;
      this.raw.rotation = DEFAULT_ROTATION;
      this.raw.needsRecalculation = true;
    }
  }
}
