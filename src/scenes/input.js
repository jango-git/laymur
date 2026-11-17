import { UIImage, UIMode, UINineSlice, UIResizePolicyCross, UIViewportLayer } from "laymur";

import {
  aspect,
  button,
  fill,
  horizontalDistance,
  height,
  horizontalProportion,
  LANDSCAPE,
  PORTRAIT,
  verticalDistance,
  verticalProportion,
  width,
} from "../kit.js";
import { color, COLORS } from "../style.js";
import { bracketTexture, outlineTexture, radarTexture } from "../textures.js";

/*
 * Elements in INTERACTIVE mode get pointer signals. A pressed element holds the pointer until it
 * is released: the bracket keeps following a drag that leaves it, and a press released outside
 * a button ends with signalPointerCancelled instead of a click.
 */

const BUTTONS = ["SCAN", "TRACK", "LOCK", "ENGAGE"];

export function createInputScene(viewport) {
  const layer = new UIViewportLayer({
    viewport,
    resizePolicy: new UIResizePolicyCross(1600, 1400),
  });
  let lastEvent = null;
  const report = (name, signal) => (lastEvent = `${name}   ${signal}`);

  const radar = new UIImage(layer, radarTexture);
  aspect(radar, 1);
  horizontalDistance(layer, radar, 0.5, 0.5, 0);
  verticalDistance(layer, radar, 0.5, 0.5, 60);
  verticalProportion(layer, radar, 0.62, LANDSCAPE);
  horizontalProportion(layer, radar, 0.84, PORTRAIT);

  const bracket = new UIImage(layer, bracketTexture);
  bracket.mode = UIMode.INTERACTIVE;
  width(bracket, 140);
  height(bracket, 140);
  const bracketX = horizontalDistance(radar, bracket, 0.5, 0.5, 120);
  const bracketY = verticalDistance(radar, bracket, 0.5, 0.5, 80);
  bracket.color = color(COLORS.accent);
  let grab = null;
  bracket.signalPointerPressed.on((event) => {
    grab = { x: event.x - bracketX.distance, y: event.y - bracketY.distance };
    report("bracket", "signalPointerPressed");
  });
  bracket.signalPointerDragged.on((event) => {
    /* The center of the bracket stays inside the circle of the radar */
    const x = event.x - grab.x;
    const y = event.y - grab.y;
    const scale = Math.min(1, radar.width / 2 / Math.hypot(x, y));
    bracketX.distance = x * scale;
    bracketY.distance = y * scale;
    report("bracket", "signalPointerDragged");
  });
  bracket.signalPointerClicked.on(() => report("bracket", "signalPointerClicked"));
  bracket.signalPointerCancelled.on(() => report("bracket", "signalPointerCancelled"));

  const buttons = BUTTONS.map((name) => {
    const { box } = button(layer, name, { isWarn: name === "ENGAGE" });
    height(box, 96);
    verticalDistance(layer, box, 0, 0, 48);
    for (const signal of [
      "signalPointerEntered",
      "signalPointerLeft",
      "signalPointerPressed",
      "signalPointerClicked",
      "signalPointerCancelled",
    ]) {
      box[signal].on(() => report(name, signal));
    }
    return box;
  });

  /* The buttons share the width: equal sizes and gaps from the left edge to the right one */
  horizontalDistance(layer, buttons[0], 0, 0, 48);
  horizontalDistance(buttons[buttons.length - 1], layer, 1, 1, 48);
  for (let i = 1; i < buttons.length; i++) {
    horizontalDistance(buttons[i - 1], buttons[i], 1, 0, 24);
    horizontalProportion(buttons[0], buttons[i], 1);
  }

  const areas = [bracket, ...buttons].map((element) => {
    const outline = new UINineSlice(layer, outlineTexture, { sliceBorders: 0.1, sliceRegions: 6 });
    outline.color = color("#00ffff");
    outline.mode = UIMode.HIDDEN;
    fill(outline, element);
    return outline;
  });

  return {
    tab: "Input",
    title: "Pointer signals",
    source: "input.js",
    layer,
    options: [
      {
        label: "interactive elements",
        get: () => areas[0].mode !== UIMode.HIDDEN,
        set: (value) => {
          for (const outline of areas) {
            outline.mode = value ? UIMode.VISIBLE : UIMode.HIDDEN;
          }
        },
      },
    ],
    readout: () => lastEvent,
  };
}
