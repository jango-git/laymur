import type { WebGLRenderer } from "three";
import { Vector2 } from "three";

import { UIAnchor } from "../../core/elements/UIAnchor/UIAnchor.js";
import type { UILayer } from "../../core/index.js";
import { assertValidNumber, assertValidPositiveNumber } from "../../core/miscellaneous/asserts.js";
import type { GLProperty, GLTypeInfo } from "../../core/miscellaneous/generic-plane/shared.js";
import { resolveGLSLTypeInfo } from "../../core/miscellaneous/generic-plane/shared.js";
import { isUIModeVisible } from "../../core/miscellaneous/UIMode.js";
import type { UIBehaviorModule } from "../behaviorModules/UIBehaviorModule.js";
import {
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
  BUILTIN_OFFSET_ROTATION,
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  BUILTIN_OFFSET_TORQUE,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
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
} from "./UIEmitter.Internal.js";
import {
  EMITTER_BEHAVIOR_SALT_BASE,
  EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES,
  EMITTER_DEFAULT_CAPACITY_STEP,
  EMITTER_DEFAULT_EXPECTED_CAPACITY,
  EMITTER_DEFAULT_LIFETIME,
  EMITTER_DEFAULT_MAX_DELTA_TIME,
  EMITTER_DEFAULT_MODE,
  EMITTER_SHADER_SALT,
  EMITTER_SPAWN_SALT_BASE,
  ignoreInput,
} from "./UIEmitter.Internal.js";

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
 * Spawns, updates, and renders particles using modular spawn/behavior/rendering pipeline.
 */
export class UIEmitter extends UIAnchor {
  /** Whether to call destroy() on all modules when emitter is destroyed */
  public automaticallyDestroyModules: boolean;

  private readonly mesh: UIInstancedParticle;
  private readonly catcherHandler: number;

  private emissionRate = 0;
  private emissionAccumulator = 0;
  private emissionDuration = Infinity;
  private emissionElapsed = 0;

  private modeInternal: UIEmitterMode;
  private maxDeltaTimeInternal: number;
  private seedInternal: number;
  /** Particles spawned since the seed was set; picks the seed of the next particle */
  private spawnedCount = 0;

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

    const collectedUniforms: Record<string, GLProperty> = {
      origin: { value: new Vector2(), glslTypeInfo: resolveGLSLTypeInfo("Vector2") },
    };
    const renderingSources = collectRenderingUniforms(
      collectedUniforms,
      renderingSequence,
      "UIEmitter.constructor.renderingSequence",
    );

    const zIndex = 0;
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
    this.layer.sceneWrapper.insertOrderedObject(
      this.mesh,
      this.layer.inputWrapper.getDepth(this.catcherHandler),
    );

    this.automaticallyDestroyModules =
      options.automaticallyDestroyModules ?? EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES;
    this.modeInternal = options.mode ?? EMITTER_DEFAULT_MODE;
    this.mesh.visible = isUIModeVisible(this.modeInternal);
    this.maxDeltaTimeInternal = options.maxDeltaTime ?? EMITTER_DEFAULT_MAX_DELTA_TIME;
    assertValidPositiveNumber(this.maxDeltaTimeInternal, "UIEmitter.constructor.maxDeltaTime");
    this.seedInternal = options.seed ?? Math.floor(Math.random() * 0x100000000);
    assertValidNonNegativeInteger(this.seedInternal, "UIEmitter.constructor.seed");
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

  /**
   * Rendering order among the elements of the layer. Higher values on top; elements with equal
   * values keep the order of creation, a later one on top.
   */
  public get zIndex(): number {
    return this.layer.inputWrapper.getZIndex(this.catcherHandler);
  }

  /** Visibility mode */
  public set mode(value: UIEmitterMode) {
    this.assertNotDestroyed("UIEmitter.mode");
    if (this.modeInternal !== value) {
      this.modeInternal = value;
      this.mesh.visible = isUIModeVisible(value);
    }
  }

  /** Longest frame step in seconds; longer frames are clamped */
  public set maxDeltaTime(value: number) {
    this.assertNotDestroyed("UIEmitter.maxDeltaTime");
    assertValidPositiveNumber(value, "UIEmitter.maxDeltaTime");
    this.maxDeltaTimeInternal = value;
  }

  /**
   * Sets the seed and restarts its sequence: the next particles repeat those spawned after the
   * same seed was set before
   */
  public set seed(value: number) {
    this.assertNotDestroyed("UIEmitter.seed");
    assertValidNonNegativeInteger(value, "UIEmitter.seed");
    this.seedInternal = value;
    this.spawnedCount = 0;
  }

  /**
   * Rendering order among the elements of the layer. Higher values on top; elements with equal
   * values keep the order of creation, a later one on top.
   */
  public set zIndex(value: number) {
    this.assertNotDestroyed("UIEmitter.zIndex");
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
    this.assertNotDestroyed("UIEmitter.burst");
    assertValidNonNegativeInteger(count, "UIEmitter.burst.count");
    if (count === 0) {
      return;
    }

    const instanceBegin = this.mesh.instanceCount;
    this.mesh.createInstances(count);
    const instanceEnd = this.mesh.instanceCount;
    // A slot may hold a dead particle's values.
    this.mesh.resetInstances(instanceBegin, instanceEnd);

    {
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
    }

    for (let index = 0; index < this.spawnSequence.length; index++) {
      this.spawnSequence[index].spawn(
        this.mesh.propertyBuffers,
        instanceBegin,
        instanceEnd,
        EMITTER_SPAWN_SALT_BASE + index,
      );
    }

    this.mesh.limitUploadToLiveInstances();
  }

  /** Removes all active particles */
  public clear(): void {
    this.assertNotDestroyed("UIEmitter.clear");
    this.mesh.drop();
  }

  /**
   * Starts continuous particle emission.
   *
   * @param rate - Particles per second
   * @param options - Emission duration and other settings
   */
  public play(rate: number, options: Partial<UIEmitterPlayOptions> = {}): void {
    this.assertNotDestroyed("UIEmitter.play");
    this.emissionRate = rate;
    this.emissionAccumulator = 0;
    this.emissionDuration = options.duration ?? Infinity;
    this.emissionElapsed = 0;
  }

  /** Stops continuous particle emission */
  public stop(): void {
    this.assertNotDestroyed("UIEmitter.stop");
    this.emissionRate = 0;
    this.emissionAccumulator = 0;
    this.emissionDuration = Infinity;
    this.emissionElapsed = 0;
  }

  /** Frees the particles and the input catcher, optionally destroys modules */
  protected override destroyInternal(): void {
    this.layer.signalRendering.off(this.onRendering);
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

  private readonly onRendering = (renderer: WebGLRenderer, rawDeltaTime: number): void => {
    this.layer.sceneWrapper.setOrderedObjectDepth(
      this.mesh,
      this.layer.inputWrapper.getDepth(this.catcherHandler),
    );

    const deltaTime = Math.min(rawDeltaTime, this.maxDeltaTimeInternal);

    if (this.mesh.instanceCount > 0) {
      const { array, itemSize } = this.mesh.propertyBuffers.builtin;

      for (let i = 0; i < this.mesh.instanceCount; i++) {
        array[i * itemSize + BUILTIN_OFFSET_AGE] += deltaTime;
      }

      this.mesh.removeDeadParticles();
    }

    if (this.emissionRate > 0) {
      const emittedBefore = this.emissionElapsed;
      this.emissionElapsed += deltaTime;
      this.emissionAccumulator +=
        this.emissionRate * (Math.min(this.emissionElapsed, this.emissionDuration) - emittedBefore);

      const particlesToSpawn = Math.floor(this.emissionAccumulator);
      if (particlesToSpawn > 0) {
        this.burst(particlesToSpawn);
        this.emissionAccumulator -= particlesToSpawn;
      }

      if (this.emissionElapsed >= this.emissionDuration) {
        this.stop();
      }
    }

    if (this.mesh.instanceCount === 0) {
      return;
    }

    this.mesh.setOrigin(this.x, this.y);

    {
      const { propertyBuffers, instanceCount } = this.mesh;

      for (let index = 0; index < this.behaviorSequence.length; index++) {
        this.behaviorSequence[index].update(
          propertyBuffers,
          instanceCount,
          deltaTime,
          EMITTER_BEHAVIOR_SALT_BASE + index,
        );
      }
    }

    const { builtin } = this.mesh.propertyBuffers;
    const { array, itemSize } = builtin;

    for (let i = 0; i < this.mesh.instanceCount; i++) {
      const itemOffset = i * itemSize;
      array[itemOffset + BUILTIN_OFFSET_POSITION_X] +=
        array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] * deltaTime;
      array[itemOffset + BUILTIN_OFFSET_POSITION_Y] +=
        array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] * deltaTime;
      array[itemOffset + BUILTIN_OFFSET_ROTATION] +=
        array[itemOffset + BUILTIN_OFFSET_TORQUE] * deltaTime;
    }

    builtin.needsUpdate = true;
    this.mesh.limitUploadToLiveInstances();
  };
}
