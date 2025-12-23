import type { UIOrientation } from "../../miscellaneous/UIOrientation";
import type { UIPriority } from "../../miscellaneous/UIPriority";
import type { UIRelation } from "../../miscellaneous/UIRelation";

/** Horizontal and vertical values object */
export interface UIType2DObject<T> {
  /** Horizontal value */
  h?: T;
  /** Vertical value */
  v?: T;
}

/** Horizontal and vertical values as object, tuple, or single value */
export type UIType2D<T> = UIType2DObject<T> | [T, T] | T;

/**
 * Normalizes UIType2D input to object form.
 * @param value Object, tuple, or single value
 * @returns Normalized object with h and v properties
 */
export function normalizeUIType2D<T>(
  value: UIType2D<T> | undefined,
): UIType2DObject<T> {
  if (value === undefined) {
    return {};
  }
  if (Array.isArray(value)) {
    return { h: value[0], v: value[1] };
  }
  if (
    typeof value === "object" &&
    value !== null &&
    ("h" in value || "v" in value)
  ) {
    return value;
  }
  return { h: value as T, v: value as T };
}

/** Base 2D constraint options */
export interface UIConstraint2DOptions {
  /** Priority for each axis */
  priority: UIType2D<UIPriority>;
  /** Relation for each axis */
  relation: UIType2D<UIRelation>;
  /** Orientation for each axis */
  orientation: UIType2D<UIOrientation>;
}

/** 2D size constraint options */
export interface UIConstraintSize2DOptions extends UIConstraint2DOptions {
  /** Width and height */
  size: UIType2D<number>;
}

/** 2D distance constraint options */
export interface UIConstraintDistance2DOptions extends UIConstraint2DOptions {
  /** Anchor on element A for each axis */
  anchorA: UIType2D<number>;
  /** Anchor on element B for each axis */
  anchorB: UIType2D<number>;
  /** Distance for each axis */
  distance: UIType2D<number>;
}

/** 2D proportion constraint options */
export interface UIConstraintProportion2DOptions extends UIConstraint2DOptions {
  /** Proportion for each axis */
  proportion: UIType2D<number>;
}

/** 2D interpolation constraint options */
export interface UIConstraintInterpolation2DOptions
  extends UIConstraint2DOptions {
  /** Anchor on element A for each axis */
  anchorA: UIType2D<number>;
  /** Anchor on element B for each axis */
  anchorB: UIType2D<number>;
  /** Anchor on element C for each axis */
  anchorC: UIType2D<number>;
  /** Interpolation factor for each axis */
  t: UIType2D<number>;
}

/** Horizontal and vertical constraint pair */
export interface UIConstraint2DResult<TH, TV> {
  /** Horizontal constraint */
  h: TH;
  /** Vertical constraint */
  v: TV;
}
