import { MathUtils } from "three";
import type { UIElement } from "../Elements/UIElement";
import { needsRecalculation } from "./symbols";

const DEFAULT_POSITION = 0;
const DEFAULT_ANCHOR = 0.5;
const DEFAULT_SCALE = 1;
const DEFAULT_ROTATION = 0;

export class UIMicroTransformations {
  public [needsRecalculation] = false;

  private positionXInternal = DEFAULT_POSITION;
  private positionYInternal = DEFAULT_POSITION;
  private anchorXInternal = DEFAULT_ANCHOR;
  private anchorYInternal = DEFAULT_ANCHOR;
  private scaleXInternal = DEFAULT_SCALE;
  private scaleYInternal = DEFAULT_SCALE;
  private rotationInternal = DEFAULT_ROTATION;

  constructor(private readonly owner: UIElement) {}

  public get x(): number {
    return this.positionXInternal;
  }

  public get y(): number {
    return this.positionYInternal;
  }

  public get anchorX(): number {
    return this.anchorXInternal;
  }

  public get anchorY(): number {
    return this.anchorYInternal;
  }

  public get scaleX(): number {
    return this.scaleXInternal;
  }

  public get scaleY(): number {
    return this.scaleYInternal;
  }

  public get angle(): number {
    return MathUtils.radToDeg(this.rotationInternal);
  }

  public get rotation(): number {
    return this.rotationInternal;
  }

  public set x(value: number) {
    this.positionXInternal = value;
    this[needsRecalculation] = true;
  }

  public set y(value: number) {
    this.positionYInternal = value;
    this[needsRecalculation] = true;
  }

  public set anchorX(value: number) {
    this.anchorXInternal = value;
    this[needsRecalculation] = true;
  }

  public set anchorY(value: number) {
    this.anchorYInternal = value;
    this[needsRecalculation] = true;
  }

  public set scaleX(value: number) {
    this.scaleXInternal = value;
    this[needsRecalculation] = true;
  }

  public set scaleY(value: number) {
    this.scaleYInternal = value;
    this[needsRecalculation] = true;
  }

  public set angle(value: number) {
    this.rotationInternal = MathUtils.degToRad(value);
    this[needsRecalculation] = true;
  }

  public set rotation(value: number) {
    this.rotationInternal = value;
    this[needsRecalculation] = true;
  }

  public setAnchorByGlobalPosition(x: number, y: number): void {
    const deltaX = x - this.owner.x;
    const deltaY = y - this.owner.y;
    this.anchorXInternal = deltaX / this.owner.width;
    this.anchorYInternal = deltaY / this.owner.height;
    this[needsRecalculation] = true;
  }

  public reset(): void {
    this.positionXInternal = DEFAULT_POSITION;
    this.positionYInternal = DEFAULT_POSITION;
    this.anchorXInternal = DEFAULT_ANCHOR;
    this.anchorYInternal = DEFAULT_ANCHOR;
    this.scaleXInternal = DEFAULT_SCALE;
    this.scaleYInternal = DEFAULT_SCALE;
    this.rotationInternal = DEFAULT_ROTATION;
    this[needsRecalculation] = true;
  }
}
