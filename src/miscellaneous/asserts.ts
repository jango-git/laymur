export const EPSILON = 1e-6;

// export function assertSameLayer(
//   elementOne: UIElement | UIAnchor | UILayer,
//   elementTwo: UIElement | UIAnchor,
//   message?: string,
// ): void {
//   if (
//     (elementOne instanceof UILayer ? elementOne : elementOne.layer) !==
//     elementTwo.layer
//   ) {
//     throw new Error(
//       message ??
//         `Elements must be on the same layer - element "${elementTwo.constructor.name}" cannot interact with elements from a different layer`,
//     );
//   }
// }

export function assertValidNumber(value: number, subject: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${subject}: value must be a finite number`);
  }

  if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${subject}: value exceeds maximum safe integer range`);
  }
}

export function assertValidPositiveNumber(
  value: number,
  subject: string,
): void {
  assertValidNumber(value, subject);

  if (value < EPSILON) {
    throw new Error(
      `${subject}: value must be greater than or equal to ${EPSILON}`,
    );
  }
}
