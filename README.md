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
  <a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-0.157.0--0.180.0-green" alt="Three.js"></a>
</p>

## Features

- **Cassowary solver** - constraint-based layouts via `@lume/kiwi`
- **Orientation-aware** - define portrait and landscape rules in one layout, solver toggles automatically
- **Micro-transforms** - transforms (scale, rotation, offset) that bypass the solver; input follows them
- **Masks** - analytic shader masks (rectangle, rounded rectangle, ellipse) with soft edges and input clipping
- **Color adjustment** - per-element hue/saturation/lightness and additive blend mode
- **Resize policies** - Cover, Fit, FixedHeight, FixedWidth, Cross strategies
- **Modular particles** - separate `laymur/particles` entry point, import only if needed
- **Debug overlay** - separate `laymur/debug` entry point, constraint visualization

## Installation

```bash
npm install laymur
```

Peer Dependencies:

- `three` (>=0.157.0 <0.180.0)
- `@lume/kiwi` (^0.4.4)
- `ferrsign` (^0.0.4)
- `fast-simplex-noise` (^4.0.0) - only required when using `laymur/particles`

## Visual Editor & Live Examples

Check out visual editor and interactive examples at:

**[EDITOR](https://jango-git.github.io/laymur-docs/editor/index.html)**

**[EXAMPLES](https://jango-git.github.io/laymur/examples/index.html)**

## Core Concepts

### 1. Layers & Elements

`UIFullscreenLayer` manages coordinate system, canvas scaling, and input. All UI elements attach to a layer.

```typescript
import { UIFullscreenLayer, UIImage, UIMode, UIResizePolicyFixedHeight } from "laymur";

const layer = new UIFullscreenLayer({
  name: "MainHUD",
  mode: UIMode.VISIBLE,
  resizePolicy: new UIResizePolicyFixedHeight(1080, 1920),
});
```

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

### 6. Particle System

Modular pipeline: Spawn -> Behavior -> Rendering.

```typescript
import {
  UIEmitter,
  UISpawnRectangle,
  UIBehaviorDirectionalGravity,
  UIRenderingTexture,
} from "laymur/particles";

const emitter = new UIEmitter(
  layer,
  [new UISpawnRectangle([-500, 0], [500, 0])],
  [new UIBehaviorDirectionalGravity({ x: 0, y: 100 })],
  [new UIRenderingTexture(particleTexture)],
  { expectedCapacity: 1024 }, // Pre-allocation hint, not a hard limit
);

emitter.play(60); // particles/sec
```

### 7. Debug Overlay

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

## API Overview

Most commonly used exports (not exhaustive):

### Core

UIFullscreenLayer, UIImage, UIAnimatedImage, UIText, UINineSlice, UIProgress, UIMask

### Constraints

UIAspectConstraint, UIHorizontalDistanceConstraint, UIVerticalDistanceConstraint, UIHorizontalProportionConstraint, UIVerticalProportionConstraint, UICoverConstraintBuilder, UIFitConstraintBuilder

### Extension Points

UIElement, UIArea, UIResizePolicy, UIProgressMaskFunction, UIMaskMaterialPatch, UIAffineMatrix3

UIRenderingModule, UISpawnModule, UIBehaviorModule (laymur/particles)

### Particles (laymur/particles)

UIEmitter, UISpawnRectangle, UISpawnRandomLifetime, UIBehaviorDirectionalGravity, UIBehaviorVelocityDamping, UIRenderingTexture, UIRenderingColorOverLife

### Debug (laymur/debug)

UILayerDebug, UIAspectDebug, UIHeightDebug, UIWidthDebug, UIHorizontalDistanceDebug, UIVerticalDistanceDebug, UIHorizontalInterpolationDebug, UIVerticalInterpolationDebug

## License

MIT (c) jango
