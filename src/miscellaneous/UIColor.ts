import { Eventail } from "eventail";
import type { Color } from "three";

// Color name database
const COLOR_NAMES: Record<string, number | undefined> = {
  // Basic colors
  black: 0x000000,
  white: 0xffffff,
  red: 0xff0000,
  green: 0x008000,
  blue: 0x0000ff,
  yellow: 0xffff00,
  cyan: 0x00ffff,
  magenta: 0xff00ff,

  // Extended colors
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

  // Additional common colors
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

export enum UIColorEvent {
  CHANGE = "change",
}

export class UIColor extends Eventail {
  public r = 1;
  public g = 1;
  public b = 1;
  public a = 1;

  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(r: number, g: number, b: number, a?: number);
  constructor(hexRGB: number, a?: number);
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(colorName: UIColorName, a?: number);
  constructor(...args: unknown[]) {
    super();

    if (args.length >= 3 && typeof args[0] === "number") {
      const [r, g, b, a = 1] = args as number[];
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    } else if (args.length >= 1) {
      const [first, a = 1] = args;
      if (typeof first === "string") {
        this.setName(first as UIColorName, a as number);
      } else {
        this.setHexRGB(first as number, a as number);
      }
    }
  }

  public set(r: number, g: number, b: number, a: number = this.a): this {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.emit(UIColorEvent.CHANGE, this);
    return this;
  }

  public getHexRGBA(): number {
    return (
      (Math.round(this.r * 255) << 24) |
      (Math.round(this.g * 255) << 16) |
      (Math.round(this.b * 255) << 8) |
      Math.round(this.a * 255)
    );
  }

  public getHexRGB(): number {
    return (
      (Math.round(this.r * 255) << 16) |
      (Math.round(this.g * 255) << 8) |
      Math.round(this.b * 255)
    );
  }

  public getHSL(): { h: number; s: number; l: number } {
    const { r, g, b } = this;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const l = (max + min) / 2;

    let h = 0;
    if (d !== 0) {
      if (max === r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else {
        h = (r - g) / d + 4;
      }
      h *= 60;
    }

    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h, s, l };
  }

  public setHexRGBA(hex: number): this {
    this.r = ((hex >> 16) & 0xff) / 255;
    this.g = ((hex >> 8) & 0xff) / 255;
    this.b = (hex & 0xff) / 255;
    this.a = ((hex >> 24) & 0xff) / 255;
    this.emit(UIColorEvent.CHANGE, this);
    return this;
  }

  public setHexRGB(hex: number, a = this.a): this {
    this.r = ((hex >> 16) & 0xff) / 255;
    this.g = ((hex >> 8) & 0xff) / 255;
    this.b = (hex & 0xff) / 255;
    this.a = a;
    this.emit(UIColorEvent.CHANGE, this);
    return this;
  }

  public setHSL(h: number, s: number, l: number, a = this.a): this {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let [r, g, b] =
      hp < 1
        ? [c, x, 0]
        : hp < 2
          ? [x, c, 0]
          : hp < 3
            ? [0, c, x]
            : hp < 4
              ? [0, x, c]
              : hp < 5
                ? [x, 0, c]
                : [c, 0, x];

    const m = l - c / 2;
    return this.set(r + m, g + m, b + m, a);
  }

  public setName(colorName: UIColorName, a = this.a): this {
    const normalizedName = colorName.toLowerCase().trim();
    const hex = COLOR_NAMES[normalizedName];

    if (hex === undefined) {
      throw new Error(`Unknown color name: "${colorName}".`);
    }

    return this.setHexRGB(hex, a);
  }

  public copy(color: UIColor | Color): this {
    if (color instanceof UIColor) {
      this.r = color.r;
      this.g = color.g;
      this.b = color.b;
      this.a = color.a;
    } else {
      this.r = color.r;
      this.g = color.g;
      this.b = color.b;
      this.a = 1;
    }

    this.emit(UIColorEvent.CHANGE, this);
    return this;
  }

  public clone(): UIColor {
    return new UIColor(this.r, this.g, this.b, this.a);
  }
}
