import { assertValidNonNegativeNumber } from "./asserts";

export interface UIPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function resolvePadding(value: unknown): UIPadding {
  if (typeof value === "number") {
    return { left: value, right: value, top: value, bottom: value };
  }

  if (typeof value === "object" && value !== null) {
    const left =
      "left" in value && typeof value.left === "number" ? value.left : 0;
    const right =
      "right" in value && typeof value.right === "number" ? value.right : 0;
    const top = "top" in value && typeof value.top === "number" ? value.top : 0;
    const bottom =
      "bottom" in value && typeof value.bottom === "number" ? value.bottom : 0;

    assertValidNonNegativeNumber(left, "resolvePadding.left");
    assertValidNonNegativeNumber(right, "resolvePadding.right");
    assertValidNonNegativeNumber(top, "resolvePadding.top");
    assertValidNonNegativeNumber(bottom, "resolvePadding.bottom");

    return { left, right, top, bottom };
  }

  return { left: 0, right: 0, top: 0, bottom: 0 };
}
