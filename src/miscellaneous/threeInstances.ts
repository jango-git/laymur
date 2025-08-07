import { PlaneGeometry } from "three";

const GEOMETRY_SIZE = 1;
const GEOMETRY_OFFSET = 0.5;

export const geometry = new PlaneGeometry(
  GEOMETRY_SIZE,
  GEOMETRY_SIZE,
).translate(GEOMETRY_OFFSET, GEOMETRY_OFFSET, 0);
