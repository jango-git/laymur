import {
  assertValidNonNegativeNumber,
  assertValidNumber,
  assertValidPositiveNumber,
} from "../asserts.js";
import { toCanvasColor } from "../color/canvasColor.js";
import type { UIPaint, UIPaintConfig } from "../paint/UIPaint.Internal.js";
import { resolvePaint } from "../paint/UIPaint.js";
import type {
  UIResolvedTextStyle,
  UITextAlign,
  UITextFontStyle,
  UITextFontWeight,
  UITextPaintBox,
  UITextShadow,
  UITextShadowConfig,
  UITextStroke,
  UITextStrokeConfig,
  UITextStyleConfig,
} from "./UITextStyle.Internal.js";
import {
  TEXT_STYLE_DEFAULT_ALIGN,
  TEXT_STYLE_DEFAULT_COLOR,
  TEXT_STYLE_DEFAULT_FONT_FAMILY,
  TEXT_STYLE_DEFAULT_FONT_SIZE,
  TEXT_STYLE_DEFAULT_FONT_STYLE,
  TEXT_STYLE_DEFAULT_FONT_WEIGHT,
  TEXT_STYLE_DEFAULT_LINE_HEIGHT,
  TEXT_STYLE_DEFAULT_PAINT_BOX,
  TEXT_STYLE_DEFAULT_SHADOWS,
  TEXT_STYLE_DEFAULT_STROKE_JOIN,
  TEXT_STYLE_DEFAULT_STROKES,
} from "./UITextStyle.Internal.js";

type UITextStyleKey = keyof UIResolvedTextStyle;

/** Value of every property after `setDefaults` */
const TEXT_STYLE_DEFAULTS: Readonly<UIResolvedTextStyle> = {
  color: TEXT_STYLE_DEFAULT_COLOR,
  paintBox: TEXT_STYLE_DEFAULT_PAINT_BOX,
  align: TEXT_STYLE_DEFAULT_ALIGN,
  fontFamily: TEXT_STYLE_DEFAULT_FONT_FAMILY,
  fontSize: TEXT_STYLE_DEFAULT_FONT_SIZE,
  fontStyle: TEXT_STYLE_DEFAULT_FONT_STYLE,
  fontWeight: TEXT_STYLE_DEFAULT_FONT_WEIGHT,
  lineHeight: TEXT_STYLE_DEFAULT_FONT_SIZE * TEXT_STYLE_DEFAULT_LINE_HEIGHT,
  strokes: TEXT_STYLE_DEFAULT_STROKES,
  shadows: TEXT_STYLE_DEFAULT_SHADOWS,
};

const TEXT_STYLE_KEYS = Object.keys(TEXT_STYLE_DEFAULTS) as UITextStyleKey[];

/**
 * Converts outline configs to stored outlines.
 * @param strokes Outline configs
 * @returns Frozen outlines with colors as CSS strings
 */
function resolveStrokes(strokes: readonly UITextStrokeConfig[]): readonly UITextStroke[] {
  return Object.freeze(
    strokes.map((stroke) => {
      assertValidNonNegativeNumber(stroke.thickness, "UITextStyle.strokes.thickness");
      return Object.freeze({
        paint: resolvePaint(stroke.paint),
        thickness: stroke.thickness,
        join: stroke.join ?? TEXT_STYLE_DEFAULT_STROKE_JOIN,
      });
    }),
  );
}

/**
 * Converts shadow configs to stored shadows.
 * @param shadows Shadow configs
 * @returns Frozen shadows with colors as CSS strings
 */
function resolveShadows(shadows: readonly UITextShadowConfig[]): readonly UITextShadow[] {
  return Object.freeze(
    shadows.map((shadow) => {
      const offsetX = shadow.offsetX ?? 0;
      const offsetY = shadow.offsetY ?? 0;
      const blur = shadow.blur ?? 0;
      assertValidNumber(offsetX, "UITextStyle.shadows.offsetX");
      assertValidNumber(offsetY, "UITextStyle.shadows.offsetY");
      assertValidNonNegativeNumber(blur, "UITextStyle.shadows.blur");
      return Object.freeze({ color: toCanvasColor(shadow.color), offsetX, offsetY, blur });
    }),
  );
}

/**
 * Text style of a span or of a whole text. Properties left undefined are taken from the
 * fallback style, the common style of the text for a span, then from the defaults. Lists of
 * strokes and shadows are taken as a whole.
 */
export class UITextStyle {
  private readonly values: Partial<UIResolvedTextStyle> = {};
  private dirtyInternal = true;

  /** @param config Partial style configuration. Unspecified properties remain undefined. */
  constructor(config?: Partial<UITextStyleConfig>) {
    this.color = config?.color;
    this.paintBox = config?.paintBox;
    this.align = config?.align;
    this.fontFamily = config?.fontFamily;
    this.fontSize = config?.fontSize;
    this.fontStyle = config?.fontStyle;
    this.fontWeight = config?.fontWeight;
    this.lineHeight = config?.lineHeight;
    this.strokes = config?.strokes;
    this.shadows = config?.shadows;
  }

  /** Color or gradient of the glyphs. A color is kept as a CSS string. */
  public get color(): UIPaint | undefined {
    return this.values.color;
  }

  /** Box the gradients of the fill and of the strokes are laid over */
  public get paintBox(): UITextPaintBox | undefined {
    return this.values.paintBox;
  }

  /** Text alignment */
  public get align(): UITextAlign | undefined {
    return this.values.align;
  }

  /** Font family name */
  public get fontFamily(): string | undefined {
    return this.values.fontFamily;
  }

  /** Font size in pixels */
  public get fontSize(): number | undefined {
    return this.values.fontSize;
  }

  /** Font style */
  public get fontStyle(): UITextFontStyle | undefined {
    return this.values.fontStyle;
  }

  /** Font weight */
  public get fontWeight(): UITextFontWeight | undefined {
    return this.values.fontWeight;
  }

  /** Line height in pixels, the distance between baselines */
  public get lineHeight(): number | undefined {
    return this.values.lineHeight;
  }

  /** Outlines from the innermost to the outermost */
  public get strokes(): readonly UITextStroke[] | undefined {
    return this.values.strokes;
  }

  /** Shadows and glows, the first one on top */
  public get shadows(): readonly UITextShadow[] | undefined {
    return this.values.shadows;
  }

  /**
   * Indicates whether any property has been modified.
   * Must be reset to `false` externally by the owner.
   * @internal
   */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  /** Color or gradient of the glyphs. A string is a CSS color. */
  public set color(value: UIPaintConfig | undefined) {
    this.setValue("color", value === undefined ? undefined : resolvePaint(value));
  }

  /** Box the gradients of the fill and of the strokes are laid over */
  public set paintBox(value: UITextPaintBox | undefined) {
    this.setValue("paintBox", value);
  }

  /** Text alignment */
  public set align(value: UITextAlign | undefined) {
    this.setValue("align", value);
  }

  /** Font family name */
  public set fontFamily(value: string | undefined) {
    this.setValue("fontFamily", value);
  }

  /** Font size in pixels */
  public set fontSize(value: number | undefined) {
    if (value !== undefined) {
      assertValidPositiveNumber(value, "UITextStyle.fontSize");
    }
    this.setValue("fontSize", value);
  }

  /** Font style */
  public set fontStyle(value: UITextFontStyle | undefined) {
    this.setValue("fontStyle", value);
  }

  /** Font weight */
  public set fontWeight(value: UITextFontWeight | undefined) {
    if (typeof value === "number") {
      assertValidPositiveNumber(value, "UITextStyle.fontWeight");
    }
    this.setValue("fontWeight", value);
  }

  /** Line height in pixels, the distance between baselines */
  public set lineHeight(value: number | undefined) {
    if (value !== undefined) {
      assertValidNumber(value, "UITextStyle.lineHeight");
    }
    this.setValue("lineHeight", value);
  }

  /**
   * Outlines from the innermost to the outermost. Each one lies outside the previous one. An
   * empty list draws no outline, undefined takes the outlines of the fallback style.
   */
  public set strokes(value: readonly UITextStrokeConfig[] | undefined) {
    this.setValue("strokes", value === undefined ? undefined : resolveStrokes(value));
  }

  /**
   * Shadows and glows, the first one on top. An empty list draws no shadow, undefined takes the
   * shadows of the fallback style.
   */
  public set shadows(value: readonly UITextShadowConfig[] | undefined) {
    this.setValue("shadows", value === undefined ? undefined : resolveShadows(value));
  }

  /**
   * Resolves complete style from primary and fallback sources.
   * @param primary First style to check for each property
   * @param fallback Second style to check if primary is undefined
   * @returns Complete style with all defaults applied
   * @internal
   */
  public static resolve(primary?: UITextStyle, fallback?: UITextStyle): UIResolvedTextStyle {
    const pick = <K extends UITextStyleKey>(key: K): UIResolvedTextStyle[K] | undefined =>
      primary?.values[key] ?? fallback?.values[key];

    const fontSize = pick("fontSize") ?? TEXT_STYLE_DEFAULT_FONT_SIZE;

    return {
      color: pick("color") ?? TEXT_STYLE_DEFAULT_COLOR,
      paintBox: pick("paintBox") ?? TEXT_STYLE_DEFAULT_PAINT_BOX,
      align: pick("align") ?? TEXT_STYLE_DEFAULT_ALIGN,
      fontFamily: pick("fontFamily") ?? TEXT_STYLE_DEFAULT_FONT_FAMILY,
      fontSize,
      fontStyle: pick("fontStyle") ?? TEXT_STYLE_DEFAULT_FONT_STYLE,
      fontWeight: pick("fontWeight") ?? TEXT_STYLE_DEFAULT_FONT_WEIGHT,
      lineHeight: pick("lineHeight") ?? fontSize * TEXT_STYLE_DEFAULT_LINE_HEIGHT,
      strokes: pick("strokes") ?? TEXT_STYLE_DEFAULT_STROKES,
      shadows: pick("shadows") ?? TEXT_STYLE_DEFAULT_SHADOWS,
    };
  }

  /**
   * Calculates the padding a resolved style needs on every side for its outlines and shadows.
   * The outlines add up outside the glyphs. A shadow is cast by the outlined glyphs and spreads
   * by its offset and about twice its blur radius.
   * @param style Resolved style
   * @returns Padding in pixels
   * @internal
   */
  public static calculatePadding(style: UIResolvedTextStyle): number {
    let outline = 0;
    for (const stroke of style.strokes) {
      outline += stroke.thickness;
    }

    let shadowSpread = 0;
    for (const shadow of style.shadows) {
      const offset = Math.max(Math.abs(shadow.offsetX), Math.abs(shadow.offsetY));
      shadowSpread = Math.max(shadowSpread, offset + shadow.blur * 2);
    }

    return Math.ceil(outline + shadowSpread);
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /** Sets all properties to default values */
  public setDefaults(): void {
    for (const key of TEXT_STYLE_KEYS) {
      this.setValue(key, TEXT_STYLE_DEFAULTS[key]);
    }
  }

  /** Sets all properties to undefined */
  public clear(): void {
    for (const key of TEXT_STYLE_KEYS) {
      this.setValue(key, undefined);
    }
  }

  /** Copies from another style instance */
  public copy(value: UITextStyle): void {
    for (const key of TEXT_STYLE_KEYS) {
      this.setValue(key, value.values[key]);
    }
  }

  /**
   * Calculates the padding needed on every side for outlines and shadows.
   * Properties left undefined here are taken from `fallback`, then from defaults,
   * so a span style is measured with the outlines and shadows it is drawn with.
   * @param fallback Style that supplies undefined properties (usually the common style)
   * @returns Padding in pixels
   */
  public calculatePadding(fallback?: UITextStyle): number {
    return UITextStyle.calculatePadding(UITextStyle.resolve(this, fallback));
  }

  private setValue<K extends UITextStyleKey>(
    key: K,
    value: UIResolvedTextStyle[K] | undefined,
  ): void {
    if (this.values[key] !== value) {
      this.values[key] = value;
      this.dirtyInternal = true;
    }
  }
}
