import { Strength } from "@lume/kiwi";

/**
 * Priority values for constraint strength calculation.
 * Higher values indicate stronger constraint enforcement.
 */
const HIGH_PRIORITY = 1000;
/**
 * Medium priority value for constraint strength calculation.
 */
const MEDIUM_PRIORITY = 100;
/**
 * Low priority value for constraint strength calculation.
 */
const LOW_PRIORITY = 10;

/**
 * Defines the strength/priority levels for UI constraints.
 *
 * Constraints with higher power (lower index) take precedence over
 * those with lower power when the constraint solver can't satisfy all constraints.
 *
 * The enum values map to different strength configurations in the Kiwi.js solver:
 * - P0: Highest priority, "required" constraint that must be satisfied
 * - P1-P7: Decreasing levels of priority
 */
export enum UIConstraintPower {
  /** Highest priority - must be satisfied (required constraint) */
  P0,
  /** Very high priority */
  P1,
  /** High priority */
  P2,
  /** Medium-high priority */
  P3,
  /** Medium priority */
  P4,
  /** Medium-low priority */
  P5,
  /** Low priority */
  P6,
  /** Lowest priority */
  P7,
}

/**
 * Type guard to check if a value is a valid UIConstraintPower.
 *
 * @param obj - The value to check
 * @returns True if the value is a valid UIConstraintPower enum value
 */
export function isUIConstraintPower(obj: unknown): obj is UIConstraintPower {
  return (
    obj !== null && Object.values(UIConstraintPower).some((v) => v === obj)
  );
}

/**
 * Resolves an optional power level to a definite value.
 *
 * @param power - The constraint power to resolve, or undefined
 * @returns The provided power level, or P0 (highest) if none was provided
 */
export function resolvePower(power?: UIConstraintPower): UIConstraintPower {
  return power ?? UIConstraintPower.P0;
}

/**
 * Converts a UIConstraintPower enum value to a Kiwi.js strength value.
 *
 * The Kiwi.js constraint solver uses a three-tiered strength system.
 * This function maps our power levels to appropriate strength values:
 *
 * - P0: Maximum strength in all tiers (required constraint)
 * - P1-P2: Varying strengths in the first tier
 * - P3-P4: Varying strengths in the second tier
 * - P5-P7: Varying strengths in the third tier
 *
 * @param power - The constraint power to convert, or undefined
 * @returns A Kiwi.js strength value corresponding to the power level
 */
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
