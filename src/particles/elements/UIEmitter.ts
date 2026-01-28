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
import type { UIRenderingModule } from "../renderingModule/UIRenderingModule";
import type { UISpawnModule } from "../spawnModules/UISpawnModule";
import {
  EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES,
  EMITTER_DEFAULT_CAPACITY_STEP,
  EMITTER_DEFAULT_EXPECTED_CAPACITY,
  EMITTER_DEFAULT_MODE,
  ignoreInput,
  type UIEmitterMode,
} from "./UIEmitter.Internal";

export interface UIEmitterOptions extends UIAnchorOptions {
  mode: UIEmitterMode;
  expectedCapacity: number;
  capacityStep: number;
  automaticallyDestroyModules: boolean;
}

export class UIEmitter extends UIAnchor {
  public automaticallyDestroyModules: boolean;

  private readonly mesh: UIInstancedParticle;
  private readonly catcherHandler: number;

  private emissionRate = 0;
  private emissionAccumulator = 0;
  private emissionDuration = Infinity;
  private emissionElapsed = 0;

  private modeInternal: UIEmitterMode;

  constructor(
    layer: UILayer,
    private readonly spawnSequence: UISpawnModule[],
    private readonly behaviorSequence: readonly UIBehaviorModule[],
    private readonly renderingSequence: readonly UIRenderingModule[],
    options: Partial<UIEmitterOptions> = {},
  ) {
    super(layer, options);

    const collectedProperties: Record<string, GLTypeInfo> = {
      position: resolveGLSLTypeInfo("Vector2"), // x, y
      velocity: resolveGLSLTypeInfo("Vector2"), // x, y
      rotation: resolveGLSLTypeInfo("number"),
      torque: resolveGLSLTypeInfo("number"),
      scale: resolveGLSLTypeInfo("Vector2"), // x, y
      lifetime: resolveGLSLTypeInfo("Vector2"), // lifetime, age
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

  public get mode(): UIEmitterMode {
    return this.modeInternal;
  }

  public get zIndex(): number {
    return this.layer.inputWrapper.getZIndex(this.catcherHandler);
  }

  public set mode(value: UIEmitterMode) {
    if (this.modeInternal !== value) {
      this.modeInternal = value;
      this.mesh.visible = isUIModeVisible(value);
    }
  }

  public set zIndex(value: number) {
    this.layer.inputWrapper.setZIndex(this.catcherHandler, value);
  }

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

  public burst(count: number): void {
    const instanceOffset = this.mesh.instanceCount;
    this.mesh.createInstances(count);

    for (const spawnModule of this.spawnSequence) {
      spawnModule.spawn(this.mesh.propertyBuffers, instanceOffset, this.mesh.instanceCount);
    }
  }

  public play(rate: number, duration = Infinity): void {
    this.emissionRate = rate;
    this.emissionAccumulator = 0;
    this.emissionDuration = duration;
    this.emissionElapsed = 0;
  }

  public stop(): void {
    this.emissionRate = 0;
    this.emissionAccumulator = 0;
    this.emissionDuration = Infinity;
    this.emissionElapsed = 0;
  }

  private readonly onRendering = (renderer: WebGLRenderer, deltaTime: number): void => {
    {
      const { lifetime } = this.mesh.propertyBuffers;
      const { itemSize, array } = lifetime;

      for (let i = 0; i < this.mesh.instanceCount; i++) {
        array[i * itemSize + 1] += deltaTime;
      }

      lifetime.needsUpdate = true;
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

    for (const module of this.behaviorSequence) {
      module.update(this.mesh.propertyBuffers, this.mesh.instanceCount, deltaTime);
    }

    {
      const { position, velocity } = this.mesh.propertyBuffers;

      for (let i = 0; i < this.mesh.instanceCount; i++) {
        const offset = i * position.itemSize;
        const { array: positionArray } = position;
        const { array: velocityArray } = velocity;
        positionArray[offset] += velocityArray[offset] * deltaTime;
        positionArray[offset + 1] += velocityArray[offset + 1] * deltaTime;
      }

      position.needsUpdate = true;
    }

    {
      const { rotation, torque } = this.mesh.propertyBuffers;

      for (let i = 0; i < this.mesh.instanceCount; i++) {
        const rotationOffset = i * rotation.itemSize;
        const torqueOffset = i * torque.itemSize;
        rotation.array[rotationOffset] += torque.array[torqueOffset] * deltaTime;
      }

      rotation.needsUpdate = true;
    }
  };
}
