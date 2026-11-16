"use client";
import { useEffect, useState } from "react";

/**
 * Decorative xiangqi board for the landing page.
 *
 * It opens on the standard starting position (shown for a moment), then plays
 * the moves that form the "Screen Horses" (Bình phong mã) setup, holds the
 * final position, fades out and loops. Purely visual (aria-hidden).
 */

// 9 files x 10 ranks; grid pitch 40, margin 20  ->  viewBox 360 x 400
const W = 360,
  H = 400;
const X = (c: number) => 20 + c * 40;
const Y = (r: number) => 20 + r * 40;
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

// ---- position & moves ------------------------------------------------------
// Squares use the same notation as the interactive Board: file a-i (left to
// right, red's view) + rank 0-9 (0 = red's back rank), e.g. "h2".
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
 * Screen Horses (Bình phong mã): red takes the centre with the cannon, then
 * both sides develop both horses in front of their pawns.
 */
const MOVES = [
  "h2e2", // Red   Pháo 2 bình 5 (cannon to the centre)
  "h9g7", // Black Mã 8 tiến 7
  "h0g2", // Red   Mã 2 tiến 3
  "b9c7", // Black Mã 2 tiến 3  -> the "screen" is complete
] as const;

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

// Small, fixed tilts so the floating pieces don't all move in sync.
const TILTS = [-4, 3, 5, -6, 4, -3, 6, -5, 2];

// ---- timing (ms) -----------------------------------------------------------
const START_HOLD = 1800; // show the starting position before the first move
const STEP_MS = 1400; // between moves
const END_HOLD = 3500; // hold the finished setup
const FADE_MS = 600; // fade out / in when looping
const GLIDE_MS = 700; // one piece sliding to its new square

export default function HeroBoard({ className = "" }: { className?: string }) {
  const [step, setStep] = useState(0); // moves played so far (0 = start position)
  const [visible, setVisible] = useState(true);
  const [animate, setAnimate] = useState(false); // off while snapping back to the start

  useEffect(() => {
    // Respect reduced motion: show the finished setup and stop.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(MOVES.length);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (step < MOVES.length) {
      timers.push(
        setTimeout(
          () => {
            setAnimate(true);
            setStep((s) => s + 1);
          },
          step === 0 ? START_HOLD : STEP_MS,
        ),
      );
    } else {
      timers.push(
        setTimeout(() => {
          setVisible(false);
          timers.push(
            setTimeout(() => {
              // Pieces are invisible now: jump back to the start without gliding.
              setAnimate(false);
              setStep(0);
              setVisible(true);
            }, FADE_MS),
          );
        }, END_HOLD),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Replay the first `step` moves on top of the starting position.
  const occupant = new Map(INITIAL.map((p) => [p.sq, p.id]));
  const squareOf = new Map(INITIAL.map((p) => [p.id, p.sq]));
  const captured = new Set<string>();
  let lastId: string | null = null;
  let lastFrom: string | null = null;
  let lastTo: string | null = null;
  for (const mv of MOVES.slice(0, step)) {
    const from = mv.slice(0, 2);
    const to = mv.slice(2, 4);
    const id = occupant.get(from)!;
    const taken = occupant.get(to);
    if (taken) captured.add(taken);
    occupant.delete(from);
    occupant.set(to, id);
    squareOf.set(id, to);
    lastId = id;
    lastFrom = from;
    lastTo = to;
  }

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

  const ease = "cubic-bezier(.4,0,.2,1)";

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

      {/* pieces + last-move rings fade out together before the loop restarts */}
      <div
        className="absolute inset-0"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        {/* last move: dashed ring where the piece left, pulsing ring where it landed */}
        {lastFrom && (
          <span
            key={`from-${step}`}
            className="absolute size-[10%] rounded-full border-2 border-dashed border-lacquer/60"
            style={{
              left: pct(X(colOf(lastFrom)), W),
              top: pct(Y(rowOf(lastFrom)), H),
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
        {lastTo && (
          <span
            key={`to-${step}`}
            className="ring-pulse absolute size-[10%] rounded-full border-2 border-lacquer"
            style={{
              left: pct(X(colOf(lastTo)), W),
              top: pct(Y(rowOf(lastTo)), H),
            }}
          />
        )}

        {INITIAL.map((p, i) => {
          const sq = squareOf.get(p.id)!;
          return (
            <span
              key={p.id}
              className={`piece float-piece absolute size-[10%] text-[5.6cqw] ${
                p.red ? "text-lacquer" : "text-night"
              }`}
              style={
                {
                  left: pct(X(colOf(sq)), W),
                  top: pct(Y(rowOf(sq)), H),
                  // the piece that just moved glides above the others
                  zIndex: p.id === lastId ? 10 : undefined,
                  opacity: captured.has(p.id) ? 0 : undefined,
                  transition: animate
                    ? `left ${GLIDE_MS}ms ${ease}, top ${GLIDE_MS}ms ${ease}`
                    : "none",
                  "--tilt": `${TILTS[i % TILTS.length]}deg`,
                  animationDelay: `${((i * 0.35) % 3).toFixed(2)}s`,
                } as React.CSSProperties
              }
            >
              {p.glyph}
            </span>
          );
        })}
      </div>
    </div>
  );
}
