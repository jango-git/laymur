import {
  UIBehaviorDirectionalGravity,
  UIBehaviorVelocityDamping,
  UIBehaviorVelocityNoise,
  UIColor,
  UIEmitter,
  UIImage,
  UIRenderingColorOverLife,
  UIRenderingTexture,
  UIResizePolicyCross,
  UISpawnRandomLifetime,
  UISpawnRandomScale,
  UISpawnRandomVelocity,
  UIViewportLayer,
} from "laymur";
import { Vector3 } from "three";

import { camera, probe } from "../space.js";
import { button, horizontalDistance, height, text, verticalDistance, width } from "../kit.js";
import { color, COLORS, hex } from "../style.js";
import { bracketTexture, dotTexture } from "../textures.js";

/*
 * UIEmitter runs its particles through three sequences of modules: spawn modules set up a new
 * particle, behavior modules move it every frame, rendering modules draw it. The emitter plays a
 * stream around the target, which follows the probe in space, and ENGAGE bursts a cloud out of it.
 */

const MODULES = {
  velocity: { group: "spawn", label: "UISpawnRandomVelocity", isOn: true },
  damping: { group: "behavior", label: "UIBehaviorVelocityDamping", isOn: true },
  gravity: { group: "behavior", label: "UIBehaviorDirectionalGravity", isOn: false },
  noise: { group: "behavior", label: "UIBehaviorVelocityNoise", isOn: false },
  colorOverLife: { group: "rendering", label: "UIRenderingColorOverLife", isOn: true },
};

export function createParticlesScene(viewport) {
  const layer = new UIViewportLayer({
    viewport,
    resizePolicy: new UIResizePolicyCross(1600, 1400),
  });

  const target = new UIImage(layer, bracketTexture);
  target.color = color(COLORS.warn);
  width(target, 160);
  height(target, 160);
  const targetX = horizontalDistance(layer, target, 0, 0.5, 0);
  const targetY = verticalDistance(layer, target, 0, 0.5, 0);
  const projected = new Vector3();
  const name = text(layer, "TGT-04", { size: 22, css: COLORS.warn });
  horizontalDistance(target, name, 1, 0, 12);
  verticalDistance(name, target, 1, 1, 0);

  const { box: engage } = button(layer, "ENGAGE", { isWarn: true });
  width(engage, 320);
  height(engage, 96);
  horizontalDistance(layer, engage, 0.5, 0.5, 0);
  verticalDistance(layer, engage, 0, 0, 64);

  const isOn = (key) => MODULES[key].isOn;

  function createEmitter(speed, damping, colors) {
    const emitter = new UIEmitter(
      layer,
      [
        new UISpawnRandomLifetime([0.8, 1.6]),
        new UISpawnRandomScale([10, 22], 1),
        ...(isOn("velocity") ? [new UISpawnRandomVelocity([-Math.PI, Math.PI], speed)] : []),
      ],
      [
        ...(isOn("damping") ? [new UIBehaviorVelocityDamping(damping)] : []),
        ...(isOn("gravity") ? [new UIBehaviorDirectionalGravity({ x: 0, y: -600 })] : []),
        ...(isOn("noise") ? [new UIBehaviorVelocityNoise(0.004, 900)] : []),
      ],
      [
        new UIRenderingTexture(dotTexture),
        ...(isOn("colorOverLife") ? [new UIRenderingColorOverLife(colors)] : []),
      ],
      { expectedCapacity: 512 },
    );
    horizontalDistance(target, emitter, 0.5, 0, 0);
    verticalDistance(target, emitter, 0.5, 0, 0);
    return emitter;
  }

  const warn = hex(COLORS.warn);
  const accent = hex(COLORS.accent);
  let stream;
  let burst;
  function rebuild() {
    stream?.destroy();
    burst?.destroy();
    stream = createEmitter([40, 180], 0.4, [
      new UIColor(warn, 0.9),
      new UIColor(warn, 0.5),
      new UIColor(warn, 0),
    ]);
    burst = createEmitter([80, 560], 0.85, [
      new UIColor(0xffffff, 1),
      new UIColor(warn, 0.9),
      new UIColor(accent, 0.4),
      new UIColor(accent, 0),
    ]);
    stream.play(60);
  }
  rebuild();
  engage.signalPointerClicked.on(() => burst.burst(240));

  const options = [];
  for (const group of ["spawn", "behavior", "rendering"]) {
    options.push({ label: group, heading: true });
    for (const module of Object.values(MODULES).filter((m) => m.group === group)) {
      options.push({
        label: module.label,
        get: () => module.isOn,
        set: (value) => {
          module.isOn = value;
          rebuild();
        },
      });
    }
  }

  return {
    tab: "Particles",
    title: "UIEmitter",
    source: "particles.js",
    layer,
    options,

    update() {
      const point = layer.projectWorldPosition(probe.position, camera, projected);
      targetX.distance = point.x;
      targetY.distance = point.y;
    },
  };
}
