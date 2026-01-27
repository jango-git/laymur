import type { WebGLRenderer } from "three";
import { Vector2 } from "three";
import type { UILayer } from "../../core";
import { UIAnchor } from "../../core/elements/UIAnchor/UIAnchor";
import type { UIBehaviorModule } from "../behaviorModules/UIBehaviorModule";
import {
  callbackPlaceholder,
  cloneProperties,
  collectProperties,
  collectUniforms,
  convertUIPropertiesToGLProperties,
  createDefaultProperties,
  resolveGLSLTypeInfo,
  type UIParticleProperty,
  type UIParticlePropertyName,
} from "../instancedParticle/shared";
import { UIGenericInstancedParticle } from "../instancedParticle/UIGenericInstancedParticle";
import type { UIRenderingModule } from "../renderingModule/UIRenderingModule";
import type { UISpawnModule } from "../spawnModules/UISpawnModule";

export class UIEmitter extends UIAnchor {
  private readonly mesh: UIGenericInstancedParticle;
  private readonly catcherHandler: number;
  private readonly defaultProperties: Record<string, UIParticleProperty>;
  private isEmitting = false;
  private emissionRate = 0;
  private emissionAccumulator = 0;
  private emissionDuration = Infinity;
  private emissionElapsed = 0;

  constructor(
    layer: UILayer,
    private readonly spawnSequence: UISpawnModule[],
    private readonly behaviorSequence: readonly UIBehaviorModule[],
    private readonly renderingSequence: readonly UIRenderingModule[],
  ) {
    super(layer);

    const collectedProperties: Record<string, UIParticlePropertyName> = {};
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

    this.defaultProperties = createDefaultProperties(collectedProperties);

    const collectedUniforms: Record<string, UIParticleProperty> = {};
    collectUniforms(
      collectedUniforms,
      renderingSequence,
      "UIEmitter.constructor.renderingSequence",
    );

    const zIndex = 0;
    this.catcherHandler = this.layer.inputWrapper.createInputCatcher(
      callbackPlaceholder,
      callbackPlaceholder,
      callbackPlaceholder,
      zIndex,
    );

    this.mesh = new UIGenericInstancedParticle(
      this.renderingSequence.map((module) => module.source),
      {
        origin: { value: new Vector2(0, 0), glslTypeInfo: resolveGLSLTypeInfo("Vector2") },
        ...convertUIPropertiesToGLProperties(collectedUniforms),
      },
      convertUIPropertiesToGLProperties(this.defaultProperties),
    );
    this.mesh.renderOrder = zIndex;

    this.layer.signalRendering.on(this.onRendering);
    this.layer.sceneWrapper.insertCustomObject(this.mesh);
  }

  public get zIndex(): number {
    return this.layer.inputWrapper.getZIndex(this.catcherHandler);
  }

  public set zIndex(value: number) {
    this.layer.inputWrapper.setZIndex(this.catcherHandler, value);
  }

  public burst(particleCount: number): void {
    const properties: Record<string, UIParticleProperty>[] = [];

    for (let i = 0; i < particleCount; i++) {
      let initialProperties = cloneProperties(this.defaultProperties);

      for (const spawnModule of this.spawnSequence) {
        initialProperties = { ...initialProperties, ...spawnModule.spawn() };
      }

      properties.push(initialProperties);
    }

    this.mesh.createInstances(properties);
  }

  public startEmission(particlesPerSecond: number, duration = Infinity): void {
    this.isEmitting = true;
    this.emissionRate = particlesPerSecond;
    this.emissionAccumulator = 0;
    this.emissionDuration = duration;
    this.emissionElapsed = 0;
  }

  public stopEmission(): void {
    this.isEmitting = false;
    this.emissionRate = 0;
    this.emissionAccumulator = 0;
    this.emissionDuration = Infinity;
    this.emissionElapsed = 0;
  }

  public override destroy(): void {
    this.layer.signalRendering.off(this.onRendering);
    this.layer.sceneWrapper.removeCustomObject(this.mesh);
    super.destroy();
  }

  private readonly onRendering = (renderer: WebGLRenderer, deltaTime: number): void => {
    this.mesh.renderOrder = this.zIndex;
    this.mesh.setOrigin(this.x, this.y);

    if (this.isEmitting && this.emissionRate > 0) {
      this.emissionElapsed += deltaTime;

      if (this.emissionElapsed >= this.emissionDuration) {
        this.stopEmission();
      } else {
        this.emissionAccumulator += this.emissionRate * deltaTime;

        const particlesToSpawn = Math.floor(this.emissionAccumulator);
        if (particlesToSpawn > 0) {
          this.burst(particlesToSpawn);
          this.emissionAccumulator -= particlesToSpawn;
        }
      }
    }

    for (const module of this.behaviorSequence) {
      module.update(this.mesh.propertyBuffers, this.mesh.instanceCount, deltaTime);
    }

    this.mesh.removeDeadParticles();
  };
}
