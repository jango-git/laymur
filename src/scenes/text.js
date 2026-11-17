import {
  UIMask,
  UIPriority,
  UIRelation,
  UIResizePolicyCross,
  UIText,
  UITextResizeMode,
  UIViewportLayer,
} from "laymur";

import {
  aspect,
  horizontalDistance,
  height,
  horizontalProportion,
  inside,
  LANDSCAPE,
  panel,
  PORTRAIT,
  text,
  verticalDistance,
} from "../kit.js";
import { COLORS, MONO, SANS } from "../style.js";

/*
 * UIText draws spans of styled text. In BREAK mode lines wrap at the width the constraints give
 * the text, in SCALE mode the text keeps its lines and scales down to fit. A mask on the panel
 * cuts off the text that does not fit in it.
 */

const LOG = [
  ["17:36.7", "COM", "relay 7 ack 159 ms", COLORS.accent],
  ["17:38.8", "SNS", "pass 439, 6 contacts", COLORS.accent],
  ["17:40.3", "SNS", "TGT-05 brg 129 rng 32.8", COLORS.accent],
  ["17:43.2", "WPN", "lock TGT-04 brg 049", COLORS.warn],
  ["17:44.0", "WPN", "TGT-04 locked", COLORS.warn],
  ["17:45.6", "NAV", "hdg 42.8 drift 0.008", COLORS.accent],
];

const BRIEFING =
  "Contact TGT-04 crossed the outer marker at 17:43 and holds bearing 049. Keep the lock until " +
  "the relay confirms the second pass, then hand the track over to the wing.";

export function createTextScene(viewport) {
  const layer = new UIViewportLayer({
    viewport,
    resizePolicy: new UIResizePolicyCross(1600, 1400),
  });

  const heading = text(layer, "SIGNAL LOST", { size: 96, family: SANS });
  horizontalDistance(layer, heading, 0, 0, 48);
  verticalDistance(heading, layer, 1, 1, 48);
  /*
   * The heading keeps its aspect. In a narrow layer it scales down to stay inside it, so its
   * height is a weaker constraint than the right edge.
   */
  aspect(heading);
  height(heading, 88).priority = UIPriority.P1;
  horizontalDistance(heading, layer, 1, 1, 48).relation = UIRelation.GREATER_THAN;

  const box = panel(layer);
  inside(box, layer, 48, null, 48, null);
  verticalDistance(box, heading, 1, 0, 32);
  horizontalProportion(layer, box, 0.62, LANDSCAPE);
  horizontalDistance(box, layer, 1, 1, 48, PORTRAIT);

  const spans = LOG.flatMap(([time, tag, body, css], i) => [
    { text: `${time}  `, style: { color: COLORS.dim } },
    { text: `${tag}  `, style: { color: css } },
    { text: body, style: { color: COLORS.text } },
    ...(i < LOG.length - 1 ? ["\n"] : []),
  ]);
  const log = new UIText(layer, spans, {
    commonStyle: { fontFamily: MONO, fontSize: 28, fontWeight: 500, lineHeight: 40 },
  });
  inside(log, box, 28, null, null, 28);
  /* The log keeps its size where it fits and scales down in a narrow panel */
  horizontalDistance(log, box, 1, 1, 28).relation = UIRelation.GREATER_THAN;

  const briefing = new UIText(layer, BRIEFING, {
    commonStyle: {
      fontFamily: MONO,
      fontSize: 28,
      fontWeight: 500,
      color: COLORS.text,
      lineHeight: 40,
    },
    resizeMode: UITextResizeMode.BREAK,
  });
  inside(briefing, box, 28, 28, null, null);
  verticalDistance(briefing, log, 1, 0, 40);

  const clip = new UIMask(box, { padding: 12 });
  log.mask = clip;
  briefing.mask = clip;

  const mode = (label, value) => ({
    label,
    get: () => briefing.resizeMode === value,
    set: () => (briefing.resizeMode = value),
  });

  return {
    tab: "Text",
    title: "UIText",
    source: "text.js",
    layer,
    options: [
      { label: "resizeMode", heading: true },
      mode("BREAK", UITextResizeMode.BREAK),
      mode("SCALE", UITextResizeMode.SCALE),
    ],
  };
}
