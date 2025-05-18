import { MathUtils } from "three";
import { readMicroSymbol } from "./symbols";

export interface UIMicroTransformable {
  [readMicroSymbol](): void;
}

export class UIMicroTransformations {
  private positionXPrivate = 0;
  private positionYPrivate = 0;
  private anchorXPrivate = 0.5;
  private anchorYPrivate = 0.5;
  private scaleXPrivate = 1;
  private scaleYPrivate = 1;
  private rotationPrivate = 0;

  public constructor(private readonly owner: UIMicroTransformable) {}

  public get x(): number {
    return this.positionXPrivate;
  }

  public get y(): number {
    return this.positionYPrivate;
  }

  public get anchorX(): number {
    return this.anchorXPrivate;
  }

  public get anchorY(): number {
    return this.anchorYPrivate;
  }

  public get scaleX(): number {
    return this.scaleXPrivate;
  }

  public get scaleY(): number {
    return this.scaleYPrivate;
  }

  public get angle(): number {
    return MathUtils.radToDeg(this.rotationPrivate);
  }

  public get rotation(): number {
    return this.rotationPrivate;
  }

  public set x(value: number) {
    this.positionXPrivate = value;
    this.owner[readMicroSymbol]();
  }

  public set y(value: number) {
    this.positionYPrivate = value;
    this.owner[readMicroSymbol]();
  }

  public set anchorX(value: number) {
    this.anchorXPrivate = value;
    this.owner[readMicroSymbol]();
  }

  public set anchorY(value: number) {
    this.anchorYPrivate = value;
    this.owner[readMicroSymbol]();
  }

  public set scaleX(value: number) {
    this.scaleXPrivate = value;
    this.owner[readMicroSymbol]();
  }

  public set scaleY(value: number) {
    this.scaleYPrivate = value;
    this.owner[readMicroSymbol]();
  }

  public set angle(value: number) {
    this.rotationPrivate = MathUtils.degToRad(value);
    this.owner[readMicroSymbol]();
  }

  public set rotation(value: number) {
    this.rotationPrivate = value;
    this.owner[readMicroSymbol]();
  }
}
