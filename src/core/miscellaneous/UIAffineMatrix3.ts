import { Matrix3 } from "three";

/**
 * Matrix3 holding a 2D affine transform, such as a UV transform: its bottom row is taken as
 * (0, 0, 1). As a shader property it is passed per instance as its six meaningful elements
 * instead of nine, which saves a vertex attribute and a varying row on busy shaders. In GLSL
 * it is still a mat3.
 *
 * The property keeps that layout for the lifetime of the element: a plain Matrix3 assigned to
 * it later is read the same way, with its bottom row ignored. The other way round, a property
 * created as a plain Matrix3 stays a full mat3 when a UIAffineMatrix3 is assigned to it.
 */
export class UIAffineMatrix3 extends Matrix3 {}
