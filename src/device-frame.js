import { UIDummy, UIGraphics, UIMode, UINineSlice } from "laymur";

import { BUTTON_HEIGHT, setCursor } from "./controls.js";
import { height, horizontalDistance, LANDSCAPE, PORTRAIT, verticalDistance, width } from "./kit.js";
import { color, controlColors } from "./style.js";
import { frameTexture } from "./textures.js";

const PRESETS = [
  [390, 844],
  [844, 390],
  [820, 1180],
  [1280, 720],
];
const MIN_DEVICE_SIZE = 280;
const MAX_DEVICE_SIZE = 2400;
const MAX_ASPECT = 21 / 9;
const PRESETS_TOP = 28;
const PRESETS_GAP = 24;

/**
 * The device on the page: a region it is fitted into, a frame around it, a resize handle at its
 * corner and presets of its size under the region. In portrait the region stands above the panel.
 */
export function createDeviceFrame(layer, panel, viewport, { button, paint, row }) {
  const region = new UIDummy(layer);
  horizontalDistance(layer, region, 0, 0, 48, LANDSCAPE);
  horizontalDistance(region, panel, 1, 0, 80, LANDSCAPE);
  verticalDistance(region, layer, 1, 1, 230, LANDSCAPE);
  verticalDistance(layer, region, 0, 0, 108, LANDSCAPE);
  horizontalDistance(layer, region, 0, 0, 24, PORTRAIT);
  horizontalDistance(region, layer, 1, 1, 24, PORTRAIT);
  verticalDistance(region, layer, 1, 1, 194, PORTRAIT);
  verticalDistance(
    panel,
    region,
    1,
    0,
    PRESETS_TOP + BUTTON_HEIGHT[PORTRAIT] + PRESETS_GAP,
    PORTRAIT,
  );

  const presets = PRESETS.map(([deviceWidth, deviceHeight]) =>
    button(`${deviceWidth}x${deviceHeight}`, () => viewport.resize(deviceWidth, deviceHeight)),
  );
  horizontalDistance(region, presets[0].frame, 0, 0, 0, LANDSCAPE);
  horizontalDistance(panel, presets[0].frame, 0, 0, 0, PORTRAIT);
  verticalDistance(presets[0].frame, region, 1, 0, PRESETS_TOP);
  row(presets);

  const frame = new UINineSlice(layer, frameTexture, { sliceBorders: 0.2, sliceRegions: 18 });
  const frameLeft = horizontalDistance(layer, frame, 0, 0, 0);
  const frameBottom = verticalDistance(layer, frame, 0, 0, 0);
  const frameWidth = width(frame, 100);
  const frameHeight = height(frame, 100);

  const handle = new UIGraphics(layer, { width: 48, height: 48 });
  handle.mode = UIMode.INTERACTIVE;
  handle.drawPolyline(
    [
      [44, 8],
      [44, 44],
      [8, 44],
    ],
    color("#ffffff"),
    4,
  );
  width(handle, 24);
  height(handle, 24);
  horizontalDistance(handle, frame, 1, 1, -12);
  verticalDistance(frame, handle, 0, 0, -12);
  let isHandleHovered = false;
  handle.signalPointerEntered.on(() => {
    isHandleHovered = true;
    setCursor("nwse-resize");
  });
  handle.signalPointerLeft.on(() => {
    isHandleHovered = false;
    setCursor("");
  });

  const pixelsPerUnit = () => window.innerWidth / layer.width;
  function regionRect() {
    const unit = pixelsPerUnit();
    return {
      left: region.x * unit,
      top: window.innerHeight - region.oppositeY * unit,
      width: region.width * unit,
      height: region.height * unit,
    };
  }
  const scaleOf = (rect) => Math.min(rect.width / viewport.width, rect.height / viewport.height, 1);

  /*
   * While the handle is dragged the scale stays, so the corner follows the pointer. The device
   * stays centered, so the corner moves by half of the size change. A side stops at the
   * region, taken at the scale of the drag and rounded down so the device never outgrows it, and
   * at the aspect of 21:9 to the other side, the widest phone or screen the examples are laid out
   * for. The width is limited by the current height, then the height by the new width, until the
   * size stops changing. The current size always fits these limits, so each side only moves toward
   * the pointer, and a side the pointer does not move stays as it is.
   */
  let dragScale = 0;
  handle.signalPointerPressed.on(() => (dragScale = scaleOf(regionRect())));
  handle.signalPointerDragged.on((event) => {
    const area = regionRect();
    const x = event.x * pixelsPerUnit() - (area.left + area.width / 2);
    const y = window.innerHeight - event.y * pixelsPerUnit() - (area.top + area.height / 2);
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const toDevice = (offset) => Math.round((2 * offset) / dragScale);
    const regionLimit = (size) => Math.floor(Math.min(size / dragScale, MAX_DEVICE_SIZE));
    const side = (offset, otherSide, size) =>
      clamp(
        toDevice(offset),
        Math.max(MIN_DEVICE_SIZE, Math.ceil(otherSide / MAX_ASPECT)),
        Math.min(regionLimit(size), Math.floor(otherSide * MAX_ASPECT)),
      );
    let deviceWidth = viewport.width;
    let deviceHeight = viewport.height;
    for (;;) {
      const nextWidth = side(x, deviceHeight, area.width);
      const nextHeight = side(y, nextWidth, area.height);
      if (nextWidth === deviceWidth && nextHeight === deviceHeight) {
        break;
      }
      deviceWidth = nextWidth;
      deviceHeight = nextHeight;
    }
    viewport.resize(deviceWidth, deviceHeight);
  });
  handle.signalPointerReleased.on(() => (dragScale = 0));
  handle.signalPointerCancelled.on(() => (dragScale = 0));

  function place() {
    const area = regionRect();
    const scale = dragScale > 0 ? Math.min(dragScale, scaleOf(area)) : scaleOf(area);
    const deviceWidth = viewport.width * scale;
    const deviceHeight = viewport.height * scale;
    const left = area.left + (area.width - deviceWidth) / 2;
    const top = area.top + (area.height - deviceHeight) / 2;
    viewport.rect = { left, top, width: deviceWidth, height: deviceHeight };

    const unit = pixelsPerUnit();
    frameLeft.distance = left / unit - 3;
    frameBottom.distance = (window.innerHeight - top - deviceHeight) / unit - 3;
    frameWidth.width = deviceWidth / unit + 6;
    frameHeight.height = deviceHeight / unit + 6;
  }

  function update() {
    const presetIndex = PRESETS.findIndex(
      ([deviceWidth, deviceHeight]) =>
        deviceWidth === viewport.width && deviceHeight === viewport.height,
    );
    presets.forEach((preset, i) => paint(preset, i === presetIndex));
    [handle.color] = controlColors({ isCurrent: dragScale > 0, isHovered: isHandleHovered });
    place();
  }

  return { update };
}
