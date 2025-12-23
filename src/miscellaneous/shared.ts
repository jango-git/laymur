import { UILayer } from "../layers/UILayer";

/** Objects that belong to a UI layer */
export interface UILayerElement {
  /** The UI layer containing this element */
  readonly layer: UILayer;
}

/** UI elements with position in 2D space */
export interface UIPointElement {
  /** Solver variable for x coordinate */
  readonly xVariable: number;
  /** Solver variable for y coordinate */
  readonly yVariable: number;

  /** X coordinate in world units */
  readonly x: number;
  /** Y coordinate in world units */
  readonly y: number;
}

/** UI elements with position and dimensions */
export interface UIPlaneElement extends UIPointElement {
  /** Solver variable for width */
  readonly wVariable: number;
  /** Solver variable for height */
  readonly hVariable: number;

  /** Width in world units */
  readonly width: number;
  /** Height in world units */
  readonly height: number;
}

/**
 * Checks if object implements UILayerElement.
 * @param obj Object to check
 * @returns True if object has valid layer property
 */
export function isUILayerElement(obj: unknown): obj is UILayerElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "layer" in obj &&
    obj.layer instanceof UILayer
  );
}

/**
 * Checks if object implements UIPointElement.
 * @param obj Object to check
 * @returns True if object has valid position variables
 */
export function isUIPointElement(obj: unknown): obj is UIPointElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "xVariable" in obj &&
    typeof obj.xVariable === "number" &&
    "yVariable" in obj &&
    typeof obj.yVariable === "number" &&
    "width" in obj &&
    typeof obj.width === "number" &&
    "height" in obj &&
    typeof obj.height === "number"
  );
}

/**
 * Checks if object implements UIPlaneElement.
 * @param obj Object to check
 * @returns True if object has valid dimension variables
 */
export function isUIPlaneElement(obj: unknown): obj is UIPlaneElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "wVariable" in obj &&
    typeof obj.wVariable === "number" &&
    "hVariable" in obj &&
    typeof obj.hVariable === "number" &&
    "width" in obj &&
    typeof obj.width === "number" &&
    "height" in obj &&
    typeof obj.height === "number"
  );
}
