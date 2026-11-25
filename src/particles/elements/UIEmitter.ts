import type { FerrsignView2 } from "ferrsign";
import { Ferrsign2 } from "ferrsign";
import type { WebGLRenderer } from "three";
import { Vector2 } from "three";

import { UIAnchor } from "../../core/elements/UIAnchor/UIAnchor.js";
import type { UIBlendMode, UILayer } from "../../core/index.js";
import {
  assertNotDestroyed,
  assertValidNonNegativeNumber,
  assertValidNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts.js";
import type { GLProperty, GLTypeInfo } from "../../core/miscellaneous/generic-plane/shared.js";
import { resolveGLSLTypeInfo } from "../../core/miscellaneous/generic-plane/shared.js";
import { blendModeToFactor } from "../../core/miscellaneous/UIBlendMode.js";
import { isUIModeVisible } from "../../core/miscellaneous/UIMode.js";
import type { UIBehaviorModule } from "../behaviorModules/UIBehaviorModule.js";
import {
  assignRenderingRandomValues,
  collectProperties,
  collectRenderingUniforms,
} from "../instancedParticle/UIInstancedParticle.Internal.js";
import { UIInstancedParticle } from "../instancedParticle/UIInstancedParticle.js";
import {
  assertValidNonNegativeInteger,
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_LIFETIME,
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_RANDOM_A,
  BUILTIN_OFFSET_RANDOM_B,
  BUILTIN_OFFSET_RANDOM_C,
  BUILTIN_OFFSET_RANDOM_D,
  BUILTIN_OFFSET_RANDOM_E,
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  computeParticleSeed,
  particleRandom,
  particleRandomStream,
  writeParticleSeed,
} from "../miscellaneous/miscellaneous.js";
import type { UIRenderingModule } from "../renderingModules/UIRenderingModule.js";
import type { UISpawnModule } from "../spawnModules/UISpawnModule.js";
import type {
  UIEmitterMode,
  UIEmitterOptions,
  UIEmitterPlayOptions,
  UISpawnPath,
} from "./UIEmitter.Internal.js";
import {
  advanceParticle,
  EMITTER_BEHAVIOR_SALT_BASE,
  EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES,
  EMITTER_DEFAULT_BLEND_MODE,
  EMITTER_DEFAULT_CAPACITY_STEP,
  EMITTER_DEFAULT_EXPECTED_CAPACITY,
  EMITTER_DEFAULT_LIFETIME,
  EMITTER_DEFAULT_MAX_DELTA_TIME,
  EMITTER_DEFAULT_MODE,
  EMITTER_DEFAULT_PREWARM_STEP,
  EMITTER_DEFAULT_SPACE,
  EMITTER_DEFAULT_Z_INDEX,
  EMITTER_SHADER_SALT,
  EMITTER_SPAWN_SALT_BASE,
  ignoreInput,
  UIEmitterSpace,
} from "./UIEmitter.Internal.js";
import { UIEmissionSchedule } from "./UIEmitter.Schedule.js";

/** Builtin slots of the random values the shaders read, each with its stream */
const SHADER_RANDOM_SLOTS = [
  BUILTIN_OFFSET_RANDOM_A,
  BUILTIN_OFFSET_RANDOM_B,
  BUILTIN_OFFSET_RANDOM_C,
  BUILTIN_OFFSET_RANDOM_D,
  BUILTIN_OFFSET_RANDOM_E,
].map((offset, channel) => ({
  offset,
  stream: particleRandomStream(EMITTER_SHADER_SALT, channel),
}));

/**
 * Particle emitter element.
 *
 * Spawns, updates, and renders particles using modular spawn/behavior/rendering pipeline. Each
 * frame ages the particles and removes the dead ones, spawns the particles due, runs the behavior
 * modules and moves the particles along their velocity.
 */
export class UIEmitter extends UIAnchor {
  /** Whether to call destroy() on all modules when emitter is destroyed */
  public automaticallyDestroyModules: boolean;

  private readonly mesh: UIInstancedParticle;
  private readonly catcherHandler: number;

  private readonly emission = new UIEmissionSchedule();
  /** Path of the emitter over the current frame, along which emission places particles */
  private readonly framePath: UISpawnPath = { time: 0, fromX: 0, fromY: 0, toX: 0, toY: 0 };
  /** Path of a single point and moment, for bursts */
  private readonly pointPath: UISpawnPath = { time: 0, fromX: 0, fromY: 0, toX: 0, toY: 0 };
  /** Layer positions of the particles that died this frame, x and y in turn */
  private readonly deadPositions: number[] = [];
  private readonly signalParticleDiedInternal = new Ferrsign2<number, number>();

  private modeInternal: UIEmitterMode;
  private blendModeInternal: UIBlendMode;
  private spaceInternal: UIEmitterSpace;
  private maxDeltaTimeInternal: number;
  private seedInternal: number;
  /** Particles spawned since the seed was set; picks the seed of the next particle */
  private spawnedCount = 0;
  /** Emitter position at the end of the last frame, where the emission of this frame starts */
  private previousX: number;
  private previousY: number;
  /** Whether `play` was called since the last frame: its emission starts at the current position */
  private emissionStarted = false;

  /**
   * @param layer - Layer containing this emitter
   * @param spawnSequence - Modules that initialize new particles
   * @param behaviorSequence - Modules that update particles each frame
   * @param renderingSequence - Modules that control particle appearance
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    private readonly spawnSequence: UISpawnModule[],
    private readonly behaviorSequence: readonly UIBehaviorModule[],
    private readonly renderingSequence: readonly UIRenderingModule[],
    options: Partial<UIEmitterOptions> = {},
  ) {
    super(layer, options);

    const collectedProperties: Record<string, GLTypeInfo> = {
      builtin: resolveGLSLTypeInfo("Matrix4"),
      // 0, 1   positionX, positionY
      // 2, 3   velocityX, velocityY
      // 4, 5   scaleX, scaleY
      // 6, 7   rotation, torque
      // 8, 9   lifetime, age
      // 10-14  random values A-E for shaders
      // 15     seed, read by shaders as random value F
    };
    collectProperties(collectedProperties, spawnSequence, "UIEmitter.constructor.spawnSequence");
    collectProperties(
      collectedProperties,
      behaviorSequence,
      "UIEmitter.constructor.behaviorSequence",
    );
    collectProperties(
      collectedProperties,
      renderingSequence,
      "UIEmitter.constructor.renderingSequence",
    );

    this.blendModeInternal = options.blendMode ?? EMITTER_DEFAULT_BLEND_MODE;
    const collectedUniforms: Record<string, GLProperty> = {
      origin: { value: new Vector2(), glslTypeInfo: resolveGLSLTypeInfo("Vector2") },
      blendFactor: {
        value: blendModeToFactor(this.blendModeInternal),
        glslTypeInfo: resolveGLSLTypeInfo("number"),
      },
    };
    const renderingSources = assignRenderingRandomValues(
      collectRenderingUniforms(
        collectedUniforms,
        renderingSequence,
        "UIEmitter.constructor.renderingSequence",
      ),
      "UIEmitter.constructor.renderingSequence",
    );

    const zIndex = options.zIndex ?? EMITTER_DEFAULT_Z_INDEX;
    assertValidNumber(zIndex, "UIEmitter.constructor.options.zIndex");
    this.catcherHandler = this.layer.inputWrapper.createInputCatcher(
      {
        catchPointerDown: ignoreInput,
        catchPointerMove: ignoreInput,
        catchPointerUp: ignoreInput,
        catchPointerCancel: ignoreInput,
      },
      zIndex,
    );

    this.mesh = new UIInstancedParticle(
      renderingSources,
      collectedUniforms,
      collectedProperties,
      options.expectedCapacity ?? EMITTER_DEFAULT_EXPECTED_CAPACITY,
      options.capacityStep ?? EMITTER_DEFAULT_CAPACITY_STEP,
    );

    this.layer.signalRendering.on(this.onRendering);
    this.layer.signalSynchronizing.on(this.onSynchronizing);
    this.layer.signalCompiling.on(this.onCompiling);
    this.layer.sceneWrapper.insertOrderedObject(
      this.mesh,
      this.layer.inputWrapper.getDepth(this.catcherHandler),
    );

    this.automaticallyDestroyModules =
      options.automaticallyDestroyModules ?? EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES;
    this.modeInternal = options.mode ?? EMITTER_DEFAULT_MODE;
    this.mesh.visible = isUIModeVisible(this.modeInternal);
    this.spaceInternal = options.space ?? EMITTER_DEFAULT_SPACE;
    this.previousX = this.x;
    this.previousY = this.y;
    this.maxDeltaTimeInternal = options.maxDeltaTime ?? EMITTER_DEFAULT_MAX_DELTA_TIME;
    assertValidPositiveNumber(this.maxDeltaTimeInternal, "UIEmitter.constructor.maxDeltaTime");
    this.seedInternal = options.seed ?? Math.floor(Math.random() * 0x100000000);
    assertValidNonNegativeInteger(this.seedInternal, "UIEmitter.constructor.seed");
  }

  /**
   * Fires for every particle that dies, with its position in layer coordinates. Fires after the
   * frame removed its dead particles, so a callback may spawn particles, also on this emitter.
   */
  public get signalParticleDied(): FerrsignView2<number, number> {
    return this.signalParticleDiedInternal;
  }

  /** Seed of the random values */
  public get seed(): number {
    return this.seedInternal;
  }

  /** Longest frame step in seconds; longer frames are clamped */
  public get maxDeltaTime(): number {
    return this.maxDeltaTimeInternal;
  }

  /** Visibility mode */
  public get mode(): UIEmitterMode {
    return this.modeInternal;
  }

  /** Color blending of the particles with what is drawn under them */
  public get blendMode(): UIBlendMode {
    return this.blendModeInternal;
  }

  /** Coordinate space of particle positions */
  public get space(): UIEmitterSpace {
    return this.spaceInternal;
  }

  /**
   * Rendering order among the elements of the layer. Higher values on top; elements with equal
   * values keep the order of creation, a later one on top.
   */
  public get zIndex(): number {
    return this.layer.inputWrapper.getZIndex(this.catcherHandler);
  }

  /**
   * Layer point particle positions are relative to: the emitter in LOCAL space, where live
   * particles move with it, the layer origin in WORLD space
   */
  private get originX(): number {
    return this.spaceInternal === UIEmitterSpace.WORLD ? 0 : this.x;
  }

  private get originY(): number {
    return this.spaceInternal === UIEmitterSpace.WORLD ? 0 : this.y;
  }

  /** Visibility mode */
  public set mode(value: UIEmitterMode) {
    assertNotDestroyed(this, "element", "UIEmitter.mode");
    if (this.modeInternal !== value) {
      this.modeInternal = value;
      this.mesh.visible = isUIModeVisible(value);
    }
  }

  /** Color blending of the particles with what is drawn under them */
  public set blendMode(value: UIBlendMode) {
    assertNotDestroyed(this, "element", "UIEmitter.blendMode");
    this.blendModeInternal = value;
    this.mesh.setBlendFactor(blendModeToFactor(value));
  }

  /** Coordinate space of particle positions. Live particles keep their place on the layer. */
  public set space(value: UIEmitterSpace) {
    assertNotDestroyed(this, "element", "UIEmitter.space");
    if (this.spaceInternal === value) {
      return;
    }
    const previousOriginX = this.originX;
    const previousOriginY = this.originY;
    this.spaceInternal = value;
    const shiftX = previousOriginX - this.originX;
    const shiftY = previousOriginY - this.originY;

    const { builtin } = this.mesh.propertyBuffers;
    const { array, itemSize } = builtin;
    for (let i = 0; i < this.mesh.instanceCount; i++) {
      array[i * itemSize + BUILTIN_OFFSET_POSITION_X] += shiftX;
      array[i * itemSize + BUILTIN_OFFSET_POSITION_Y] += shiftY;
    }
    builtin.needsUpdate = true;
  }

  /** Longest frame step in seconds; longer frames are clamped */
  public set maxDeltaTime(value: number) {
    assertNotDestroyed(this, "element", "UIEmitter.maxDeltaTime");
    assertValidPositiveNumber(value, "UIEmitter.maxDeltaTime");
    this.maxDeltaTimeInternal = value;
  }

  /**
   * Sets the seed and restarts its sequence: the next particles repeat those spawned after the
   * same seed was set before
   */
  public set seed(value: number) {
    assertNotDestroyed(this, "element", "UIEmitter.seed");
    assertValidNonNegativeInteger(value, "UIEmitter.seed");
    this.seedInternal = value;
    this.spawnedCount = 0;
  }

  /**
   * Rendering order among the elements of the layer. Higher values on top; elements with equal
   * values keep the order of creation, a later one on top.
   */
  public set zIndex(value: number) {
    assertNotDestroyed(this, "element", "UIEmitter.zIndex");
    assertValidNumber(value, "UIEmitter.zIndex");
    this.layer.inputWrapper.setZIndex(this.catcherHandler, value);
  }

  /**
   * Spawns a specific number of particles immediately. Before the spawn modules run, every
   * property of a new particle is 0, except scale 1 and lifetime 1 second.
   *
   * @param count - Number of particles to create, a non-negative integer
   */
  public burst(count: number): void {
    assertNotDestroyed(this, "element", "UIEmitter.burst");
    assertValidNonNegativeInteger(count, "UIEmitter.burst.count");
    if (count === 0) {
      return;
    }

    this.spawnParticles(count, 0, 0, this.setPointPath(this.x, this.y));
  }

  /**
   * Spawns particles immediately as if the emitter stood at a point, such as where a particle of
   * another emitter died
   *
   * @param count - Number of particles to create, a non-negative integer
   * @param x - Point in layer coordinates
   * @param y - Point in layer coordinates
   */
  public burstAt(count: number, x: number, y: number): void {
    assertNotDestroyed(this, "element", "UIEmitter.burstAt");
    assertValidNonNegativeInteger(count, "UIEmitter.burstAt.count");
    assertValidNumber(x, "UIEmitter.burstAt.x");
    assertValidNumber(y, "UIEmitter.burstAt.y");
    if (count === 0) {
      return;
    }

    this.spawnParticles(count, 0, 0, this.setPointPath(x, y));
  }

  /**
   * Runs the simulation ahead without drawing, so that an emission started with `play` shows
   * its particles in full from the first frame. The emitter stays where it is meanwhile.
   *
   * @param duration - Seconds to simulate
   * @param step - Simulation step in seconds; the last step is shorter if needed
   */
  public prewarm(duration: number, step = EMITTER_DEFAULT_PREWARM_STEP): void {
    assertNotDestroyed(this, "element", "UIEmitter.prewarm");
    assertValidNonNegativeNumber(duration, "UIEmitter.prewarm.duration");
    assertValidPositiveNumber(step, "UIEmitter.prewarm.step");

    for (let elapsed = 0; elapsed < duration; elapsed += step) {
      this.simulate(Math.min(step, duration - elapsed));
    }
  }

  /** Removes all active particles */
  public clear(): void {
    assertNotDestroyed(this, "element", "UIEmitter.clear");
    this.mesh.drop();
  }

  /**
   * Starts particle emission: a stream by time and by distance moved, and bursts. Particles due
   * within a frame are spread over it.
   *
   * @param rate - Particles per second
   * @param options - Duration, particles per distance and bursts
   */
  public play(rate: number, options: Partial<UIEmitterPlayOptions> = {}): void {
    assertNotDestroyed(this, "element", "UIEmitter.play");
    this.emission.start(rate, options);
    this.emissionStarted = true;
  }

  /** Stops particle emission; live particles play out */
  public stop(): void {
    assertNotDestroyed(this, "element", "UIEmitter.stop");
    this.emission.stop();
  }

  /** Frees the particles and the input catcher, optionally destroys modules */
  protected override destroyInternal(): void {
    this.layer.signalRendering.off(this.onRendering);
    this.layer.signalSynchronizing.off(this.onSynchronizing);
    this.layer.signalCompiling.off(this.onCompiling);
    this.layer.sceneWrapper.removeOrderedObject(this.mesh);
    this.mesh.destroy();
    this.layer.inputWrapper.destroyInputCatcher(this.catcherHandler);

    if (this.automaticallyDestroyModules) {
      for (const module of this.spawnSequence) {
        module.destroy?.();
      }
      for (const module of this.behaviorSequence) {
        module.destroy?.();
      }
      for (const module of this.renderingSequence) {
        module.destroy?.();
      }
    }

    super.destroyInternal();
  }

  /** Sets the point path to a point at the end of the last frame */
  private setPointPath(x: number, y: number): UISpawnPath {
    const path = this.pointPath;
    path.time = 0;
    path.fromX = path.toX = x;
    path.fromY = path.toY = y;
    return path;
  }

  /**
   * Spawns particles at moments `firstMoment + k * interval` seconds from the start of a frame.
   * Spawn modules write a particle relative to the emitter; it is then placed at the point of the
   * path at its moment and aged by the rest of the frame.
   */
  private spawnParticles(
    count: number,
    firstMoment: number,
    interval: number,
    path: UISpawnPath,
  ): void {
    const instanceBegin = this.mesh.instanceCount;
    this.mesh.createInstances(count);
    const instanceEnd = this.mesh.instanceCount;
    // A slot may hold a dead particle's values.
    this.mesh.resetInstances(instanceBegin, instanceEnd);

    const { array, itemSize } = this.mesh.propertyBuffers.builtin;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      array[itemOffset + BUILTIN_OFFSET_SCALE_X] = 1;
      array[itemOffset + BUILTIN_OFFSET_SCALE_Y] = 1;
      array[itemOffset + BUILTIN_OFFSET_LIFETIME] = EMITTER_DEFAULT_LIFETIME;
      writeParticleSeed(
        array,
        itemOffset,
        computeParticleSeed(this.seedInternal, this.spawnedCount++),
      );
      for (const { offset, stream } of SHADER_RANDOM_SLOTS) {
        array[itemOffset + offset] = particleRandom(array, itemOffset, stream);
      }
    }

    for (let index = 0; index < this.spawnSequence.length; index++) {
      this.spawnSequence[index].spawn(
        this.mesh.propertyBuffers,
        instanceBegin,
        instanceEnd,
        EMITTER_SPAWN_SALT_BASE + index,
      );
    }

    const { time: frameTime, fromX, fromY, toX, toY } = path;
    const { originX, originY } = this;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      // Rounding can put the last moment just past the frame, and the age below 0.
      const moment = Math.min(firstMoment + (i - instanceBegin) * interval, frameTime);

      const t = frameTime > 0 ? moment / frameTime : 1;
      array[itemOffset + BUILTIN_OFFSET_POSITION_X] += fromX + (toX - fromX) * t - originX;
      array[itemOffset + BUILTIN_OFFSET_POSITION_Y] += fromY + (toY - fromY) * t - originY;

      // Moved back by its moment, the particle is advanced by the whole frame with the live
      // ones and ends it at p + v * (frameTime - moment), with that age.
      advanceParticle(array, itemOffset, -moment);
      array[itemOffset + BUILTIN_OFFSET_AGE] = frameTime - moment;
    }

    this.mesh.propertyBuffers.builtin.needsUpdate = true;
  }

  /** Spawns the particles the emission schedule hands out, along the frame path */
  private readonly spawnDue = (count: number, firstMoment: number, interval: number): void => {
    this.spawnParticles(count, firstMoment, interval, this.framePath);
  };

  /** Spawns the particles of the emission due within a frame of `deltaTime` seconds */
  private emit(deltaTime: number): void {
    if (!this.emission.isPlaying) {
      return;
    }

    const x = this.x;
    const y = this.y;
    const started = this.emissionStarted;
    this.emissionStarted = false;
    const path = this.framePath;
    path.time = deltaTime;
    path.toX = x;
    path.toY = y;
    // In LOCAL space live particles move with the emitter, so its path is not traced.
    if (started || this.spaceInternal === UIEmitterSpace.LOCAL) {
      path.fromX = x;
      path.fromY = y;
    } else {
      path.fromX = this.previousX;
      path.fromY = this.previousY;
    }

    const distance = started ? 0 : Math.hypot(x - this.previousX, y - this.previousY);
    this.emission.advance(deltaTime, distance, this.spawnDue);
  }

  /** Removes the dead particles and reports them through the signal */
  private removeDeadParticles(): void {
    const positions = this.deadPositions;
    positions.length = 0;
    this.mesh.removeDeadParticles(this.collectDeadParticle);

    // After the removal: a callback may spawn particles, which would disturb it.
    for (let i = 0; i < positions.length; i += 2) {
      this.signalParticleDiedInternal.emit(positions[i], positions[i + 1]);
    }
  }

  /** Records the layer position of a dead particle */
  private readonly collectDeadParticle = (array: ArrayLike<number>, itemOffset: number): void => {
    this.deadPositions.push(
      array[itemOffset + BUILTIN_OFFSET_POSITION_X] + this.originX,
      array[itemOffset + BUILTIN_OFFSET_POSITION_Y] + this.originY,
    );
  };

  /** Advances the particles and the emission by `deltaTime` seconds */
  private simulate(deltaTime: number): void {
    if (this.mesh.instanceCount > 0) {
      const { array, itemSize } = this.mesh.propertyBuffers.builtin;

      for (let i = 0; i < this.mesh.instanceCount; i++) {
        array[i * itemSize + BUILTIN_OFFSET_AGE] += deltaTime;
      }

      this.removeDeadParticles();
    }

    this.emit(deltaTime);
    this.previousX = this.x;
    this.previousY = this.y;

    const { propertyBuffers, instanceCount } = this.mesh;
    if (instanceCount === 0) {
      return;
    }

    for (let index = 0; index < this.behaviorSequence.length; index++) {
      this.behaviorSequence[index].update(
        propertyBuffers,
        instanceCount,
        deltaTime,
        EMITTER_BEHAVIOR_SALT_BASE + index,
      );
    }

    const { builtin } = propertyBuffers;
    const { array, itemSize } = builtin;

    for (let i = 0; i < instanceCount; i++) {
      advanceParticle(array, i * itemSize, deltaTime);
    }

    builtin.needsUpdate = true;
  }

  private readonly onRendering = (renderer: WebGLRenderer, rawDeltaTime: number): void => {
    this.simulate(Math.min(rawDeltaTime, this.maxDeltaTimeInternal));
  };

  /** Places the particles and uploads them once the frame has changed everything it changes */
  private readonly onSynchronizing = (): void => {
    this.updateDepth();

    if (this.mesh.instanceCount === 0) {
      return;
    }

    this.mesh.setOrigin(this.originX, this.originY);
    // The only upload of a frame: bursts and prewarm between frames are drawn by the next one.
    this.mesh.limitUploadToLiveInstances();
  };

  /** Places the particles at the current depth before the programs are built */
  private readonly onCompiling = (): void => {
    this.updateDepth();
  };

  /** Moves the particles to the depth of the emitter among the elements of the layer */
  private updateDepth(): void {
    this.layer.sceneWrapper.setOrderedObjectDepth(
      this.mesh,
      this.layer.inputWrapper.getDepth(this.catcherHandler),
    );
  }
}
