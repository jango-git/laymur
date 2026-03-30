import type { WebGLRenderer } from "three";
import { CanvasTexture, Object3D, Sprite, SpriteMaterial, Vector3 } from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import type { UIHorizontalDistanceConstraint } from "../core";
import { UIColor, UILayer, UIOrientation } from "../core";
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

export class UIHorizontalDistanceDebug implements UIConstraintDebug {
  public readonly tint: UIColor = new UIColor("cyan");

  private readonly container: Object3D = new Object3D();
  private readonly lineMaterial: LineMaterial = new LineMaterial({
    linewidth: DEBUG_LINE_WIDTH,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  private readonly lineGeometry: LineGeometry = new LineGeometry();
  private readonly line: Line2 = new Line2(this.lineGeometry, this.lineMaterial);

  private readonly tickMaterial: LineMaterial = new LineMaterial({
    linewidth: DEBUG_LINE_WIDTH,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  private readonly tickGeometry: LineSegmentsGeometry = new LineSegmentsGeometry();
  private readonly tickLine: LineSegments2 = new LineSegments2(
    this.tickGeometry,
    this.tickMaterial,
  );

  private readonly textSprite: Sprite;
  private readonly textTexture: CanvasTexture;
  private readonly spriteMaterial: SpriteMaterial;

  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private visibleInternal = true;
  private lastRenderedText = "";

  constructor(public readonly constraint: UIHorizontalDistanceConstraint) {
    this.line.renderOrder = DEBUG_RENDER_ORDER;
    this.tickLine.renderOrder = DEBUG_RENDER_ORDER;
    this.container.add(this.line);
    this.container.add(this.tickLine);

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

    this.lineGeometry.dispose();
    this.tickGeometry.dispose();
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
      this.tint.toThreeColor(this.lineMaterial.color);
      this.lineMaterial.opacity = this.tint.a;
      this.tint.toThreeColor(this.tickMaterial.color);
      this.tickMaterial.opacity = this.tint.a;
      this.spriteMaterial.opacity = this.tint.a;
      this.tint.setDirtyFalse();
    }

    renderer.getDrawingBufferSize(debugResolutionVector);
    this.lineMaterial.resolution.copy(debugResolutionVector);
    this.tickMaterial.resolution.copy(debugResolutionVector);

    const elementA = this.constraint.a;
    const elementB = this.constraint.b;

    const anchorAX = isUIPlaneElement(elementA)
      ? elementA.x + elementA.width * this.constraint.anchorA
      : elementA.x;
    const anchorAY = isUIPlaneElement(elementA) ? elementA.centerY : elementA.y;

    const anchorBX = isUIPlaneElement(elementB)
      ? elementB.x + elementB.width * this.constraint.anchorB
      : elementB.x;
    const anchorBY = isUIPlaneElement(elementB) ? elementB.centerY : elementB.y;

    const midY =
      elementA instanceof UILayer
        ? anchorBY
        : elementB instanceof UILayer
          ? anchorAY
          : (anchorAY + anchorBY) / 2;

    this.lineGeometry.setFromPoints([
      new Vector3(anchorAX, midY, 0),
      new Vector3(anchorBX, midY, 0),
    ]);

    const tickSize = 10;

    this.tickGeometry.setPositions([
      anchorAX,
      midY - tickSize,
      0,
      anchorAX,
      midY + tickSize,
      0,
      anchorBX,
      midY - tickSize,
      0,
      anchorBX,
      midY + tickSize,
      0,
    ]);

    const nextText: string = "HD: " + this.constraint.distance.toFixed(0);

    if (nextText !== this.lastRenderedText || tintDirty) {
      this.drawText(nextText);
      this.textTexture.needsUpdate = true;
      this.lastRenderedText = nextText;
    }

    this.textSprite.position.set((anchorAX + anchorBX) / 2, midY + 20, 0);
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
