import { Strength } from "kiwi.js";

export enum UIConstraintPower {
  p0 = 0,
  p1 = 1,
  p2 = 2,
  p3 = 3,
  p4 = 4,
  p5 = 5,
  p6 = 6,
  p7 = 7,
}

export function powerToStrength(power?: UIConstraintPower): number {
  switch (power) {
    case UIConstraintPower.p0:
      return Strength.create(1000, 1000, 1000);
    case UIConstraintPower.p1:
      return Strength.create(100, 0, 0);
    case UIConstraintPower.p2:
      return Strength.create(10, 0, 0);
    case UIConstraintPower.p3:
      return Strength.create(0, 100, 0);
    case UIConstraintPower.p4:
      return Strength.create(0, 10, 0);
    case UIConstraintPower.p5:
      return Strength.create(0, 0, 100);
    case UIConstraintPower.p6:
      return Strength.create(0, 0, 10);
    case UIConstraintPower.p7:
      return Strength.create(0, 0, 1);
    default:
      return Strength.create(1000, 1000, 1000);
  }
}
