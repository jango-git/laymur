import { UITextStyle } from "../text-style/UITextStyle";
import type { UITextSpanConfig } from "./UITextSpan.Internal";

/**
 * Text span with associated style.
 * Combines text content with styling information for rendering.
 */
export class UITextSpan {
  public style: UITextStyle;
  private textInternal: string;
  private dirtyInternal = true;

  constructor(config: UITextSpanConfig) {
    this.textInternal = config.text;
    this.style = new UITextStyle(config.style);
  }

  /** Text content. */
  public get text(): string {
    return this.textInternal;
  }

  /**
   * Indicates whether text or style has been modified.
   * Must be reset to `false` externally by the owner.
   * @internal
   */
  public get dirty(): boolean {
    return this.dirtyInternal || this.style.dirty;
  }

  public set text(value: string) {
    if (value !== this.textInternal) {
      this.textInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
    this.style.setDirtyFalse();
  }
}
