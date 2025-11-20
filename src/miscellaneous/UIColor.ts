import { Eventail } from "eventail";
import type { Color } from "three";

/**
 * Database of predefined color names mapped to their hexadecimal RGB values.
 * Used for creating UIColor instances from named colors.
 */
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

/**
 * Union type of all supported color names that can be used with UIColor.
 * These names correspond to the predefined colors in the COLOR_NAMES database.
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
 * Events that can be emitted by UIColor instances.
 */
export enum UIColorEvent {
  /** Emitted when any color property (r, g, b, a) changes. */
  CHANGE = "change",
}

/**
 * Event-based RGBA color class with support for multiple color formats and named colors.
 *
 * UIColor provides a comprehensive color management system with support for RGB, HSL,
 * hexadecimal formats, and named colors. It extends Eventail to emit change events
 * when color properties are modified, enabling reactive color updates throughout
 * the UI system.
 *
 * Color components are stored as normalized values (0-1) for precision and
 * compatibility with graphics APIs.
 *
 * @see {@link UIColorEvent} - Events emitted by color instances
 * @see {@link UIColorName} - Supported named color values
 */
export class UIColor extends Eventail {
  /** Internal storage for the red component (0-1). */
  public rInternal = 1;
  /** Internal storage for the green component (0-1). */
  public gInternal = 1;
  /** Internal storage for the blue component (0-1). */
  public bInternal = 1;
  /** Internal storage for the alpha component (0-1). */
  public aInternal = 1;

  /**
   * Creates a new UIColor instance with white color (1, 1, 1, 1).
   */
  constructor();
  /**
   * Creates a new UIColor instance from a named color.
   * @param colorName - The name of the color from the predefined color database
   * @param a - Optional alpha value (0-1), defaults to 1
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(colorName: UIColorName, a?: number);
  /**
   * Creates a new UIColor instance from RGB components.
   * @param r - Red component (0-1)
   * @param g - Green component (0-1)
   * @param b - Blue component (0-1)
   * @param a - Optional alpha value (0-1), defaults to 1
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(r: number, g: number, b: number, a?: number);
  /**
   * Creates a new UIColor instance from a hexadecimal RGB value.
   * @param hexRGB - Hexadecimal RGB value (e.g., 0xFF0000 for red)
   * @param a - Optional alpha value (0-1), defaults to 1
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

  /**
   * Gets the red component value.
   * @returns The red component (0-1)
   */
  public get r(): number {
    return this.rInternal;
  }

  /**
   * Gets the green component value.
   * @returns The green component (0-1)
   */
  public get g(): number {
    return this.gInternal;
  }

  /**
   * Gets the blue component value.
   * @returns The blue component (0-1)
   */
  public get b(): number {
    return this.bInternal;
  }

  /**
   * Gets the alpha component value.
   * @returns The alpha component (0-1)
   */
  public get a(): number {
    return this.aInternal;
  }

  /**
   * Sets the red component value and emits change event.
   * @param value - The red component (0-1)
   */
  public set r(value: number) {
    this.rInternal = value;
    this.emit(UIColorEvent.CHANGE, this);
  }

  /**
   * Sets the green component value and emits change event.
   * @param value - The green component (0-1)
   */
  public set g(value: number) {
    this.gInternal = value;
    this.emit(UIColorEvent.CHANGE, this);
  }

  /**
   * Sets the blue component value and emits change event.
   * @param value - The blue component (0-1)
   */
  public set b(value: number) {
    this.bInternal = value;
    this.emit(UIColorEvent.CHANGE, this);
  }

  /**
   * Sets the alpha component value and emits change event.
   * @param value - The alpha component (0-1)
   */
  public set a(value: number) {
    this.aInternal = value;
    this.emit(UIColorEvent.CHANGE, this);
  }

  /**
   * Sets all color components at once and emits change event.
   * @param r - Red component (0-1)
   * @param g - Green component (0-1)
   * @param b - Blue component (0-1)
   * @param a - Alpha component (0-1), defaults to current alpha value
   * @returns This UIColor instance for method chaining
   */
  public set(
    r: number,
    g: number,
    b: number,
    a: number = this.aInternal,
  ): this {
    this.rInternal = r;
    this.gInternal = g;
    this.bInternal = b;
    this.aInternal = a;
    this.emit(UIColorEvent.CHANGE, this);
    return this;
  }

  /**
   * Converts the color to a 32-bit hexadecimal RGBA value.
   * @returns Hexadecimal RGBA value with alpha in the most significant byte
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
   * Converts the color to a 24-bit hexadecimal RGB value (ignores alpha).
   * @returns Hexadecimal RGB value (e.g., 0xFF0000 for red)
   */
  public getHexRGB(): number {
    return (
      (Math.round(this.rInternal * 255) << 16) |
      (Math.round(this.gInternal * 255) << 8) |
      Math.round(this.bInternal * 255)
    );
  }

  /**
   * Converts the color to HSL (Hue, Saturation, Lightness) format.
   * @returns Object containing h (0-360), s (0-1), and l (0-1) values
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
   * Sets the color from a 32-bit hexadecimal RGBA value and emits change event.
   * @param hex - Hexadecimal RGBA value with alpha in the most significant byte
   * @returns This UIColor instance for method chaining
   */
  public setHexRGBA(hex: number): this {
    this.rInternal = ((hex >> 16) & 0xff) / 255;
    this.gInternal = ((hex >> 8) & 0xff) / 255;
    this.bInternal = (hex & 0xff) / 255;
    this.aInternal = ((hex >> 24) & 0xff) / 255;
    this.emit(UIColorEvent.CHANGE, this);
    return this;
  }

  /**
   * Sets the color from a 24-bit hexadecimal RGB value and emits change event.
   * @param hex - Hexadecimal RGB value (e.g., 0xFF0000 for red)
   * @param a - Alpha value (0-1), defaults to current alpha
   * @returns This UIColor instance for method chaining
   */
  public setHexRGB(hex: number, a = this.aInternal): this {
    this.rInternal = ((hex >> 16) & 0xff) / 255;
    this.gInternal = ((hex >> 8) & 0xff) / 255;
    this.bInternal = (hex & 0xff) / 255;
    this.aInternal = a;
    this.emit(UIColorEvent.CHANGE, this);
    return this;
  }

  /**
   * Sets the color from HSL (Hue, Saturation, Lightness) values and emits change event.
   * @param h - Hue value (0-360)
   * @param s - Saturation value (0-1)
   * @param l - Lightness value (0-1)
   * @param a - Alpha value (0-1), defaults to current alpha
   * @returns This UIColor instance for method chaining
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
   * Sets the color from a predefined color name and emits change event.
   * @param colorName - Name of the color from the predefined color database
   * @param a - Alpha value (0-1), defaults to current alpha
   * @returns This UIColor instance for method chaining
   * @throws Will throw an error if the color name is not recognized
   */
  public setName(colorName: UIColorName, a = this.aInternal): this {
    const normalizedName = colorName.toLowerCase().trim();
    const hex = COLOR_NAMES[normalizedName];

    if (hex === undefined) {
      throw new Error(`Unknown color name: "${colorName}".`);
    }

    return this.setHexRGB(hex, a);
  }

  /**
   * Copies color values from another UIColor or Three.js Color instance and emits change event.
   * @param color - The color to copy from (UIColor or Three.js Color)
   * @returns This UIColor instance for method chaining
   */
  public copy(color: UIColor | Color): this {
    if (color instanceof UIColor) {
      if (
        this.rInternal !== color.rInternal &&
        this.gInternal !== color.gInternal &&
        this.bInternal !== color.bInternal &&
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
        this.rInternal !== color.r &&
        this.gInternal !== color.g &&
        this.bInternal !== color.b &&
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
   * Converts the color to a CSS rgba() string.
   * @returns CSS rgba string (e.g., "rgba(255, 0, 0, 1)")
   */
  public toCSSColor(): string {
    const r = Math.round(this.rInternal * 255);
    const g = Math.round(this.gInternal * 255);
    const b = Math.round(this.bInternal * 255);
    return `rgba(${r}, ${g}, ${b}, ${this.aInternal})`;
  }

  /**
   * Creates a new UIColor instance with identical color values.
   * @returns A new UIColor instance with the same RGBA values
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
