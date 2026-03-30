import type { WebGLRenderer } from "three";
import { CanvasTexture, Object3D, Sprite, SpriteMaterial, Vector3 } from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import type { UIVerticalInterpolationConstraint } from "../core";
import { UIColor, UIOrientation } from "../core";
import { isUIPlaneElement } from "../core/miscellaneous/shared";
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

export class UIVerticalInterpolationDebug implements UIConstraintDebug {
  public readonly tint: UIColor = new UIColor("cyan");

  private readonly container: Object3D = new Object3D();
  private readonly baseLineMaterial: LineMaterial = new LineMaterial({
    linewidth: DEBUG_LINE_WIDTH,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  private readonly baseLineGeometry: LineGeometry = new LineGeometry();
  private readonly baseLine: Line2 = new Line2(this.baseLineGeometry, this.baseLineMaterial);

  private readonly markerMaterial: LineMaterial = new LineMaterial({
    linewidth: DEBUG_LINE_WIDTH,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  private readonly markerGeometry: LineGeometry = new LineGeometry();
  private readonly markerLine: Line2 = new Line2(this.markerGeometry, this.markerMaterial);

  private readonly textSprite: Sprite;
  private readonly textTexture: CanvasTexture;
  private readonly spriteMaterial: SpriteMaterial;

  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private visibleInternal = true;
  private lastRenderedText = "";

  constructor(public readonly constraint: UIVerticalInterpolationConstraint) {
    this.baseLine.renderOrder = DEBUG_RENDER_ORDER;
    this.markerLine.renderOrder = DEBUG_RENDER_ORDER;
    this.container.add(this.baseLine);
    this.container.add(this.markerLine);

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

    this.baseLineGeometry.dispose();
    this.markerGeometry.dispose();
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
      this.tint.toThreeColor(this.baseLineMaterial.color);
      this.baseLineMaterial.opacity = this.tint.a;
      this.tint.toThreeColor(this.markerMaterial.color);
      this.markerMaterial.opacity = this.tint.a;
      this.spriteMaterial.opacity = this.tint.a;
      this.tint.setDirtyFalse();
    }

    renderer.getDrawingBufferSize(debugResolutionVector);
    this.baseLineMaterial.resolution.copy(debugResolutionVector);
    this.markerMaterial.resolution.copy(debugResolutionVector);

    const elementA = this.constraint.a;
    const elementB = this.constraint.b;
    const elementC = this.constraint.c;

    const anchorAY = isUIPlaneElement(elementA)
      ? elementA.y + elementA.height * this.constraint.anchorA
      : elementA.y;
    const anchorAX = isUIPlaneElement(elementA) ? elementA.centerX : elementA.x;

    const anchorBY = isUIPlaneElement(elementB)
      ? elementB.y + elementB.height * this.constraint.anchorB
      : elementB.y;
    const anchorBX = isUIPlaneElement(elementB) ? elementB.centerX : elementB.x;

    const anchorCY = isUIPlaneElement(elementC)
      ? elementC.y + elementC.height * this.constraint.anchorC
      : elementC.y;

    const midX = (anchorAX + anchorBX) / 2;

    this.baseLineGeometry.setFromPoints([
      new Vector3(midX, anchorAY, 0),
      new Vector3(midX, anchorBY, 0),
    ]);

    const markerSize = 12;

    this.markerGeometry.setFromPoints([
      new Vector3(midX - markerSize, anchorCY, 0),
      new Vector3(midX + markerSize, anchorCY, 0),
    ]);

    const nextText: string = "vi: " + this.constraint.t.toFixed(2);

    if (nextText !== this.lastRenderedText || tintDirty) {
      this.drawText(nextText);
      this.textTexture.needsUpdate = true;
      this.lastRenderedText = nextText;
    }

    this.textSprite.position.set(midX + 20, anchorCY, 0);
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
