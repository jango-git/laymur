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

* **Cassowary solver** — constraint-based layouts via `@lume/kiwi`
* **Orientation-aware** — define portrait and landscape rules in one layout, solver toggles automatically
* **Micro-transforms** — visual-only transforms (scale, rotation, offset) that bypass the solver
* **Resize policies** — Cover, Fit, FixedHeight, FixedWidth, Cross strategies
* **Modular particles** — separate `laymur/particles` entry point, import only if needed

## Installation

```bash
npm install laymur
```

Peer Dependencies:

* `three` (>=0.157.0 <0.180.0)
* `@lume/kiwi` (^0.4.4)
* `ferrsign` (^0.0.4)

## Core Concepts

### 1. Layers & Elements

`UIFullscreenLayer` manages coordinate system, canvas scaling, and input. All UI elements attach to a layer.

```typescript
import { UIFullscreenLayer, UIImage, UIMode, UIResizePolicyFixedHeight } from 'laymur';

const layer = new UIFullscreenLayer({ 
  name: "MainHUD", 
  mode: UIMode.VISIBLE,
  resizePolicy: new UIResizePolicyFixedHeight(1080, 1920)
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
  UIRelation 
} from 'laymur';

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

For animations, use `.micro` — updates visual matrix without triggering the solver.

```typescript
element.micro.scaleX = Math.sin(Date.now() * 0.001) + 1;
element.micro.rotation += 0.01;
```

### 4. Particle System

Modular pipeline: Spawn → Behavior → Rendering.

```typescript
import { UIEmitter, UISpawnRectangle, UIBehaviorDirectionalGravity, UIRenderingTexture } from 'laymur/particles';

const emitter = new UIEmitter(
  layer,
  [new UISpawnRectangle([-500, 0], [500, 0])],
  [new UIBehaviorDirectionalGravity({ x: 0, y: 100 })],
  [new UIRenderingTexture(particleTexture)],
  { expectedCapacity: 1024 } // Pre-allocation hint, not a hard limit
);

emitter.play(60); // particles/sec
```

## API Overview

Most commonly used exports (not exhaustive):

### Core

UIFullscreenLayer, UIImage, UIAnimatedImage, UIText, UINineSlice, UIProgress

### Constraints

UIAspectConstraint, UIHorizontalDistanceConstraint, UIVerticalDistanceConstraint, UIHorizontalProportionConstraint, UIVerticalProportionConstraint, UICoverConstraintBuilder, UIFitConstraintBuilder

### Particles (laymur/particles)

UIEmitter, UISpawnRectangle, UISpawnRandomLifetime, UIBehaviorDirectionalGravity, UIBehaviorVelocityDamping, UIRenderingTexture, UIRenderingColorOverLife

## Entry Points

```json
// package.json
"exports": {
  ".": "./dist/index.js",
  "./particles": "./dist/particles/index.js"
}
```

## License

MIT © jango
