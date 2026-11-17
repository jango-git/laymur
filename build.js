import { copyFileSync, mkdirSync, rmSync } from "node:fs";

import * as esbuild from "esbuild";

/*
 * The libraries are bundled into `vendor`, and every module of the page is minified into `dist`
 * on its own. The examples in `src/scenes` stay as they are. The import map in `index.html` sends
 * the imports of the examples from `dist` to `src/scenes`, and their imports of the page modules
 * to `dist`.
 */

const common = {
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  legalComments: "eof",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  logLevel: "info",
};

/* Only the bare names stay external, so three/addons imported by laymur goes into its bundle */
const external = (names) => ({
  name: "external",
  setup(build) {
    const filter = new RegExp(`^(${names.join("|")})$`);
    build.onResolve({ filter }, ({ path, kind }) =>
      kind === "entry-point" ? undefined : { path, external: true },
    );
  },
});

/* The core, debug and particles entries of laymur share classes, so they go into one file */
await esbuild.build({
  ...common,
  stdin: {
    contents: `export * from "laymur"; export * from "laymur/debug"; export * from "laymur/particles";`,
    resolveDir: ".",
  },
  outfile: "vendor/laymur.js",
  plugins: [external(["three"])],
});

await esbuild.build({
  ...common,
  entryPoints: { three: "three", gsap: "gsap", "laymur-animations": "laymur-animations" },
  outdir: "vendor",
  plugins: [external(["three", "gsap", "laymur"])],
});

rmSync("dist", { recursive: true, force: true });
await esbuild.build({
  ...common,
  bundle: false,
  entryPoints: ["src/*.js"],
  outdir: "dist",
});

const FONTS = {
  "space-grotesk/files/space-grotesk-latin-400-normal.woff2": "space-grotesk-400.woff2",
  "space-grotesk/LICENSE": "LICENSE-space-grotesk.txt",
  "ubuntu-sans-mono/files/ubuntu-sans-mono-latin-500-normal.woff2": "ubuntu-sans-mono-500.woff2",
  "ubuntu-sans-mono/LICENSE": "LICENSE-ubuntu-sans-mono.txt",
};
mkdirSync("fonts", { recursive: true });
for (const [from, to] of Object.entries(FONTS)) {
  copyFileSync(`node_modules/@fontsource/${from}`, `fonts/${to}`);
}
