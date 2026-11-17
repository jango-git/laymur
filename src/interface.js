import { UIDummy, UILayerDebug, UIMode, UIResizePolicy, UIViewportLayer } from "laymur";

import { createControls } from "./controls.js";
import { createDeviceFrame } from "./device-frame.js";
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
import { createOptions, PANEL_WIDTH } from "./options.js";
import { COLORS, SANS } from "./style.js";
import { githubIcon, npmIcon, sourceIcon } from "./textures.js";

const VERSION = "0.27.1";
const REPOSITORY = "https://github.com/jango-git/laymur";
const NPM = "https://www.npmjs.com/package/laymur";
const SOURCES = `${REPOSITORY}/blob/gh-pages/src/scenes/`;

/**
 * The layer is at least 1920 by 900 units in landscape and 600 by 1300 units in portrait, so the
 * panel fits a short landscape phone and the tabs fit a narrow portrait one
 */
class PageResizePolicy extends UIResizePolicy {
  calculateScale(width, height) {
    const [minWidth, minHeight] = width > height ? [1920, 900] : [600, 1300];
    return Math.max(minWidth / width, minHeight / height);
  }
}

/**
 * The page around the device: title, links, scene tabs, the panel with the options of the
 * current scene and the device frame. In portrait the panel stands on the bottom edge and keeps
 * only the rows of the current scene, and the header stands in the column of the panel, which is
 * centered when the screen is wider than the page.
 */
export function createInterface(scenes, viewport) {
  const layer = new UIViewportLayer({ resizePolicy: new PageResizePolicy() });
  layer.mode = UIMode.INTERACTIVE;
  const controls = createControls(layer);
  const { button, paint, row } = controls;
  let current = 0;

  const panel = new UIDummy(layer);
  const panelHeight = {};
  for (const orientation of [LANDSCAPE, PORTRAIT]) {
    width(panel, PANEL_WIDTH[orientation], orientation);
    panelHeight[orientation] = height(panel, 1, orientation);
  }
  horizontalDistance(panel, layer, 1, 1, 48, LANDSCAPE);
  verticalDistance(panel, layer, 1, 1, 230, LANDSCAPE);
  horizontalDistance(layer, panel, 0.5, 0.5, 0, PORTRAIT);
  verticalDistance(layer, panel, 0, 0, 28, PORTRAIT);

  const brand = text(layer, "LAYMUR", { size: 40, family: SANS });
  horizontalDistance(layer, brand, 0, 0, 48, LANDSCAPE);
  horizontalDistance(panel, brand, 0, 0, 0, PORTRAIT);
  verticalDistance(brand, layer, 1, 1, 34, LANDSCAPE);
  verticalDistance(brand, layer, 1, 1, 24, PORTRAIT);
  const version = text(layer, VERSION, { size: 17, css: COLORS.dim });
  horizontalDistance(brand, version, 0, 0, 2);
  verticalDistance(version, brand, 1, 0, 20);

  const open = (url) => window.open(url, "_blank", "noopener");
  const links = [
    button(sourceIcon, () => open(SOURCES + scenes[current].source)),
    button(githubIcon, () => open(REPOSITORY)),
    button(npmIcon, () => open(NPM)),
  ];
  horizontalDistance(links[2].frame, layer, 1, 1, 48, LANDSCAPE);
  horizontalDistance(links[2].frame, panel, 1, 1, 0, PORTRAIT);
  verticalDistance(links[1].frame, brand, 0.5, 0.5, 0);
  row(links);

  const tabs = scenes.map((scene, i) => button(scene.tab, () => select(i)));
  horizontalDistance(layer, tabs[0].frame, 0, 0, 48, LANDSCAPE);
  horizontalDistance(panel, tabs[0].frame, 0, 0, 0, PORTRAIT);
  verticalDistance(tabs[0].frame, layer, 1, 1, 136, LANDSCAPE);
  verticalDistance(tabs[0].frame, layer, 1, 1, 114, PORTRAIT);
  row(tabs);

  const title = text(layer, scenes[0].title, { size: 36, family: SANS });
  horizontalDistance(panel, title, 0, 0, 0);
  verticalDistance(title, panel, 1, 1, 0);
  const readout = text(layer, "-", { size: 20, css: COLORS.dim });
  horizontalDistance(panel, readout, 0, 0, 0);
  verticalDistance(readout, panel, 1, 1, 58);

  let debug = null;
  const showDebug = (value) => {
    debug?.destroy();
    debug = value ? new UILayerDebug(scenes[current].layer) : null;
  };
  const debugOption = { label: "constraints", get: () => debug !== null, set: showDebug };
  const options = createOptions(
    layer,
    panel,
    scenes.map((scene) => [debugOption, ...(scene.options ?? [])]),
  );

  const deviceFrame = createDeviceFrame(layer, panel, viewport, controls);

  function showScene() {
    for (const orientation of [LANDSCAPE, PORTRAIT]) {
      panelHeight[orientation].height = options.panelHeight(current, orientation);
    }
    title.content = scenes[current].title;
  }
  showScene();

  function select(index) {
    if (index === current) {
      return;
    }
    const hasDebug = debug !== null;
    showDebug(false);
    scenes[current].layer.mode = UIMode.VISIBLE;
    current = index;
    scenes[current].layer.mode = UIMode.INTERACTIVE;
    showScene();
    showDebug(hasDebug);
  }
  for (const scene of scenes) {
    scene.layer.mode = scene === scenes[0] ? UIMode.INTERACTIVE : UIMode.VISIBLE;
  }

  return {
    get scene() {
      return scenes[current];
    },

    update() {
      tabs.forEach((tab, i) => paint(tab, i === current));
      for (const link of links) {
        paint(link);
      }
      const scene = scenes[current];
      const size = `layer ${Math.round(scene.layer.width)} x ${Math.round(scene.layer.height)}`;
      setText(readout, scene.readout?.() ?? size);
      options.draw(current);
      deviceFrame.update();
    },

    render(renderer, deltaTime) {
      layer.render(renderer, deltaTime);
    },
  };
}
