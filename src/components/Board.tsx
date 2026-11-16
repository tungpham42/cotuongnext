"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Xiangqi } from "@/lib/xiangqi";
import { playSound, unlockAudio } from "@/lib/sound";

/**
 * Interactive xiangqi board, styled to match the landing-page HeroBoard:
 * a light brass board surface, thin brown lines, and the shared `.piece`
 * discs (red = text-lacquer, black = text-night) laid over an SVG grid.
 */

const GLYPH: Record<string, [string, string]> = {
  r: ["俥", "車"],
  n: ["傌", "馬"],
  b: ["相", "象"],
  a: ["仕", "士"],
  k: ["帥", "將"],
  c: ["炮", "砲"],
  p: ["兵", "卒"],
};
const FILES = "abcdefghi";

// 9 files x 10 ranks; grid pitch 40, margin 20  ->  viewBox 360 x 400
const W = 360,
  H = 400;
const X = (c: number) => 20 + c * 40;
const Y = (r: number) => 20 + r * 40;
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

const MAX_W = 560; // never wider than this (px)
const MIN_W = 260; // never narrower than this on very short screens (px)

/**
 * CSS width for a board that fits BOTH the available width and the viewport height.
 * `reserved` = vertical space used by everything else on the page (nav, padding, labels...).
 * Uses dvh so mobile browser toolbars are taken into account.
 */
export const boardWidth = (reserved = "7.5rem") =>
  `min(100%, max(${MIN_W}px, min(${MAX_W}px, calc((100dvh - ${reserved}) * ${W / H}))))`;

interface Props {
  fen: string;
  flipped?: boolean; // true = black at the bottom
  playAs: "r" | "b" | null; // null = spectator / not allowed to move
  last?: { from: string; to: string } | null;
  onMove: (from: string, to: string) => void;
  reserved?: string; // vertical space used by other page content (see boardWidth)
}

export default function Board({
  fen,
  flipped = false,
  playAs,
  last,
  onMove,
  reserved,
}: Props) {
  const g = useMemo(() => new Xiangqi(fen), [fen]);
  const [sel, setSel] = useState<string | null>(null);
  const board = g.board();
  const legal = useMemo(() => g.moves({ verbose: true }), [g]);

  // Play a sound whenever the position changes (own, opponent's and AI moves alike).
  const prev = useRef<{ fen: string; pieces: number } | null>(null);
  const pieces = board.flat().filter(Boolean).length;
  useEffect(() => {
    const before = prev.current;
    prev.current = { fen, pieces };
    if (!before || before.fen === fen) return; // initial render / no change
    if (g.game_over()) {
      if (g.in_checkmate()) {
        // The side to move has been mated.
        playSound(playAs ? (g.turn() === playAs ? "lose" : "win") : "check");
      } else playSound("draw");
    } else if (g.in_check()) playSound("check");
    else if (pieces < before.pieces) playSound("capture");
    else playSound("move");
  }, [fen, pieces, g, playAs]);

  const targets = new Set(legal.filter((m) => m.from === sel).map((m) => m.to));

  // Grid column / row (0 = top-left of what the player sees) for a file + rank.
  const col = (file: number) => (flipped ? 8 - file : file);
  const row = (rank: number) => (flipped ? rank : 9 - rank);

  const click = (sq: string, piece: { color: string } | null) => {
    unlockAudio();
    if (sel && targets.has(sq)) {
      onMove(sel, sq);
      setSel(null);
      return;
    }
    // Clicking the already-selected piece deselects it.
    if (sq === sel) {
      setSel(null);
      return;
    }
    const next =
      piece && playAs && piece.color === playAs && g.turn() === playAs
        ? sq
        : null;
    if (next) playSound("select");
    setSel(next);
  };

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

  // Cannon / pawn corner markers (grid columns/rows, so they ignore flipping)
  const marker = (c: number, r: number) => {
    const x = X(c),
      y = Y(r),
      gap = 4,
      len = 8;
    let d = "";
    for (const sx of [-1, 1]) {
      if ((c === 0 && sx === -1) || (c === 8 && sx === 1)) continue;
      for (const sy of [-1, 1])
        d += `M${x + sx * (gap + len)} ${y + sy * gap}H${x + sx * gap}V${y + sy * (gap + len)}`;
    }
    return <path key={`m${c}-${r}`} d={d} strokeWidth="1.2" opacity=".85" />;
  };
  const markers: React.ReactNode[] = [];
  for (const c of [1, 7]) for (const r of [2, 7]) markers.push(marker(c, r));
  for (const c of [0, 2, 4, 6, 8])
    for (const r of [3, 6]) markers.push(marker(c, r));

  // A square-ish, centred slot on a grid intersection.
  // 10% of the board width is below the ~11.1% grid pitch, so neighbouring pieces never touch.
  const slot = (x: number, y: number): React.CSSProperties => ({
    left: pct(x, W),
    top: pct(y, H),
    width: "10%",
    aspectRatio: "1",
    transform: "translate(-50%, -50%)",
  });

  const lastFrom = last && {
    x: X(col(FILES.indexOf(last.from[0]))),
    y: Y(row(+last.from[1])),
  };
  const lastTo = last && {
    x: X(col(FILES.indexOf(last.to[0]))),
    y: Y(row(+last.to[1])),
  };

  return (
    <div
      style={{ width: boardWidth(reserved) }}
      className="relative mx-auto aspect-[9/10] w-full max-w-[560px] touch-manipulation select-none [container-type:inline-size] md:mx-0"
    >
      {/* soft shadow + board surface */}
      <div className="absolute inset-0 rounded-3xl border border-brass/30 bg-[linear-gradient(145deg,#e9cf94,#cfa862)] shadow-[0_30px_60px_rgb(0_0_0/.5),inset_0_0_0_6px_rgb(141_107_52/.25)]" />

      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full text-[#5b3d17]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {lines}
        {markers}
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

      {/* last move: dashed ring where the piece left, pulsing ring where it landed */}
      {lastFrom && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full border-2 border-dashed border-lacquer/60"
          style={slot(lastFrom.x, lastFrom.y)}
        />
      )}
      {lastTo && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute animate-pulse rounded-full border-2 border-lacquer"
          style={slot(lastTo.x, lastTo.y)}
        />
      )}

      {/* intersections: click targets, move hints and pieces */}
      {board.map((rowPieces, ri) =>
        rowPieces.map((p, ci) => {
          const sq = FILES[ci] + (9 - ri);
          const x = X(col(ci));
          const y = Y(row(9 - ri));
          const isSel = sel === sq;
          const isTarget = targets.has(sq);
          const isRed = p?.color === "r";
          return (
            <div
              key={sq}
              role="button"
              aria-label={sq}
              onClick={() => click(sq, p)}
              className="absolute cursor-pointer"
              style={slot(x, y)}
            >
              {isTarget &&
                (p ? (
                  <span className="pointer-events-none absolute -inset-[6%] animate-pulse rounded-full border-[3px] border-river" />
                ) : (
                  <span className="pointer-events-none absolute inset-[30%] animate-pulse rounded-full bg-river/80 ring-2 ring-river/30" />
                ))}

              {p && (
                <div
                  className={`size-full transition-transform duration-150 ${
                    isSel ? "-translate-y-[6%] scale-105" : ""
                  }`}
                >
                  <span
                    className={`piece size-full text-[5.6cqw] ${
                      isRed ? "text-lacquer" : "text-night"
                    } ${isSel ? "ring-[3px] ring-brass ring-offset-2 ring-offset-[#d9b878]" : ""}`}
                  >
                    {GLYPH[p.type][isRed ? 0 : 1]}
                  </span>
                </div>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
