// Browser-side Pikafish (WebAssembly) wrapper. Client-only: never import this from a server component.
//
// The engine runs inside a classic Web Worker provided by `pikafish-js`. The WASM builds and the NNUE
// network are NOT bundled with the npm package; they are static files served from `BASE` (see README).
import type { AnalysisInfo, PikafishEngine } from "pikafish-js";

const BASE = (process.env.NEXT_PUBLIC_PIKAFISH_BASE ?? "/engine").replace(/\/$/, "");
// Optional: SHA-256 of the NNUE file. With it the network is verified and cached in Cache Storage.
const NET_SHA256 = process.env.NEXT_PUBLIC_PIKAFISH_NET_SHA256 || undefined;

let enginePromise: Promise<PikafishEngine> | null = null;

/** Pikafish needs SharedArrayBuffer, which needs a cross-origin isolated page (COOP + COEP headers). */
export const canRunPikafish = () =>
  typeof window !== "undefined" &&
  typeof WebAssembly !== "undefined" &&
  window.crossOriginIsolated === true;

/** Lazily creates one shared engine (the worker and the network are expensive to start). */
export function getEngine(onProgress?: (pct: number) => void): Promise<PikafishEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      if (!canRunPikafish()) throw new Error("Page is not cross-origin isolated");
      const { createEngine } = await import("pikafish-js");
      const build = (dir: string) => ({
        js: `${BASE}/${dir}/pikafish.js`,
        wasm: `${BASE}/${dir}/pikafish.wasm`,
      });
      return createEngine({
        builds: {
          "threads-simd": build("threads-simd"),
          "single-simd": build("single-simd"),
          "single-nosimd": build("single-nosimd"),
        },
        netUrl: `${BASE}/pikafish.nnue`,
        netSha256: NET_SHA256,
        // Copied from node_modules by scripts/copy-engine-worker.mjs. A plain URL keeps the worker a
        // classic (importScripts) script, which is what the Emscripten glue needs; bundlers would not.
        workerUrl: `${BASE}/engine.worker.js`,
        onNetProgress: ({ loaded, total }) => {
          if (total > 0) onProgress?.(Math.min(100, Math.round((loaded / total) * 100)));
        },
      });
    })().catch((e) => {
      enginePromise = null; // allow a retry on the next move
      throw e;
    });
  }
  return enginePromise;
}

export function disposeEngine() {
  const p = enginePromise;
  enginePromise = null;
  p?.then((e) => e.dispose()).catch(() => {});
}

/** xiangqi.js writes Red as `r`; Pikafish (UCCI) wants `w`. Squares (`h2`) and moves (`h2e2`) already match. */
export const toUciFen = (fen: string) => {
  const parts = fen.trim().split(/\s+/);
  if (parts[1] === "r") parts[1] = "w";
  return parts.join(" ");
};

export interface Candidate {
  move: string; // UCCI, e.g. "h2e2"
  score: number; // centipawns from the mover's point of view (mate = ±10000)
}

/**
 * Searches `startFen` + `moves` and returns the engine's candidate moves, best first.
 * Passing the whole move list (not just the final FEN) lets Pikafish apply its repetition rules.
 */
export async function search(
  startFen: string,
  moves: string[],
  opts: { depth: number; movetime: number; multiPV: number },
  signal: AbortSignal,
  onProgress?: (pct: number) => void,
): Promise<Candidate[]> {
  const engine = await getEngine(onProgress);
  const handle = await engine.analyze({
    fen: toUciFen(startFen),
    moves,
    depth: opts.depth,
    movetime: opts.movetime,
    multiPV: opts.multiPV,
    signal,
  });
  const { bestmove, info } = await handle.result;

  // Keep the deepest line seen for each multipv slot.
  const bySlot = new Map<number, AnalysisInfo>();
  for (const i of info) {
    const slot = i.multipv ?? 1;
    const prev = bySlot.get(slot);
    if (i.pv?.length && i.score && (!prev || (i.depth ?? 0) >= (prev.depth ?? 0))) bySlot.set(slot, i);
  }
  const lines = [...bySlot.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, i]) => ({
      move: i.pv![0],
      score: i.score!.type === "mate" ? Math.sign(i.score!.value) * 10000 : i.score!.value,
    }));

  if (!bestmove || bestmove === "(none)") return [];
  // Always lead with the engine's own choice, whatever the info stream looked like.
  return [{ move: bestmove, score: lines.find((l) => l.move === bestmove)?.score ?? 0 }, ...lines.filter((l) => l.move !== bestmove)];
}
