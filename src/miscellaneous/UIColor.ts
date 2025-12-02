import { Eventail } from "eventail";
import type { Color } from "three";
import { Vector4 } from "three";

/**
 * Converts sRGB component to linear color space.
 * @param c - sRGB component value (0-1)
 * @returns Linear component value (0-1)
 */
function sRGBToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

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

  private hInternal = 0;
  private sInternal = 0;
  private lInternal = 1;

  private rgbDirty = false;
  private hslDirty = false;

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
        this.setColorName(first as UIColorName, a as number);
      } else {
        this.setHexRGB(first as number, a as number);
      }
    }
  }

  /** Creates black color (0x000000). */
  public static get black(): UIColor {
    return new UIColor("black");
  }

  /** Creates white color (0xFFFFFF). */
  public static get white(): UIColor {
    return new UIColor("white");
  }

  /** Creates red color (0xFF0000). */
  public static get red(): UIColor {
    return new UIColor("red");
  }

  /** Creates green color (0x008000). */
  public static get green(): UIColor {
    return new UIColor("green");
  }

  /** Creates blue color (0x0000FF). */
  public static get blue(): UIColor {
    return new UIColor("blue");
  }

  /** Creates yellow color (0xFFFF00). */
  public static get yellow(): UIColor {
    return new UIColor("yellow");
  }

  /** Creates cyan color (0x00FFFF). */
  public static get cyan(): UIColor {
    return new UIColor("cyan");
  }

  /** Creates magenta color (0xFF00FF). */
  public static get magenta(): UIColor {
    return new UIColor("magenta");
  }

  /** Creates gray color (0x808080). */
  public static get gray(): UIColor {
    return new UIColor("gray");
  }

  /** Creates grey color (0x808080). */
  public static get grey(): UIColor {
    return new UIColor("grey");
  }

  /** Creates silver color (0xC0C0C0). */
  public static get silver(): UIColor {
    return new UIColor("silver");
  }

  /** Creates maroon color (0x800000). */
  public static get maroon(): UIColor {
    return new UIColor("maroon");
  }

  /** Creates olive color (0x808000). */
  public static get olive(): UIColor {
    return new UIColor("olive");
  }

  /** Creates lime color (0x00FF00). */
  public static get lime(): UIColor {
    return new UIColor("lime");
  }

  /** Creates aqua color (0x00FFFF). */
  public static get aqua(): UIColor {
    return new UIColor("aqua");
  }

  /** Creates teal color (0x008080). */
  public static get teal(): UIColor {
    return new UIColor("teal");
  }

  /** Creates navy color (0x000080). */
  public static get navy(): UIColor {
    return new UIColor("navy");
  }

  /** Creates fuchsia color (0xFF00FF). */
  public static get fuchsia(): UIColor {
    return new UIColor("fuchsia");
  }

  /** Creates purple color (0x800080). */
  public static get purple(): UIColor {
    return new UIColor("purple");
  }

  /** Creates orange color (0xFFA500). */
  public static get orange(): UIColor {
    return new UIColor("orange");
  }

  /** Creates pink color (0xFFC0CB). */
  public static get pink(): UIColor {
    return new UIColor("pink");
  }

  /** Creates brown color (0xA52A2A). */
  public static get brown(): UIColor {
    return new UIColor("brown");
  }

  /** Creates gold color (0xFFD700). */
  public static get gold(): UIColor {
    return new UIColor("gold");
  }

  /** Creates violet color (0xEE82EE). */
  public static get violet(): UIColor {
    return new UIColor("violet");
  }

  /** Creates indigo color (0x4B0082). */
  public static get indigo(): UIColor {
    return new UIColor("indigo");
  }

  /** Creates coral color (0xFF7F50). */
  public static get coral(): UIColor {
    return new UIColor("coral");
  }

  /** Creates salmon color (0xFA8072). */
  public static get salmon(): UIColor {
    return new UIColor("salmon");
  }

  /** Creates khaki color (0xF0E68C). */
  public static get khaki(): UIColor {
    return new UIColor("khaki");
  }

  /** Creates plum color (0xDDA0DD). */
  public static get plum(): UIColor {
    return new UIColor("plum");
  }

  /** Creates orchid color (0xDA70D6). */
  public static get orchid(): UIColor {
    return new UIColor("orchid");
  }

  /** Creates tan color (0xD2B48C). */
  public static get tan(): UIColor {
    return new UIColor("tan");
  }

  /** Creates beige color (0xF5F5DC). */
  public static get beige(): UIColor {
    return new UIColor("beige");
  }

  /** Creates mint color (0x98FB98). */
  public static get mint(): UIColor {
    return new UIColor("mint");
  }

  /** Creates lavender color (0xE6E6FA). */
  public static get lavender(): UIColor {
    return new UIColor("lavender");
  }

  /** Creates crimson color (0xDC143C). */
  public static get crimson(): UIColor {
    return new UIColor("crimson");
  }

  /** Creates azure color (0xF0FFFF). */
  public static get azure(): UIColor {
    return new UIColor("azure");
  }

  /** Creates ivory color (0xFFFFF0). */
  public static get ivory(): UIColor {
    return new UIColor("ivory");
  }

  /** Creates snow color (0xFFFAFA). */
  public static get snow(): UIColor {
    return new UIColor("snow");
  }

  /** Red component (0-1). */
  public get r(): number {
    this.ensureRGBUpdatedFromHSL();
    return this.rInternal;
  }

  /** Green component (0-1). */
  public get g(): number {
    this.ensureRGBUpdatedFromHSL();
    return this.gInternal;
  }

  /** Blue component (0-1). */
  public get b(): number {
    this.ensureRGBUpdatedFromHSL();
    return this.bInternal;
  }

  /** Alpha component (0-1). */
  public get a(): number {
    return this.aInternal;
  }

  /** Hue component (0-360). */
  public get hue(): number {
    this.ensureHSLUpdatedFromRGB();
    return this.hInternal;
  }

  /** Saturation component (0-1). */
  public get saturation(): number {
    this.ensureHSLUpdatedFromRGB();
    return this.sInternal;
  }

  /** Lightness component (0-1). */
  public get lightness(): number {
    this.ensureHSLUpdatedFromRGB();
    return this.lInternal;
  }

  public set r(value: number) {
    this.ensureRGBUpdatedFromHSL();
    if (value !== this.rInternal) {
      this.rInternal = value;
      this.hslDirty = true;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set g(value: number) {
    this.ensureRGBUpdatedFromHSL();
    if (value !== this.gInternal) {
      this.gInternal = value;
      this.hslDirty = true;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set b(value: number) {
    this.ensureRGBUpdatedFromHSL();
    if (value !== this.bInternal) {
      this.bInternal = value;
      this.hslDirty = true;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set a(value: number) {
    if (value !== this.aInternal) {
      this.aInternal = value;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set hue(value: number) {
    this.ensureHSLUpdatedFromRGB();
    if (value !== this.hInternal) {
      this.hInternal = value;
      this.rgbDirty = true;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set saturation(value: number) {
    this.ensureHSLUpdatedFromRGB();
    if (value !== this.sInternal) {
      this.sInternal = value;
      this.rgbDirty = true;
      this.emit(UIColorEvent.CHANGE, this);
    }
  }

  public set lightness(value: number) {
    this.ensureHSLUpdatedFromRGB();
    if (value !== this.lInternal) {
      this.lInternal = value;
      this.rgbDirty = true;
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
    this.ensureRGBUpdatedFromHSL();
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
      this.hslDirty = true;
      this.emit(UIColorEvent.CHANGE, this);
    }
    return this;
  }

  /**
   * Returns 32-bit hex RGBA value (alpha in MSB).
   */
  public getHexRGBA(): number {
    this.ensureRGBUpdatedFromHSL();
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
    this.ensureRGBUpdatedFromHSL();
    return (
      (Math.round(this.rInternal * 255) << 16) |
      (Math.round(this.gInternal * 255) << 8) |
      Math.round(this.bInternal * 255)
    );
  }

  /**
   * Sets color from 32-bit hex RGBA value.
   *
   * @param hex - Hex RGBA (alpha in MSB)
   * @returns This instance
   */
  public setHexRGBA(hex: number): this {
    this.ensureRGBUpdatedFromHSL();
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
      this.hslDirty = true;
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
    this.ensureRGBUpdatedFromHSL();
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
      this.hslDirty = true;
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
    this.ensureHSLUpdatedFromRGB();
    if (
      h !== this.hInternal ||
      s !== this.sInternal ||
      l !== this.lInternal ||
      a !== this.aInternal
    ) {
      this.hInternal = h;
      this.sInternal = s;
      this.lInternal = l;
      this.aInternal = a;
      this.rgbDirty = true;
      this.emit(UIColorEvent.CHANGE, this);
    }
    return this;
  }

  /**
   * Sets color from predefined name.
   *
   * @param colorName - Color name
   * @param a - Alpha (0-1)
   * @returns This instance
   * @throws Error if color name is unknown
   */
  public setColorName(colorName: UIColorName, a = this.aInternal): this {
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
    this.ensureRGBUpdatedFromHSL();
    const r = Math.round(this.rInternal * 255);
    const g = Math.round(this.gInternal * 255);
    const b = Math.round(this.bInternal * 255);
    return `rgba(${r}, ${g}, ${b}, ${this.aInternal})`;
  }

  /**
   * Converts color to linear color space for GLSL.
   *
   * @param result - Vector4 to store the result
   * @returns Vector4 with linear RGB (0-1) and alpha
   */
  public toGLSLColor(result: Vector4 = new Vector4()): Vector4 {
    this.ensureRGBUpdatedFromHSL();

    result.x = sRGBToLinear(this.rInternal);
    result.y = sRGBToLinear(this.gInternal);
    result.z = sRGBToLinear(this.bInternal);
    result.w = this.aInternal;

    return result;
  }

  /**
   * Copies values from another color.
   *
   * @param color - UIColor or Three.js Color
   * @returns This instance
   */
  public copy(color: UIColor | Color): this {
    if (color instanceof UIColor) {
      this.ensureRGBUpdatedFromHSL();
      color.ensureRGBUpdatedFromHSL();

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
        this.hslDirty = true;
        this.emit(UIColorEvent.CHANGE, this);
      }
    } else {
      this.ensureRGBUpdatedFromHSL();
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
        this.hslDirty = true;
        this.emit(UIColorEvent.CHANGE, this);
      }
    }

    return this;
  }

  /**
   * Creates a copy of this color.
   */
  public clone(): UIColor {
    this.ensureRGBUpdatedFromHSL();
    return new UIColor(
      this.rInternal,
      this.gInternal,
      this.bInternal,
      this.aInternal,
    );
  }

  /**
   * Updates RGB values from HSL if needed.
   */
  private ensureRGBUpdatedFromHSL(): void {
    if (this.rgbDirty) {
      const { hInternal: h, sInternal: s, lInternal: l } = this;
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
      this.rInternal = r + m;
      this.gInternal = g + m;
      this.bInternal = b + m;
      this.rgbDirty = false;
    }
  }

  /**
   * Updates HSL values from RGB if needed.
   */
  private ensureHSLUpdatedFromRGB(): void {
    if (this.hslDirty) {
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
      this.hInternal = h;
      this.sInternal = s;
      this.lInternal = l;
      this.hslDirty = false;
    }
  }
}
