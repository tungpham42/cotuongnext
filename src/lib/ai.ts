import { Xiangqi } from "@/lib/xiangqi";

const V: Record<string, number> = {
  p: 100,
  a: 200,
  b: 200,
  n: 400,
  c: 450,
  r: 900,
  k: 10000,
};
export const AI_LEVELS = [
  { name: "Easiest", depth: 1, rand: 0.6 },
  { name: "Easy", depth: 1, rand: 0.2 },
  { name: "Normal", depth: 2, rand: 0.05 },
  { name: "Hard", depth: 3, rand: 0 },
];

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
export function bestMove(fen: string, level: number) {
  const { depth, rand } = AI_LEVELS[level];
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
