import { Strength } from "@lume/kiwi";

export enum UIPriority {
  P0,
  P1,
  P2,
  P3,
  P4,
  P5,
  P6,
  P7,
}

export function convertPriority(priority: UIPriority): number {
  switch (priority) {
    case UIPriority.P0:
      return Strength.create(1000, 1000, 1000);
    case UIPriority.P1:
      return Strength.create(100, 0, 0);
    case UIPriority.P2:
      return Strength.create(10, 0, 0);
    case UIPriority.P3:
      return Strength.create(0, 100, 0);
    case UIPriority.P4:
      return Strength.create(0, 10, 0);
    case UIPriority.P5:
      return Strength.create(0, 0, 100);
    case UIPriority.P6:
      return Strength.create(0, 0, 10);
    case UIPriority.P7:
      return Strength.create(0, 0, 1);
    default:
      throw new Error(`Invalid priority: ${priority}`);
  }
}

export function resolvePriority(priority?: UIPriority): UIPriority {
  return priority ?? UIPriority.P0;
}
