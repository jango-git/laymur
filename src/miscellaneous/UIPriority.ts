import { Strength } from "@lume/kiwi";

/** High priority value for constraint solver strength calculations. */
const HIGH_PRIORITY = 1000;
/** Medium priority value for constraint solver strength calculations. */
const MEDIUM_PRIORITY = 100;
/** Low priority value for constraint solver strength calculations. */
const LOW_PRIORITY = 10;

/**
 * Priority levels for UI layout constraints and variables.
 *
 * Hierarchical system used by the constraint solver to determine which
 * constraints take precedence when conflicts arise. Lower numeric values
 * represent higher priority (P0 = highest, P7 = lowest).
 *
 * Maps to Kiwi solver strength values with different strength components.
 *
 * @public
 */
export enum UIPriority {
  /** Highest priority - required constraints that must be satisfied. */
  P0 = 0,
  /** High priority - strong constraints with medium strength. */
  P1 = 1,
  /** Medium-high priority - strong constraints with low strength. */
  P2 = 2,
  /** Medium priority - medium strength constraints. */
  P3 = 3,
  /** Medium-low priority - medium strength constraints with low weight. */
  P4 = 4,
  /** Low priority - weak strength constraints with medium weight. */
  P5 = 5,
  /** Very low priority - weak strength constraints with low weight. */
  P6 = 6,
  /** Lowest priority - weak strength constraints with minimal weight. */
  P7 = 7,
}

/**
 * Converts UIPriority enum values to Kiwi solver strength values.
 *
 * Maps UI priority levels to the three-component strength system used by
 * the Kiwi constraint solver. Higher priority levels get stronger values.
 *
 * @param priority - UI priority level to convert
 * @returns Corresponding Kiwi solver strength value
 * @throws Error when an invalid priority is provided
 * @public
 */
export function convertPriority(priority: UIPriority): number {
  switch (priority) {
    case UIPriority.P0:
      return Strength.create(HIGH_PRIORITY, HIGH_PRIORITY, HIGH_PRIORITY);
    case UIPriority.P1:
      return Strength.create(MEDIUM_PRIORITY, 0, 0);
    case UIPriority.P2:
      return Strength.create(LOW_PRIORITY, 0, 0);
    case UIPriority.P3:
      return Strength.create(0, MEDIUM_PRIORITY, 0);
    case UIPriority.P4:
      return Strength.create(0, LOW_PRIORITY, 0);
    case UIPriority.P5:
      return Strength.create(0, 0, MEDIUM_PRIORITY);
    case UIPriority.P6:
      return Strength.create(0, 0, LOW_PRIORITY);
    case UIPriority.P7:
      return Strength.create(0, 0, 1);
    default:
      throw new Error(`Invalid priority: ${priority}`);
  }
}

/**
 * Resolves an optional priority value to a concrete UIPriority.
 *
 * Returns the default highest priority (P0) if no priority is provided.
 * Used in constraint creation where priority is optional.
 *
 * @param priority - Optional priority value to resolve
 * @returns Resolved priority, defaulting to P0 if undefined
 * @public
 */
export function resolvePriority(priority?: UIPriority): UIPriority {
  return priority ?? UIPriority.P0;
}
