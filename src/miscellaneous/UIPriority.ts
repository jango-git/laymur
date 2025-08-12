import { Strength } from "@lume/kiwi";

const HIGH_PRIORITY = 1000;
const MEDIUM_PRIORITY = 100;
const LOW_PRIORITY = 10;

export enum UIPriority {
  P0 = 0,
  P1 = 1,
  P2 = 2,
  P3 = 3,
  P4 = 4,
  P5 = 5,
  P6 = 6,
  P7 = 7,
}

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

export function resolvePriority(priority?: UIPriority): UIPriority {
  return priority ?? UIPriority.P0;
}
