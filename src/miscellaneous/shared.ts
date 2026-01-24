import { UILayer } from "../layers/UILayer/UILayer";

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
  return typeof obj === "object" && obj !== null && "layer" in obj && obj.layer instanceof UILayer;
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
    typeof (obj as UIPointElement).xVariable === "number" &&
    typeof (obj as UIPointElement).yVariable === "number" &&
    typeof (obj as UIPointElement).x === "number" &&
    typeof (obj as UIPointElement).y === "number"
  );
}

/**
 * Checks if object implements UIPlaneElement.
 * @param obj Object to check
 * @returns True if object has valid dimension variables
 */
export function isUIPlaneElement(obj: unknown): obj is UIPlaneElement {
  return (
    isUIPointElement(obj) &&
    typeof (obj as UIPlaneElement).wVariable === "number" &&
    typeof (obj as UIPlaneElement).hVariable === "number" &&
    typeof (obj as UIPlaneElement).width === "number" &&
    typeof (obj as UIPlaneElement).height === "number"
  );
}
