import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  EdgesGeometry,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
} from "three";

import { COLORS, hex } from "./style.js";

export const space = new Scene();
export const camera = new PerspectiveCamera(62, 1, 0.1, 1000);

let seed = 1234567;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/*
 * Stars are streaks flying at the camera. The vertex shader moves them by the time uniform, so the
 * field costs one draw call and no buffer uploads.
 */
const STAR_COUNT = 400;
const starPositions = new Float32Array(STAR_COUNT * 6);
const starTails = new Float32Array(STAR_COUNT * 2);
for (let i = 0; i < STAR_COUNT; i++) {
  const radius = 6 + Math.pow(random(), 0.8) * 70;
  const angle = random() * Math.PI * 2;
  const star = [Math.cos(angle) * radius, Math.sin(angle) * radius, random() * 240];
  starPositions.set([...star, ...star], i * 6);
  starTails[i * 2 + 1] = 1;
}
const starGeometry = new BufferGeometry();
starGeometry.setAttribute("position", new BufferAttribute(starPositions, 3));
starGeometry.setAttribute("tail", new BufferAttribute(starTails, 1));
const starUniforms = { time: { value: 0 } };
space.add(
  new LineSegments(
    starGeometry,
    new ShaderMaterial({
      uniforms: starUniforms,
      vertexShader: `
        attribute float tail;
        uniform float time;
        varying float fade;
        const float DEPTH = 240.0;
        const float SPEED = 10.0;
        const float STREAK = 1.2;
        void main() {
          float head = mod(position.z + SPEED * time, DEPTH) - DEPTH;
          float near = 1.0 + head / DEPTH;
          float z = tail > 0.5 ? max(head - STREAK * (1.0 + 3.0 * near), -DEPTH) : head;
          fade = tail > 0.5 ? 0.0 : 0.35 * min(1.0, near * 3.0) * min(1.0, -head / 12.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, z, 1.0);
        }
      `,
      fragmentShader: `
        varying float fade;
        void main() {
          gl_FragColor = vec4(vec3(fade), 1.0);
        }
      `,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  ),
);

const farPositions = new Float32Array(1500 * 3);
for (let i = 0; i < 1500; i++) {
  const z = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(1 - z * z);
  farPositions.set(
    [Math.cos(angle) * radius * 600, Math.sin(angle) * radius * 600, -Math.abs(z) * 600 - 50],
    i * 3,
  );
}
const farGeometry = new BufferGeometry();
farGeometry.setAttribute("position", new BufferAttribute(farPositions, 3));
space.add(
  new Points(
    farGeometry,
    new PointsMaterial({ color: 0x4a4a4a, size: 1.6, sizeAttenuation: false }),
  ),
);

const probeGeometry = new IcosahedronGeometry(3, 1);
export const probe = new Mesh(probeGeometry, new MeshBasicMaterial({ color: hex(COLORS.screen) }));
probe.add(
  new LineSegments(
    new EdgesGeometry(probeGeometry),
    new LineBasicMaterial({ color: hex(COLORS.accent), transparent: true, opacity: 0.85 }),
  ),
);
space.add(probe);

let time = 0;

export function updateSpace(deltaTime, aspect) {
  time += deltaTime;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  const angularSpeed = (Math.PI * 2) / 15;
  probe.position.set(
    8 * Math.sin(angularSpeed * time),
    3.5 * Math.sin(2 * angularSpeed * time),
    -46 + 12 * Math.sin(angularSpeed * time + 1.2),
  );
  probe.rotation.set(2 * angularSpeed * time, angularSpeed * time, 0);

  starUniforms.time.value = time;
}
