import type { WebGLRenderer } from "three";
import { CanvasTexture, Object3D, Sprite, SpriteMaterial, Vector3 } from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import type { UIAspectConstraint } from "../core";
import { UIColor, UIOrientation } from "../core";
import {
  DEBUG_BADGE_BACKGROUND_COLOR,
  DEBUG_BADGE_FONT_FAMILY,
  DEBUG_BADGE_FONT_SIZE,
  DEBUG_BADGE_SIZE,
  DEBUG_LINE_WIDTH,
  DEBUG_RENDER_ORDER,
  debugResolutionVector,
} from "./miscellaneous";
import type { UIConstraintDebug } from "./UIConstraintDebug";

export class UIAspectDebug implements UIConstraintDebug {
  public readonly tint: UIColor = new UIColor("cyan");

  private readonly container: Object3D = new Object3D();
  private readonly diagonalMaterial: LineMaterial = new LineMaterial({
    linewidth: DEBUG_LINE_WIDTH,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  private readonly diagonalGeometry: LineGeometry = new LineGeometry();
  private readonly diagonalLine: Line2 = new Line2(this.diagonalGeometry, this.diagonalMaterial);

  private readonly textSprite: Sprite;
  private readonly textTexture: CanvasTexture;
  private readonly spriteMaterial: SpriteMaterial;

  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private visibleInternal = true;
  private lastRenderedText = "";

  constructor(public readonly constraint: UIAspectConstraint) {
    this.diagonalLine.renderOrder = DEBUG_RENDER_ORDER;
    this.container.add(this.diagonalLine);

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;

    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Failed to get 2D context for debug text");
    }

    this.canvas = canvas;
    this.context = context;

    this.drawText("");
    this.textTexture = new CanvasTexture(canvas);

    this.spriteMaterial = new SpriteMaterial({
      map: this.textTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    this.textSprite = new Sprite(this.spriteMaterial);
    this.textSprite.renderOrder = DEBUG_RENDER_ORDER;
    this.textSprite.scale.set(DEBUG_BADGE_SIZE, DEBUG_BADGE_SIZE * 0.25, 1);
    this.container.add(this.textSprite);

    this.constraint.layer.signalRendering.on(this.onRendering);
    this.constraint.layer.signalOrientationChanged.on(this.onOrientationChanged);
    this.constraint.layer.sceneWrapper.insertCustomObject(this.container);
    this.updateContainerVisibility();
  }

  public get visible(): boolean {
    return this.visibleInternal;
  }

  public set visible(value: boolean) {
    if (value !== this.visibleInternal) {
      this.visibleInternal = value;
      this.updateContainerVisibility();
    }
  }

  public destroy(): void {
    this.constraint.layer.signalRendering.off(this.onRendering);
    this.constraint.layer.signalOrientationChanged.off(this.onOrientationChanged);
    this.constraint.layer.sceneWrapper.removeCustomObject(this.container);

    this.diagonalGeometry.dispose();
    this.textTexture.dispose();
  }

  private updateContainerVisibility(): void {
    const orientationActive =
      this.constraint.orientation === UIOrientation.ALWAYS ||
      this.constraint.orientation === this.constraint.layer.orientation;
    this.container.visible = this.visibleInternal && orientationActive;
  }

  private readonly onOrientationChanged = (): void => {
    this.updateContainerVisibility();
  };

  private readonly onRendering = (renderer: WebGLRenderer): void => {
    const tintDirty = this.tint.dirty;

    if (tintDirty) {
      this.tint.toThreeColor(this.diagonalMaterial.color);
      this.diagonalMaterial.opacity = this.tint.a;
      this.spriteMaterial.opacity = this.tint.a;
      this.tint.setDirtyFalse();
    }

    renderer.getDrawingBufferSize(debugResolutionVector);
    this.diagonalMaterial.resolution.copy(debugResolutionVector);

    const { x, y, oppositeX, oppositeY, width, height, centerX, centerY } = this.constraint.element;

    if (width <= 0 || height <= 0) {
      return;
    }

    this.diagonalGeometry.setFromPoints([
      new Vector3(x, y, 0),
      new Vector3(oppositeX, oppositeY, 0),
    ]);

    const nextText: string =
      this.constraint.aspect.toFixed(2) + " (" + width.toFixed(0) + "×" + height.toFixed(0) + ")";

    if (nextText !== this.lastRenderedText || tintDirty) {
      this.drawText(nextText);
      this.textTexture.needsUpdate = true;
      this.lastRenderedText = nextText;
    }

    const dx = oppositeX - x;
    const dy = oppositeY - y;
    const angle = Math.atan2(dy, dx);

    this.textSprite.position.set(centerX, centerY, 0);
    this.textSprite.material.rotation = angle;
  };

  private drawText(text: string): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.fillStyle = DEBUG_BADGE_BACKGROUND_COLOR;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.fillStyle = this.tint.getHexStringRGB();
    this.context.font = `${DEBUG_BADGE_FONT_SIZE}px ${DEBUG_BADGE_FONT_FAMILY}`;
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";

    this.context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
  }
}
