# laymur examples

The page at https://jango-git.github.io/laymur/. Each tab is one example, and its code is in
`src/scenes`. The examples run inside a simulated device: the presets under it and the handle at
its corner change its size, and the first option of every example shows the constraints of its
layer.

| Path | What it holds |
|---|---|
| `src/scenes` | The examples, served as they are |
| `src` | The page: the device, the 3D scene, textures, buttons, options and the shared helpers of the examples |
| `dist` | The page modules from `src`, minified one by one |
| `vendor` | three, gsap, laymur and laymur-animations bundled and minified from npm |
| `fonts` | Space Grotesk and Ubuntu Sans Mono from fontsource with their licenses |

The import map in `index.html` points the libraries at `vendor`. It also sends the imports of
the examples from `dist` to `src/scenes`, and their imports of the page modules to `dist`.

## Build

```bash
npm install
npm run build
```

The build writes `vendor` and `dist` and copies the fonts. Run it after a change in `src`, except
in `src/scenes`, and after updating a library. For a new laymur release, also change `VERSION` in
`src/interface.js`. The page runs from any static server, for example `python3 -m http.server`.
