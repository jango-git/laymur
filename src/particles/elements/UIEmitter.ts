import type { WebGLRenderer } from "three";
import { Vector2 } from "three";
import type { UILayer } from "../../core";
import { UIAnchor } from "../../core/elements/UIAnchor/UIAnchor";
import type { UIAnchorOptions } from "../../core/elements/UIAnchor/UIAnchor.Internal";
import {
  resolveGLSLTypeInfo,
  type GLProperty,
  type GLTypeInfo,
} from "../../core/miscellaneous/generic-plane/shared";
import { isUIModeVisible } from "../../core/miscellaneous/UIMode";
import type { UIBehaviorModule } from "../behaviorModules/UIBehaviorModule";
import { UIInstancedParticle } from "../instancedParticle/UIInstancedParticle";
import {
  collectProperties,
  collectUniforms,
} from "../instancedParticle/UIInstancedParticle.Internal";
import {
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_RANDOM_A,
  BUILTIN_OFFSET_RANDOM_B,
  BUILTIN_OFFSET_RANDOM_C,
  BUILTIN_OFFSET_RANDOM_D,
  BUILTIN_OFFSET_RANDOM_E,
  BUILTIN_OFFSET_RANDOM_F,
  BUILTIN_OFFSET_ROTATION,
  BUILTIN_OFFSET_TORQUE,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
} from "../miscellaneous/miscellaneous";
import type { UIRenderingModule } from "../renderingModules/UIRenderingModule";
import type { UISpawnModule } from "../spawnModules/UISpawnModule";
import {
  EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES,
  EMITTER_DEFAULT_CAPACITY_STEP,
  EMITTER_DEFAULT_EXPECTED_CAPACITY,
  EMITTER_DEFAULT_MODE,
  ignoreInput,
  type UIEmitterMode,
  type UIEmitterPlayOptions,
} from "./UIEmitter.Internal";

export interface UIEmitterOptions extends UIAnchorOptions {
  mode: UIEmitterMode;
  expectedCapacity: number;
  capacityStep: number;
  automaticallyDestroyModules: boolean;
}

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
      // 10, 11, 12   randomX, randomY, randomZ
      // 13, 14, 16   reservedX, reservedY, reservedZ
    };
    collectProperties(collectedProperties, spawnSequence, "UIEmitter.constructor.spawnSequence:");
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
    collectUniforms(
      collectedUniforms,
      renderingSequence,
      "UIEmitter.constructor.renderingSequence",
    );

    const zIndex = 0;
    this.catcherHandler = this.layer.inputWrapper.createInputCatcher(
      ignoreInput,
      ignoreInput,
      ignoreInput,
      zIndex,
    );

    this.mesh = new UIInstancedParticle(
      this.renderingSequence.map((module) => module.source),
      collectedUniforms,
      collectedProperties,
      options.expectedCapacity ?? EMITTER_DEFAULT_EXPECTED_CAPACITY,
      options.capacityStep ?? EMITTER_DEFAULT_CAPACITY_STEP,
    );
    this.mesh.renderOrder = zIndex;

    this.layer.signalRendering.on(this.onRendering);
    this.layer.sceneWrapper.insertCustomObject(this.mesh);

    this.automaticallyDestroyModules =
      options.automaticallyDestroyModules ?? EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES;
    this.modeInternal = options.mode ?? EMITTER_DEFAULT_MODE;
  }

  /** Visibility mode */
  public get mode(): UIEmitterMode {
    return this.modeInternal;
  }

  /** Rendering order. Higher values draw on top */
  public get zIndex(): number {
    return this.layer.inputWrapper.getZIndex(this.catcherHandler);
  }

  /** Visibility mode */
  public set mode(value: UIEmitterMode) {
    if (this.modeInternal !== value) {
      this.modeInternal = value;
      this.mesh.visible = isUIModeVisible(value);
    }
  }

  /** Rendering order. Higher values draw on top */
  public set zIndex(value: number) {
    this.layer.inputWrapper.setZIndex(this.catcherHandler, value);
  }

  /** Removes emitter and optionally destroys modules */
  public override destroy(): void {
    this.layer.signalRendering.off(this.onRendering);
    this.layer.sceneWrapper.removeCustomObject(this.mesh);

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

    super.destroy();
  }

  /**
   * Spawns a specific number of particles immediately.
   *
   * @param count - Number of particles to create
   */
  public burst(count: number): void {
    const instanceBegin = this.mesh.instanceCount;
    this.mesh.createInstances(count);
    const instanceEnd = this.mesh.instanceCount;

    {
      const { builtin } = this.mesh.propertyBuffers;
      const { array, itemSize } = builtin;

      for (let i = instanceBegin; i < instanceEnd; i++) {
        const itemOffset = i * itemSize;
        array[itemOffset + BUILTIN_OFFSET_RANDOM_A] = Math.random();
        array[itemOffset + BUILTIN_OFFSET_RANDOM_B] = Math.random();
        array[itemOffset + BUILTIN_OFFSET_RANDOM_C] = Math.random();
        array[itemOffset + BUILTIN_OFFSET_RANDOM_D] = Math.random();
        array[itemOffset + BUILTIN_OFFSET_RANDOM_E] = Math.random();
        array[itemOffset + BUILTIN_OFFSET_RANDOM_F] = Math.random();
      }

      builtin.needsUpdate = true;
    }

    for (const spawnModule of this.spawnSequence) {
      spawnModule.spawn(this.mesh.propertyBuffers, instanceBegin, instanceEnd);
    }
  }

  /** Removes all active particles */
  public clear(): void {
    this.mesh.drop();
  }

  /**
   * Starts continuous particle emission.
   *
   * @param rate - Particles per second
   * @param options - Emission duration and other settings
   */
  public play(rate: number, options: Partial<UIEmitterPlayOptions> = {}): void {
    this.emissionRate = rate;
    this.emissionAccumulator = 0;
    this.emissionDuration = options.duration ?? Infinity;
    this.emissionElapsed = 0;
  }

  /** Stops continuous particle emission */
  public stop(): void {
    this.emissionRate = 0;
    this.emissionAccumulator = 0;
    this.emissionDuration = Infinity;
    this.emissionElapsed = 0;
  }

  private readonly onRendering = (renderer: WebGLRenderer, deltaTime: number): void => {
    {
      const { builtin } = this.mesh.propertyBuffers;
      const { array, itemSize } = builtin;

      for (let i = 0; i < this.mesh.instanceCount; i++) {
        array[i * itemSize + BUILTIN_OFFSET_AGE] += deltaTime;
      }

      builtin.needsUpdate = true;
      this.mesh.removeDeadParticles();
    }

    if (this.emissionRate > 0) {
      this.emissionElapsed += deltaTime;

      if (this.emissionElapsed >= this.emissionDuration) {
        this.stop();
      } else {
        this.emissionAccumulator += this.emissionRate * deltaTime;

        const particlesToSpawn = Math.floor(this.emissionAccumulator);
        if (particlesToSpawn > 0) {
          this.burst(particlesToSpawn);
          this.emissionAccumulator -= particlesToSpawn;
        }
      }
    }

    if (this.mesh.instanceCount === 0) {
      return;
    }

    this.mesh.renderOrder = this.zIndex;
    this.mesh.setOrigin(this.x, this.y);

    {
      const { propertyBuffers, instanceCount } = this.mesh;

      for (const module of this.behaviorSequence) {
        module.update(propertyBuffers, instanceCount, deltaTime);
      }
    }

    const { builtin } = this.mesh.propertyBuffers;
    const { array, itemSize } = builtin;

    {
      for (let i = 0; i < this.mesh.instanceCount; i++) {
        const itemOffset = i * itemSize;
        array[itemOffset + BUILTIN_OFFSET_POSITION_X] +=
          array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] * deltaTime;
        array[itemOffset + BUILTIN_OFFSET_POSITION_Y] +=
          array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] * deltaTime;
      }

      builtin.needsUpdate = true;
    }

    {
      for (let i = 0; i < this.mesh.instanceCount; i++) {
        const itemOffset = i * itemSize;
        array[itemOffset + BUILTIN_OFFSET_ROTATION] +=
          array[itemOffset + BUILTIN_OFFSET_TORQUE] * deltaTime;
      }

      builtin.needsUpdate = true;
    }
  };
}
