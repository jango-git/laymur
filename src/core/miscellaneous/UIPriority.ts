import { Strength } from "@lume/kiwi";

const HIGH_PRIORITY = 1000;
const MEDIUM_PRIORITY = 100;
const LOW_PRIORITY = 10;

/** Constraint solver priority levels */
export enum UIPriority {
  /** Highest priority */
  P0 = 0,
  /** High priority */
  P1 = 1,
  /** Medium-high priority */
  P2 = 2,
  /** Medium priority */
  P3 = 3,
  /** Medium-low priority */
  P4 = 4,
  /** Low priority */
  P5 = 5,
  /** Very low priority */
  P6 = 6,
  /** Lowest priority */
  P7 = 7,
}

/**
 * Converts priority to solver strength.
 * @param priority Priority level
 * @returns Solver strength value
 * @throws If priority is invalid
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
      throw new Error(`convertPriority.priority: invalid priority`);
  }
}

/**
 * Resolves optional priority.
 * @param priority Priority to resolve
 * @returns Priority or P0 if undefined
 */
export function resolvePriority(priority?: UIPriority): UIPriority {
  return priority ?? UIPriority.P0;
}
