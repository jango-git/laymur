import type { FerrsignView1, FerrsignView2, FerrsignView3 } from "ferrsign";
import { Ferrsign1, Ferrsign2, Ferrsign3 } from "ferrsign";
import type { WebGLRenderer } from "three";

import type { UIConstraint } from "../../constraints/UIConstraint.js";
import type { UIAnchor } from "../../elements/UIAnchor/UIAnchor.js";
import { assertValidPositiveNumber } from "../../miscellaneous/asserts.js";
import { UIContextMonitor } from "../../miscellaneous/context-monitor/UIContextMonitor.js";
import type { UIMask } from "../../miscellaneous/mask/UIMask.js";
import type { UIPlaneElement } from "../../miscellaneous/shared.js";
import { isUIModeInteractive, isUIModeVisible } from "../../miscellaneous/UIMode.js";
import { UIPriority } from "../../miscellaneous/UIPriority.js";
import type { UIInputWrapperView } from "../../wrappers/UIInputWrapper/UIInputWrapper.Internal.js";
import { UIInputWrapper } from "../../wrappers/UIInputWrapper/UIInputWrapper.js";
import type { UISceneWrapperView } from "../../wrappers/UISceneWrapper/UISceneWrapper.Internal.js";
import { UISceneWrapper } from "../../wrappers/UISceneWrapper/UISceneWrapper.js";
import type { UISolverWrapperView } from "../../wrappers/UISolverWrapper/UISolverWrapper.Internal.js";
import { UISolverWrapper } from "../../wrappers/UISolverWrapper/UISolverWrapper.js";
import type {
  UIAspectRange,
  UILayerMode,
  UILayerOptions,
  UILayerOrientation,
} from "./UILayer.Internal.js";
import {
  calculateLayerOrientation,
  copyValidAspectRange,
  LAYER_DEFAULT_MODE,
  LAYER_DEFAULT_NAME,
  LAYER_DEFAULT_SIZE,
} from "./UILayer.Internal.js";

/** Base layer for UI rendering and layout management */
export abstract class UILayer implements UIPlaneElement {
  /** Optional layer name */
  public name = "";
  /** Solver variable for x coordinate */
  public readonly xVariable: number;
  /** Solver variable for y coordinate */
  public readonly yVariable: number;
  /** Solver variable for width */
  public readonly wVariable: number;
  /** Solver variable for height */
  public readonly hVariable: number;

  protected readonly inputWrapperInternal = new UIInputWrapper();
  private readonly solverWrapperInternal = new UISolverWrapper((constraints) => {
    this.reportRejectedConstraints(constraints);
  });
  private readonly sceneWrapperInternal: UISceneWrapper;

  private modeInternal: UILayerMode;
  private orientationInternal: UILayerOrientation;
  private squareAspectRangeInternal: UIAspectRange | null;
  private pixelDensityInternal = 1;

  private readonly signalOrientationChangedInternal = new Ferrsign2<UILayerOrientation, UILayer>();
  private readonly signalModeChangedInternal = new Ferrsign2<UILayerMode, UILayer>();
  private readonly signalRenderingInternal = new Ferrsign3<WebGLRenderer, number, UILayer>();
  private readonly signalResizedInternal = new Ferrsign3<number, number, UILayer>();
  private readonly signalContextLostInternal = new Ferrsign1<UILayer>();
  private readonly signalContextRestoredInternal = new Ferrsign1<UILayer>();

  private readonly signalConstraintAddedInternal = new Ferrsign2<UILayer, UIConstraint>();
  private readonly signalConstraintRemovedInternal = new Ferrsign2<UILayer, UIConstraint>();

  private readonly constraintRegistryInternal: UIConstraint[] = [];
  private readonly elementRegistryInternal: UIAnchor[] = [];
  private readonly maskRegistryInternal: UIMask[] = [];
  private contextMonitor: UIContextMonitor | null = null;
  private destroyedInternal = false;

  /**
   * @param options Layer configuration
   * @param orientation Orientation the subclass sized the layer for; classified from the size if
   *   omitted
   */
  constructor(options: Partial<UILayerOptions>, orientation?: UILayerOrientation) {
    if (options.width !== undefined) {
      assertValidPositiveNumber(options.width, "UILayer.constructor.options.width");
    }

    if (options.height !== undefined) {
      assertValidPositiveNumber(options.height, "UILayer.constructor.options.height");
    }

    const width = options.width ?? LAYER_DEFAULT_SIZE;
    const height = options.height ?? LAYER_DEFAULT_SIZE;

    this.sceneWrapperInternal = new UISceneWrapper(width, height);
    this.name = options.name ?? LAYER_DEFAULT_NAME;
    this.modeInternal = options.mode ?? LAYER_DEFAULT_MODE;
    const squareAspectRange = options.squareAspectRange ?? null;
    this.squareAspectRangeInternal =
      squareAspectRange === null
        ? null
        : copyValidAspectRange(squareAspectRange, "UILayer.constructor.options.squareAspectRange");
    this.orientationInternal = orientation ?? this.calculateOrientation(width, height);

    this.xVariable = this.solverWrapperInternal.createVariable(0, UIPriority.P0);
    this.yVariable = this.solverWrapperInternal.createVariable(0, UIPriority.P0);
    this.wVariable = this.solverWrapperInternal.createVariable(width, UIPriority.P0);
    this.hVariable = this.solverWrapperInternal.createVariable(height, UIPriority.P0);
  }

  /**
   * Scene of the layer. Elements living outside laymur, such as Spine skeletons, use it to add
   * their own objects ordered among the planes.
   */
  public get sceneWrapper(): UISceneWrapperView {
    return this.sceneWrapperInternal;
  }

  /** @internal */
  public get solverWrapper(): UISolverWrapperView {
    return this.solverWrapperInternal;
  }

  /** @internal */
  public get inputWrapper(): UIInputWrapperView {
    return this.inputWrapperInternal;
  }

  /** X coordinate in world units (always 0 for layers) */
  public get x(): number {
    return this.solverWrapperInternal.readVariableValue(this.xVariable);
  }

  /** Y coordinate in world units (always 0 for layers) */
  public get y(): number {
    return this.solverWrapperInternal.readVariableValue(this.yVariable);
  }

  /** Layer width in world units */
  public get width(): number {
    return this.solverWrapperInternal.readVariableValue(this.wVariable);
  }

  /** Layer height in world units */
  public get height(): number {
    return this.solverWrapperInternal.readVariableValue(this.hVariable);
  }

  /** X coordinate of right edge */
  public get oppositeX(): number {
    return this.x + this.width;
  }

  /** Y coordinate of top edge */
  public get oppositeY(): number {
    return this.y + this.height;
  }

  /** X coordinate of horizontal center */
  public get centerX(): number {
    return this.x + this.width / 2;
  }

  /** Y coordinate of vertical center */
  public get centerY(): number {
    return this.y + this.height / 2;
  }

  /** Current visibility and interactivity mode */
  public get mode(): UILayerMode {
    return this.modeInternal;
  }

  /** Current orientation based on aspect ratio */
  public get orientation(): UILayerOrientation {
    return this.orientationInternal;
  }

  /**
   * Aspects, width divided by height, the layer counts as square. Null when the layer has no
   * square orientation: then a layer as wide as high is VERTICAL.
   */
  public get squareAspectRange(): Readonly<UIAspectRange> | null {
    return this.squareAspectRangeInternal;
  }

  /** Signal fired when orientation changes */
  public get signalOrientationChanged(): FerrsignView2<UILayerOrientation, UILayer> {
    return this.signalOrientationChangedInternal;
  }

  /** Signal fired when mode changes */
  public get signalModeChanged(): FerrsignView2<UILayerMode, UILayer> {
    return this.signalModeChangedInternal;
  }

  /** Signal fired during rendering */
  public get signalRendering(): FerrsignView3<WebGLRenderer, number, UILayer> {
    return this.signalRenderingInternal;
  }

  /** Signal fired when layer resized */
  public get signalResized(): FerrsignView3<number, number, UILayer> {
    return this.signalResizedInternal;
  }

  /**
   * Signal fired when the WebGL context of the renderer the layer is drawn with is lost. The
   * layer draws nothing until the context is restored, so pause what depends on frames being shown.
   */
  public get signalContextLost(): FerrsignView1<UILayer> {
    return this.signalContextLostInternal;
  }

  /**
   * Signal fired when the WebGL context is restored. The renderer has recreated its GL state by
   * then. Content that lives on the GPU only, such as render targets, has to be redrawn.
   */
  public get signalContextRestored(): FerrsignView1<UILayer> {
    return this.signalContextRestoredInternal;
  }

  /**
   * Signal fired when a constraint is added. It fires from the base constructor, before the
   * fields of the subclass are set: read them no sooner than in a microtask or on the next frame.
   */
  public get signalConstraintAdded(): FerrsignView2<UILayer, UIConstraint> {
    return this.signalConstraintAddedInternal;
  }

  /** Signal fired when a constraint is removed */
  public get signalConstraintRemoved(): FerrsignView2<UILayer, UIConstraint> {
    return this.signalConstraintRemovedInternal;
  }

  /** Constraint registry */
  public get constraintRegistry(): readonly UIConstraint[] {
    return this.constraintRegistryInternal;
  }

  /** Elements created on the layer and not destroyed yet */
  public get elementRegistry(): readonly UIAnchor[] {
    return this.elementRegistryInternal;
  }

  /** Masks whose source is the layer or one of its elements, not destroyed yet */
  public get maskRegistry(): readonly UIMask[] {
    return this.maskRegistryInternal;
  }

  /** Whether the layer is destroyed */
  public get destroyed(): boolean {
    return this.destroyedInternal;
  }

  /**
   * Screen pixels per world unit, as of the last render. Canvas-drawn elements and `UIScene`
   * rasterize at this density, so their content stays sharp on high-DPI screens. 1 for a layer
   * that does not know its screen size.
   */
  public get pixelDensity(): number {
    return this.pixelDensityInternal;
  }

  /**
   * Updates visibility and interactivity mode. A layer that stops taking input cancels the
   * pressed pointers: their releases would never arrive.
   */
  public set mode(value: UILayerMode) {
    if (value !== this.modeInternal) {
      this.modeInternal = value;
      if (!isUIModeInteractive(value)) {
        this.cancelPointers();
      }
      this.signalModeChangedInternal.emit(this.modeInternal, this);
    }
  }

  /** Updates the aspects counted as square. The orientation and the size follow at once. */
  public set squareAspectRange(value: Readonly<UIAspectRange> | null) {
    this.squareAspectRangeInternal =
      value === null ? null : copyValidAspectRange(value, "UILayer.squareAspectRange");
    this.refreshOrientation();
  }

  /**
   * Destroys all elements, constraints and masks of the layer, those tied to the layer itself
   * included, and frees the GPU resources of the layer. Textures are left to their owners.
   * Does nothing if the layer is already destroyed.
   */
  public destroy(): void {
    if (this.destroyedInternal) {
      return;
    }
    this.destroyedInternal = true;
    this.bindContextMonitor(null);

    for (const element of [...this.elementRegistryInternal]) {
      element.destroy();
    }
    this.destroyMasksUsingSource(this);
    this.destroyConstraints(() => true);
    this.sceneWrapperInternal.destroy();
  }

  /**
   * Destroys the constraints that refer to any of the solver variables, so that an element
   * can remove its variables.
   * @internal
   */
  public destroyConstraintsUsingVariables(variables: readonly number[]): void {
    this.destroyConstraints((constraint) =>
      variables.some((variable) => constraint.isUsingVariable(variable)),
    );
  }

  /**
   * Destroys the masks that follow the given source, so that the source can be removed.
   * @internal
   */
  public destroyMasksUsingSource(source: UIAnchor | UILayer): void {
    for (const mask of [...this.maskRegistryInternal]) {
      if (mask.source === source) {
        mask.destroy();
      }
    }
  }

  /** @internal */
  public addMask(mask: UIMask): void {
    if (this.destroyedInternal) {
      throw new Error(`UILayer.addMask: layer is destroyed`);
    }
    this.maskRegistryInternal.push(mask);
  }

  /** @internal */
  public removeMask(mask: UIMask): void {
    const index = this.maskRegistryInternal.indexOf(mask);
    if (index === -1) {
      throw new Error(`UILayer.removeMask: mask is not found in this layer`);
    }
    this.maskRegistryInternal.splice(index, 1);
  }

  /** @internal */
  public addElement(element: UIAnchor): void {
    if (this.destroyedInternal) {
      throw new Error(`UILayer.addElement: layer is destroyed`);
    }
    this.elementRegistryInternal.push(element);
  }

  /** @internal */
  public removeElement(element: UIAnchor): void {
    const index = this.elementRegistryInternal.indexOf(element);
    if (index === -1) {
      throw new Error(`UILayer.removeElement: element is not found in this layer`);
    }
    this.elementRegistryInternal.splice(index, 1);
  }

  /** @internal */
  public addConstraint(constraint: UIConstraint): void {
    if (this.destroyedInternal) {
      throw new Error(`UILayer.addConstraint: layer is destroyed`);
    }
    if (this.constraintRegistryInternal.includes(constraint)) {
      throw new Error(`UILayer.addConstraint: constraint is already added to this layer`);
    }
    this.constraintRegistryInternal.push(constraint);
    this.signalConstraintAddedInternal.emit(this, constraint);
  }

  /** @internal */
  public removeConstraint(constraint: UIConstraint): void {
    const index = this.constraintRegistryInternal.indexOf(constraint);
    if (index === -1) {
      throw new Error(`UILayer.removeConstraint: constraint is not found in this layer`);
    }
    this.constraintRegistryInternal.splice(index, 1);
    this.signalConstraintRemovedInternal.emit(this, constraint);
  }

  /**
   * @param width New width in world units
   * @param height New height in world units
   * @param orientation Orientation the size was chosen for
   */
  protected resizeInternal(width: number, height: number, orientation: UILayerOrientation): void {
    this.solverWrapperInternal.suggestVariableValue(this.wVariable, width);
    this.solverWrapperInternal.suggestVariableValue(this.hVariable, height);
    this.sceneWrapperInternal.resize(width, height);

    // Updated before the signals, so that a resize handler reads the new orientation
    const orientationChanged = orientation !== this.orientationInternal;
    this.orientationInternal = orientation;

    this.signalResizedInternal.emit(width, height, this);
    if (orientationChanged) {
      this.signalOrientationChangedInternal.emit(this.orientationInternal, this);
    }
  }

  /**
   * Orientation of an area under the `squareAspectRange` of the layer.
   * @param width Area width
   * @param height Area height
   * @returns Orientation of the area
   */
  protected calculateOrientation(width: number, height: number): UILayerOrientation {
    return calculateLayerOrientation(width, height, this.squareAspectRangeInternal);
  }

  /**
   * Classifies the orientation again after `squareAspectRange` changes. A subclass whose size
   * depends on the orientation resizes here.
   */
  protected refreshOrientation(): void {
    const orientation = this.calculateOrientation(this.width, this.height);
    if (orientation !== this.orientationInternal) {
      this.orientationInternal = orientation;
      this.signalOrientationChangedInternal.emit(this.orientationInternal, this);
    }
  }

  /** Sets the screen pixels per world unit, read by elements on their next render */
  protected setPixelDensity(value: number): void {
    assertValidPositiveNumber(value, "UILayer.setPixelDensity.value");
    this.pixelDensityInternal = value;
  }

  protected renderInternal(renderer: WebGLRenderer, deltaTime: number): void {
    if (this.destroyedInternal) {
      return;
    }

    // While the context is lost the frame is skipped as a whole: elements compare versions, so
    // nothing changed meanwhile is lost once drawing resumes
    const contextMonitor = UIContextMonitor.for(renderer);
    this.bindContextMonitor(contextMonitor);
    if (contextMonitor.lost) {
      return;
    }

    if (isUIModeVisible(this.mode)) {
      this.signalRenderingInternal.emit(renderer, deltaTime, this);
      if (this.destroyed) {
        return;
      }
      this.sceneWrapperInternal.render(renderer);
    }
  }

  /**
   * Cancels every pressed pointer, for its elements and for the layer: no release of those
   * pointers will be reported.
   */
  protected cancelPointers(): void {
    this.inputWrapperInternal.cancelPointers((x, y, identifier) => {
      this.reportPointerCancelledByLayer(x, y, identifier);
    });
  }

  /** Follows the context of the renderer the layer is drawn with, or stops following with null */
  private bindContextMonitor(monitor: UIContextMonitor | null): void {
    if (monitor === this.contextMonitor) {
      return;
    }
    this.contextMonitor?.signalLost.off(this.onContextLost);
    this.contextMonitor?.signalRestored.off(this.onContextRestored);
    this.contextMonitor = monitor;
    monitor?.signalLost.on(this.onContextLost);
    monitor?.signalRestored.on(this.onContextRestored);
  }

  private readonly onContextLost = (): void => {
    this.signalContextLostInternal.emit(this);
  };

  private readonly onContextRestored = (): void => {
    this.signalContextRestoredInternal.emit(this);
  };

  /** A removal signal handler may destroy other constraints, so the registry is walked over a copy */
  private destroyConstraints(predicate: (constraint: UIConstraint) => boolean): void {
    for (const constraint of [...this.constraintRegistryInternal]) {
      if (!constraint.destroyed && predicate(constraint)) {
        constraint.destroy();
      }
    }
  }

  /**
   * Reports constraints the solver rejected for conflicting with required constraints. Throws in
   * development builds. Warns in production builds, where the layout goes on without them.
   */
  private reportRejectedConstraints(constraints: readonly UIConstraint[]): void {
    const names = constraints.map((constraint) =>
      constraint.name === ""
        ? constraint.constructor.name
        : `${constraint.constructor.name} "${constraint.name}"`,
    );
    const message = `UILayer "${this.name}": constraints conflict with required (P0) constraints and are not applied: ${names.join(", ")}`;
    if (process.env.NODE_ENV !== "production") {
      throw new Error(message);
    }
    // eslint-disable-next-line no-console -- The only report of a broken layout in production builds
    console.warn(message);
  }

  /**
   * Called for each pointer the layer cancels, before its elements are told: the subclass that
   * takes the input reports the cancel to the users of the layer.
   * @param x Last known horizontal position in layer coordinates
   * @param y Last known vertical position in layer coordinates
   * @param identifier Pointer identifier
   */
  protected abstract reportPointerCancelledByLayer(x: number, y: number, identifier: number): void;
}
