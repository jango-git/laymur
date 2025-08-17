<p align="center">
  <h1 align="center">Laymur</h1>
  <p align="center">
      A TypeScript Three.js UI layout library with constraint-based positioning and rendering.
  </p>
</p>

<p align="center">
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-%5E5.8.0-blue" alt="TypeScript"></a>
<a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-%5E0.175.0-green" alt="Three.js"></a>
</p>

⚠️ **Early Alpha / Work in Progress** ⚠️

This library is in very early development stage. APIs may change significantly.

## Features

- 🎯 **Constraint-Based Layout** - Powerful Cassowary constraint solver for flexible positioning
- 📐 **Anchor Points** - Flexible element positioning with configurable anchor points
- 🖼️ **Rich Elements** - Images, text, scenes, and custom UI components
- 📱 **Responsive Design** - Orientation-aware layouts that adapt to screen changes
- ✨ **Micro-Transformations** - Lightweight animations and effects without constraint changes
- 🎨 **Three.js Integration** - Native 3D scene rendering within UI elements
- 📦 **Full TypeScript Support** - Complete type safety and IntelliSense
- 🎪 **Event System** - Comprehensive interaction and lifecycle events

## Installation

```bash
npm install laymur
```

## Requirements

- Three.js ^0.175.0 (peer dependency)
- Modern JavaScript environment with ES2020+ support

## Quick Start

```typescript
import { UIFullscreenLayer, UIImage, UIText, UIWidthConstraint } from 'laymur';
import { WebGLRenderer, TextureLoader } from 'three';

// Create renderer and fullscreen layer
const renderer = new WebGLRenderer();
const layer = new UIFullscreenLayer(1920, 1920); // Fixed design dimensions

// Load a texture
const texture = new TextureLoader().load('my-image.jpg');

// Create UI elements
const background = new UIImage(layer, texture, 0, 0);
const title = new UIText(layer, 'Welcome to Laymur!', {
  maxWidth: 800,
  commonStyle: { fontSize: 48, color: '#ffffff' }
}, 100, 100);

// Add constraints for responsive layout
new UIWidthConstraint(background, { width: layer.width });

// Render loop
function animate() {
  const deltaTime = clock.getDelta();
  layer.render(renderer, deltaTime);
  requestAnimationFrame(animate);
}

animate();
```

## Core Concepts

### Layers

Layers are containers that manage UI elements, constraint solving, and rendering:

- **UIFullscreenLayer** - Automatic browser window integration with responsive scaling
- **UILayer** - Base layer class for custom implementations

### Elements

UI elements are the building blocks of your interface:

- **UIAnchor** - Basic positioned point in 2D space
- **UIImage** - Textured image display with color tinting
- **UIText** - Dynamic text rendering with rich formatting
- **UIScene** - Embedded 3D scene rendering
- **UIElement** - Base class for custom elements

### Constraints

Constraints define relationships between elements for automatic layout:

- **UIWidthConstraint** / **UIHeightConstraint** - Fixed dimensions
- **UIAspectConstraint** - Maintain aspect ratios
- **UIHorizontalDistanceConstraint** / **UIVerticalDistanceConstraint** - Spacing between elements
- **UIHorizontalProportionConstraint** / **UIVerticalProportionConstraint** - Proportional sizing
- **UICustomConstraint** - Custom mathematical relationships

## Layout System

### Constraint-Based Positioning

Laymur uses the Cassowary constraint solving algorithm to automatically calculate element positions and sizes based on relationships you define:

```typescript
import { UIImage, UIText, UIHorizontalDistanceConstraint, UIWidthConstraint } from 'laymur';

// Create elements
const sidebar = new UIImage(layer, sidebarTexture, 0, 0);
const content = new UIText(layer, 'Main content', {}, 0, 0);

// Define layout constraints
new UIWidthConstraint(sidebar, { width: 300 }); // Fixed sidebar width
new UIHorizontalDistanceConstraint(sidebar, content, {
  distance: 20,    // 20px spacing
  anchorA: 1.0,    // Right edge of sidebar
  anchorB: 0.0     // Left edge of content
});
```

### Anchor Points

Elements support flexible anchor points for precise positioning control:

```typescript
// Anchor values: 0.0 = left/top, 0.5 = center, 1.0 = right/bottom
new UIHorizontalDistanceConstraint(elementA, elementB, {
  anchorA: 0.5,  // Center of element A
  anchorB: 0.5,  // Center of element B
  distance: 100  // 100px between centers
});
```

### Proportional Layouts

Create responsive layouts that maintain proportions:

```typescript
import { UIHorizontalProportionConstraint } from 'laymur';

// Make content area 3x wider than sidebar
new UIHorizontalProportionConstraint(content, sidebar, {
  proportion: 3.0
});
```

## UI Elements

### UIImage - Textured Images

Display and manipulate images with full control over appearance:

```typescript
import { UIImage } from 'laymur';
import { TextureLoader } from 'three';

const texture = new TextureLoader().load('hero-image.jpg');
const heroImage = new UIImage(layer, texture, 0, 0);

// Modify appearance
heroImage.color = 0xff8844;     // Orange tint
heroImage.opacity = 0.8;        // Semi-transparent
heroImage.transparency = true;  // Enable alpha blending
```

### UIText - Dynamic Text Rendering

Render text with automatic word wrapping and styling:

```typescript
import { UIText } from 'laymur';

const description = new UIText(layer, {
  content: [
    { text: 'Welcome to ', style: { fontSize: 24, color: '#333333' } },
    { text: 'Laymur', style: { fontSize: 32, color: '#0066cc', fontWeight: 'bold' } },
    { text: '!', style: { fontSize: 24, color: '#333333' } }
  ]
}, {
  maxWidth: 600,
  padding: { top: 20, left: 20, right: 20, bottom: 20 },
  commonStyle: { fontFamily: 'Arial, sans-serif' }
});

// Update content dynamically
description.content = 'New text content';
```

### UIScene - Embedded 3D Scenes

Render Three.js scenes directly within your UI:

```typescript
import { UIScene, UISceneUpdateMode } from 'laymur';
import { Scene, PerspectiveCamera, BoxGeometry, Mesh } from 'three';

// Create 3D scene
const scene3d = new Scene();
const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
const cube = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color: 0x00ff00 }));
scene3d.add(cube);

// Embed in UI
const sceneElement = new UIScene(layer, {
  width: 400,
  height: 300,
  scene: scene3d,
  camera: camera,
  updateMode: UISceneUpdateMode.EACH_FRAME,
  resolutionFactor: 1.0
});
```

## Micro-Transformations

Apply lightweight transformations independent of the constraint system:

```typescript
// Access micro-transformation system
const element = new UIImage(layer, texture);

// Apply transformations for animations or effects
element.micro.x = 10;           // Offset position
element.micro.y = -5;
element.micro.scaleX = 1.2;     // Scale up horizontally
element.micro.rotation = 0.1;   // Rotate in radians
element.micro.anchorX = 0.5;    // Transform around center
element.micro.anchorY = 0.5;

// Reset all transformations
element.micro.reset();
```

## Event Handling

### Element Events

Listen for user interactions and lifecycle events:

```typescript
import { UIElementEvent } from 'laymur';

const button = new UIImage(layer, buttonTexture);
button.mode = UIMode.INTERACTIVE; // Enable interaction

button.on(UIElementEvent.CLICK, (x, y, element) => {
  console.log(`Button clicked at ${x}, ${y}`);
  // Handle button click
});
```

### Layer Events

Respond to layer-level changes:

```typescript
import { UILayerEvent } from 'laymur';

layer.on(UILayerEvent.ORIENTATION_CHANGE, (orientation, layer) => {
  console.log('Orientation changed to:', orientation);
  // Adjust layout for new orientation
});

layer.on(UILayerEvent.MODE_CHANGE, (mode, layer) => {
  console.log('Layer mode changed to:', mode);
});
```

## Advanced Features

### Custom Constraints

Create complex mathematical relationships:

```typescript
import { UICustomConstraint, UIExpression } from 'laymur';

// Create custom constraint: elementA.width = elementB.width + elementC.height * 2
const lhs = new UIExpression(0, [[elementA.wVariable, 1]]);
const rhs = new UIExpression(0, [
  [elementB.wVariable, 1],
  [elementC.hVariable, 2]
]);

new UICustomConstraint(layer, lhs, rhs, {
  priority: UIPriority.P2,
  relation: UIRelation.EQUAL
});
```

### Responsive Design

Handle different screen orientations and sizes:

```typescript
import { UIOrientation } from 'laymur';

// Constraints that only apply in specific orientations
new UIWidthConstraint(sidebar, {
  width: 300,
  orientation: UIOrientation.HORIZONTAL // Only in landscape
});

new UIWidthConstraint(sidebar, {
  width: 200,
  orientation: UIOrientation.VERTICAL   // Only in portrait
});
```

## API Reference

### Priority Levels

Constraint priorities from highest to lowest:

- `UIPriority.P0` - Required constraints (highest)
- `UIPriority.P1` - Strong constraints
- `UIPriority.P2` - Medium-strong constraints
- `UIPriority.P3` - Medium constraints
- `UIPriority.P4` - Medium-weak constraints
- `UIPriority.P5` - Weak constraints
- `UIPriority.P6` - Very weak constraints
- `UIPriority.P7` - Suggestion constraints (lowest)

### Relation Types

Mathematical relationships for constraints:

- `UIRelation.EQUAL` - Left-hand side equals right-hand side
- `UIRelation.LESS_THAN` - Left-hand side ≤ right-hand side
- `UIRelation.GREATER_THAN` - Left-hand side ≥ right-hand side

### UI Modes

Element visibility and interaction states:

- `UIMode.HIDDEN` - Not rendered, no interaction
- `UIMode.VISIBLE` - Rendered, no interaction
- `UIMode.INTERACTIVE` - Rendered with interaction

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Live Examples

Interactive examples and demos are available at: [https://jango-git.github.io/laymur/](https://jango-git.github.io/laymur/)

Explore constraint-based layouts, proportional positioning, and responsive UI components in action.

## License

Laymur is licensed under the [MIT License](./LICENSE).

It uses [Kiwi.js](https://github.com/lume/kiwi) as its constraint solving engine — a fast and lightweight Cassowary implementation in TypeScript.

Kiwi.js is licensed under the [BSD-3-Clause License](https://github.com/lume/kiwi/blob/main/LICENSE).
The MIT and BSD-3-Clause licenses are [compatible](https://opensource.org/license/bsd-3-clause/) and permissive.

## Credits

- Constraint solving powered by [Kiwi.js](https://github.com/lume/kiwi)
- Built with [Three.js](https://threejs.org/) for 3D rendering support
- Event system powered by [eventail](https://www.npmjs.com/package/eventail)
- Mathematical foundations based on the Cassowary constraint solving algorithm
