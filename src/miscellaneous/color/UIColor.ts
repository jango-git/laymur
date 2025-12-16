import { Color, Vector4 } from "three";
import { LinearToSRGB, SRGBToLinear } from "three/src/math/ColorManagement.js";
import type { UIColorConfig, UIColorName } from "./UIColor.Internal";
import { COLORS } from "./UIColor.Internal";

/**
 * RGBA color with support for RGB, HSL, hex, and named colors.
 * All components are normalized (0-1).
 */
export class UIColor {
  private rInternal = 1;
  private gInternal = 1;
  private bInternal = 1;
  private aInternal = 1;

  private hInternal = 0;
  private sInternal = 0;
  private lInternal = 1;

  private dirtyInternal = false;

  /**
   * Indicates that RGB values need to be recalculated from HSL.
   * Set to `true` when HSL components are modified.
   * Used for lazy RGB computation on next access.
   */
  private rgbDirty = false;

  /**
   * Indicates that HSL values need to be recalculated from RGB.
   * Set to `true` when RGB components are modified.
   * Used for lazy HSL computation on next access.
   */
  private hslDirty = false;

  constructor();
  /**
   * @param r - Red (0-1)
   * @param g - Green (0-1)
   * @param b - Blue (0-1)
   * @param a - Alpha (0-1)
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(r: number, g: number, b: number, a?: number);
  /**
   * @param colorName - Named color
   * @param a - Alpha (0-1)
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(colorName: UIColorName, a?: number);
  /**
   * @param threeColor - Three.js Color object
   * @param a - Alpha (0-1)
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(threeColor: Color, a?: number);
  /**
   * @param hexRGB - Hex RGB value (e.g., 0xff0000)
   * @param a - Alpha (0-1)
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(hexRGB: number, a?: number);
  /**
   * @param hexString - Hex string (e.g., "#ffffff" or "#ffffffff")
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(hexString?: string);
  /**
   * @param uiColor - UIColor object to copy from
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(uiColor?: UIColor);
  /**
   * @param uiColorConfig - UIColorConfig object
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Separate overloads make the different constructor patterns more clear
  constructor(uiColorConfig?: UIColorConfig);
  constructor(...args: unknown[]) {
    if (args.length >= 3 && typeof args[0] === "number") {
      const [r, g, b, a = 1] = args as number[];
      this.rInternal = r;
      this.gInternal = g;
      this.bInternal = b;
      this.aInternal = a;
    } else if (args.length >= 1 && args[0] !== undefined) {
      const [firstArgument, a = 1] = args;
      if (typeof firstArgument === "string") {
        if (firstArgument.startsWith("#")) {
          this.setHexString(firstArgument);
        } else {
          this.setColorName(firstArgument as UIColorName, a as number);
        }
      } else if (firstArgument instanceof UIColor) {
        firstArgument.ensureRGBUpdatedFromHSL();
        this.rInternal = firstArgument.rInternal;
        this.gInternal = firstArgument.gInternal;
        this.bInternal = firstArgument.bInternal;
        this.aInternal = firstArgument.aInternal;
      } else if (firstArgument instanceof Color) {
        this.rInternal = firstArgument.r;
        this.gInternal = firstArgument.g;
        this.bInternal = firstArgument.b;
        this.aInternal = a as number;
      } else if (typeof firstArgument === "number") {
        this.setHexRGB(firstArgument, a as number);
      }
    }
  }

  /** Black (0x000000). */
  public static get black(): UIColor {
    return new UIColor("black");
  }

  /** White (0xffffff). */
  public static get white(): UIColor {
    return new UIColor("white");
  }

  /** Red (0xff0000). */
  public static get red(): UIColor {
    return new UIColor("red");
  }

  /** Green (0x008000). */
  public static get green(): UIColor {
    return new UIColor("green");
  }

  /** Blue (0x0000ff). */
  public static get blue(): UIColor {
    return new UIColor("blue");
  }

  /** Yellow (0xffff00). */
  public static get yellow(): UIColor {
    return new UIColor("yellow");
  }

  /** Cyan (0x00ffff). */
  public static get cyan(): UIColor {
    return new UIColor("cyan");
  }

  /** Magenta (0xff00ff). */
  public static get magenta(): UIColor {
    return new UIColor("magenta");
  }

  /** Gray (0x808080). */
  public static get gray(): UIColor {
    return new UIColor("gray");
  }

  /** Grey (0x808080). */
  public static get grey(): UIColor {
    return new UIColor("grey");
  }

  /** Silver (0xc0c0c0). */
  public static get silver(): UIColor {
    return new UIColor("silver");
  }

  /** Maroon (0x800000). */
  public static get maroon(): UIColor {
    return new UIColor("maroon");
  }

  /** Olive (0x808000). */
  public static get olive(): UIColor {
    return new UIColor("olive");
  }

  /** Lime (0x00ff00). */
  public static get lime(): UIColor {
    return new UIColor("lime");
  }

  /** Aqua (0x00ffff). */
  public static get aqua(): UIColor {
    return new UIColor("aqua");
  }

  /** Teal (0x008080). */
  public static get teal(): UIColor {
    return new UIColor("teal");
  }

  /** Navy (0x000080). */
  public static get navy(): UIColor {
    return new UIColor("navy");
  }

  /** Fuchsia (0xff00ff). */
  public static get fuchsia(): UIColor {
    return new UIColor("fuchsia");
  }

  /** Purple (0x800080). */
  public static get purple(): UIColor {
    return new UIColor("purple");
  }

  /** Orange (0xffa500). */
  public static get orange(): UIColor {
    return new UIColor("orange");
  }

  /** Pink (0xffc0cb). */
  public static get pink(): UIColor {
    return new UIColor("pink");
  }

  /** Brown (0xa52a2a). */
  public static get brown(): UIColor {
    return new UIColor("brown");
  }

  /** Gold (0xffd700). */
  public static get gold(): UIColor {
    return new UIColor("gold");
  }

  /** Violet (0xee82ee). */
  public static get violet(): UIColor {
    return new UIColor("violet");
  }

  /** Indigo (0x4b0082). */
  public static get indigo(): UIColor {
    return new UIColor("indigo");
  }

  /** Coral (0xff7f50). */
  public static get coral(): UIColor {
    return new UIColor("coral");
  }

  /** Salmon (0xfa8072). */
  public static get salmon(): UIColor {
    return new UIColor("salmon");
  }

  /** Khaki (0xf0e68c). */
  public static get khaki(): UIColor {
    return new UIColor("khaki");
  }

  /** Plum (0xdda0dd). */
  public static get plum(): UIColor {
    return new UIColor("plum");
  }

  /** Orchid (0xda70d6). */
  public static get orchid(): UIColor {
    return new UIColor("orchid");
  }

  /** Tan (0xd2b48c). */
  public static get tan(): UIColor {
    return new UIColor("tan");
  }

  /** Beige (0xf5f5dc). */
  public static get beige(): UIColor {
    return new UIColor("beige");
  }

  /** Mint (0x98fb98). */
  public static get mint(): UIColor {
    return new UIColor("mint");
  }

  /** Lavender (0xe6e6fa). */
  public static get lavender(): UIColor {
    return new UIColor("lavender");
  }

  /** Crimson (0xdc143c). */
  public static get crimson(): UIColor {
    return new UIColor("crimson");
  }

  /** Azure (0xf0ffff). */
  public static get azure(): UIColor {
    return new UIColor("azure");
  }

  /** Ivory (0xfffff0). */
  public static get ivory(): UIColor {
    return new UIColor("ivory");
  }

  /** Snow (0xfffafa). */
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

  /**
   * Indicates whether the color has been modified since last check.
   * Set to `true` when any color component changes.
   * Must be reset to `false` externally by the color owner.
   * @internal
   */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  public set r(value: number) {
    this.ensureRGBUpdatedFromHSL();
    if (value !== this.rInternal) {
      this.rInternal = value;
      this.hslDirty = true;
      this.dirtyInternal = true;
    }
  }

  public set g(value: number) {
    this.ensureRGBUpdatedFromHSL();
    if (value !== this.gInternal) {
      this.gInternal = value;
      this.hslDirty = true;
      this.dirtyInternal = true;
    }
  }

  public set b(value: number) {
    this.ensureRGBUpdatedFromHSL();
    if (value !== this.bInternal) {
      this.bInternal = value;
      this.hslDirty = true;
      this.dirtyInternal = true;
    }
  }

  public set a(value: number) {
    if (value !== this.aInternal) {
      this.aInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set hue(value: number) {
    this.ensureHSLUpdatedFromRGB();
    if (value !== this.hInternal) {
      this.hInternal = value;
      this.rgbDirty = true;
      this.dirtyInternal = true;
    }
  }

  public set saturation(value: number) {
    this.ensureHSLUpdatedFromRGB();
    if (value !== this.sInternal) {
      this.sInternal = value;
      this.rgbDirty = true;
      this.dirtyInternal = true;
    }
  }

  public set lightness(value: number) {
    this.ensureHSLUpdatedFromRGB();
    if (value !== this.lInternal) {
      this.lInternal = value;
      this.rgbDirty = true;
      this.dirtyInternal = true;
    }
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /**
   * Sets RGB(A) components.
   *
   * @param r - Red (0-1)
   * @param g - Green (0-1)
   * @param b - Blue (0-1)
   * @param a - Alpha (0-1)
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
      this.dirtyInternal = true;
    }
    return this;
  }

  /** Returns RGBA as 32-bit hex (RRGGBBAA). */
  public getHexRGBA(): number {
    this.ensureRGBUpdatedFromHSL();
    return (
      (Math.round(this.rInternal * 255) << 24) |
      (Math.round(this.gInternal * 255) << 16) |
      (Math.round(this.bInternal * 255) << 8) |
      Math.round(this.aInternal * 255)
    );
  }

  /** Returns RGB as 24-bit hex (RRGGBB). */
  public getHexRGB(): number {
    this.ensureRGBUpdatedFromHSL();
    return (
      (Math.round(this.rInternal * 255) << 16) |
      (Math.round(this.gInternal * 255) << 8) |
      Math.round(this.bInternal * 255)
    );
  }

  /** Returns RGB as hex string (e.g., "#ffffff"). */
  public getHexStringRGB(): string {
    const hex = this.getHexRGB();
    return `#${hex.toString(16).padStart(6, "0")}`;
  }

  /** Returns RGBA as hex string (e.g., "#ffffffff"). */
  public getHexStringRGBA(): string {
    const hex = this.getHexRGBA();
    return `#${hex.toString(16).padStart(8, "0")}`;
  }

  /** Sets color from 32-bit hex RGBA (RRGGBBAA). */
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
      this.dirtyInternal = true;
    }
    return this;
  }

  /**
   * Sets color from 24-bit hex RGB (RRGGBB).
   *
   * @param hex - Hex RGB (e.g., 0xff0000)
   * @param a - Alpha (0-1)
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
      this.dirtyInternal = true;
    }
    return this;
  }

  /**
   * Sets color from hex string ("#ffffff" or "#ffffffff").
   *
   * @throws Error if format is invalid
   */
  public setHexString(hexString: string): this {
    if (!hexString.startsWith("#")) {
      throw new Error(
        `UIColor.setHexString.hexString: invalid hex string format. expected format: "#ffffff" or "#ffffffff"`,
      );
    }

    const hex = hexString.slice(1);

    if (hex.length === 6) {
      const hexNumber = parseInt(hex, 16);
      if (isNaN(hexNumber)) {
        throw new Error(
          `UIColor.setHexString.hexString: invalid hex string format. expected format: "#ffffff" or "#ffffffff"`,
        );
      }
      return this.setHexRGB(hexNumber);
    } else if (hex.length === 8) {
      const hexNumber = parseInt(hex, 16);
      if (isNaN(hexNumber)) {
        throw new Error(
          `UIColor.setHexString.hexString: invalid hex string format. expected format: "#ffffff" or "#ffffffff"`,
        );
      }
      return this.setHexRGBA(hexNumber);
    } else {
      throw new Error(
        `UIColor.setHexString.hexString: invalid hex string format. expected format: "#ffffff" or "#ffffffff"`,
      );
    }
  }

  /**
   * Sets color from HSL values.
   *
   * @param h - Hue (0-360)
   * @param s - Saturation (0-1)
   * @param l - Lightness (0-1)
   * @param a - Alpha (0-1)
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
      this.dirtyInternal = true;
    }
    return this;
  }

  /**
   * Sets color from predefined name.
   *
   * @throws Error if color name is unknown
   */
  public setColorName(colorName: UIColorName, a = this.aInternal): this {
    const normalizedName = colorName.toLowerCase().trim();
    const hex = COLORS[normalizedName];

    if (hex === undefined) {
      throw new Error(`UIColor.setColorName.colorName: unknown color name`);
    }

    return this.setHexRGB(hex, a);
  }

  /**
   * Sets color from linear (GLSL) color space.
   *
   * @param r - Red in linear space (0-1)
   * @param g - Green in linear space (0-1)
   * @param b - Blue in linear space (0-1)
   * @param a - Alpha (0-1)
   */
  public setGLSLColor(
    r: number,
    g: number,
    b: number,
    a = this.aInternal,
  ): this {
    this.ensureRGBUpdatedFromHSL();

    const sRGBR = LinearToSRGB(r);
    const sRGBG = LinearToSRGB(g);
    const sRGBB = LinearToSRGB(b);

    if (
      sRGBR !== this.rInternal ||
      sRGBG !== this.gInternal ||
      sRGBB !== this.bInternal ||
      a !== this.aInternal
    ) {
      this.rInternal = sRGBR;
      this.gInternal = sRGBG;
      this.bInternal = sRGBB;
      this.aInternal = a;
      this.hslDirty = true;
      this.dirtyInternal = true;
    }

    return this;
  }

  /** Sets color from Three.js Color. */
  public setThreeColor(threeColor: Color, a = this.aInternal): this {
    this.ensureRGBUpdatedFromHSL();
    if (
      threeColor.r !== this.rInternal ||
      threeColor.g !== this.gInternal ||
      threeColor.b !== this.bInternal ||
      a !== this.aInternal
    ) {
      this.rInternal = threeColor.r;
      this.gInternal = threeColor.g;
      this.bInternal = threeColor.b;
      this.aInternal = a;
      this.hslDirty = true;
      this.dirtyInternal = true;
    }
    return this;
  }

  /** Returns CSS color string (e.g., "rgba(255, 0, 0, 1)"). */
  public toCSSColor(): string {
    this.ensureRGBUpdatedFromHSL();
    const r = Math.round(this.rInternal * 255);
    const g = Math.round(this.gInternal * 255);
    const b = Math.round(this.bInternal * 255);
    return `rgba(${r}, ${g}, ${b}, ${this.aInternal})`;
  }

  /** Converts to linear (GLSL) color space. */
  public toGLSLColor(result: Vector4 = new Vector4()): Vector4 {
    this.ensureRGBUpdatedFromHSL();

    result.x = SRGBToLinear(this.rInternal);
    result.y = SRGBToLinear(this.gInternal);
    result.z = SRGBToLinear(this.bInternal);
    result.w = this.aInternal;

    return result;
  }

  /** Converts to Three.js Color (without alpha). */
  public toThreeColor(result: Color = new Color()): Color {
    this.ensureRGBUpdatedFromHSL();

    result.r = this.rInternal;
    result.g = this.gInternal;
    result.b = this.bInternal;

    return result;
  }

  /** Copies from another color. */
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
        this.dirtyInternal = true;
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
        this.dirtyInternal = true;
      }
    }

    return this;
  }

  /** Returns a copy of this color. */
  public clone(): UIColor {
    this.ensureRGBUpdatedFromHSL();
    return new UIColor(
      this.rInternal,
      this.gInternal,
      this.bInternal,
      this.aInternal,
    );
  }

  /** @internal */
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

  /** @internal */
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
