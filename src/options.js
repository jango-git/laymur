import { UIGraphics, UIMode } from "laymur";

import { setCursor } from "./controls.js";
import {
  height,
  horizontalDistance,
  LANDSCAPE,
  PORTRAIT,
  setText,
  text,
  verticalDistance,
  width,
} from "./kit.js";
import { color, COLORS, controlColors, MONO } from "./style.js";

/*
 * The options of a scene are rows of a canvas with a box each. A heading takes a whole row with a
 * caption and a rule, and the options under it fill the rows from left to right. In portrait a
 * list longer than SHORT_LIST takes two columns when its labels fit in them. Rows are drawn in
 * canvas pixels, CANVAS_SCALE per layer unit at the landscape width.
 */

export const PANEL_WIDTH = { [LANDSCAPE]: 400, [PORTRAIT]: 552 };
const OPTIONS_TOP = { [LANDSCAPE]: 120, [PORTRAIT]: 96 };
const ROWS = 11;
const ROW_HEIGHT = 44;
const CANVAS_SCALE = 2;
const CANVAS_WIDTH = PANEL_WIDTH[LANDSCAPE] * CANVAS_SCALE;
const INDENT = 60;
const BOX_SIZE = 28;
const LABEL_SIZE = 20;
const HEADING_SIZE = 15;
const HEADING_COUNT = 4;
const RULE_GAP = 20;
const SHORT_LIST = 4;
const COLUMN_GAP = 16;

const measure = document.createElement("canvas").getContext("2d");
function textWidth(content, size) {
  measure.font = `500 ${size}px "${MONO}"`;
  return measure.measureText(content).width;
}

function arrange(list, columns) {
  const cells = [];
  let row = 0;
  let group = [];
  const closeGroup = () => {
    group.forEach((option, i) =>
      cells.push({ option, column: i % columns, row: row + Math.floor(i / columns) }),
    );
    row += Math.ceil(group.length / columns);
    group = [];
  };
  for (const option of list) {
    if (option.heading) {
      closeGroup();
      cells.push({ option, column: 0, row: row++ });
    } else {
      group.push(option);
    }
  }
  closeGroup();
  return { cells, rows: row, columns };
}

/**
 * The option lists of all scenes, placed at the top left of the panel below OPTIONS_TOP. `draw`
 * shows the list of one scene, and `panelHeight` is the height the panel needs for it.
 */
export function createOptions(layer, panel, lists) {
  const isPortrait = () => layer.height > layer.width;
  const portraitUnit = PANEL_WIDTH[PORTRAIT] / CANVAS_WIDTH;

  const canvas = new UIGraphics(layer, {
    width: CANVAS_WIDTH,
    height: ROWS * ROW_HEIGHT * CANVAS_SCALE,
  });
  canvas.mode = UIMode.INTERACTIVE;
  horizontalDistance(panel, canvas, 0, 0, 0);
  for (const orientation of [LANDSCAPE, PORTRAIT]) {
    const scale = PANEL_WIDTH[orientation] / PANEL_WIDTH[LANDSCAPE];
    width(canvas, PANEL_WIDTH[orientation], orientation);
    height(canvas, ROWS * ROW_HEIGHT * scale, orientation);
    verticalDistance(canvas, panel, 1, 1, OPTIONS_TOP[orientation], orientation);
  }

  const labelPool = (count, size) =>
    Array.from({ length: count }, () => {
      const label = text(layer, "-", { size });
      label.mode = UIMode.HIDDEN;
      const left = horizontalDistance(canvas, label, 0, 0, 0);
      const top = verticalDistance(label, canvas, 0.5, 1, 0);
      return { label, left, top };
    });
  const itemLabels = labelPool(ROWS, LABEL_SIZE);
  const headingLabels = labelPool(HEADING_COUNT, HEADING_SIZE);

  const arrangements = lists.map((list) => {
    const columnWidth = PANEL_WIDTH[PORTRAIT] / 2 - COLUMN_GAP;
    const indent = INDENT * portraitUnit;
    const fits = list.every(
      (option) => option.heading || indent + textWidth(option.label, LABEL_SIZE) <= columnWidth,
    );
    return {
      [LANDSCAPE]: arrange(list, 1),
      [PORTRAIT]: arrange(list, list.length > SHORT_LIST && fits ? 2 : 1),
    };
  });

  let current = 0;
  let hoveredCell = null;
  const arrangement = () => arrangements[current][isPortrait() ? PORTRAIT : LANDSCAPE];
  const cellAt = (event) => {
    const { cells, columns } = arrangement();
    const row = Math.floor((1 - (event.y - canvas.y) / canvas.height) * ROWS);
    const column = Math.floor(((event.x - canvas.x) / canvas.width) * columns);
    return cells.find(
      (cell) => cell.row === row && (cell.option.heading || cell.column === column),
    );
  };
  canvas.signalPointerMoved.on((event) => {
    hoveredCell = cellAt(event);
    setCursor(hoveredCell && !hoveredCell.option.heading ? "pointer" : "");
  });
  canvas.signalPointerLeft.on(() => {
    hoveredCell = null;
    setCursor("");
  });
  canvas.signalPointerClicked.on((event) => {
    const option = cellAt(event)?.option;
    if (option && !option.heading) {
      option.set(!option.get());
    }
  });

  function drawHeading(label, y, unit) {
    label.color = color(COLORS.dim);
    const ruleStart = textWidth(label.content[0].text, HEADING_SIZE) / unit + RULE_GAP;
    canvas.drawPolyline(
      [
        [ruleStart, y],
        [CANVAS_WIDTH, y],
      ],
      color(COLORS.dim, 0.3),
      2,
    );
  }

  function drawBox(label, x, y, isOn, isHovered) {
    const [frameColor, labelColor] = controlColors({ isCurrent: isOn, isHovered });
    label.color = labelColor;
    const [left, bottom, right, top] = [
      x + 2,
      y - BOX_SIZE / 2,
      x + 2 + BOX_SIZE,
      y + BOX_SIZE / 2,
    ];
    canvas.drawPolyline(
      [
        [left, bottom],
        [right, bottom],
        [right, top],
        [left, top],
        [left, bottom],
      ],
      frameColor,
      3,
    );
    if (isOn) {
      canvas.drawRect(left, bottom, BOX_SIZE, BOX_SIZE, color(COLORS.accent));
    }
  }

  function draw(index) {
    current = index;
    canvas.clear();
    const unit = canvas.width / CANVAS_WIDTH;
    const { cells, columns } = arrangement();
    let items = 0;
    let headings = 0;
    for (const cell of cells) {
      const { option } = cell;
      const { label, left, top } = option.heading ? headingLabels[headings++] : itemLabels[items++];
      const x = cell.column * (CANVAS_WIDTH / columns);
      const y = (cell.row + 0.5) * ROW_HEIGHT * CANVAS_SCALE;
      label.mode = UIMode.VISIBLE;
      setText(label, option.label);
      left.distance = (x + (option.heading ? 0 : INDENT)) * unit;
      top.distance = y * unit;
      if (option.heading) {
        drawHeading(label, y, unit);
      } else {
        drawBox(label, x, y, option.get(), cell === hoveredCell);
      }
    }
    for (const [pool, used] of [
      [itemLabels, items],
      [headingLabels, headings],
    ]) {
      for (let i = used; i < pool.length; i++) {
        pool[i].label.mode = UIMode.HIDDEN;
      }
    }
  }

  function panelHeight(index, orientation) {
    if (orientation === LANDSCAPE) {
      return OPTIONS_TOP[LANDSCAPE] + ROWS * ROW_HEIGHT;
    }
    const { rows } = arrangements[index][PORTRAIT];
    return OPTIONS_TOP[PORTRAIT] + rows * ROW_HEIGHT * CANVAS_SCALE * portraitUnit;
  }

  return { draw, panelHeight };
}
