import { Strength } from "kiwi.js";

const HIGH_PRIORITY = 1000;
const MEDIUM_PRIORITY = 100;
const LOW_PRIORITY = 10;

export enum UIConstraintPower {
  P0,
  P1,
  P2,
  P3,
  P4,
  P5,
  P6,
  P7,
}

export function isUIConstraintPower(obj: unknown): obj is UIConstraintPower {
  return (
    obj !== null && Object.values(UIConstraintPower).some((v) => v === obj)
  );
}

export function resolvePower(power?: UIConstraintPower): UIConstraintPower {
  return power ?? UIConstraintPower.P0;
}

export function convertPowerToStrength(power?: UIConstraintPower): number {
  switch (power) {
    case UIConstraintPower.P0:
      return Strength.create(HIGH_PRIORITY, HIGH_PRIORITY, HIGH_PRIORITY);
    case UIConstraintPower.P1:
      return Strength.create(MEDIUM_PRIORITY, 0, 0);
    case UIConstraintPower.P2:
      return Strength.create(LOW_PRIORITY, 0, 0);
    case UIConstraintPower.P3:
      return Strength.create(0, MEDIUM_PRIORITY, 0);
    case UIConstraintPower.P4:
      return Strength.create(0, LOW_PRIORITY, 0);
    case UIConstraintPower.P5:
      return Strength.create(0, 0, MEDIUM_PRIORITY);
    case UIConstraintPower.P6:
      return Strength.create(0, 0, LOW_PRIORITY);
    case UIConstraintPower.P7:
      return Strength.create(0, 0, 1);
    default:
      return Strength.create(HIGH_PRIORITY, HIGH_PRIORITY, HIGH_PRIORITY);
  }
}
