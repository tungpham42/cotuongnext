/**
 * Decorative xiangqi board for the landing page: a mid-game position with
 * gently floating pieces. Purely visual (aria-hidden), no game logic.
 */

// 9 files x 10 ranks; grid pitch 40, margin 20  ->  viewBox 360 x 400
const X = (c: number) => 20 + c * 40;
const Y = (r: number) => 20 + r * 40;
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

type P = { c: number; r: number; glyph: string; red?: boolean; tilt?: number };

const PIECES: P[] = [
  // black (top)
  { c: 4, r: 0, glyph: "將" },
  { c: 3, r: 0, glyph: "士", tilt: -4 },
  { c: 1, r: 2, glyph: "砲", tilt: 5 },
  { c: 6, r: 2, glyph: "馬", tilt: -6 },
  { c: 4, r: 4, glyph: "卒", tilt: 3 },
  // red (bottom)
  { c: 4, r: 9, glyph: "帥", red: true },
  { c: 5, r: 9, glyph: "仕", red: true, tilt: 4 },
  { c: 7, r: 7, glyph: "炮", red: true, tilt: -5 },
  { c: 2, r: 6, glyph: "傌", red: true, tilt: 6 },
  { c: 4, r: 5, glyph: "兵", red: true, tilt: -3 },
];

const LAST_MOVE = { c: 4, r: 5 }; // the soldier that just crossed the river

export default function HeroBoard({ className = "" }: { className?: string }) {
  const lines: React.ReactNode[] = [];
  for (let r = 0; r < 10; r++)
    lines.push(<line key={`h${r}`} x1={X(0)} x2={X(8)} y1={Y(r)} y2={Y(r)} />);
  for (let c = 0; c < 9; c++) {
    const edge = c === 0 || c === 8;
    lines.push(
      <line key={`va${c}`} x1={X(c)} x2={X(c)} y1={Y(0)} y2={Y(edge ? 9 : 4)} />,
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
        viewBox="0 0 360 400"
        className="absolute inset-0 size-full text-[#5b3d17]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {lines}
        {/* palaces */}
        <path d={`M${X(3)} ${Y(0)} L${X(5)} ${Y(2)} M${X(5)} ${Y(0)} L${X(3)} ${Y(2)}`} />
        <path d={`M${X(3)} ${Y(7)} L${X(5)} ${Y(9)} M${X(5)} ${Y(7)} L${X(3)} ${Y(9)}`} />
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

      {/* "last move" pulse */}
      <span
        className="ring-pulse absolute size-[11%] rounded-full border-2 border-lacquer"
        style={{
          left: pct(X(LAST_MOVE.c), 360),
          top: pct(Y(LAST_MOVE.r), 400),
        }}
      />

      {PIECES.map((p, i) => (
        <span
          key={i}
          className={`piece float-piece absolute size-[11.5%] text-[6.4cqw] ${
            p.red ? "text-lacquer" : "text-night"
          }`}
          style={
            {
              left: pct(X(p.c), 360),
              top: pct(Y(p.r), 400),
              "--tilt": `${p.tilt ?? 0}deg`,
              animationDelay: `${(i * 0.45).toFixed(2)}s`,
            } as React.CSSProperties
          }
        >
          {p.glyph}
        </span>
      ))}
    </div>
  );
}
