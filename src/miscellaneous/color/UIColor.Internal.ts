// /**
//  * Converts sRGB component to linear color space.
//  * @param c - sRGB component value (0-1)
//  * @returns Linear component value (0-1)
//  */
// export function sRGBToLinear(c: number): number {
//   return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
// }

// /**
//  * Converts linear component to sRGB color space.
//  * @param c - Linear component value (0-1)
//  * @returns sRGB component value (0-1)
//  */
// export function linearToSRGB(c: number): number {
//   return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
// }

export const COLORS: Record<string, number | undefined> = {
  black: 0x000000,
  white: 0xffffff,
  red: 0xff0000,
  green: 0x008000,
  blue: 0x0000ff,
  yellow: 0xffff00,
  cyan: 0x00ffff,
  magenta: 0xff00ff,

  gray: 0x808080,
  grey: 0x808080,
  silver: 0xc0c0c0,
  maroon: 0x800000,
  olive: 0x808000,
  lime: 0x00ff00,
  aqua: 0x00ffff,
  teal: 0x008080,
  navy: 0x000080,
  fuchsia: 0xff00ff,
  purple: 0x800080,

  orange: 0xffa500,
  pink: 0xffc0cb,
  brown: 0xa52a2a,
  gold: 0xffd700,
  violet: 0xee82ee,
  indigo: 0x4b0082,
  coral: 0xff7f50,
  salmon: 0xfa8072,
  khaki: 0xf0e68c,
  plum: 0xdda0dd,
  orchid: 0xda70d6,
  tan: 0xd2b48c,
  beige: 0xf5f5dc,
  mint: 0x98fb98,
  lavender: 0xe6e6fa,
  crimson: 0xdc143c,
  azure: 0xf0ffff,
  ivory: 0xfffff0,
  snow: 0xfffafa,
};

export type UIColorName =
  | "black"
  | "white"
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "cyan"
  | "magenta"
  | "gray"
  | "grey"
  | "silver"
  | "maroon"
  | "olive"
  | "lime"
  | "aqua"
  | "teal"
  | "navy"
  | "fuchsia"
  | "purple"
  | "orange"
  | "pink"
  | "brown"
  | "gold"
  | "violet"
  | "indigo"
  | "coral"
  | "salmon"
  | "khaki"
  | "plum"
  | "orchid"
  | "tan"
  | "beige"
  | "mint"
  | "lavender"
  | "crimson"
  | "azure"
  | "ivory"
  | "snow";
