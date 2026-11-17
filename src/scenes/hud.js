import { gsap } from "gsap";
import {
  UIBehaviorVelocityDamping,
  UIBlendMode,
  UIColor,
  UIDummy,
  UIEmitter,
  UIGraphics,
  UIImage,
  UIMask,
  UIMaskShape,
  UIMode,
  UINineSlice,
  UIProgress,
  UIProgressMaskFunctionCircular,
  UIPriority,
  UIProgressMaskFunctionDirectional,
  UIRelation,
  UIRenderingColorOverLife,
  UIRenderingTexture,
  UIResizePolicyCross,
  UISpawnRandomLifetime,
  UISpawnRandomScale,
  UISpawnRandomVelocity,
  UIViewportLayer,
} from "laymur";
import { UIFlashAnimator } from "laymur-animations";
import { Vector3 } from "three";

import { camera, probe } from "../space.js";
import {
  aspect,
  button,
  center,
  fill,
  formatClock,
  horizontalDistance,
  height,
  horizontalInterpolation,
  horizontalProportion,
  inside,
  LANDSCAPE,
  panel,
  PORTRAIT,
  setText,
  text,
  verticalDistance,
  verticalInterpolation,
  verticalProportion,
  width,
} from "../kit.js";
import { color, COLORS, hex, SANS } from "../style.js";
import {
  barFillTexture,
  barTrackTexture,
  bracketTexture,
  dotTexture,
  radarTexture,
  ringTexture,
  sweepTexture,
} from "../textures.js";

/*
 * The HUD of the laymur video in one layer: side columns in landscape, panels stacked around the
 * radar in portrait. LOCK and ENGAGE work, and the marker follows the object in the 3D scene.
 */

const MARGIN = 32;
const GAP = 24;
const PAD = 20;
const SWEEP_PERIOD = 3.5;
const BLIPS = [
  { radius: 0.56, angle: 0.72, isHostile: true },
  { radius: 0.32, angle: 2.3 },
  { radius: 0.74, angle: 3.6 },
  { radius: 0.48, angle: 4.5 },
  { radius: 0.82, angle: 5.6 },
  { radius: 0.2, angle: 5.0 },
];
const TELEMETRY = [
  { name: "REACTOR", base: 0.84, amplitude: 0.025, rate: 0.8 },
  { name: "SHIELD", base: 0.71, amplitude: 0.04, rate: 1.3 },
  { name: "HULL", base: 0.937, amplitude: 0, rate: 0 },
  { name: "THRUST", base: 0.52, amplitude: 0.09, rate: 2.1 },
];
const MESSAGES = [
  ["NAV", "hdg 42.8 drift 0.008"],
  ["SNS", "TGT-05 brg 129 rng 32.8"],
  ["PWR", "bus A 69% / 415 kW"],
  ["COM", "relay 7 ack 159 ms"],
  ["SYS", "coolant B 298.4 K"],
  ["SNS", "pass 439, 6 contacts"],
  ["NAV", "wp DELTA eta 04:52"],
];
const LOG_LINES = 14;
const LINE_HEIGHT = 24;
const LOG_SPEED = 30;

export function createHudScene(viewport) {
  const layer = new UIViewportLayer({
    viewport,
    resizePolicy: new UIResizePolicyCross(1600, 1400),
  });

  const header = panel(layer);
  inside(header, layer, MARGIN, MARGIN, null, MARGIN);
  height(header, 56);
  const name = text(layer, "KESTREL", { size: 24, family: SANS });
  horizontalDistance(header, name, 0, 0, PAD);
  verticalDistance(header, name, 0.5, 0.5, 0);
  const clock = text(layer, "T+ 00:00:00.0", { size: 22 });
  horizontalDistance(clock, header, 1, 1, PAD);
  verticalDistance(header, clock, 0.5, 0.5, 0);

  const footer = new UIDummy(layer);
  inside(footer, layer, MARGIN, MARGIN, MARGIN, null);
  height(footer, 72);

  const telemetry = panel(layer);
  const signal = panel(layer);
  const log = panel(layer);
  const radar = new UIImage(layer, radarTexture);
  aspect(radar, 1);

  /* Landscape: two side columns, the middle stays open for the scene */
  horizontalDistance(layer, telemetry, 0, 0, MARGIN, LANDSCAPE);
  horizontalProportion(layer, telemetry, 0.24, LANDSCAPE);
  verticalDistance(telemetry, header, 1, 0, GAP, LANDSCAPE);
  height(telemetry, 250, LANDSCAPE);
  horizontalDistance(layer, radar, 0, 0, MARGIN, LANDSCAPE);
  verticalDistance(radar, telemetry, 1, 0, GAP, LANDSCAPE);
  /* The radar takes the width of the column, unless it would reach the buttons; then it shrinks */
  horizontalProportion(telemetry, radar, 1, LANDSCAPE).priority = UIPriority.P3;
  horizontalProportion(telemetry, radar, 1, LANDSCAPE).relation = UIRelation.LESS_THAN;
  verticalDistance(footer, radar, 1, 0, GAP, LANDSCAPE).relation = UIRelation.GREATER_THAN;
  horizontalDistance(signal, layer, 1, 1, MARGIN, LANDSCAPE);
  horizontalProportion(layer, signal, 0.24, LANDSCAPE);
  verticalDistance(signal, header, 1, 0, GAP, LANDSCAPE);
  height(signal, 250, LANDSCAPE);
  horizontalDistance(log, layer, 1, 1, MARGIN, LANDSCAPE);
  horizontalProportion(layer, log, 0.24, LANDSCAPE);
  verticalDistance(log, signal, 1, 0, GAP, LANDSCAPE);
  verticalDistance(footer, log, 1, 0, GAP, LANDSCAPE);

  /* Portrait: two panels under the header, the radar and the log above the buttons */
  horizontalDistance(layer, telemetry, 0, 0, MARGIN, PORTRAIT);
  verticalDistance(telemetry, header, 1, 0, GAP, PORTRAIT);
  height(telemetry, 300, PORTRAIT);
  horizontalDistance(telemetry, signal, 1, 0, GAP, PORTRAIT);
  horizontalProportion(telemetry, signal, 1, PORTRAIT);
  horizontalDistance(signal, layer, 1, 1, MARGIN, PORTRAIT);
  verticalDistance(signal, header, 1, 0, GAP, PORTRAIT);
  height(signal, 300, PORTRAIT);
  horizontalDistance(layer, radar, 0, 0, MARGIN, PORTRAIT);
  verticalDistance(footer, radar, 1, 0, GAP, PORTRAIT);
  horizontalDistance(radar, log, 1, 0, GAP, PORTRAIT);
  horizontalProportion(radar, log, 1, PORTRAIT);
  horizontalDistance(log, layer, 1, 1, MARGIN, PORTRAIT);
  verticalDistance(footer, log, 1, 0, GAP, PORTRAIT);
  verticalProportion(radar, log, 1, PORTRAIT);

  const panelTitle = (box, content, value) => {
    const title = text(layer, content, { size: 15, css: COLORS.accent });
    horizontalDistance(box, title, 0, 0, PAD);
    verticalDistance(title, box, 1, 1, 14);
    if (!value) {
      return [title];
    }
    const note = text(layer, value, { size: 15, css: COLORS.dim });
    horizontalDistance(note, box, 1, 1, PAD);
    verticalDistance(note, box, 1, 1, 14);
    return [title, note];
  };

  const telemetryGroup = [telemetry, ...panelTitle(telemetry, "TELEMETRY")];
  const bars = TELEMETRY.map((row, i) => {
    const track = new UIImage(layer, barTrackTexture);
    inside(track, telemetry, PAD, PAD, null, null);
    height(track, 8);
    verticalInterpolation(telemetry, telemetry, track, 0, 1, 0.5, 0.72 - i * 0.2);
    const bar = new UIProgress(layer, barFillTexture, {
      maskFunction: new UIProgressMaskFunctionDirectional({ x: 1, y: 0 }),
    });
    fill(bar, track);
    const label = text(layer, row.name, { size: 16, css: COLORS.dim });
    horizontalDistance(telemetry, label, 0, 0, PAD);
    verticalDistance(track, label, 1, 0, 8);
    const value = text(layer, "-", { size: 16 });
    horizontalDistance(value, telemetry, 1, 1, PAD);
    verticalDistance(track, value, 1, 0, 8);
    telemetryGroup.push(track, bar, label, value);
    return { ...row, bar, value };
  });

  const GRAPH_WIDTH = 768;
  const GRAPH_HEIGHT = 256;
  const graph = new UIGraphics(layer, { width: GRAPH_WIDTH, height: GRAPH_HEIGHT });
  inside(graph, signal, PAD, PAD, PAD, 46);
  const signalGroup = [signal, graph, ...panelTitle(signal, "SIGNAL", "1.42 GHZ")];

  const sweep = new UIImage(layer, sweepTexture, { blendMode: UIBlendMode.ADDITIVE });
  fill(sweep, radar);
  const radarMask = new UIMask(radar, { shape: UIMaskShape.ELLIPSE, softness: 4, padding: 4 });
  sweep.mask = radarMask;
  const blips = BLIPS.map((blip) => {
    const image = new UIImage(layer, dotTexture, { blendMode: UIBlendMode.ADDITIVE });
    image.color = color(COLORS.accent);
    aspect(image, 1);
    height(image, blip.isHostile ? 22 : 16);
    horizontalInterpolation(
      radar,
      radar,
      image,
      0,
      1,
      0.5,
      0.5 + 0.5 * blip.radius * Math.cos(blip.angle),
    );
    verticalInterpolation(
      radar,
      radar,
      image,
      0,
      1,
      0.5,
      0.5 + 0.5 * blip.radius * Math.sin(blip.angle),
    );
    return { ...blip, image };
  });
  const hostile = blips[0].image;

  const lockRing = new UIProgress(layer, ringTexture, {
    maskFunction: new UIProgressMaskFunctionCircular(Math.PI / 2, true),
    progress: 0,
  });
  lockRing.color = color(COLORS.accent);
  aspect(lockRing, 1);
  height(lockRing, 52);
  center(lockRing, hostile);
  const lockBracket = new UINineSlice(layer, bracketTexture, {
    sliceBorders: 0.4,
    sliceRegions: 16,
  });
  lockBracket.color = color(COLORS.warn, 0);
  aspect(lockBracket, 1);
  height(lockBracket, 76);
  center(lockBracket, hostile);

  const burst = new UIEmitter(
    layer,
    [
      new UISpawnRandomLifetime([0.5, 1.3]),
      new UISpawnRandomScale([6, 16], 1),
      new UISpawnRandomVelocity([-Math.PI, Math.PI], [80, 520]),
    ],
    [new UIBehaviorVelocityDamping(0.85)],
    [
      new UIRenderingTexture(dotTexture),
      new UIRenderingColorOverLife([
        new UIColor(0xffffff, 1),
        new UIColor(hex(COLORS.warn), 0.9),
        new UIColor(hex(COLORS.accent), 0.4),
        new UIColor(hex(COLORS.accent), 0),
      ]),
    ],
    { expectedCapacity: 512 },
  );
  horizontalDistance(hostile, burst, 0.5, 0, 0);
  verticalDistance(hostile, burst, 0.5, 0, 0);

  const radarGroup = [radar, sweep, lockRing, lockBracket, ...blips.map((blip) => blip.image)];

  /* The log scrolls under a mask, each line takes the next message when it wraps to the bottom */
  const logView = new UIDummy(layer);
  inside(logView, log, 6, 6, 8, 42);
  const logMask = new UIMask(logView, { softness: 14 });
  let nextMessage = 0;
  const logLines = Array.from({ length: LOG_LINES }, (_, i) => {
    const line = text(layer, "-", { size: 15, css: COLORS.dim });
    horizontalDistance(logView, line, 0, 0, 14);
    verticalDistance(line, logView, 1, 1, 4 + i * LINE_HEIGHT);
    line.mask = logMask;
    return { line, pass: null };
  });
  const logGroup = [log, ...panelTitle(log, "EVENT LOG"), ...logLines.map(({ line }) => line)];
  const pending = [];
  const minutesAndSeconds = (seconds) => formatClock(seconds, 1).slice(3);
  function logEntry(seconds) {
    const [tag, body, css] = pending.shift() ?? MESSAGES[nextMessage++ % MESSAGES.length];
    return [
      { text: `${minutesAndSeconds(seconds)}  `, style: { color: COLORS.dim } },
      { text: `${tag}  `, style: { color: css ?? COLORS.accent } },
      { text: body, style: { color: css ? COLORS.text : COLORS.dim } },
    ];
  }

  const buttons = ["SCAN", "TRACK", "LOCK", "ENGAGE"].map((caption, i) => {
    const { box, label } = button(layer, caption, {
      isWarn: caption === "ENGAGE",
      size: 20,
      family: SANS,
    });
    height(box, 60);
    verticalDistance(footer, box, 0.5, 0.5, 0);
    width(box, 190, LANDSCAPE);
    horizontalInterpolation(footer, footer, box, 0, 1, 0.5, 0.5 + (i - 1.5) * 0.14, LANDSCAPE);
    horizontalProportion(footer, box, 0.235, PORTRAIT);
    horizontalInterpolation(
      footer,
      footer,
      box,
      0,
      1,
      0.5,
      (i + 0.5) / 4 + (i - 1.5) * 0.004,
      PORTRAIT,
    );
    return { box, caption: label };
  });
  const [, , lockButton, engageButton] = buttons;
  let isLocked = false;
  lockButton.box.signalPointerClicked.on(() => {
    if (isLocked) {
      return;
    }
    isLocked = true;
    pending.push(["WPN", "lock TGT-04 brg 049", COLORS.accent]);
    gsap.to(lockRing, { progress: 1, duration: 0.9, ease: "power1.inOut" });
    gsap.to(lockBracket.color, { a: 1, duration: 0.25, delay: 0.9 });
    gsap.fromTo(
      lockBracket.micro,
      { scaleX: 1.8, scaleY: 1.8 },
      { scaleX: 1, scaleY: 1, duration: 0.35, delay: 0.9 },
    );
  });
  engageButton.box.signalPointerClicked.on(() => {
    if (!isLocked) {
      return;
    }
    isLocked = false;
    burst.burst(220);
    UIFlashAnimator.flash([sweep, ...blips.map((blip) => blip.image)], {
      lightness: 0.3,
      durationIn: 0.05,
    });
    gsap.to(lockBracket.color, { a: 0, duration: 0.25 });
    gsap.to(lockRing, { progress: 0, duration: 0.4 });
    pending.push(["WPN", "TGT-04 lost", COLORS.warn]);
  });

  const marker = new UINineSlice(layer, bracketTexture, { sliceBorders: 0.4, sliceRegions: 14 });
  marker.color = color(COLORS.accent);
  aspect(marker, 1);
  const markerX = horizontalDistance(layer, marker, 0, 0.5, 0);
  const markerY = verticalDistance(layer, marker, 0, 0.5, 0);
  const markerSize = height(marker, 80);
  const markerLabel = text(layer, "OBJ-7", { size: 15, css: COLORS.accent });
  horizontalDistance(marker, markerLabel, 1, 0, 14);
  verticalDistance(marker, markerLabel, 1, 1, 0);
  const markerDistance = text(layer, "-", { size: 15 });
  horizontalDistance(markerLabel, markerDistance, 0, 0, 0);
  verticalDistance(markerDistance, markerLabel, 1, 0, 4);
  const projected = new Vector3();

  const groups = [
    ["header", [header, name, clock]],
    ["telemetry", telemetryGroup],
    ["signal", signalGroup],
    ["radar", radarGroup],
    ["event log", logGroup],
    ["buttons", buttons.flatMap(({ box, caption }) => [box, caption])],
    ["marker", [marker, markerLabel, markerDistance]],
  ];

  /* The nine-slices with their borders: with borders of 0 a nine-slice stretches as one image */
  const slicing = new Map(
    [header, telemetry, signal, log, lockBracket, marker, ...buttons.map(({ box }) => box)].map(
      (element) => [element, element.sliceBorders.left],
    ),
  );

  function drawGraph(time) {
    graph.clear();
    const grid = color(COLORS.accent, 0.12);
    for (let i = 1; i < 4; i++) {
      graph.drawRect(0, (GRAPH_HEIGHT * i) / 4, GRAPH_WIDTH, 1, grid);
    }
    for (let i = 1; i < 8; i++) {
      graph.drawRect((GRAPH_WIDTH * i) / 8, 0, 1, GRAPH_HEIGHT, grid);
    }
    const main = [];
    const second = [];
    for (let x = 0; x <= GRAPH_WIDTH; x += 6) {
      const fraction = x / GRAPH_WIDTH;
      const phase = fraction * 9 + time * 2.5;
      main.push([
        x,
        GRAPH_HEIGHT *
          (0.45 +
            0.22 * Math.sin(phase) * Math.sin(fraction * 3.1 + time * 0.8) +
            0.05 * Math.sin(phase * 5.3)),
      ]);
      second.push([
        x,
        GRAPH_HEIGHT * (0.62 + 0.12 * Math.sin(phase * 1.7 + 1.3) + 0.04 * Math.sin(phase * 7.1)),
      ]);
    }
    graph.drawPolyline(second, color(COLORS.dim, 0.8), 3);
    graph.drawPolyline(main, color(COLORS.accent), 4);
  }

  const CLOCK_START = 3 * 3600 + 17 * 60 + 41.6;
  let time = 0;

  return {
    tab: "HUD",
    title: "HUD",
    source: "hud.js",
    layer,
    options: [
      {
        label: "nine-slice",
        get: () => slicing.get(header) === header.sliceBorders.left,
        set: (value) => {
          for (const [element, borders] of slicing) {
            element.sliceBorders = value ? borders : 0;
          }
        },
      },
      {
        label: "mask",
        get: () => sweep.mask !== null,
        set: (value) => {
          sweep.mask = value ? radarMask : null;
          for (const { line } of logLines) {
            line.mask = value ? logMask : null;
          }
        },
      },
      { label: "visible", heading: true },
      ...groups.map(([label, elements]) => {
        const modes = elements.map((element) => element.mode);
        return {
          label,
          get: () => elements[0].mode !== UIMode.HIDDEN,
          set: (value) => {
            elements.forEach((element, i) => (element.mode = value ? modes[i] : UIMode.HIDDEN));
          },
        };
      }),
    ],

    update(deltaTime) {
      time += deltaTime;
      const seconds = CLOCK_START + time;
      setText(clock, `T+ ${formatClock(seconds, 1)}`);

      /*
       * The sweep turns clockwise. A blip is brightest right after it passes and fades over the
       * turn.
       */
      const edge = -((time / SWEEP_PERIOD) * Math.PI * 2) % (Math.PI * 2);
      sweep.micro.rotation = edge;
      for (const blip of blips) {
        const behind = (((blip.angle - edge) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const glow = Math.pow(1 - behind / (Math.PI * 2), 3);
        blip.image.lightness = blip.isHostile ? 0.1 + 0.3 * glow : 0.25 * glow - 0.1;
        if (!blip.isHostile) {
          blip.image.micro.scaleX = blip.image.micro.scaleY = 0.7 + 0.5 * glow;
        }
      }

      for (const row of bars) {
        const value = row.base + row.amplitude * Math.sin(time * row.rate + row.rate);
        row.bar.progress = value;
        setText(row.value, `${(value * 100).toFixed(1)}%`);
      }
      drawGraph(time);

      const span = LOG_LINES * LINE_HEIGHT;
      const scroll = time * LOG_SPEED;
      logLines.forEach((entry, i) => {
        const pass = Math.floor((scroll - i * LINE_HEIGHT) / span);
        if (pass !== entry.pass) {
          entry.pass = pass;
          entry.line.content = logEntry(seconds);
        }
        entry.line.micro.y =
          i * LINE_HEIGHT - ((((i * LINE_HEIGHT - scroll) % span) + span) % span);
      });

      const point = layer.projectWorldPosition(probe.position, camera, projected);
      markerX.distance = point.x;
      markerY.distance = point.y;
      const distance = probe.position.length();
      const scale = layer.height / 2 / (distance * Math.tan((camera.fov * Math.PI) / 360));
      markerSize.height = Math.max(24, 6 * scale * 1.35);
      setText(markerDistance, `${Math.round(distance * 9)} M`);
    },
  };
}
