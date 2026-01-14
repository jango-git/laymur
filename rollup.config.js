import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "rollup-plugin-typescript2";
import minifyPrivatesTransformer from "ts-transformer-minify-privates";
import { string } from "rollup-plugin-string";
import { babel } from "@rollup/plugin-babel";

const replaceNodeEnv = (isProduction) => ({
  name: "replace-node-env",
  renderChunk(code) {
    return {
      code: code.replace(
        /process\.env\.NODE_ENV/g,
        JSON.stringify(isProduction ? "production" : "development"),
      ),
      map: null,
    };
  },
});

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "esm",
      sourcemap: true,
      plugins: [replaceNodeEnv(false)],
    },
    {
      file: "dist/index.min.js",
      format: "esm",
      sourcemap: true,
      plugins: [
        replaceNodeEnv(true),
        terser({
          compress: {
            ecma: 2015,
            passes: 5,
            arrows: true,
            arguments: true,
            collapse_vars: true,
            computed_props: true,
            dead_code: true,
            drop_console: true,
            drop_debugger: true,
            hoist_props: true,
            inline: true,
            keep_fargs: false,
            pure_getters: true,
            reduce_funcs: true,
            reduce_vars: true,
            switches: true,
            toplevel: true,
            typeofs: true,
            unsafe: true,
            unsafe_arrows: true,
            unsafe_comps: true,
            unsafe_Function: true,
            unsafe_math: true,
            unsafe_methods: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_undefined: true,
          },
          format: {
            ecma: 2015,
            comments: false,
          },
          mangle: {
            toplevel: true,
            properties: {
              regex: /^_/,
            },
          },
        }),
      ],
    },
  ],
  plugins: [
    nodeResolve({ extensions: [".js", ".ts"] }),
    {
      name: "minify-shaders",
      transform(code, id) {
        if (/\.(glsl|fs|vs|frag|vert)$/.test(id)) {
          return {
            code: code
              .replace(/\/\*[\s\S]*?\*\//g, "")
              .replace(/\/\/[^\n]*/g, "")
              .replace(/\s*([{}(),=;+\-*/<>])\s*/g, "$1")
              .replace(/\s+/g, " ")
              .trim(),
            map: null,
          };
        }
      },
    },
    string({
      include: ["**/*.glsl", "**/*.fs", "**/*.vs", "**/*.frag", "**/*.vert"],
    }),
    typescript({
      tsconfig: "tsconfig.json",
      useTsconfigDeclarationDir: true,
      transformers: [
        (service) => ({
          before: [minifyPrivatesTransformer.default(service.getProgram())],
          after: [],
        }),
      ],
    }),
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".ts"],
      presets: [
        ["@babel/preset-env", { targets: { ios: "13" } }],
      ],
    }),
  ],
  external: ["three"],
};
