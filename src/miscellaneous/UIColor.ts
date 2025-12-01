import { Eventail } from "eventail";
import type { Color } from "three";

const COLORS: Record<string, number | undefined> = {
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

/**
 * Predefined color names supported by UIColor.
 */
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

/**
 * Events emitted by UIColor.
 */
export enum UIColorEvent {
  /** Emitted when color components change. */
  CHANGE = "change",
}

/**
 * Event-based RGBA color with support for RGB, HSL, hex, and named colors.
 * Color components are stored as normalized values (0-1).
 */
export class UIColor extends Eventail {
  private rInternal = 1;
  private gInternal = 1;
  private bInternal = 1;
  private aInternal = 1;

  constructor();
  /**
   * @param colorName - Named color
   * @param a - Alpha (0-1)
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(colorName: UIColorName, a?: number);
  /**
   * @param r - Red (0-1)
   * @param g - Green (0-1)
   * @param b - Blue (0-1)
   * @param a - Alpha (0-1)
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(r: number, g: number, b: number, a?: number);
  /**
   * @param hexRGB - Hex RGB value (e.g., 0xFF0000)
   * @param a - Alpha (0-1)
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(hexRGB: number, a?: number);
  constructor(...args: unknown[]) {
    super();

    if (args.length >= 3 && typeof args[0] === "number") {
      const [r, g, b, a = 1] = args as number[];
      this.rInternal = r;
      this.gInternal = g;
      this.bInternal = b;
      this.aInternal = a;
    } else if (args.length >= 1) {
      const [first, a = 1] = args;
      if (typeof first === "string") {
        this.setName(first as UIColorName, a as number);
      } else {
        this.setHexRGB(first as number, a as number);
      }
    }
  }

  /** Red component (0-1). */
  public get r(): number {
    return this.rInternal;
  }

  /** Green component (0-1). */
  public get g(): number {
    return this.gInternal;
  }

  /** Blue component (0-1). */
  public get b(): number {
    return this.bInternal;
  }

  /** Alpha component (0-1). */
  public get a(): number {
    return this.aInternal;
  }

  public set r(value: number) {
    if (value !== this.rInternal) {
      this.rInternal = value;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set g(value: number) {
    if (value !== this.gInternal) {
      this.gInternal = value;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set b(value: number) {
    if (value !== this.bInternal) {
      this.bInternal = value;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set a(value: number) {
    if (value !== this.aInternal) {
      this.aInternal = value;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  /**
   * Sets all color components.
   *
   * @param r - Red (0-1)
   * @param g - Green (0-1)
   * @param b - Blue (0-1)
   * @param a - Alpha (0-1)
   * @returns This instance
   */
  public set(
    r: number,
    g: number,
    b: number,
    a: number = this.aInternal,
  ): this {
    if (
      r !== this.rInternal ||
      g !== this.gInternal ||
      b !== this.bInternal ||
      a !== this.aInternal
    ) {
      this.rInternal = r;
      this.gInternal = g;
      this.bInternal = b;
      this.aInternal = a;
      this.emit(UIColorEvent.CHANGE, this);
    }
    return this;
  }

  /**
   * Returns 32-bit hex RGBA value (alpha in MSB).
   */
  public getHexRGBA(): number {
    return (
      (Math.round(this.rInternal * 255) << 24) |
      (Math.round(this.gInternal * 255) << 16) |
      (Math.round(this.bInternal * 255) << 8) |
      Math.round(this.aInternal * 255)
    );
  }

  /**
   * Returns 24-bit hex RGB value.
   */
  public getHexRGB(): number {
    return (
      (Math.round(this.rInternal * 255) << 16) |
      (Math.round(this.gInternal * 255) << 8) |
      Math.round(this.bInternal * 255)
    );
  }

  /**
   * Converts to HSL format.
   *
   * @returns Object with h (0-360), s (0-1), l (0-1)
   */
  public getHSL(): { h: number; s: number; l: number } {
    const { rInternal: r, gInternal: g, bInternal: b } = this;
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

  /**
   * Sets color from 32-bit hex RGBA value.
   *
   * @param hex - Hex RGBA (alpha in MSB)
   * @returns This instance
   */
  public setHexRGBA(hex: number): this {
    const r = ((hex >> 16) & 0xff) / 255;
    const g = ((hex >> 8) & 0xff) / 255;
    const b = (hex & 0xff) / 255;
    const a = ((hex >> 24) & 0xff) / 255;
    if (
      r !== this.rInternal ||
      g !== this.gInternal ||
      b !== this.bInternal ||
      a !== this.aInternal
    ) {
      this.rInternal = r;
      this.gInternal = g;
      this.bInternal = b;
      this.aInternal = a;
      this.emit(UIColorEvent.CHANGE, this);
    }
    return this;
  }

  /**
   * Sets color from 24-bit hex RGB value.
   *
   * @param hex - Hex RGB (e.g., 0xFF0000)
   * @param a - Alpha (0-1)
   * @returns This instance
   */
  public setHexRGB(hex: number, a = this.aInternal): this {
    const r = ((hex >> 16) & 0xff) / 255;
    const g = ((hex >> 8) & 0xff) / 255;
    const b = (hex & 0xff) / 255;
    if (
      r !== this.rInternal ||
      g !== this.gInternal ||
      b !== this.bInternal ||
      a !== this.aInternal
    ) {
      this.rInternal = r;
      this.gInternal = g;
      this.bInternal = b;
      this.aInternal = a;
      this.emit(UIColorEvent.CHANGE, this);
    }
    return this;
  }

  /**
   * Sets color from HSL values.
   *
   * @param h - Hue (0-360)
   * @param s - Saturation (0-1)
   * @param l - Lightness (0-1)
   * @param a - Alpha (0-1)
   * @returns This instance
   */
  public setHSL(h: number, s: number, l: number, a = this.aInternal): this {
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

  /**
   * Sets color from predefined name.
   *
   * @param colorName - Color name
   * @param a - Alpha (0-1)
   * @returns This instance
   * @throws Error if color name is unknown
   */
  public setName(colorName: UIColorName, a = this.aInternal): this {
    const normalizedName = colorName.toLowerCase().trim();
    const hex = COLORS[normalizedName];

    if (hex === undefined) {
      throw new Error(`Unknown color name: "${colorName}".`);
    }

    return this.setHexRGB(hex, a);
  }

  /**
   * Returns CSS rgba() string.
   */
  public toCSSColor(): string {
    const r = Math.round(this.rInternal * 255);
    const g = Math.round(this.gInternal * 255);
    const b = Math.round(this.bInternal * 255);
    return `rgba(${r}, ${g}, ${b}, ${this.aInternal})`;
  }

  /**
   * Copies values from another color.
   *
   * @param color - UIColor or Three.js Color
   * @returns This instance
   */
  public copy(color: UIColor | Color): this {
    if (color instanceof UIColor) {
      if (
        this.rInternal !== color.rInternal ||
        this.gInternal !== color.gInternal ||
        this.bInternal !== color.bInternal ||
        this.aInternal !== color.aInternal
      ) {
        this.rInternal = color.rInternal;
        this.gInternal = color.gInternal;
        this.bInternal = color.bInternal;
        this.aInternal = color.aInternal;
        this.emit(UIColorEvent.CHANGE, this);
      }
    } else {
      if (
        this.rInternal !== color.r ||
        this.gInternal !== color.g ||
        this.bInternal !== color.b ||
        this.aInternal !== 1
      ) {
        this.rInternal = color.r;
        this.gInternal = color.g;
        this.bInternal = color.b;
        this.aInternal = 1;
        this.emit(UIColorEvent.CHANGE, this);
      }
    }

    return this;
  }

  /**
   * Creates a copy of this color.
   */
  public clone(): UIColor {
    return new UIColor(
      this.rInternal,
      this.gInternal,
      this.bInternal,
      this.aInternal,
    );
  }
}
