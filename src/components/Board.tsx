"use client";
import { useMemo, useState } from "react";
import { Xiangqi } from "@/lib/xiangqi";

const CELL = 56,
  M = 36;
const CH: Record<string, [string, string]> = {
  r: ["车", "車"],
  n: ["马", "馬"],
  b: ["相", "象"],
  a: ["仕", "士"],
  k: ["帅", "將"],
  c: ["炮", "砲"],
  p: ["兵", "卒"],
};
const FILES = "abcdefghi";

// Intrinsic drawing size (SVG viewBox) and responsive sizing limits.
const W = M * 2 + CELL * 8,
  H = M * 2 + CELL * 9;
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
  const targets = new Set(legal.filter((m) => m.from === sel).map((m) => m.to));

  const pos = (file: number, rank: number): [number, number] => [
    M + (flipped ? 8 - file : file) * CELL,
    M + (flipped ? rank : 9 - rank) * CELL,
  ];
  const line = (a: [number, number], b: [number, number], k: string) => (
    <line
      key={k}
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke="#5b3a1a"
      strokeWidth={1.5}
    />
  );

  const click = (sq: string, piece: { color: string } | null) => {
    if (sel && targets.has(sq)) {
      onMove(sel, sq);
      setSel(null);
      return;
    }
    setSel(
      piece && playAs && piece.color === playAs && g.turn() === playAs
        ? sq
        : null,
    );
  };

  const els: React.ReactNode[] = [];
  for (let r = 0; r <= 9; r++) els.push(line(pos(0, r), pos(8, r), `h${r}`));
  for (let f = 0; f <= 8; f++) {
    if (f === 0 || f === 8) els.push(line(pos(f, 0), pos(f, 9), `v${f}`));
    else {
      els.push(line(pos(f, 0), pos(f, 4), `va${f}`));
      els.push(line(pos(f, 5), pos(f, 9), `vb${f}`));
    }
  }
  for (const [r0, r1] of [
    [0, 2],
    [7, 9],
  ]) {
    els.push(line(pos(3, r0), pos(5, r1), `d1${r0}`));
    els.push(line(pos(5, r0), pos(3, r1), `d2${r0}`));
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: boardWidth(reserved) }}
      className="block h-auto w-full max-w-[560px] touch-manipulation select-none rounded-xl bg-amber-200 shadow-xl"
    >
      {els}
      <text
        x={W / 2}
        y={M + CELL * 4.5 + 8}
        textAnchor="middle"
        fontSize={26}
        fill="#5b3a1a"
        opacity={0.6}
      >
        楚 河　　漢 界
      </text>
      {last &&
        [last.from, last.to].map((sq) => {
          const [x, y] = pos(FILES.indexOf(sq[0]), +sq[1]);
          return (
            <rect
              key={sq}
              x={x - 24}
              y={y - 24}
              width={48}
              height={48}
              fill="none"
              stroke="#16a34a"
              strokeWidth={3}
              rx={6}
            />
          );
        })}
      {board.map((row, ri) =>
        row.map((p, ci) => {
          const sq = FILES[ci] + (9 - ri);
          const [x, y] = pos(ci, 9 - ri);
          return (
            <g key={sq} onClick={() => click(sq, p)} className="cursor-pointer">
              <circle cx={x} cy={y} r={26} fill="transparent" />
              {targets.has(sq) && (
                <circle
                  cx={x}
                  cy={y}
                  r={p ? 28 : 8}
                  fill={p ? "none" : "#16a34a"}
                  stroke="#16a34a"
                  strokeWidth={3}
                />
              )}
              {p && (
                <>
                  <circle
                    cx={x}
                    cy={y}
                    r={24}
                    fill="#fef3c7"
                    stroke={
                      sel === sq
                        ? "#2563eb"
                        : p.color === "r"
                          ? "#b91c1c"
                          : "#1c1917"
                    }
                    strokeWidth={sel === sq ? 4 : 2.5}
                  />
                  <text
                    x={x}
                    y={y + 9}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill={p.color === "r" ? "#b91c1c" : "#1c1917"}
                  >
                    {CH[p.type][p.color === "r" ? 0 : 1]}
                  </text>
                </>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
