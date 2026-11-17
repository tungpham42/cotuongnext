import { Xiangqi } from "@/lib/xiangqi";
import { canRunPikafish, search as pikafishSearch } from "@/lib/pikafish";

/**
 * Pikafish (WebAssembly, in a Web Worker) plays the moves. Strength is shaped three ways:
 *  - `depth` / `movetime`: how hard it searches (whichever limit is hit first ends the search);
 *  - `multiPV` + `blunder`: it asks for several candidate moves and, with probability `blunder`,
 *    plays one of the non-best ones, so weaker levels make human-like mistakes;
 *  - `legacy`: settings for the small built-in minimax below, used only when Pikafish can't run
 *    (page not cross-origin isolated, e.g. Safari, or the engine files failed to load).
 */
export const AI_LEVELS = [
  { key: "easiest", depth: 1, movetime: 100, multiPV: 5, blunder: 0.6, legacy: { depth: 1, rand: 0.6 } },
  { key: "easy", depth: 3, movetime: 200, multiPV: 4, blunder: 0.25, legacy: { depth: 1, rand: 0.2 } },
  { key: "normal", depth: 8, movetime: 500, multiPV: 3, blunder: 0.05, legacy: { depth: 2, rand: 0.05 } },
  { key: "hard", depth: 16, movetime: 1500, multiPV: 1, blunder: 0, legacy: { depth: 3, rand: 0 } },
];

export interface AiMove {
  from: string;
  to: string;
  engine: "pikafish" | "fallback";
}

/**
 * Picks the computer's reply. `startFen` + `moves` (UCCI, e.g. "h2e2") describe the game so far.
 * Rejects only when `signal` is aborted; any engine failure falls back to the built-in minimax.
 */
export async function bestMove(
  startFen: string,
  moves: string[],
  level: number,
  signal: AbortSignal,
  onProgress?: (pct: number) => void,
): Promise<AiMove | null> {
  const cfg = AI_LEVELS[level];
  const g = new Xiangqi(startFen);
  for (const m of moves) g.move({ from: m.slice(0, 2), to: m.slice(2, 4) });
  const legal = new Set(g.moves({ verbose: true }).map((m) => m.from + m.to));
  if (!legal.size) return null;

  if (canRunPikafish()) {
    try {
      const found = (await pikafishSearch(startFen, moves, cfg, signal, onProgress)).filter((c) => legal.has(c.move));
      if (found.length) {
        const pick =
          found.length > 1 && Math.random() < cfg.blunder
            ? found[1 + Math.floor(Math.random() * (found.length - 1))]
            : found[0];
        return { from: pick.move.slice(0, 2), to: pick.move.slice(2, 4), engine: "pikafish" };
      }
    } catch (e) {
      if (signal.aborted) throw e;
      console.warn("Pikafish unavailable, using the built-in AI:", e);
    }
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const m = legacyBestMove(g.fen(), level);
  return m ? { from: m.from, to: m.to, engine: "fallback" } : null;
}

// ---- Built-in fallback: a tiny alpha-beta minimax with a material-only evaluation. ----
const V: Record<string, number> = {
  p: 100,
  a: 200,
  b: 200,
  n: 400,
  c: 450,
  r: 900,
  k: 10000,
};

function evaluate(g: Xiangqi) {
  let s = 0;
  g.board().forEach((row, ri) =>
    row.forEach((p) => {
      if (!p) return;
      let v = V[p.type];
      if (p.type === "p" && (p.color === "r" ? ri <= 4 : ri >= 5)) v += 100; // crossed the river
      s += p.color === "r" ? v : -v;
    }),
  );
  return s;
}
function search(g: Xiangqi, d: number, a: number, b: number): number {
  if (g.in_checkmate()) return g.turn() === "r" ? -99999 - d : 99999 + d;
  if (d === 0 || g.game_over()) return evaluate(g);
  const red = g.turn() === "r";
  let best = red ? -Infinity : Infinity;
  for (const m of g.moves({ verbose: true })) {
    g.move({ from: m.from, to: m.to });
    const sc = search(g, d - 1, a, b);
    g.undo();
    if (red) {
      best = Math.max(best, sc);
      a = Math.max(a, sc);
    } else {
      best = Math.min(best, sc);
      b = Math.min(b, sc);
    }
    if (b <= a) break;
  }
  return best;
}
function legacyBestMove(fen: string, level: number) {
  const { depth, rand } = AI_LEVELS[level].legacy;
  const g = new Xiangqi(fen);
  const moves = g.moves({ verbose: true }).sort(() => Math.random() - 0.5);
  if (!moves.length) return null;
  if (Math.random() < rand) return moves[0];
  const red = g.turn() === "r";
  let best = moves[0],
    bs = red ? -Infinity : Infinity;
  for (const m of moves) {
    g.move({ from: m.from, to: m.to });
    const sc = search(g, depth - 1, -Infinity, Infinity);
    g.undo();
    if (red ? sc > bs : sc < bs) {
      bs = sc;
      best = m;
    }
  }
  return best;
}
