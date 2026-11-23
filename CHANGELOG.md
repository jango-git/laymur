# Changelog

Every notable change to laymur. Versions follow semver; while the major is 0, a minor release may
break the API, and patch releases before 0.12.0 sometimes did too. Breaking changes are marked.

## 0.30.1 - 2026-11-23

### Fixed

- `UILayer.compile` no longer throws "duplicate zIndex" on a layer whose elements were created
  with `zIndex` values out of creation order and have not been drawn yet. Elements and emitters
  take their current depth before the programs are built.

## 0.30.0 - 2026-11-23

### Changed

- **Breaking:** `UIOrientation` values are flags and combine with `|`, so a constraint with
  `orientation: UIOrientation.VERTICAL | UIOrientation.SQUARE` is active in portrait and square.
  Code that uses the names is unaffected, and stored numbers change.
- **Breaking:** `UIResizePolicy.calculateScale` takes the orientation of the layer as a third
  argument. The built-in policies follow the orientation of the layer instead of comparing the
  width and the height themselves, and a custom policy can do the same.
- **Breaking:** a subclass of `UILayer` passes the orientation to `resizeInternal`, so the
  orientation the size was chosen for and the one the layer reports are the same.

### Added

- Square orientation. `UILayerOptions.squareAspectRange` and `UILayer.squareAspectRange` (a
  `UIAspectRange`) set the aspects, width divided by height, the layer counts as square. Inside
  the range `UILayer.orientation` is `UIOrientation.SQUARE`, and constraints for only
  `HORIZONTAL` or only `VERTICAL` are disabled there. Without a range a layer has no square
  orientation and behaves as before.
- A square target in `UIResizePolicyFixedWidth`, `UIResizePolicyFixedHeight`,
  `UIResizePolicyCross` (the longer side) and `UIResizePolicyCrossInverted` (the shorter side),
  as an optional third constructor argument and a property. Without it a square layer is scaled
  by the portrait rule.
- `UILayer.compile(renderer)` builds the shader programs of the layer ahead of its first frame,
  hidden elements and a hidden layer included, and the scenes `UIScene` elements draw. It
  returns a promise, which on three r157 is resolved after a synchronous build.
- `UILayer.signalCompiling` with `UILayerCompilation`, for elements outside laymur whose scene
  objects appear on their first frame or that draw a scene of their own.
- `enabled` on the built-in constraints, those derived from `UISingleParameterConstraint`. It
  tells whether the orientation of the layer is among those of the constraint.

## 0.29.0 - 2026-11-19

### Changed

- **Breaking:** `UITextStyle` takes outlines as a list. `strokes` replaces `enableStroke`,
  `strokeColor` and `strokeThickness`. Each outline lies outside the previous one, and its
  `thickness` is the width visible outside the glyphs. The old stroke showed half its thickness,
  so `{ strokeColor: c, strokeThickness: t }` becomes `strokes: [{ paint: c, thickness: t / 2 }]`.
  Outline corners are round by default, and `join: "miter"` gives the old corners.
- **Breaking:** `UITextStyle` takes shadows as a list. `shadows` replaces `enableShadow`,
  `shadowOffsetX`, `shadowOffsetY`, `shadowBlur` and `shadowColor`. A shadow is cast once by the
  outlined glyphs of all spans that have it. Before, the stroke and the fill of each span cast one,
  and a translucent shadow was darker where they overlap.
- **Breaking:** the `color` of `UITextStyle` accepts any `UIColorConfig` or a gradient and reads
  back as a CSS string or the gradient. `UITextStyle.resolve` and the static
  `UITextStyle.calculatePadding` are no longer public.
- **Breaking:** `UIGraphics` keeps its shapes until `clear()` and draws them again when needed.
  The drawing methods take a style instead of a color. `drawRect(x, y, w, h, color)` becomes
  `drawRect(x, y, w, h, { fill: color })`, and `drawPolyline(points, color, width)` becomes
  `drawPolyline(points, { paint: color, width })` with points as `{ x, y }` objects. A string
  color is a `UIColor` name or any CSS color, so `rgba(...)` works.
- **Breaking:** `UIAspectConstraint` created without an aspect follows the content aspect of a
  `UIText` or a `UIImage`. A text that rewraps, for example after `maxLineWidth` changes with the
  orientation, keeps its proportions without a constraint per orientation. Other elements keep
  their ratio at creation as before. Setting `aspect` stops following the content.
- **Breaking:** `UIScene.resolutionFactor` multiplies the pixel density of the layer, so 1 renders
  as many pixels as the element covers on the screen. With a renderer pixel ratio of 2 the render
  target has four times the pixels it had. Dividing the old factor by `layer.pixelDensity` keeps
  the old size.
- `UIText` and `UIGraphics` draw their canvas at the size the element takes on the screen, times
  the pixel density of the layer. Text stays sharp on high-DPI screens and when constraints
  enlarge it, and the canvas takes more memory there, four times as much at a pixel ratio of 2.
  The canvas is redrawn when the size crosses a step of about 19%, and its longer side is kept
  within 4096 pixels. Micro transforms do not redraw it.
- Outlines and shadows of text are drawn in layers over all spans. An outline of one span no
  longer covers the glyphs of the span before it.
- Changing the `color` tint of a `UIText` no longer redraws its canvas.
- **Breaking:** a required (P0) constraint that conflicts with other required constraints throws
  in development builds, naming the constraint, and warns in production builds, where the layout
  goes on without it. Of the conflicting constraints, the later created is not applied. Before, it
  was skipped without a message.
- A constraint rejected for a conflict is applied once the conflict is gone, for example after
  the constraint it conflicted with is destroyed. Before, it stayed unapplied.

### Added

- `UILinearGradient` and `UIRadialGradient`, the paint of text, its outlines and the shapes of
  `UIGraphics`. A gradient is laid over the box of what it fills. `UITextStyle.paintBox`
  (`UITextPaintBox`) lays it over each line or over the whole text.
- Several outlines and several shadows per text style. A shadow without an offset is a glow.
- `UITextOptions.lineBox` and `UIText.lineBox`, of type `UITextLineBox`. With `FONT` the height
  of a line comes from the ascent and descent of its font, so texts of one font aligned by an edge
  share the baseline.
- `UILayer.pixelDensity`, screen pixels per world unit as of the last render.
- `contentAspect` and `signalContentAspectChanged` on `UIText` and `UIImage`, described by
  `UIContentAspectElement`.
- `UIGraphics.drawRoundedRect` and `UIGraphics.drawPolygon`, a stroke on every shape, and
  gradient fills. `clear` fills with a color or a gradient.
- `applied` on the built-in constraints, those derived from `UISingleParameterConstraint`. It
  tells whether the solver applies the constraint.
- `zIndex` in the options of every element and of `UIEmitter`.
- `UIColor.lerp` and `UIColor.lerpColors`, interpolating RGBA in sRGB.
- `UISceneOptions.samples` and `UIScene.samples`, multisample antialiasing of the render target.
  Ignored on WebGL1.

### Fixed

- A texture whose image or video is not loaded yet measures as the default size instead of 0, so
  a `UIImage` created from it gets a valid size and aspect.
- `UIText.autoPadding` reads false as soon as the padding is changed through `UIText.padding`.
  Before, it read true until the next style change.

## 0.28.0 - 2026-11-18

### Changed

- **Breaking:** a mouse released over an element stays over it. The element no longer fires
  `signalPointerLeft` after the release and fires it when the mouse moves off. Hover effects stay
  on after a click. A touch or a pen leaves on release as before. Code that reset press visuals on
  `signalPointerLeft` should use `signalPointerClicked` and `signalPointerCancelled`.
- **Breaking:** `UIEmitter.play` takes a non-negative rate and checks its options. A negative rate,
  which emitted nothing, throws.
- Continuous particle emission spreads the particles of a frame over it. Each one starts aged by
  the part of the frame after its moment, so a stream stays even at any frame rate. Before, the
  particles of a frame were spawned together at age 0.

### Added

- `UIEmitterOptions.blendMode` and `UIEmitter.blendMode`. With `UIBlendMode.ADDITIVE` the particles
  add their light to what is drawn under them, as elements do.
- `UIEmitterOptions.space` and `UIEmitter.space`, of type `UIEmitterSpace`. In `WORLD` space a
  particle stays where it was spawned on the layer when the emitter moves, and a moving emitter
  leaves an unbroken trail, as each particle starts where the emitter was at its moment within the
  frame. Particle positions and the points of behavior modules, such as the center of
  `UIBehaviorPointGravity`, are then layer coordinates. Spawn modules write positions relative to
  the emitter in both spaces. Changing the space keeps live particles in place.
- `UISpawnCircle` spawns particles in a circle, a ring or a sector, uniformly by area. With
  `UICircleDistribution.EVEN` the particles of one spawn call, such as one burst, are evenly spaced
  along the arc.
- `UISpawnRadialVelocity` sets the velocity along the direction from a center to the spawn
  position. It reads the position, so it goes after the shape module.
- `UIRenderingFlipbook` draws frames of a sprite sheet, a grid of cells in one texture or atlas
  region. `UIFlipbookMode` plays them over the particle's life, at a frame rate with an optional
  random start, or picks one at random. The frame count costs no uniforms.
- `UIRenderingShape` draws a circle, a ring or a four-point sparkle (`UIParticleShape`) with a soft
  edge, without a texture. Color modules tint it.
- `UIEasing` and the `easing` of `UIBehaviorScaleOverLife`, applied within each span between two
  anchors.
- `UIBehaviorAlignToVelocity` turns particles along their velocity and stretches them with speed,
  for sparks and streaks. It derives the length from the Y scale, so it goes after the scale
  modules.
- `UIBehaviorOrbit` rotates the position and the velocity of particles around a center at an
  angular speed. Particles at rest circle it, particles moving outward spiral.
- `UIBehaviorBounce` keeps particles on one side of a line, as a floor or a wall, with restitution
  and friction.
- `UIRenderingRandomColor` colors each particle with a color picked from a palette.
- `UIEmitter.prewarm(duration)` runs the simulation ahead without drawing, so an emission shows its
  particles in full from the first frame.
- The source of a particle rendering module can read `PARTICLE_RANDOM`, a random value of the
  module's own, constant over the particle's life. Each module that reads it gets the next of
  `PARTICLE_RANDOM_A`-`E` in module order, so two modules do not pick alike, as two flipbooks in
  one emitter would. Up to five modules of an emitter can read it, more throw.
- `UIBehaviorSeek` steers particles into a target point at the end of their life, keeping their
  initial motion and curving into it, as coins flying into a counter.
- `UIEmitter.signalParticleDied` fires for every particle that dies, with its position in layer
  coordinates, and `UIEmitter.burstAt(count, x, y)` spawns particles at a point. Together they
  chain emitters, as sparks where a coin lands.
- `UIEmitterPlayOptions` take `ratePerDistance`, particles per unit the emitter moves, for trails
  of even density at any speed, and `burstCount` with `burstInterval` for repeated bursts. The
  rate of `play` may be 0 for an emission of bursts or distance only.

### Fixed

- `UIText` with an empty or whitespace-only text no longer throws. Such text keeps the element at
  least 1 world unit wide and high.
- **Breaking:** `UIProgressMaskFunctionCircular.startAngle` is in radians from the right edge,
  counter-clockwise, so `Math.PI / 2` starts the fill at the top. Before, the shader read the value
  as turns from the left edge. A start angle chosen to work around this must be set again.

## 0.27.1 - 2026-11-16

### Changed

- The `three` peer range is `>=0.157.0 <0.188.0`, up from `<0.180.0`. The library typechecks
  against the typings of every version in the range.
- The `ferrsign` peer is `^0.0.6`, up from `^0.0.4`. The `on` and `once` of laymur's signals return
  a function that unsubscribes the callback. Code that uses ferrsign itself follows its
  [changelog](https://github.com/jango-git/ferrsign/blob/main/CHANGELOG.md) from 0.0.5 on.

### Fixed

- Debug lines (`UIHorizontalDistanceDebug`, `UIVerticalDistanceDebug`, the interpolation, width,
  height and aspect debugs) draw on three.js before 0.171. Before 0.170 the line was missing and
  only its ticks were drawn. On 0.170 the debug threw on its first frame.
- Debug lines take their pixel width from the current viewport, as three.js 0.165 and later do,
  instead of the whole drawing buffer. On earlier versions lines in a layer smaller than the
  canvas were thinner than set.

## 0.27.0 - 2026-11-12

### Changed

- **Breaking:** `UIViewportLayer` replaces `UIFullscreenLayer`, and `UIViewportLayerOptions` and
  `UIViewportLayerInputEventData` replace the `UIFullscreenLayer*` types. The layer covers the
  part of the page given by its `viewport` option, the whole window by default.
- **Breaking:** a pointer pressed on an element is captured by it. Until the pointer is released or
  cancelled, its moves and release go to that element only, wherever they happen.
- Input positions are measured from the viewport, not from the element under the pointer, so an
  HTML element over the canvas no longer shifts them.
- A layer that stops taking input, whose page is hidden or loses focus, or whose viewport loses its
  size, cancels its pressed pointers instead of waiting for releases that may never come. A
  cancelled pointer is ignored until it is released.
- A released or cancelled pointer leaves the element (`signalPointerLeft`), so a touch does not
  stay over it. Elements track each pointer separately.
- While the WebGL context is lost, a layer skips its frames and keeps its pending changes, which
  are drawn once the context is restored. `UIScene` redraws its render target after a restore.
- The OffscreenCanvas and sRGB checks share one temporary WebGL context and release it right away,
  so they no longer use up a slot of the browser's live-context limit.
- **Breaking:** `UIResizePolicy.version` and the protected `markChanged()` replace the public
  `dirty` flag. A custom policy calls `markChanged()` when a parameter changes, and one policy can
  serve several layers.
- **Breaking:** a new particle starts from defaults instead of the values of the particle that last
  used its slot: every property is 0, except scale 1 and lifetime 1 second. Spawn modules set what
  they need on top, and `UISpawnRandomLifetime` no longer resets the age.
- **Breaking:** the uniforms of each particle rendering module are private to it. A module's source
  reads its own uniforms as `p_<name>` and can no longer read those of another module, and uniform
  names must be GLSL identifiers.
- **Breaking:** damping in `UIBehaviorVelocityDamping` and `UIBehaviorTorqueDamping` must be between
  0 and 1, the threshold of `UIBehaviorPointGravity` must be positive, and `UIEmitter.burst` takes
  a non-negative integer. Other values throw.
- Elements compare layout and draw-order versions instead of reading flags cleared every frame, so
  a change is never lost: not while a layer is hidden, nor when it happens during
  `signalRendering` after other elements were updated, as when text resizes itself.
- A touch over overlapping elements leaves the lower ones once an element above catches it, and a
  layer that stops taking input also ends the hover of an idle mouse.
- **Breaking:** every particle module draws its own random values, independent of the other
  modules, also of another instance of the same module, instead of sharing six values per
  particle. Before, for example, the atlas variant picked by `UIRenderingTexture` decided the pull
  of `UIBehaviorPointGravity`. Spawn and behavior modules receive a `randomSalt` argument, take a
  stream per value with `particleRandomStream` and read it with `particleRandom`; the six builtin
  values remain for shaders (`PARTICLE_RANDOM_A`-`F`). Effects keep their ranges but draw
  different particles.
- **Breaking:** the default `scale` of `UIBehaviorVelocityNoise` is 0.005 instead of 100. The noise
  is sampled at the position times scale, and 100 made a noise detail a hundredth of a layer unit:
  particles jittered on new noise every frame, more strongly at lower frame rates, instead of
  drifting through the field.
- An emitter without particles uploads nothing, and a live emitter uploads only its live particles.
  Particle buffers double when they grow.
- The constructors of `UIBehaviorTorqueDamping`, `UIBehaviorTorqueNoise`,
  `UIBehaviorDirectionalGravity` and `UIBehaviorPointGravity` accept the same ranges and vectors as
  their setters.
- `UIConstraint2DBuilder.size` accepts any plane element, such as a `UIDummy`, like the width and
  height constraints do.
- `fast-simplex-noise` is an optional peer dependency, needed only for `laymur/particles`.

### Added

- `UIViewport`, the part of the page a layer covers, with `UIWindowViewport` (the window) and
  `UIElementViewport` (the box of a page element, such as a canvas that does not fill the window).
  A viewport passed to a layer belongs to the caller and can serve several layers.
- `signalPointerClicked`, `signalPointerDragged` and `signalPointerCancelled` on elements. Every
  press an element catches ends with exactly one click or cancel.
- `UIViewportLayer.signalPointerCancelled`.
- `UILayer.signalContextLost` and `signalContextRestored`.
- `UIEmitterOptions.maxDeltaTime` and `UIEmitter.maxDeltaTime`, the longest frame step in seconds
  (0.1 by default). A longer frame, such as one after a hidden tab, is clamped, so it no longer
  spawns a burst of the whole gap or makes particles jump.
- Getters for the `show*` toggles of `UILayerDebug`.
- `UIEmitterOptions.seed` and `UIEmitter.seed`. Emitters with one seed and one sequence of spawns
  produce the same particles; setting the seed restarts its sequence. Random by default.
- The README describes the development checks: they run unless `process.env.NODE_ENV` is
  `"production"`, which a bundler sets and then strips them, and how to define it without one.
- `UIElement.consumeLayoutChange()`, for custom elements whose content depends on their size: it
  tells whether the layout changed since the last call, so the size is read only then.
- `particleRandomStream` and `particleRandom`, the per-module random values of a particle for
  custom spawn and behavior modules.

### Fixed

- `UIHorizontalInterpolationConstraint` and `UIVerticalInterpolationConstraint` use the `anchorB`
  option. Before, B took the anchor of A until `anchorB` was set.
- Setting a texture config applies a frame that differs from the current one only in position,
  and a new atlas texture updates the UV transform.
- A handler that turns input off during a press no longer leaves the pointer captured with neither
  a click nor a cancel.
- Destroying an element during a press it holds ends the press with `signalPointerCancelled`.
- An element made visible and then interactive in one frame is shown.
- Element constructors no longer write default sizes into the options object passed to them, so
  one options object can serve several elements.
- The atlas trim of `UIImage`, `UIProgress` and `UIAnimatedImage` stretches with the element, so a
  trimmed sprite drawn at another size keeps its proportions.
- Elements created during `signalRendering` no longer throw a duplicate depth error, and are not
  drawn until they are placed on the next frame.
- `UIScene` resizes its render target on the next frame that renders it, in every update mode.
- `UIProgress` updates its texture resolution when the texture changes size, even if constraints
  already hold the element at that size.
- Replacing `UIAnimatedImage.sequence` resizes the element to the new first frame, and an empty
  sequence throws.
- `UITextureView.trimmedWidth` and `trimmedHeight` are no longer swapped for rotated frames.
- `UIColor.getHexRGBA` and `getHexStringRGBA` are correct for a red of 128 or more.
- `UITextStyle.shadowOffsetX` and `shadowOffsetY` accept negative values, as the constructor does.
- `signalResized` reports the new `orientation`.
- `UIElementViewport` follows size changes made by CSS transforms.
- The `laymur/debug` overlays of constraints created after `UILayerDebug` show in the current
  orientation, and destroying an overlay frees its materials.
- Changing a solver variable's priority to or from P0 keeps its value instead of throwing or
  pulling it to 0.
- `mode: UIMode.HIDDEN` given to the `UIEmitter` constructor hides the particles.
- Two particle rendering modules of one type, such as two `UIRenderingTexture` or two
  `UIRenderingColorOverLife`, each draw with their own texture or gradient. Two
  `UIRenderingColorOverVelocity` modules compile.
- `UIRenderingColorOverLife` and `UIRenderingColorOverVelocity` reach the first and last colors at
  the ends of their range instead of half a texel inside it, and small `maxVelocity` values are no
  longer rounded to zero.
- `play(rate, { duration })` emits the particles due within the duration, including those of the
  frame that ends it.
- GPU buffers replaced when an emitter grows are freed.
- The particle example in the README renders visible particles.

## 0.26.0 - 2026-11-07

### Changed

- **Breaking:** input hit-testing follows micro transforms by default, so a moved, rotated or
  scaled element is hit where it is drawn. Set `micro.affectsInput = false` to keep the hit area on
  the layout rectangle.
- Varyings are packed into as few vec4 rows as possible, so busier element shaders fit the
  device's varying budget. A shader that still exceeds it throws instead of silently not drawing.

### Added

- `UIMask`, an analytic mask that follows the rectangle of an element or a layer. Assign it to an
  element's `mask`. It supports `RECTANGLE` (with `radius`) and `ELLIPSE` shapes (`UIMaskShape`),
  plus `softness`, `padding`, `inverted` and `useMicro`. One mask can serve many elements of a
  layer, and masked elements still batch together.
- With `clipInput` (on by default), the masked-out part of an element stops catching input.
  `UIMask.containsPoint` tests a point against the visible part.
- A mask is destroyed with its source, and a destroyed mask is taken off every element it masked.
  `UILayer.maskRegistry` lists the masks of a layer.
- `UIMaskMaterialPatch` applies a `UIMask` to three.js materials laymur does not build, such as a
  Spine skeleton's or a custom object's placed among the planes.
- `UIMicro.affectsInput`.
- `UIDummy.computeVisualTransform`, the transform of the element rectangle as drawn.
- `UIAffineMatrix3`, a `Matrix3` property passed to the shader as its six meaningful elements.
  Texture transforms use it, which saves a vertex attribute and a varying row.
- Extension points are exported for custom elements and modules: `UIElement`, `UIArea`,
  `UIResizePolicy`, `UIProgressMaskFunction`, `UISpawnModule`, `UIRenderingModule` and
  `UIBehaviorModule`. Their abstract members are declared in the typings.
- Exports for `UIInsets`, `UITextSpan`, `UITextStyle` and `UITextureView`.
- Type exports for every options interface (`UI*Options`), and for `UIColorConfig`,
  `UITextureConfig`, `UITextContent`, `UITextAlign`, `UIProperty`, `UIPlaneElement`,
  `UISceneWrapperView` and others.
- `laymur/debug` exports the `UIConstraintDebug` and `UILayerDebugOptions` types.

## 0.25.2 - 2026-11-06

### Added

- `UILayer.sceneWrapper` is public, so elements built outside laymur can place their own objects
  among the planes.
- Exports for `computeTransformMatrix`, `isUIModeVisible` and `isUIModeInteractive`, and for the
  `UIAnchorOptions`, `UIDummyOptions` and `UIMicroConfig` types.

## 0.25.1 - 2026-10-26

### Changed

- Per-instance plane and particle data is packed into as few vertex attributes as possible, so
  elements with more properties fit the 16 attribute locations most devices offer.
- A shader that still exceeds the device's `MAX_VERTEX_ATTRIBS` throws instead of silently not
  drawing.

## 0.25.0 - 2026-10-16

0.24.0 was not published; its changes are included here.

### Changed

- **Breaking:** the package is compiled with `tsc` instead of being bundled with rollup. `dist`
  mirrors the source modules, `main` points to `./dist/core/index.js`, and `./package.json` is
  exported. Private member names are no longer minified.
- **Breaking:** the `three/addons` line classes and `fast-simplex-noise` are imported from the
  installed packages instead of being bundled into `dist`. `fast-simplex-noise` must be installed
  when `laymur/particles` is used.
- **Breaking:** destroying an element also destroys every constraint that refers to it, instead of
  throwing.
- **Breaking:** changing a property of a destroyed element or constraint throws.
- **Breaking:** `zIndex` reads back the value it was set to, not a normalized position. Elements
  with equal `zIndex` keep their creation order, the later one on top.
- **Breaking:** subclasses of elements and constraints override `destroyInternal()` instead of
  `destroy()`.
- Particle emitters are drawn between element planes by `zIndex`, on the same scale as other
  elements.
- `UIText` breaks lines like a browser:
  - A space never wraps to the next line by itself, and spaces at the end of a line do not count
    toward its width.
  - A wrapped line does not start with a space.
  - No-break spaces never break.
  - Two newlines in a row leave an empty line.
- `UIText` padding follows the stroke and shadow of its styles until it is set by hand. The new
  `autoPadding` flag controls this.
- Span styles are measured with the stroke and shadow inherited from the common style, and only
  half of the stroke width counts as padding.
- Error messages name the offending value or index.

### Added

- `UILayer.destroy()` destroys all elements, constraints and GPU resources of a layer.
  `UIFullscreenLayer.destroy()` uses it.
- `destroyed` on elements, constraints and layers, and `UILayer.elementRegistry`.
- `UIConstraint` is exported.
- `UIBehaviorScaleOscillation` (`laymur/particles`) oscillates particle scale along one axis, like a
  turning paper piece.
- `UITextStyle.calculatePadding(style)` (static) and a `fallback` argument for `calculatePadding`.

### Fixed

- `UIText` no longer clips glyphs that reach past their advance, such as italics.
- Destroying an emitter frees its particle mesh and input catcher.
- Destroying elements inside a pointer handler no longer breaks event dispatch.
- Texture sizes are read correctly from video, canvas, bitmap and `DataTexture` images.
- Particles with negative (mirrored) scale are drawn.
- `UICustomConstraint` rejects expressions that use variables of destroyed elements.

## 0.23.0 - 2026-07-25

### Changed

- **Breaking:** `UITextureView.signalDimensionsChanged` replaces the misspelled
  `signalDiminsionsChanged`.

### Fixed

- Reading `mode` on an element returns its mode instead of `undefined`.
- `UIProgress` stops listening to its texture when destroyed.
- `UIProgressMaskFunctionDirectional` normalizes its direction correctly.
- Rebuilding the solver after a rejected constraint skips that constraint instead of throwing again
  and leaving the layout half built.

## 0.22.0 - 2026-07-23

### Added

- Right-to-left and bidirectional text in `UIText`. The `direction` option (`UITextDirection`:
  `AUTO`, `LTR`, `RTL`) sets the base direction, and `AUTO` detects it from the content.
- Text alignment accepts `"start"` and `"end"`, resolved against the text direction
  (`UITextAlign`). `"start"` is the new default.

### Fixed

- `UIText` places lines by their ascent and descent, so the text box runs exactly from the top of
  the first line to the bottom of the last.
- `UIText` resizes its canvas when its size changes.

## 0.21.1 - 2026-07-22

### Fixed

- `UIScene` restores the renderer's render target and clear color after rendering into its
  texture.

## 0.21.0 - 2026-06-10

### Changed

- `fast-simplex-noise` is a new peer dependency. The particle noise behaviors use simplex noise
  instead of a hash.

### Added

- `hue`, `saturation` and `lightness` on every element, applied in the shader.
- `blendMode` on every element. `UIBlendMode.ADDITIVE` blends additively and only affects `BLEND`
  transparency.

### Fixed

- Destroying an element updates the input order of the remaining elements.

## 0.20.0 - 2026-04-24

### Changed

- **Breaking:** `UIRenderingTexture` replaces `UITextureRenderingModule` (`laymur/particles`).

### Added

- `UIRenderingTexture` accepts an array of texture configs from one atlas. Each particle picks one
  of them at random.

## 0.19.3 - 2026-04-21

### Fixed

- `UIProgress` accepts any `UITextureConfig` as its texture, not only a `Texture`.

## 0.19.2 - 2026-04-03

### Fixed

- `UIGraphics.drawPolyline` accepts any `UIColorConfig` as its color.

## 0.19.1 - 2026-03-31

### Fixed

- `UIColor.setHexRGBA` reads `0xRRGGBBAA` instead of treating the top byte as alpha.

## 0.19.0 - 2026-03-26

### Changed

- **Breaking:** `UIPlaneElement` requires `oppositeX`, `oppositeY`, `centerX` and `centerY`.

### Added

- The `laymur/debug` entry, with overlays that draw constraints on top of a layer: `UILayerDebug`,
  `UIAspectDebug`, `UIWidthDebug`, `UIHeightDebug`, `UIHorizontalDistanceDebug`,
  `UIVerticalDistanceDebug`, `UIHorizontalInterpolationDebug` and `UIVerticalInterpolationDebug`.
- `UILayer.constraintRegistry`, `signalConstraintAdded` and `signalConstraintRemoved`.
- `UIConstraint.destroy()`, which removes the constraint from its layer.
- `oppositeX`, `oppositeY`, `centerX` and `centerY` on `UILayer`.
- The elements a built-in constraint refers to are public read-only fields (`element`, or `a`, `b`,
  `c`).

## 0.18.1 - 2026-03-20

### Changed

- `BLEND` elements render with premultiplied alpha.
- Pixels with alpha up to 0.0075 are discarded.

## 0.18.0 - 2026-03-02

### Changed

- **Breaking:** `UITransparencyMode.CLIP` is removed, and the remaining values are renumbered
  (`HASH = 0`, `BLEND = 1`).
- Every element discards nearly transparent pixels, in any transparency mode.
- Planes no longer read or write the depth buffer. Draw order alone decides what is on top.

## 0.17.8 - 2026-02-26

### Added

- The `UIFullscreenLayerInputEventData` type is exported.

## 0.17.7 - 2026-02-12

### Added

- `UIMicro.setUnifiedScale(scale)` and `UIMicro.setUnifiedAnchor(anchor)` set X and Y to the same
  value in one call.

## 0.17.6 - 2026-02-11

### Added

- The `UIInputEventData` type is exported.

## 0.17.5 - 2026-02-11

### Fixed

- Elements with a negative micro scale stay visible. Planes render double-sided, so a mirrored
  element is no longer culled.

## 0.17.4 - 2026-01-31

### Fixed

- `UILayer.signalResized` fires when the layer is resized. In 0.17.3 it was never emitted.

## 0.17.3 - 2026-01-31

### Added

- `UILayer.signalResized`, with the new width, the new height and the layer.

## 0.17.2 - 2026-01-31

### Fixed

- `UIText` passes its options on to the element. Before, options such as position, size, mode,
  `zIndex` and `micro` were ignored for text.

## 0.17.1 - 2026-01-29

### Fixed

- The package includes its built `dist` again. 0.17.0 was published without it.

## 0.17.0 - 2026-01-29

Published without `dist`; use 0.17.1.

### Changed

- **Breaking:** the package is an ES module only (`"type": "module"`). The `require` entry, the
  minified bundle and the `development`/`production` export conditions are gone. `dist` ships one
  module per source file instead of a single bundle.
- **Breaking:** `@lume/kiwi` and `ferrsign` are peer dependencies instead of dependencies, so they
  must be installed next to `three`.

### Added

- A particle system in the new `laymur/particles` entry. `UIEmitter` is a layer anchor that spawns,
  updates and draws particles with `burst(count)`, `play(rate, { duration })`, `stop()` and
  `clear()`. Its behavior comes from module sequences:
  - spawn: `UISpawnOffset`, `UISpawnRectangle`, `UISpawnRandomLifetime`, `UISpawnRandomRotation`,
    `UISpawnRandomScale`, `UISpawnRandomTorque`, `UISpawnRandomVelocity`;
  - behavior: `UIBehaviorDirectionalGravity`, `UIBehaviorPointGravity`, `UIBehaviorScaleOverLife`,
    `UIBehaviorTorqueDamping`, `UIBehaviorTorqueNoise`, `UIBehaviorVelocityDamping`,
    `UIBehaviorVelocityNoise`;
  - rendering: `UITextureRenderingModule`, `UIRenderingColorOverLife`,
    `UIRenderingColorOverVelocity`.
- `UIAnchor` and every element accept a `name` option.

## 0.16.0 - 2026-01-24

### Changed

- **Breaking:** `UIDummy` replaces `UIInputDummy`, and `UIDummyOptions` replaces
  `UIInputDummyOptions`.
- **Breaking:** the input signals are renamed to `signalPointerPressed`, `signalPointerMoved`,
  `signalPointerReleased`, `signalPointerEntered` and `signalPointerLeft`, on both `UIDummy` and
  `UIFullscreenLayer`.

### Added

- `UILayer` is exported.

## 0.15.1 - 2026-01-24

### Fixed

- Elements update again when their layer renders. In 0.15.0 the render callback ran without its
  `this`.

## 0.15.0 - 2026-01-24

### Changed

- **Breaking:** signals from `ferrsign` replace `eventail` events. Layers, elements and texture
  views no longer extend `Eventail` and have no `on`/`off`/`emit`. Each event is a signal property:
  - `UILayer`: `signalOrientationChanged`, `signalModeChanged`, `signalRendering`;
  - `UIFullscreenLayer`: `signalPressed`, `signalMoved`, `signalReleased`, with a
    `UIFullscreenLayerInputEventData` payload;
  - `UIInputDummy` and the elements: `signalPressed`, `signalMoved`, `signalReleased`,
    `signalEntered`, `signalLeft`, with a `UIInputEventData` payload;
  - `UIAnimatedImage`: `signalPlayed`, `signalPaused`, `signalStopped`;
  - `UITextureView`: `signalDiminsionsChanged`.
- The `ferrsign` dependency replaces `eventail`.

### Removed

- **Breaking:** the `UIInputEvent`, `UILayerEvent`, `UIAnimatedImageEvent` and
  `UITextureViewEvent` enums.

## 0.14.2 - 2026-01-23

### Changed

- Elements draw in `zIndex` order. Elements that share a shader are batched only where batching
  keeps that order. Plane changes are applied once per render instead of on every call.
- The build targets ES2020 again, without the Babel pass for older browsers.

## 0.14.1 - 2026-01-16

### Changed

- The OffscreenCanvas and sRGB support checks run the first time they are needed, not when the
  module is imported. The capability log on import is gone.

## 0.14.0 - 2026-01-16

### Changed

- The `three` peer range widens to `>=0.157.0 <0.180.0`, down from `>=0.175.0`.
- Text and graphics use `OffscreenCanvas` only when it works as a WebGL texture source, and fall
  back to an HTML canvas otherwise.
- Canvas textures use clamp-to-edge wrapping and linear filtering without mipmaps, so
  non-power-of-two canvases work on WebGL1.

## 0.13.8 - 2026-01-16

### Changed

- Text and graphics always draw to an HTML canvas. The `OffscreenCanvas` path is disabled.

## 0.13.7 - 2026-01-15

### Fixed

- Colors are correct on WebGL1 without `EXT_sRGB`. Textures are uploaded without an sRGB color
  space there and decoded in the shader.

## 0.13.6 - 2026-01-14

### Fixed

- The minified bundle mangles only the library's own private properties, not every
  underscore-prefixed name.

## 0.13.5 - 2026-01-14

### Changed

- The build is transpiled with Babel for iOS 13 and uses assignment semantics for class fields.
- `eventail` is updated to `^0.2.12`.

## 0.13.4 - 2026-01-14

### Changed

- The build targets ES2015 instead of ES2020.
- `eventail` is updated to `^0.2.11`.

## 0.13.3 - 2026-01-14

### Fixed

- `UIText` and `UIGraphics` fall back to an HTML canvas where `OffscreenCanvas` is not available.

## 0.13.2 - 2026-01-12

### Fixed

- `UIGraphics` passes a 3×3 texture transform to its shader, like the other textured elements.

## 0.13.1 - 2026-01-12

### Fixed

- `UIText` redraws when only its color changes.

## 0.13.0 - 2025-12-31

### Changed

- **Breaking:** `UIAnimatedImageLoopMode` replaces `UILoopMode`.
- **Breaking:** `UISceneUpdateMode.EVERY_FRAME` replaces `UISceneUpdateMode.EACH_FRAME`.
- **Breaking:** `UIColor.set(r, g, b)` without an alpha sets alpha to 1. The new
  `setRGBA(r, g, b, a?)` keeps the current alpha.
- `UIColor.set` accepts every form the constructor does: nothing (white), RGB(A) components, a
  color name, a three `Color`, a hex number, a hex string or another `UIColor`.
- `color`, `padding`, `sliceBorders`, `sliceRegions`, `maskFunction` and `UIScene.clearColor` are
  settable. Assigning a color or insets config copies it into the existing object.
- `UIGraphics.clear`, `drawRect`, `drawCircle` and `drawArc` take any color config instead of only
  a `UIColor`.
- The element `micro` option takes a partial config.

### Added

- Insets configs accept `[left, right, top, bottom]` and `[horizontal, vertical]` tuples, and
  `UIInsets.set(config)` takes any insets config.
- `UIFullscreenLayer.projectWorldPosition` and `projectLayerPosition` take an optional `result`
  vector to write into.

## 0.12.0 - 2025-12-23

### Changed

- **Breaking:** `UIFullscreenLayer` takes an options object (`resizePolicy`, `mode`, `name`)
  instead of positional arguments.
- **Breaking:** `UIAnimatedImage` replaces `loop` with `loopMode` (`UILoopMode.NONE`, `LOOP`,
  `PING_PONG`).

### Added

- `UIAnimatedImage.timeScale`, a playback speed multiplier. A negative value plays the animation
  backwards.
- Constraints accept a `name` option.

### Fixed

- `UINineSlice` recalculates its slice borders when its texture's dimensions change, and stops
  listening to the texture when destroyed.

## 0.11.5 - 2025-12-23

### Changed

- `UIColor` clamps its components to 0-1 and the hue to 0-360. In the development build it rejects
  non-finite values.
- `UIExpression` checks its coefficients in the development build. `divide(0)` throws.
- Constraint argument checks run only in the development build (`index.js`).

### Added

- `UIHorizontalInterpolationConstraint` and `UIVerticalInterpolationConstraint` place element C
  between A and B by the factor `t` (0 puts it at A, 1 at B), with an anchor for each element.
- `UIConstraint2DBuilder.interpolation(a, b, c, options)` builds both interpolation constraints.
- `UIConstraint2DBuilder` options take a single value or an `[h, v]` tuple as well as `{ h, v }`.

### Fixed

- `package.json` `exports` puts `types` inside the `import` and `require` conditions, so
  TypeScript finds the typings under either condition.

## 0.11.4 - 2025-12-22

### Changed

- **Breaking:** `UIInputDummy` replaces `UIDummy`.
- **Breaking:** `UIInsets` replaces `UIPadding` as the type of `UIText.padding` and
  `UINineSlice.sliceBorders` / `sliceRegions`. Their config type is `UIInsetsConfig`.
- **Breaking:** `UITextureView.dirty` splits into `textureDirty`, `uvTransformDirty` and
  `trimDirty`. `UITextureView.reset()` is removed.
- `UIImage`, `UIGraphics`, `UIProgress` and `UIAnimatedImage` send only the shader properties that
  changed since the last frame.

### Fixed

- `UIText` and `UIGraphics` canvas textures are marked sRGB, so their colors match other elements
  now that colors are linearized.

## 0.11.3 - 2025-12-17

### Fixed

- An element created with a mode that is not visible, such as `mode: UIMode.HIDDEN`, starts
  hidden.

## 0.11.2 - 2025-12-17

### Added

- `UIResizePolicyCover` and `UIResizePolicyFit` scale the layer to a target rect (`rectWidth`,
  `rectHeight`) and keep its proportions.

## 0.11.1 - 2025-12-17

### Fixed

- `UIGraphics` sizes its canvas from the `height` option, not from `width`.

## 0.11.0 - 2025-12-17

### Changed

- **Breaking:** the package entry exports named symbols instead of re-exporting every module. Base
  classes, option interfaces and helper types are no longer importable (see Removed).
- **Breaking:** `UIInputEvent` members are `PRESSED`, `MOVED`, `RELEASED`, `ENTERED` and `LEFT`
  (were `DOWN`, `MOVE`, `UP`, `ENTER`, `LEAVE`). The string values are unchanged.
- **Breaking:** `UIAnchor` takes an options object `{ x, y }` instead of positional `x, y`.
- **Breaking:** `UIDummy` receives pointer input. It has `mode`, `zIndex`, `interactionArea` and
  the input events, and `UIElement` extends it.
- **Breaking:** `UIElement.transparencyMode` replaces `UIElement.transparency`. Every element
  accepts `transparencyMode` and `micro` options.
- **Breaking:** `UIColor` no longer emits events (`UIColorEvent` is removed). Elements check colors
  for changes every frame. Element `color` properties are read-only `UIColor` instances, changed in
  place. Color options take a `UIColorConfig` (`UIColor`, three `Color`, hex number or string).
- **Breaking:** `UIMicro` no longer emits events and loses `size`. Its constructor takes a config.
- **Breaking:** `UIImage`, `UIAnimatedImage` and `UINineSlice` take a `UITextureConfig`, which is a
  `Texture` or a texture-atlas frame (`frame`, `rotated`, `spriteSourceSize`, `sourceSize`,
  `scale`). Their `texture` is a read-only `UITextureView`.
- **Breaking:** `UIAnimatedImage` takes an array of `UITextureConfig` frames instead of
  `{ texture, transforms }` or `Texture[]`. Its `sequence` can be replaced. Playback advances with
  the layer's frame time instead of a timer. Events are `PLAYED`, `PAUSED` and `STOPPED`, and a new
  `playByDefault` option starts playback on creation.
- **Breaking:** `UIGraphics` draws with `drawRect`, `drawCircle`, `drawArc` and `drawPolyline`,
  which take a color argument. The path API (`rect`, `fillRect`, `strokeRect`, `circle`,
  `beginPath`, `moveTo`, `lineTo`, `fill`, `stroke`, `set*Style`, `setLineWidth`) is removed.
- **Breaking:** `UIProgress` takes `texture` and a mask-function object
  (`UIProgressMaskFunctionDirectional` or `UIProgressMaskFunctionCircular`) instead of the
  `UIProgressMaskFunction` GLSL enum. `backgroundTexture`, `foregroundColor`, `backgroundColor` and
  `inverseDirection` are removed.
- **Breaking:** `UINineSlice` exposes `sliceBorders` (texture fractions) and `sliceRegions`
  (on-screen size) as insets, interpreted by `regionMode` (`UINineSliceRegionMode.WORLD` by
  default, or `NORMALIZED`). The `sliceBorderLeft`/`Right`/`Top`/`Bottom` accessors and
  `setSliceBorders` are removed.
- **Breaking:** `UIScene.clearColor` is a `UIColor` and `clearAlpha` is removed. `requestUpdate()`
  replaces `requestRender()`. `UISceneUpdateMode` members are `EACH_FRAME`, `EVERY_SECOND_FRAME`,
  `ON_PROPERTIES_CHANGE`, `ON_DIMENSIONS_CHANGE` (new) and `MANUAL`, with renumbered values.
- **Breaking:** `UIText.maxLineWidth` replaces `maxWidth`. `color`, `padding` and `commonStyle` are
  read-only objects edited in place. `content` returns `UITextSpan` objects whose `text` and
  `style` can be edited. The text-style field `strokeThickness` replaces `strokeWidth`.
- **Breaking:** `UIResizePolicy` no longer emits events. `calculateScale` is public.
  `UIResizePolicyFixedWidth` and `UIResizePolicyFixedHeight` lose their square-aspect parameters.
- **Breaking:** the layer `mode` accepts only `HIDDEN`, `VISIBLE` or `INTERACTIVE`.
- Elements that share a shader are batched into instanced meshes.
- Number assertions run only in the development build (`index.js`). The production build
  (`index.min.js`) skips them.

### Added

- `UIMode.INTERACTIVE_TRANSPARENT`: the element receives input and passes it on to the elements
  behind it.
- `interactionArea` on input-receiving elements, in normalized element coordinates:
  `UIAreaRectangle` (default, the whole element), `UIAreaRoundedRectangle`, `UIAreaCircle`,
  `UIAreaPolygon`.
- `UITextResizeMode`: `UIText.resizeMode` either scales text to the element size (`SCALE`,
  default) or breaks it into lines (`BREAK`).
- `UIColor` construction from a hex string, another `UIColor` or a `UIColorConfig`.
  `getHexStringRGB`, `getHexStringRGBA`, `setHexString` and `setGLSLColor`.
- `UIFullscreenLayer.buildRay(position, camera, result?)` builds a world ray through a layer point.

### Removed

- From the package exports: `UIElement`, `UILayer`, `UILayerEvent`, `UILayerInputListener`,
  `UIConstraint`, `UIResizePolicy`, `UIResizePolicyEvent`, `UIColorEvent`, `UIMicroEvent`,
  `UIAnimatedImageEvent`, `UIProgressMaskFunction`, `UIGenericInstancedPlane`,
  `UISceneWrapperClientAPI`, `UIPadding`, `UITextSpan`, `UITextStyle`, the `*Options` interfaces
  and the text helpers (`isUITextSpan`, `resolveTextStyle`, `DEFAULT_TEXT_STYLE`,
  `resolveTextPadding`).
- The leftover `UIComposer`, `UIPass` and `UIFullscreenQuad` declarations, which the package entry
  no longer exported.

## 0.10.3 - 2025-12-05

### Fixed

- `UIText` quotes the font family in the canvas font string, so names with spaces render.

## 0.10.2 - 2025-12-02

### Fixed

- `new UIColor()` with no arguments creates white again instead of an invalid color.

## 0.10.1 - 2025-12-02

### Added

- `UIColor` accepts a three `Color` in its constructor. `setThreeColor` and `toThreeColor`.

## 0.10.0 - 2025-12-02

### Changed

- **Breaking:** `UIColor.setColorName` replaces `setName`.

### Added

- `UIColor.hue`, `saturation` and `lightness` accessors.
- Static named colors on `UIColor`, such as `UIColor.red` and `UIColor.gold`, one for each
  supported color name.
- `UIColor.toGLSLColor(result?)` returns the linear RGBA color as a `Vector4`.

### Fixed

- An element's initial color is linearized too, not only later color changes.

### Removed

- `UIColor.getHSL()`. Use the `hue`, `saturation` and `lightness` accessors.

## 0.9.0 - 2025-12-02

### Changed

- **Breaking:** `UIFullscreenLayer.projectWorldPosition` returns a `Vector3` again. Its `z` holds
  the NDC depth.
- `projectLayerPosition` returns a new vector on each call instead of a shared one.

## 0.8.1 - 2025-12-02

### Changed

- Colors are converted from sRGB to linear before they reach element shaders.

## 0.8.0 - 2025-12-01

0.7.x was not published.

### Changed

- **Breaking:** `UIFullscreenLayer.projectWorldPosition` returns a `Vector2` and no longer modifies
  the input position.
- `UIColor` emits `CHANGE` only when a value actually changes.
- `UIFullscreenLayer` emits its own input event before it dispatches the pointer to elements.

### Added

- `UIFullscreenLayer.projectLayerPosition(position, camera, z = -1)` turns a layer point into a
  world position.

### Fixed

- `UIColor.copy` applies colors that differ in only some components.
- Shader sources and uniforms are no longer logged to the console.

## 0.6.2 - 2025-11-27

### Changed

- `UIFullscreenLayer` emits input events only in `UIMode.INTERACTIVE`.
- `UIColor` component storage (`rInternal`, …) is private.

## 0.6.1 - 2025-11-27

### Added

- `UIFullscreenLayer` emits `UIInputEvent.DOWN`, `MOVE` and `UP` with `(x, y, pointerId)` in layer
  coordinates.

## 0.6.0 - 2025-11-27

### Changed

- **Breaking:** input event listeners receive the pointer id. The arguments are
  `(x, y, identifier, element)`.
- `UIGraphicsOptions` and `UIProgressOptions` are passed as `Partial`, like the other options.

### Added

- A `mode` option on `UIGraphics`, `UIImage`, `UINineSlice`, `UIProgress`, `UIScene` and `UIText`.

## 0.5.0 - 2025-11-27

### Changed

- `UIAnchor` and `UIDummy` are no longer abstract and can be created directly.

## 0.4.0 - 2025-11-27

### Changed

- **Breaking:** `UIInputEvent` uses DOM pointer names. `ENTER` and `LEAVE` replace `IN` and `OUT`,
  and the values are `"pointerdown"`, `"pointermove"`, `"pointerup"`, `"pointerenter"` and
  `"pointerleave"`.

### Fixed

- `UIFullscreenLayer.destroy()` removes its `pointermove` and `pointerup` window listeners.

## 0.3.31 - 2025-11-26

### Added

- `UIInputEvent.IN` and `UIInputEvent.OUT`. An element emits them when the pointer enters or leaves
  it.

## 0.3.30 - 2025-11-26

### Changed

- **Breaking:** `UIInputEvent.DOWN`, `UIInputEvent.MOVE` and `UIInputEvent.UP` replace
  `UIInputEvent.CLICK`. `UIFullscreenLayer` listens to `pointerdown`, `pointermove` and
  `pointerup`. `DOWN` keeps the old `"click"` string value.

## 0.3.29 - 2025-11-26

### Changed

- `calculateScaleInternal` on resize policies is protected.

### Added

- `UIResizePolicyFixedWidth` and `UIResizePolicyFixedHeight` take an optional size for near-square
  screens (`fixedWidthSquare` / `fixedHeightSquare`, default: the portrait value) and a
  `squareEpsilon` (default 0.1). A screen counts as square when its aspect ratio is within
  `squareEpsilon` of 1.

## 0.3.28 - 2025-11-26

### Fixed

- Text `align` aligns each line within the widest line of the text, not within `maxWidth`.

## 0.3.27 - 2025-11-26

### Added

- `DEFAULT_TEXT_STYLE` is exported.

### Fixed

- `align` works per line: a line whose spans all share one `align` is offset as a whole, and a line
  with mixed values falls back to `"left"`.

## 0.3.26 - 2025-11-26

### Added

- `UITextStyle.align` (`"left"`, `"center"` or `"right"`, default `"left"`).

## 0.3.25 - 2025-11-26

### Added

- Setters for `UIElement.centerX`, `centerY`, `oppositeX` and `oppositeY`. They move the element so
  that its edge or center lands on the given value.

## 0.3.24 - 2025-11-20

### Changed

- **Breaking:** `UIGraphics.clear`, `setFillStyle` and `setStrokeStyle` take a `UIColor` in place of
  a CSS color string. Gradients and patterns still work.

### Added

- `UIColor.toCSSColor()`.

### Removed

- **Breaking:** `UIGraphics.canvasWidth` and `UIGraphics.canvasHeight`.

## 0.3.23 - 2025-11-20

### Added

- `UIFullscreenLayer` takes an optional initial `mode` as its second constructor argument (default
  `UIMode.VISIBLE`).

## 0.3.22 - 2025-11-20

### Changed

- `UIGraphics` drawing methods return the element, so calls can be chained.

## 0.3.21 - 2025-11-20

### Changed

- `UIFullscreenLayer.resizePolicy` is a getter/setter. Assigning a new policy resizes the layer
  right away. The constructor also takes an optional resize policy.
- Resize policies emit `UIResizePolicyEvent.CHANGE`, and their sizes are getter/setters. Changing a
  size resizes the layer.

## 0.3.19 - 2025-11-20

### Changed

- **Breaking:** `UIFullscreenLayer` takes no constructor arguments. `fixedWidth` and `fixedHeight`
  are replaced by `resizePolicy`.
- **Breaking:** `UIPadding` replaces `UITextPadding`.

### Added

- `UIAnimatedImage`, a frame-sequence image. It takes either an array of textures or one texture
  with an array of UV transforms. It has `frameRate`, `loop`, `duration`, `play`, `pause` and
  `stop`, and emits `UIAnimatedImageEvent.PLAY`, `PAUSE` and `STOP`.
- `UIGraphics`, an element backed by a 2D canvas. It offers `clear`, `rect`, `fillRect`,
  `strokeRect`, `circle`, path methods, and fill, stroke and line-width setters.
- Resize policies for `UIFullscreenLayer.resizePolicy`: `UIResizePolicyNone`,
  `UIResizePolicyFixedWidth`, `UIResizePolicyFixedHeight`, `UIResizePolicyCross` and
  `UIResizePolicyCrossInverted`. Each one takes separate landscape and portrait sizes.
- `UIMicro` emits `UIMicroEvent.CHANGE` and has `copy()`.

## 0.3.16 - 2025-11-14

### Added

- `width` and `height` options for `UIImage`. Without them, the image uses the texture's size as
  before.

## 0.3.15 - 2025-11-14

### Fixed

- Assigning `UIImage.texture` also applies the new texture's UV transform.

## 0.3.11 - 0.3.14 - 2025-11-14

### Added

- `UIImage` samples its texture through `texture.matrix`, so the texture's `offset`, `repeat`,
  `rotation` and `center` apply (after `texture.updateMatrix()`).

### Fixed

- 0.3.14 fixes the default shader of `UIImage`, `UIScene` and `UIText`. In 0.3.11 to 0.3.13 it
  declared `uvTransform` twice or left it out, so those elements could fail to compile.

## 0.3.10 - 2025-11-06

### Added

- `UIElement.centerX`, `centerY`, `oppositeX` and `oppositeY` getters. The opposite values are the
  right and top edges.

## 0.3.9 - 2025-11-04

### Changed

- Elements default to `UITransparencyMode.BLEND` (was `CLIP`).

## 0.3.8 - 2025-10-10

### Added

- `UIFullscreenLayer.projectWorldPosition(position, camera)` maps a 3D world position to layer
  coordinates. It modifies and returns the given vector.

## 0.3.7 - 2025-09-30

### Fixed

- `UIText` binds its new texture after a content change. In 0.3.6, changed text was not shown.

## 0.3.6 - 2025-09-30

### Fixed

- `UIText` creates a new texture when its content changes, so a resized canvas uploads correctly.

## 0.3.5 - 2025-09-30

### Changed

- **Breaking:** `UIProgressMaskFunction.CIRCLE_LEFT` replaces `CIRCLE`.
- Text height no longer adds the last line's baseline, so the space below the text is gone.

### Added

- `UIProgressMaskFunction.CIRCLE_TOP`, a radial fill that starts at the top.

### Fixed

- `UIText` updates its aspect ratio whenever the rendered size changes.

## 0.3.4 - 2025-09-30

### Fixed

- `UIText` clears its canvas before redrawing, so old text no longer shows through.

## 0.3.3 - 2025-09-30

### Changed

- The properties of the `UIPointElement`, `UIPlaneElement` and `UILayerElement` interfaces are
  read-only.

### Added

- `UIGenericInstancedPlane`, an instanced plane mesh with a custom GLSL source and a per-instance
  property layout, for custom elements.
- `UISceneWrapperClientAPI` is exported. It gains `insertCustomObject` and `removeCustomObject`, so
  a custom element can add its own `Object3D` to the layer's scene.
- `UILayer.x` and `UILayer.y`. A layer satisfies `UIPlaneElement`, so it can be passed where
  constraints and builders take a plane element.

## 0.3.0 - 2025-08-22

### Changed

- **Breaking:** each element renders as a plane with a GLSL source and uniforms, which go to the
  `UIElement` constructor (`source`, `uniforms`). Subclasses hook `onWillRender`. `UIElement` is no
  longer generic over an `Object3D`.
- **Breaking:** colors are `UIColor` objects (RGBA, named colors, hex and HSL, and a `CHANGE`
  event). The `color` of `UIImage`, `UIText`, `UIScene`, `UINineSlice` and `UIProgress` is a
  `UIColor`, and its alpha replaces `opacity`.
- **Breaking:** `UIElement.transparency` is a `UITransparencyMode` (`CLIP`, `HASH`, `BLEND`;
  default `CLIP`). It is no longer a boolean on each element.
- **Breaking:** `UIInputEvent.CLICK` replaces `UIElementEvent.CLICK`.
- **Breaking:** `UIMicroAnchorMode` replaces `UIAnchorMode`.
- **Breaking:** `UIImage` and `UIDummy` take an options object (`x`, `y`, plus `color` or
  `width`/`height`). `UIText`, `UIScene` and `UINineSlice` gain a `color` option.
- **Breaking:** `UIProgress` is reworked. `maskFunction` takes a `UIProgressMaskFunction`
  (`HORIZONTAL`, `VERTICAL`, `DIAGONAL`, `CIRCLE`) or a custom GLSL string. `inverseDirection`
  replaces `isForwardDirection`, and `backgroundTexture` replaces the `textureBackground` option.
  `angle` and the opacity properties are gone. `color`, `foregroundColor` and `backgroundColor`
  are `UIColor`s.
- **Breaking:** `UINineSliceBorders` and the `sliceBorders` option replace `UINineSliceBorder` and
  `sliceBorder`.
- **Breaking:** `resolveTextPadding` replaces `resolvePadding`.
- `UIText` draws on an `OffscreenCanvas`.

### Removed

- **Breaking:** `UIType2D` is no longer exported.

## 0.2.18 - 2025-08-20

### Fixed

- `UIFullscreenLayer` starts at the window size, not 1 x 1.

## 0.2.17 - 2025-08-19

### Changed

- `UINineSlice` no longer tests or writes depth.
- `UIProgress` defaults to opaque rendering with alpha test.

## 0.2.16 - 2025-08-19

### Added

- `UIProgress.color` and `UIProgress.opacity`, an overall tint on top of the foreground and
  background colors.

## 0.2.14 - 0.2.15 - 2025-08-19

Documentation only.

## 0.2.13 - 2025-08-18

### Changed

- **Breaking:** the `UIProgress` option `isForwardDirection` replaces `isForegroundDirection`, to
  match the property.
- `UIProgress` has a hard edge at the progress threshold, and the foreground blends over the
  background by its alpha.

### Added

- `UIProgress.transparency`.

## 0.2.12 - 2025-08-18

### Changed

- **Breaking:** `UIText` takes `x` and `y` in its options, not as constructor arguments.
- **Breaking:** `UINineSlice` takes an options object (`sliceBorder`, `x`, `y`), not `x, y`.

### Added

- `UILayerEvent.WILL_RENDER`, emitted before the layer draws, with `(renderer, deltaTime, layer)`.
- `UINineSlice` options: `sliceBorder` takes a number, `{ horizontal, vertical }` or
  `{ left, right, top, bottom }`. There are getters and setters for each border, plus
  `setSliceBorders`, `texture`, `color`, `opacity` and `transparency`.

## 0.2.11 - 2025-08-18

### Changed

- `UIWidthConstraint`, `UIHeightConstraint` and `UIAspectConstraint` accept any plane element on a
  layer, not only `UIElement`.

### Added

- `UIFitConstraintBuilder` and `UICoverConstraintBuilder` lay out an element inside another one,
  like CSS `contain` and `cover`. Both take `anchorH`, `anchorV` (default 0.5), `orientation` and
  `keepActiveAspect`.

## 0.2.10 - 2025-08-18

### Fixed

- `micro.x` and `micro.y` apply again in the default `UIAnchorMode.ROTATION_SCALE` mode.

## 0.2.9 - 2025-08-18

### Added

- `UIAnchorMode` and `UIMicro.anchorMode`. In `ROTATION_SCALE` (the default), the micro anchor is
  only the pivot for rotation and scale, and the element stays at its layout position. In
  `POSITION_ROTATION_SCALE`, the anchor also offsets the position, as before.

## 0.2.8 - 2025-08-18

### Fixed

- Alpha test applies to opaque images (`transparency = false`). It used to apply to transparent
  ones instead.

## 0.2.7 - 2025-08-18

### Fixed

- A solver error, such as an unsatisfiable required constraint, no longer throws. The layout solver
  is rebuilt on the next read.

## 0.2.6 - 2025-08-17

### Removed

- `UILayerEvent.WILL_ORIENTATION_CHANGE` (added in 0.2.5).

## 0.2.5 - 2025-08-17

### Added

- `UILayerEvent.WILL_ORIENTATION_CHANGE`, emitted before the layer's orientation changes.

## 0.2.4 - 2025-08-17

### Changed

- `UIText` sets its `width` and `height` to the rendered text size when its content changes.

### Added

- `UINineSlice`, a nine-slice image element.

## 0.2.3 - 2025-08-17

### Fixed

- Proportion constraints apply `LESS_THAN` and `GREATER_THAN` the right way round: `b`'s size is
  compared with `a`'s size times `proportion`.

## 0.2.2 - 2025-08-17

### Fixed

- Layer rendering saves and restores the renderer's clear color, clear alpha and auto-clear flags,
  and clears only depth and stencil before drawing the UI.
- A constraint created disabled (for example for the other orientation) is no longer added to the
  solver.

## 0.2.1 - 2025-08-17

Rewrite of the layout and rendering core. Each layer owns a solver wrapper and a scene wrapper, and
elements draw straight into the layer's scene. The post-processing pipeline is gone: an element no
longer renders through its own `UIComposer` passes into render targets. Elements and constraints
refer to layout variables through numeric handles (`xVariable`, `yVariable`, `wVariable`,
`hVariable`) instead of kiwi `Variable`s. Constraints are rewritten around `UIPriority`,
`UIRelation` and `UIExpression`, with live setters for every parameter.

### Changed

- **Breaking:** `UIPriority` (`P0`–`P7`) replaces `UIConstraintPower`, and `UIRelation` (`EQUAL`,
  `LESS_THAN`, `GREATER_THAN`) replaces `UIConstraintRule`. The `priority` and `relation` options
  replace `power` and `rule`.
- **Breaking:** distance constraints and `UIConstraint2DBuilder` use `anchorA`/`anchorB` in place of
  `anchorOne`/`anchorTwo`. Builder results are `{ h, v }`, not `{ x, y }`.
- **Breaking:** `UIOrientation.HORIZONTAL` and `VERTICAL` replace `LANDSCAPE` and `PORTRAIT`.
- **Breaking:** `UIFullscreenLayer` replaces `UIFullScreenLayer`. Its constructor takes `fixedWidth`
  and `fixedHeight`, which replace `tergetScreenHeight`.
- **Breaking:** `UILayerEvent.ORIENTATION_CHANGE` replaces `ORIENTATION_CHANGED`.
- **Breaking:** `UIText` takes `content` and a `commonStyle` option in place of `spans` and
  `defaultStyle`.
- **Breaking:** `UIScene` options `updateMode` and `enableDepthBuffer` replace `updateBehavior` and
  `useDepth`.
- **Breaking:** `UIDummy` extends `UIAnchor` and only holds a position and size. It no longer
  renders.
- **Breaking:** the `UIElement` constructor is `(layer, x, y, width, height, object)`, and `zIndex`
  moves from `UIAnchor` to `UIElement`.
- Text types are split into the `UITextStyle`, `UITextSpan` and `UITextPadding` modules.
  `UIExpression` and `UIMicro` are exported.

### Added

- `UICustomConstraint(layer, lhs, rhs, options)`, built from `UIExpression`s over element
  variables, and the `UISingleParameterConstraint` base with `priority`, `relation` and
  `orientation` setters.
- Live setters on constraints: `width`, `height`, `aspect`, `distance`, `anchorA`, `anchorB` and
  `proportion`.
- `UIElement` setters for `zIndex` and `mode`, and `UIMicro.size`.
- `UIImage.texture`, `UIImage.transparency` and optional `x`/`y` constructor arguments.
- `UIText.content`, `maxWidth`, `padding` and `commonStyle` setters, plus `color`, `opacity` and
  `transparency`.
- `UIScene.updateMode` with `EACH_FRAME`, `EACH_SECOND_FRAME`, `PROPERTY_CHANGED` and `MANUAL`.
  `scene`, `camera`, `resolutionFactor`, `clearColor` and `clearAlpha` are settable, and `color`,
  `opacity` and `transparency` are added.
- `UIProgress` texture setters and `x`/`y` options.
- `UILayerEvent.MODE_CHANGE`.

### Removed

- **Breaking:** `UIComposer`, `UIPass`, `UIFullScreenQuad` and `UIElement.composer`.
- **Breaking:** `UIConstraintContainerBuilder`, `UIConstraintStackBuilder`, `UIFitConstraint` and
  `UICoverConstraint`.
- **Breaking:** `UIBlending` and `UIImage.blending`.
- **Breaking:** `UIProgress.color` and `UIProgress.opacity`, and
  `UIMicro.setAnchorByGlobalPosition`.
- **Breaking:** `UILayerEvent.CLICK`, the public kiwi variables (`xInternal` and similar) and the
  constraint `name`.

## 0.2.0 and earlier

The first library, in which every element rendered its content into render targets through its own
chain of post-processing passes (`UIElement.composer`, `UIComposer`, `UIPass`). It is not compatible
with 0.2.1 and later.
