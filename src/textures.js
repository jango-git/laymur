import { CanvasTexture, SRGBColorSpace } from "three";

import { COLORS, MONO, rgba } from "./style.js";

/*
 * Every sprite is drawn on its own canvas and then packed into one atlas, so neighbouring
 * elements with the same shader draw in one call. A sprite is an atlas config whose texture and
 * frame are set by packAtlas() at the end of this module, before any other module uses it. The
 * atlas is packed in shelves from the tallest sprite down, and the gaps keep mipmaps from bleeding
 * between sprites.
 */
const sprites = [];

function sprite(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const config = {
    texture: null,
    frame: { x: 0, y: 0, w: width, h: height },
    spriteSourceSize: { x: 0, y: 0, w: width, h: height },
    sourceSize: { w: width, h: height },
  };
  sprites.push({ canvas, config });
  return config;
}

function packAtlas(width, gap) {
  const order = [...sprites].sort((a, b) => b.canvas.height - a.canvas.height);
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const { canvas, config } of order) {
    if (x + canvas.width > width) {
      x = 0;
      y += shelf + gap;
      shelf = 0;
    }
    config.frame.x = x;
    config.frame.y = y;
    x += canvas.width + gap;
    shelf = Math.max(shelf, canvas.height);
  }
  const atlas = document.createElement("canvas");
  atlas.width = width;
  atlas.height = y + shelf;
  const context = atlas.getContext("2d");
  for (const { canvas, config } of sprites) {
    context.drawImage(canvas, config.frame.x, config.frame.y);
  }
  const texture = new CanvasTexture(atlas);
  texture.colorSpace = SRGBColorSpace;
  for (const { config } of sprites) {
    config.texture = texture;
  }
}

/*
 * Panels and buttons are drawn for a nine-slice with borders of 0.3 of the texture, so the cut
 * corner of a button and the tick on the top edge of a panel stay sharp.
 */
const CHAMFER = 16;

function chamferedBox(css, fillAlpha, strokeAlpha) {
  return sprite(64, 64, (context, width, height) => {
    context.beginPath();
    context.moveTo(2 + CHAMFER, 2);
    context.lineTo(width - 2, 2);
    context.lineTo(width - 2, height - 2 - CHAMFER);
    context.lineTo(width - 2 - CHAMFER, height - 2);
    context.lineTo(2, height - 2);
    context.lineTo(2, 2 + CHAMFER);
    context.closePath();
    context.fillStyle = rgba(COLORS.screen, 0.6);
    context.fill();
    context.fillStyle = rgba(css, fillAlpha);
    context.fill();
    context.strokeStyle = rgba(css, strokeAlpha);
    context.lineWidth = 2;
    context.stroke();
  });
}

function stripes(alpha) {
  return sprite(256, 8, (context, width, height) => {
    context.fillStyle = rgba(COLORS.accent, alpha);
    for (let x = 0; x < width; x += 8) {
      context.fillRect(x, 0, 6, height);
    }
  });
}

export const panelTexture = sprite(64, 64, (context, width, height) => {
  context.fillStyle = rgba(COLORS.screen, 0.84);
  context.fillRect(1, 1, width - 2, height - 2);
  context.fillStyle = rgba(COLORS.accent, 0.05);
  context.fillRect(1, 1, width - 2, height - 2);
  context.strokeStyle = rgba(COLORS.accent, 0.24);
  context.lineWidth = 2;
  context.strokeRect(2, 2, width - 4, height - 4);
  context.fillStyle = COLORS.accent;
  context.fillRect(1, 1, 12, 3);
});

export const buttonTexture = chamferedBox(COLORS.accent, 0.1, 0.75);
export const warnButtonTexture = chamferedBox(COLORS.warn, 0.16, 1);
export const barTrackTexture = stripes(0.14);
export const barFillTexture = stripes(1);

export const bracketTexture = sprite(64, 64, (context, width, height) => {
  const length = 18;
  context.fillStyle = "#ffffff";
  for (const [x, y] of [
    [0, 0],
    [width - length, 0],
    [0, height - 3],
    [width - length, height - 3],
  ]) {
    context.fillRect(x, y, length, 3);
  }
  for (const [x, y] of [
    [0, 0],
    [width - 3, 0],
    [0, height - length],
    [width - 3, height - length],
  ]) {
    context.fillRect(x, y, 3, length);
  }
});

export const radarTexture = sprite(1024, 1024, (context, size) => {
  const radius = size / 2 - 4;
  context.translate(size / 2, size / 2);
  context.fillStyle = rgba(COLORS.screen, 0.6);
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = rgba(COLORS.accent, 0.035);
  context.fill();
  context.strokeStyle = rgba(COLORS.accent, 0.7);
  context.lineWidth = 3;
  context.stroke();
  context.lineWidth = 1.5;
  context.strokeStyle = rgba(COLORS.accent, 0.22);
  for (const fraction of [0.25, 0.5, 0.75]) {
    context.beginPath();
    context.arc(0, 0, radius * fraction, 0, Math.PI * 2);
    context.stroke();
  }
  const cross = radius - 108;
  context.strokeStyle = rgba(COLORS.accent, 0.16);
  context.beginPath();
  context.moveTo(-cross, 0);
  context.lineTo(cross, 0);
  context.moveTo(0, -cross);
  context.lineTo(0, cross);
  context.stroke();
  for (let i = 0; i < 72; i++) {
    const angle = (i / 72) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    const length = isMajor ? 26 : 10;
    context.strokeStyle = rgba(COLORS.accent, isMajor ? 0.8 : 0.4);
    context.lineWidth = isMajor ? 3 : 1.5;
    context.beginPath();
    context.moveTo(Math.cos(angle) * (radius - 2), Math.sin(angle) * (radius - 2));
    context.lineTo(
      Math.cos(angle) * (radius - 2 - length),
      Math.sin(angle) * (radius - 2 - length),
    );
    context.stroke();
  }
  context.fillStyle = rgba(COLORS.accent, 0.55);
  context.font = `500 40px "${MONO}"`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
    context.fillText(
      String(i * 90).padStart(3, "0"),
      Math.cos(angle) * (radius - 70),
      Math.sin(angle) * (radius - 70),
    );
  }
});

/*
 * The edge points along +x and the wedge lies counter-clockwise of it, so it trails the edge of a
 * sweep that turns clockwise, as a radar does. The sweep is turned by micro.rotation.
 */
export const sweepTexture = sprite(512, 512, (context, size) => {
  const radius = size / 2;
  const steps = 90;
  context.translate(radius, radius);
  for (let i = 0; i < steps; i++) {
    context.fillStyle = rgba(COLORS.accent, 0.34 * Math.pow(1 - i / steps, 2.2));
    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, -((i + 1) / steps) * 1.3 - 0.01, -(i / steps) * 1.3);
    context.closePath();
    context.fill();
  }
  context.strokeStyle = COLORS.accent;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(radius, 0);
  context.stroke();
});

export const dotTexture = sprite(64, 64, (context, size) => {
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.25)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
});

export const ringTexture = sprite(256, 256, (context, size) => {
  context.strokeStyle = "#ffffff";
  context.lineWidth = 10;
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
  context.stroke();
});

export const frameTexture = sprite(128, 128, (context, width, height) => {
  context.strokeStyle = rgba(COLORS.dim, 0.75);
  context.lineWidth = 2.5;
  context.strokeRect(2, 2, width - 4, height - 4);
});

export const OUTLINE_TEXTURE_SIZE = 64;
export const outlineTexture = sprite(
  OUTLINE_TEXTURE_SIZE,
  OUTLINE_TEXTURE_SIZE,
  (context, width, height) => {
    context.strokeStyle = "#ffffff";
    context.lineWidth = 3;
    context.strokeRect(1.5, 1.5, width - 3, height - 3);
  },
);

/*
 * Link icons are white, so they take the color of their button. The paths are in a 16 unit box
 * for GitHub and a 24 unit box for npm and the source, and the npm square is drawn smaller than
 * the box so that it weighs as much as the round mark.
 */
const ICON_SIZE = 128;

const GITHUB =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

const NPM = "M0 0h24v24H0zM5.13 5.32l13.84.02-.01 13.84h-3.46l.01-10.38h-3.46l-.01 10.37H5.11z";

export const githubIcon = sprite(ICON_SIZE, ICON_SIZE, (context, size) => {
  context.fillStyle = "#ffffff";
  context.scale(size / 16, size / 16);
  context.fill(new Path2D(GITHUB));
});

export const npmIcon = sprite(ICON_SIZE, ICON_SIZE, (context, size) => {
  const inset = 0.08 * size;
  context.fillStyle = "#ffffff";
  context.translate(inset, inset);
  context.scale((size - 2 * inset) / 24, (size - 2 * inset) / 24);
  context.fill(new Path2D(NPM), "evenodd");
});

export const sourceIcon = sprite(ICON_SIZE, ICON_SIZE, (context, size) => {
  context.strokeStyle = "#ffffff";
  context.scale(size / 24, size / 24);
  context.lineWidth = 2.4;
  context.lineJoin = "miter";
  for (const points of [
    [
      [7.5, 5],
      [1.5, 12],
      [7.5, 19],
    ],
    [
      [16.5, 5],
      [22.5, 12],
      [16.5, 19],
    ],
    [
      [14, 3],
      [10, 21],
    ],
  ]) {
    context.beginPath();
    for (const [x, y] of points) {
      context.lineTo(x, y);
    }
    context.stroke();
  }
});

packAtlas(2048, 16);
