import { build } from "esbuild";

await build({
  entryPoints: ["src/action/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/index.js",
  format: "cjs",
});

await build({
  entryPoints: ["src/konsole/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/konsole.js",
  format: "cjs",
  // @miloe255/attesta-core liest rules/ und profile/basis/ relativ zu seinem
  // eigenen __dirname. Gebuendelt verliert dieser Pfad seinen Bezug, siehe
  // Arbeitspaket 4. Die Konsole laeuft ueber npm, node_modules ist da immer
  // vorhanden, deshalb bleibt das Paket extern statt eingebettet.
  external: ["@miloe255/attesta-core"],
});
