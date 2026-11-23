<p align="center">
  <img src="./assets/logotype.png" width="200" alt="Laymur logo"><br/>
  <h1 align="center">Laymur</h1>
  <p align="center">
    Constraint-based UI library for Three.js.<br/>
    Primarily built for mobile advertisements (playable ads).
  </p>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/laymur"><img src="https://img.shields.io/npm/v/laymur.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-%5E5.8.0-blue" alt="TypeScript"></a>
  <a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-0.157.0--0.187.0-green" alt="Three.js"></a>
</p>

## Features

- **Cassowary solver** - constraint-based layouts via `@lume/kiwi`
- **Orientation-aware** - define portrait, landscape and optional square rules in one layout, solver toggles automatically
- **Micro-transforms** - transforms (scale, rotation, offset) that bypass the solver; input follows them
- **Masks** - analytic shader masks (rectangle, rounded rectangle, ellipse) with soft edges and input clipping
- **Text effects** - gradient fills, stacked outlines, shadows and glows, drawn at screen resolution
- **Color adjustment** - per-element hue/saturation/lightness and additive blend mode
- **Resize policies** - Cover, Fit, FixedHeight, FixedWidth, Cross strategies
- **Modular particles** - separate `laymur/particles` entry point, import only if needed
- **Debug overlay** - separate `laymur/debug` entry point, constraint visualization

## Installation

```bash
npm install laymur
```

Peer Dependencies:

- `three` (>=0.157.0 <0.188.0)
- `@lume/kiwi` (^0.4.4)
- `ferrsign` (^0.0.4)
- `fast-simplex-noise` (^4.0.0) - only required when using `laymur/particles`

### Development checks

Laymur validates arguments (finite numbers, ranges, destroyed objects) unless
`process.env.NODE_ENV` is `"production"`. A bundler replaces that expression with a string, and
the minifier then removes the checks from the production build:

- Vite and webpack set it for you (`"production"` in production builds).
- esbuild: `--define:process.env.NODE_ENV='"production"'`.
- Rollup: `@rollup/plugin-replace` with `"process.env.NODE_ENV": JSON.stringify("production")`.

Without a bundler (an import map, a CDN), `process` does not exist: define it before importing
laymur.

```html
<script>
  globalThis.process = { env: { NODE_ENV: "development" } }; // or "production"
</script>
```

## Visual Editor & Live Examples

Check out visual editor and interactive examples at:

**[EDITOR](https://jango-git.github.io/laymur-docs/editor/index.html)**

**[EXAMPLES](https://jango-git.github.io/laymur/examples/index.html)**

## Core Concepts

### 1. Layers & Elements

`UIViewportLayer` manages coordinate system, canvas scaling, and input. All UI elements attach to a layer.

```typescript
import { UIViewportLayer, UIImage, UIMode, UIResizePolicyFixedHeight } from "laymur";

const layer = new UIViewportLayer({
  name: "MainHUD",
  mode: UIMode.VISIBLE,
  resizePolicy: new UIResizePolicyFixedHeight(1080, 1920),
});
```

The layer covers the whole window by default. For a canvas that does not fill the window (an editor preview, a page with margins), pass the area it covers; the layer then takes its size and the origin of input positions from that element:

```typescript
import { UIElementViewport, UIViewportLayer } from "laymur";

const viewport = new UIElementViewport(renderer.domElement);
const layer = new UIViewportLayer({ viewport });
// The viewport belongs to the caller and may serve several layers: destroy it after them
```

A layer is landscape when wider than high, and portrait otherwise. It is square only when given the aspects, width divided by height, it counts as square:

```typescript
const layer = new UIViewportLayer({
  squareAspectRange: { min: 0.8, max: 1.25 },
  resizePolicy: new UIResizePolicyFixedHeight(1080, 1920, 1440),
});
```

Inside the range, constraints for only landscape or only portrait are disabled, so the layout needs rules for the square orientation. Resize policies take an optional square target, and without it a square layer is scaled like a portrait one.

### 2. Constraint System

Cassowary-based constraint solver. Supports priorities, element relationships, orientation-specific rules, and inequality relations.

```typescript
import {
  UIHorizontalDistanceConstraint,
  UIVerticalProportionConstraint,
  UIAspectConstraint,
  UIOrientation,
  UIPriority,
  UIRelation,
} from "laymur";

// Lock aspect ratio
new UIAspectConstraint(element);

// Position relative to layer center
new UIHorizontalDistanceConstraint(layer, element, {
  anchorA: 0.5,
  anchorB: 0.5,
});

// Size as proportion of layer, landscape only
new UIVerticalProportionConstraint(layer, element, {
  proportion: 0.4,
  orientation: UIOrientation.HORIZONTAL,
  priority: UIPriority.P1,
});

// Portrait and square
new UIVerticalProportionConstraint(layer, element, {
  proportion: 0.3,
  orientation: UIOrientation.VERTICAL | UIOrientation.SQUARE,
});

// Max width constraint
new UIHorizontalProportionConstraint(layer, element, {
  proportion: 0.8,
  relation: UIRelation.LESS_THAN,
});
```

### 3. Micro-transforms

For animations, use `.micro` - updates visual matrix without triggering the solver.

```typescript
element.micro.scaleX = Math.sin(Date.now() * 0.001) + 1;
element.micro.rotation += 0.01;
```

Input follows micro-transforms: a moved, rotated or scaled element is hit where it is drawn. Turn it off for effects where the hit area should stay put, such as shrinking a button while it is pressed:

```typescript
button.micro.affectsInput = false;
```

### 4. Masks

`UIMask` follows the rectangle of a source element or of the layer, so it is laid out with constraints. Masks are computed in the shader: edges can be soft and masked elements keep batching together.

```typescript
import { UIDummy, UIMask, UIMaskShape } from "laymur";

// Scroll view: content moves, the viewport stays
const viewport = new UIDummy(layer);
const mask = new UIMask(viewport, { radius: 24, softness: 8, padding: 10 });
for (const item of items) {
  item.mask = mask;
}

// Round avatar
avatar.mask = new UIMask(avatarFrame, { shape: UIMaskShape.ELLIPSE, softness: 2 });

// Tutorial spotlight: taps inside the hole reach the button below the overlay
dimOverlay.mask = new UIMask(ctaButton, {
  shape: UIMaskShape.ELLIPSE,
  inverted: true,
  softness: 40,
});
```

A mask also clips input and lives as long as its source. Particles are not clipped; three.js materials of your own can be, through `UIMaskMaterialPatch`.

### 5. Color Adjustment

Every element supports per-element color tweaks that run in the shader, independent of the layout solver.

```typescript
import { UIBlendMode } from "laymur";

element.hue = 180; // hue shift in degrees
element.saturation = 0.5; // multiplier (1 = unchanged, 0 = grayscale)
element.lightness = 0.1; // offset (0 = unchanged)

// Additive blending (light accumulation), only affects BLEND transparency
element.blendMode = UIBlendMode.ADDITIVE;
```

### 6. Text and Graphics

`UIText` and `UIGraphics` draw on a canvas. Both redraw it at the size the element takes on the
screen, so they stay sharp on high-DPI screens and when constraints enlarge them.

```typescript
import { UIGraphics, UILinearGradient, UIText } from "laymur";

const title = new UIText(layer, "WELL DONE!", {
  commonStyle: {
    fontSize: 64,
    fontWeight: "bold",
    color: new UILinearGradient([
      { offset: 0, color: "#fff6b0" },
      { offset: 1, color: "#ff7a00" },
    ]),
    strokes: [
      { paint: "#7a2a00", thickness: 4 },
      { paint: "#ffffff", thickness: 4 },
    ],
    shadows: [
      { color: "rgba(0, 0, 0, 0.6)", offsetY: 6 },
      { color: "rgba(255, 230, 0, 0.9)", blur: 12 },
    ],
  },
});

const panel = new UIGraphics(layer, { width: 300, height: 200 });
panel.drawRoundedRect(0, 0, 300, 200, 24, {
  fill: "#2060ff",
  stroke: { paint: "#ffffff", width: 4 },
});
```

- Text is laid out in pixels of its style. With `UITextResizeMode.SCALE`, scaling the element with
  constraints does not change the line breaks. With `BREAK` the text rewraps to the width.
- A gradient is laid over the box of what it fills, in fractions of that box from its top left
  corner. For text the box is each line or the whole text (`paintBox`), for a shape its bounds.
- Strokes stack outward from the glyphs in list order. Shadows are cast by the outlined glyphs,
  the first one on top, and a shadow without an offset is a glow.
- `UIGraphics` keeps its shapes until `clear()`. They are drawn in a box as large as the width and
  height the element is created with, y pointing down, and the box is stretched over the element.
- With `lineBox: UITextLineBox.FONT` the height of a line comes from the font metrics, so texts
  of one font aligned by an edge share the baseline.
- A `UIAspectConstraint` without an aspect follows the aspect of the text as it rewraps, and the
  aspect of the texture of a `UIImage`.
- Micro transforms do not redraw the canvas.

### 7. Particle System

Modular pipeline: Spawn -> Behavior -> Rendering.

```typescript
import {
  UIEmitter,
  UISpawnRectangle,
  UISpawnRandomLifetime,
  UISpawnRandomScale,
  UIBehaviorDirectionalGravity,
  UIRenderingTexture,
} from "laymur/particles";

// Unset, a particle lives 1 second at scale 1 (1 px)
const emitter = new UIEmitter(
  layer,
  [
    new UISpawnRectangle([-500, 0], [500, 0]),
    new UISpawnRandomLifetime([2, 3]), // seconds
    new UISpawnRandomScale([24, 48], particleTexture), // px, aspect from the texture
  ],
  [new UIBehaviorDirectionalGravity({ x: 0, y: 100 })],
  [new UIRenderingTexture(particleTexture)],
  { expectedCapacity: 1024 }, // Pre-allocation hint, not a hard limit
);

emitter.play(60); // particles/sec
```

A ring of sparkles drawn without a texture, and a trail that stays on the layer behind a moving
emitter:

```typescript
const ring = new UIEmitter(
  layer,
  [
    new UISpawnCircle(20, [-Math.PI, Math.PI], UICircleDistribution.EVEN),
    new UISpawnRadialVelocity(260), // after the shape: reads the spawn position
    new UISpawnRandomScale(26),
  ],
  [new UIBehaviorVelocityDamping(0.6)],
  [new UIRenderingShape(UIParticleShape.SPARKLE), new UIRenderingColorOverLife(colors)],
  { blendMode: UIBlendMode.ADDITIVE },
);
ring.burst(16);

const trail = new UIEmitter(layer, spawnModules, behaviorModules, renderingModules, {
  space: UIEmitterSpace.WORLD,
});
trail.play(240);
```

Coins that fly into a counter, which counts each one as it lands:

```typescript
const coins = new UIEmitter(
  layer,
  [new UISpawnRandomLifetime([0.9, 1.4]), new UISpawnRandomVelocity([-Math.PI, Math.PI], 300)],
  [new UIBehaviorSeek(counterPosition, 0.25)], // last: arrives at the end of life
  [new UIRenderingTexture(coinTexture)],
  { space: UIEmitterSpace.WORLD },
);
coins.signalParticleDied.on((x, y) => {
  counter.add(1);
  sparks.burstAt(6, x, y);
});
coins.burst(20);
```

Spawn modules write positions relative to the emitter. In `UIEmitterSpace.WORLD` the emitter then
places each particle where it was at the particle's moment within the frame, and particle
positions and the points of behavior modules are layer coordinates. In `LOCAL` space, the default,
live particles move with the emitter.

### 8. Debug Overlay

`laymur/debug` renders visual overlays for constraints - useful during development to inspect layout relationships.

`UILayerDebug` automatically tracks all constraints on a layer and creates the corresponding overlays. Individual constraint types can be toggled on/off.

```typescript
import { UILayerDebug } from "laymur/debug";

const debug = new UILayerDebug(layer, {
  showAspect: true,
  showWidth: true,
  showHeight: true,
  showHorizontalDistance: true,
  showVerticalDistance: true,
  showHorizontalInterpolation: false,
  showVerticalInterpolation: false,
});

// Toggle a category at runtime
debug.showAspect = false;

// Clean up
debug.destroy();
```

Overlays respect orientation - they hide automatically when their constraint's orientation is inactive.

### 9. Compiling Ahead

Shader programs are built on the first frame an element is drawn in, and that frame can stall. `compile()` builds them ahead, for example behind a loading screen:

```typescript
await layer.compile(renderer);
```

It covers every element of the layer, hidden ones and a hidden layer included, and the scene a `UIScene` draws into its texture. It draws nothing.

- Programs depend on the state of the renderer. Call `compile()` with the render target, color space and tone mapping the layer is drawn with.
- Programs are built for the current state of the elements. A mask added later, another mask function of a `UIProgress` or another transparency mode builds a program on its next frame.
- On three r157 `compile()` builds the programs synchronously and stalls until they are built. From r158 it waits without stalling.
- Without `KHR_parallel_shader_compile` a program still stalls its first frame until the driver finishes it.
- Turn `renderer.debug.checkShaderErrors` off in production. With it on, three reads the logs of every program it builds.
- Three deletes a program together with the last material using it. Once every element of one kind is destroyed, the next such element builds it again.

An element of your own whose scene objects appear on its first frame creates them in a `signalCompiling` handler, for the current state and without advancing in time. A scene it draws apart from the layer goes to `compileScene` of the handler argument.

## API Overview

Most commonly used exports (not exhaustive):

### Core

UIViewportLayer, UIImage, UIAnimatedImage, UIText, UIGraphics, UINineSlice, UIProgress, UIMask, UILinearGradient, UIRadialGradient

### Constraints

UIAspectConstraint, UIHorizontalDistanceConstraint, UIVerticalDistanceConstraint, UIHorizontalProportionConstraint, UIVerticalProportionConstraint, UICoverConstraintBuilder, UIFitConstraintBuilder

### Extension Points

UIElement, UIArea, UIGradient, UIResizePolicy, UIViewport, UIProgressMaskFunction, UIMaskMaterialPatch, UIAffineMatrix3

UIRenderingModule, UISpawnModule, UIBehaviorModule (laymur/particles)

### Particles (laymur/particles)

UIEmitter, UISpawnRectangle, UISpawnCircle, UISpawnRandomLifetime, UISpawnRadialVelocity, UIBehaviorDirectionalGravity, UIBehaviorVelocityDamping, UIBehaviorScaleOverLife, UIBehaviorAlignToVelocity, UIBehaviorOrbit, UIBehaviorBounce, UIBehaviorSeek, UIRenderingTexture, UIRenderingFlipbook, UIRenderingShape, UIRenderingColorOverLife, UIRenderingRandomColor

### Debug (laymur/debug)

UILayerDebug, UIAspectDebug, UIHeightDebug, UIWidthDebug, UIHorizontalDistanceDebug, UIVerticalDistanceDebug, UIHorizontalInterpolationDebug, UIVerticalInterpolationDebug

## License

MIT (c) jango
