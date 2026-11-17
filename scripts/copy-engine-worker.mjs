// Copies the prebuilt classic worker of `pikafish-js` into public/engine so it can be loaded by URL.
// (A classic worker is required: the Emscripten glue uses importScripts, which bundlers would break.)
// Runs on `npm install`. The WASM builds and the NNUE network are separate downloads: see README.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const src = "node_modules/pikafish-js/dist/engine.worker.js";
if (!existsSync(src)) {
  console.warn("[pikafish] pikafish-js is not installed; skipping worker copy.");
  process.exit(0);
}
mkdirSync("public/engine", { recursive: true });
copyFileSync(src, "public/engine/engine.worker.js");
console.log("[pikafish] copied engine.worker.js to public/engine/");
