import {
  UIImage,
  UIPriority,
  UIRelation,
  UIResizePolicyCover,
  UIResizePolicyCross,
  UIResizePolicyFit,
  UIResizePolicyFixedHeight,
  UIResizePolicyFixedWidth,
  UIResizePolicyNone,
  UIViewportLayer,
} from "laymur";

import {
  aspect,
  button,
  center,
  formatClock,
  horizontalDistance,
  height,
  inside,
  panel,
  setText,
  text,
  verticalDistance,
  width,
} from "../kit.js";
import { radarTexture, sweepTexture } from "../textures.js";

/*
 * The resize policy turns the size of the viewport into the size of the layer. The elements keep
 * their sizes in layer units, so the policy decides how large they look on the screen.
 */

const POLICIES = [
  ["Cross 1600, 1400", new UIResizePolicyCross(1600, 1400)],
  ["Fit 1600 x 900", new UIResizePolicyFit(1600, 900)],
  ["Cover 1600 x 900", new UIResizePolicyCover(1600, 900)],
  ["FixedWidth 1600, 900", new UIResizePolicyFixedWidth(1600, 900)],
  ["FixedHeight 900, 1600", new UIResizePolicyFixedHeight(900, 1600)],
  ["None", new UIResizePolicyNone()],
];

export function createLayoutScene(viewport) {
  const layer = new UIViewportLayer({ viewport, resizePolicy: POLICIES[0][1] });

  const header = panel(layer);
  inside(header, layer, 24, 24, null, 24);
  height(header, 72);
  const name = text(layer, "KESTREL", { size: 24 });
  horizontalDistance(header, name, 0, 0, 24);
  verticalDistance(header, name, 0.5, 0.5, 0);
  const clock = text(layer, "T+ 00:00:00", { size: 24 });
  horizontalDistance(clock, header, 1, 1, 24);
  verticalDistance(header, clock, 0.5, 0.5, 0);

  /* The radar is 560 units wide when it fits, and shrinks to stay clear of the header and button */
  const radar = new UIImage(layer, radarTexture);
  width(radar, 560).priority = UIPriority.P3;
  aspect(radar, 1);
  center(radar, layer);
  const sweep = new UIImage(layer, sweepTexture);
  inside(sweep, radar, 0, 0, 0, 0);

  const { box: engage } = button(layer, "ENGAGE", { isWarn: true });
  width(engage, 320);
  height(engage, 84);
  horizontalDistance(layer, engage, 0.5, 0.5, 0);
  verticalDistance(layer, engage, 0, 0, 32);
  verticalDistance(radar, header, 1, 0, 24).relation = UIRelation.GREATER_THAN;
  verticalDistance(engage, radar, 1, 0, 24).relation = UIRelation.GREATER_THAN;

  let time = 0;

  return {
    tab: "Layout",
    title: "UIViewportLayer",
    source: "layout.js",
    layer,

    options: [
      { label: "resizePolicy", heading: true },
      ...POLICIES.map(([label, policy]) => ({
        label,
        get: () => layer.resizePolicy === policy,
        set: () => (layer.resizePolicy = policy),
      })),
    ],

    update(deltaTime) {
      time += deltaTime;
      sweep.micro.rotation = -time * 1.8;
      setText(clock, `T+ ${formatClock(Math.floor(time))}`);
    },
  };
}
