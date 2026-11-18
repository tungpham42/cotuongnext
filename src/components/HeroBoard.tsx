/**
 * Decorative xiangqi board for the landing page.
 *
 * Static: it renders the finished "Screen Horses" (Bình phong mã) setup and
 * never moves. No timers, no state, no CSS animation, so it can be a server
 * component. Purely visual (aria-hidden).
 */

// 9 files x 10 ranks; grid pitch 40, margin 20  ->  viewBox 360 x 400
const W = 360,
  H = 400;
const X = (c: number) => 20 + c * 40;
const Y = (r: number) => 20 + r * 40;
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

// ---- position --------------------------------------------------------------
// Squares: file a-i (left to right, red's view) + rank 0-9 (0 = red's back rank).
const FILES = "abcdefghi";

const START_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR";

const GLYPH: Record<string, [string, string]> = {
  r: ["俥", "車"],
  n: ["傌", "馬"],
  b: ["相", "象"],
  a: ["仕", "士"],
  k: ["帥", "將"],
  c: ["炮", "砲"],
  p: ["兵", "卒"],
};

/**
 * Moves applied on top of the starting position to reach the Screen Horses
 * setup. Set this to `[]` to show the standard starting position instead.
 */
const MOVES: readonly string[] = [
  "h2e2", // Red   Pháo 2 bình 5 (cannon to the centre)
  "h9g7", // Black Mã 8 tiến 7
  "h0g2", // Red   Mã 2 tiến 3
  "b9c7", // Black Mã 2 tiến 3
];

type Piece = { id: string; sq: string; glyph: string; red: boolean };

const INITIAL: Piece[] = START_FEN.split("/").flatMap((rowStr, rowIdx) => {
  const out: Piece[] = [];
  let col = 0;
  for (const ch of rowStr) {
    if (/\d/.test(ch)) {
      col += Number(ch);
      continue;
    }
    const red = ch === ch.toUpperCase();
    const sq = FILES[col] + (9 - rowIdx);
    out.push({ id: sq, sq, glyph: GLYPH[ch.toLowerCase()][red ? 0 : 1], red });
    col++;
  }
  return out;
});

// Square -> grid column / row (row 0 = top = black's back rank).
const colOf = (sq: string) => FILES.indexOf(sq[0]);
const rowOf = (sq: string) => 9 - Number(sq[1]);

// Resolve the final position once, at module load.
const FINAL: Piece[] = (() => {
  const occupant = new Map(INITIAL.map((p) => [p.sq, p.id]));
  const squareOf = new Map(INITIAL.map((p) => [p.id, p.sq]));
  const captured = new Set<string>();
  for (const mv of MOVES) {
    const from = mv.slice(0, 2);
    const to = mv.slice(2, 4);
    const id = occupant.get(from)!;
    const taken = occupant.get(to);
    if (taken) captured.add(taken);
    occupant.delete(from);
    occupant.set(to, id);
    squareOf.set(id, to);
  }
  return INITIAL.filter((p) => !captured.has(p.id)).map((p) => ({
    ...p,
    sq: squareOf.get(p.id)!,
  }));
})();

export default function HeroBoard({ className = "" }: { className?: string }) {
  // ---- grid ----------------------------------------------------------------
  const lines: React.ReactNode[] = [];
  for (let r = 0; r < 10; r++)
    lines.push(<line key={`h${r}`} x1={X(0)} x2={X(8)} y1={Y(r)} y2={Y(r)} />);
  for (let c = 0; c < 9; c++) {
    const edge = c === 0 || c === 8;
    lines.push(
      <line
        key={`va${c}`}
        x1={X(c)}
        x2={X(c)}
        y1={Y(0)}
        y2={Y(edge ? 9 : 4)}
      />,
    );
    if (!edge)
      lines.push(
        <line key={`vb${c}`} x1={X(c)} x2={X(c)} y1={Y(5)} y2={Y(9)} />,
      );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative aspect-[9/10] w-full [container-type:inline-size] ${className}`}
    >
      {/* soft shadow + board surface */}
      <div className="absolute inset-0 rounded-3xl border border-brass/30 bg-[linear-gradient(145deg,#e9cf94,#cfa862)] shadow-[0_30px_60px_rgb(0_0_0/.5),inset_0_0_0_6px_rgb(141_107_52/.25)]" />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 size-full text-[#5b3d17]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {lines}
        {/* palaces */}
        <path
          d={`M${X(3)} ${Y(0)} L${X(5)} ${Y(2)} M${X(5)} ${Y(0)} L${X(3)} ${Y(2)}`}
        />
        <path
          d={`M${X(3)} ${Y(7)} L${X(5)} ${Y(9)} M${X(5)} ${Y(7)} L${X(3)} ${Y(9)}`}
        />
        {/* river */}
        <text
          x={X(1.6)}
          y={Y(4.5) + 9}
          fill="currentColor"
          stroke="none"
          fontSize="26"
          textAnchor="middle"
          className="font-han"
          opacity=".7"
        >
          楚河
        </text>
        <text
          x={X(6.4)}
          y={Y(4.5) + 9}
          fill="currentColor"
          stroke="none"
          fontSize="26"
          textAnchor="middle"
          className="font-han"
          opacity=".7"
        >
          漢界
        </text>
      </svg>

      {/* pieces */}
      <div className="absolute inset-0">
        {FINAL.map((p) => (
          <span
            key={p.id}
            className={`piece absolute size-[10%] text-[5.6cqw] ${
              p.red ? "text-lacquer" : "text-night"
            }`}
            style={{
              left: pct(X(colOf(p.sq)), W),
              top: pct(Y(rowOf(p.sq)), H),
              transform: "translate(-50%, -50%)",
            }}
          >
            {p.glyph}
          </span>
        ))}
      </div>
    </div>
  );
}
