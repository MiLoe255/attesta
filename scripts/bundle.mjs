import { build } from "esbuild";

await build({
  entryPoints: ["src/action/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/index.js",
  format: "cjs",
});
