"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Xiangqi } from "@/lib/xiangqi";
import { playSound, unlockAudio } from "@/lib/sound";

const CELL = 56,
  M = 46;
const CH: Record<string, [string, string]> = {
  r: ["俥", "車"],
  n: ["傌", "馬"],
  b: ["相", "象"],
  a: ["仕", "士"],
  k: ["帥", "將"],
  c: ["炮", "砲"],
  p: ["兵", "卒"],
};
const FILES = "abcdefghi";
const RED_NUM = ["九", "八", "七", "六", "五", "四", "三", "二", "一"];
const BLK_NUM = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Palette — lacquer, gold, ink, jade
const INK = "#3a2412";
const RED = "#b3121b";
const BLACK = "#16110d";
const GOLD = "#e3b948";
const JADE = "#10b981";
const SERIF =
  "'STKaiti','KaiTi','Kaiti SC','Noto Serif SC','Songti SC','SimSun',serif";

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
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${uid}`;
  const ref = (n: string) => `url(#${id(n)})`;

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

  const pos = (file: number, rank: number): [number, number] => [
    M + (flipped ? 8 - file : file) * CELL,
    M + (flipped ? rank : 9 - rank) * CELL,
  ];

  const line = (
    a: [number, number],
    b: [number, number],
    k: string,
    w = 1.5,
  ) => (
    <line
      key={k}
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke={INK}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );

  const click = (sq: string, piece: { color: string } | null) => {
    unlockAudio();
    if (sel && targets.has(sq)) {
      onMove(sel, sq);
      setSel(null);
      return;
    }
    const next =
      piece && playAs && piece.color === playAs && g.turn() === playAs
        ? sq
        : null;
    if (next && next !== sel) playSound("select");
    setSel(next);
  };

  // ---- grid ----------------------------------------------------------------
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

  // Cannon / pawn corner markers
  const marker = (file: number, rank: number) => {
    const [x, y] = pos(file, rank);
    const gap = 5,
      len = 10;
    const parts: string[] = [];
    for (const sx of [-1, 1]) {
      // Hide the side facing the board edge
      const df = flipped ? 8 - file : file;
      if ((df === 0 && sx === -1) || (df === 8 && sx === 1)) continue;
      for (const sy of [-1, 1]) {
        parts.push(
          `M${x + sx * (gap + len)} ${y + sy * gap}H${x + sx * gap}V${y + sy * (gap + len)}`,
        );
      }
    }
    return (
      <path
        key={`m${file}${rank}`}
        d={parts.join("")}
        fill="none"
        stroke={INK}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };
  const markers: React.ReactNode[] = [];
  for (const f of [1, 7]) for (const r of [2, 7]) markers.push(marker(f, r));
  for (const f of [0, 2, 4, 6, 8])
    for (const r of [3, 6]) markers.push(marker(f, r));

  // Outer double border
  const [tlx, tly] = [M - 9, M - 9];
  const [brx, bry] = [W - M + 9, H - M + 9];

  // Coordinate numerals
  const topNums = flipped ? RED_NUM.slice().reverse() : BLK_NUM;
  const botNums = flipped ? BLK_NUM.slice().reverse() : RED_NUM;
  const topIsRed = flipped;

  // Last-move corner brackets
  const bracket = (x: number, y: number, k: string) => {
    const h = 28,
      l = 10;
    const d = [
      `M${x - h} ${y - h + l}V${y - h}H${x - h + l}`,
      `M${x + h - l} ${y - h}H${x + h}V${y - h + l}`,
      `M${x + h} ${y + h - l}V${y + h}H${x + h - l}`,
      `M${x - h + l} ${y + h}H${x - h}V${y + h - l}`,
    ].join("");
    return (
      <path
        key={k}
        d={d}
        fill="none"
        stroke={GOLD}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={ref("glow")}
      />
    );
  };

  // Corner ornaments for the outer frame
  const corner = (x: number, y: number, sx: number, sy: number, k: string) => (
    <g key={k} stroke={GOLD} fill="none" strokeLinecap="round" opacity={0.95}>
      <path d={`M${x} ${y + sy * 22}V${y}H${x + sx * 22}`} strokeWidth={2.2} />
      <path
        d={`M${x + sx * 6} ${y + sy * 14}V${y + sy * 6}H${x + sx * 14}`}
        strokeWidth={1.2}
      />
      <circle
        cx={x + sx * 3}
        cy={y + sy * 3}
        r={1.8}
        fill={GOLD}
        stroke="none"
      />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: boardWidth(reserved) }}
      className="mx-auto block h-auto w-full max-w-[560px] touch-manipulation select-none drop-shadow-[0_20px_30px_rgba(60,20,0,0.45)] md:mx-0"
    >
      <defs>
        {/* Lacquered frame */}
        <linearGradient id={id("frame")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a1a12" />
          <stop offset="0.5" stopColor="#2e0d09" />
          <stop offset="1" stopColor="#4a150f" />
        </linearGradient>
        {/* Warm wood face */}
        <linearGradient id={id("wood")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d994" />
          <stop offset="0.45" stopColor="#ecc176" />
          <stop offset="1" stopColor="#dca85a" />
        </linearGradient>
        <radialGradient id={id("vig")} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor="#7a3f10" stopOpacity="0" />
          <stop offset="1" stopColor="#7a3f10" stopOpacity="0.35" />
        </radialGradient>
        {/* Wood grain */}
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.42"
            numOctaves="3"
            seed="7"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.42  0 0 0 0 0.24  0 0 0 0 0.07  0 0 0 1.25 -0.45"
          />
        </filter>
        {/* Piece wood */}
        <radialGradient id={id("disc")} cx="0.38" cy="0.32" r="0.85">
          <stop offset="0" stopColor="#fff6dc" />
          <stop offset="0.55" stopColor="#f3cf88" />
          <stop offset="1" stopColor="#cf9440" />
        </radialGradient>
        <radialGradient id={id("rimR")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.8" stopColor="#7a1016" />
          <stop offset="1" stopColor="#3d0709" />
        </radialGradient>
        <radialGradient id={id("rimB")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.8" stopColor="#2a211b" />
          <stop offset="1" stopColor="#0b0705" />
        </radialGradient>
        <filter id={id("shadow")} x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="2.2"
            floodColor="#2b1200"
            floodOpacity="0.5"
          />
        </filter>
        <filter id={id("glow")} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={id("river")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f7f86" stopOpacity="0" />
          <stop offset="0.5" stopColor="#2f7f86" stopOpacity="0.22" />
          <stop offset="1" stopColor="#2f7f86" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ---- Frame ---- */}
      <rect width={W} height={H} rx={22} fill={ref("frame")} />
      <rect
        x={5}
        y={5}
        width={W - 10}
        height={H - 10}
        rx={18}
        fill="none"
        stroke={GOLD}
        strokeWidth={1.5}
        opacity={0.8}
      />
      <rect
        x={10}
        y={10}
        width={W - 20}
        height={H - 20}
        rx={12}
        fill={ref("wood")}
      />
      <rect
        x={10}
        y={10}
        width={W - 20}
        height={H - 20}
        rx={12}
        filter={ref("grain")}
        opacity={0.55}
      />
      <rect
        x={10}
        y={10}
        width={W - 20}
        height={H - 20}
        rx={12}
        fill={ref("vig")}
      />
      <rect
        x={10}
        y={10}
        width={W - 20}
        height={H - 20}
        rx={12}
        fill="none"
        stroke="#2e0d09"
        strokeWidth={2}
      />
      {corner(18, 18, 1, 1, "c1")}
      {corner(W - 18, 18, -1, 1, "c2")}
      {corner(18, H - 18, 1, -1, "c3")}
      {corner(W - 18, H - 18, -1, -1, "c4")}

      {/* ---- River (ink wash) ---- */}
      <rect
        x={M}
        y={M + CELL * 4}
        width={CELL * 8}
        height={CELL}
        fill={ref("river")}
      />
      {[0, 1, 2].map((i) => (
        <path
          key={`w${i}`}
          d={`M${M + 6} ${M + CELL * 4 + 14 + i * 14}${Array.from({
            length: 10,
          })
            .map((_, k) => `q${22} ${k % 2 ? 6 : -6} ${44} 0`)
            .join("")}`}
          fill="none"
          stroke="#2f7f86"
          strokeWidth={1}
          opacity={0.22}
          strokeLinecap="round"
        />
      ))}

      {/* ---- Grid ---- */}
      <rect
        x={tlx}
        y={tly}
        width={brx - tlx}
        height={bry - tly}
        rx={3}
        fill="none"
        stroke={INK}
        strokeWidth={3.2}
      />
      {els}
      {markers}

      {/* River calligraphy */}
      <g
        fontFamily={SERIF}
        fontSize={30}
        fontWeight={700}
        fill={INK}
        opacity={0.78}
        textAnchor="middle"
        letterSpacing={6}
      >
        <text x={M + CELL * 2} y={M + CELL * 4.5 + 10}>
          楚 河
        </text>
        <text x={M + CELL * 6} y={M + CELL * 4.5 + 10}>
          漢 界
        </text>
      </g>
      {/* Red seal */}
      <g transform={`translate(${W / 2 - 14} ${M + CELL * 4.5 - 14})`}>
        <rect
          width={28}
          height={28}
          rx={4}
          fill={RED}
          stroke="#7a0b10"
          strokeWidth={1}
          transform="rotate(-6 14 14)"
        />
        <text
          x={14}
          y={22}
          textAnchor="middle"
          fontSize={20}
          fontFamily={SERIF}
          fontWeight={700}
          fill="#fde9c3"
          transform="rotate(-6 14 14)"
        >
          棋
        </text>
      </g>

      {/* Coordinate numerals */}
      <g fontFamily={SERIF} fontSize={16} fontWeight={700} textAnchor="middle">
        {topNums.map((n, i) => (
          <text
            key={`t${i}`}
            x={M + i * CELL}
            y={M - 20}
            fill={topIsRed ? RED : BLACK}
            opacity={0.8}
          >
            {n}
          </text>
        ))}
        {botNums.map((n, i) => (
          <text
            key={`b${i}`}
            x={M + i * CELL}
            y={H - M + 29}
            fill={topIsRed ? BLACK : RED}
            opacity={0.8}
          >
            {n}
          </text>
        ))}
      </g>

      {/* ---- Last move ---- */}
      {last &&
        [last.from, last.to].map((sq, i) => {
          const [x, y] = pos(FILES.indexOf(sq[0]), +sq[1]);
          return i === 1 ? (
            bracket(x, y, sq)
          ) : (
            <g key={sq}>
              <circle cx={x} cy={y} r={24} fill={GOLD} opacity={0.18} />
              <circle
                cx={x}
                cy={y}
                r={24}
                fill="none"
                stroke={GOLD}
                strokeWidth={2}
                strokeDasharray="4 5"
                opacity={0.85}
              />
            </g>
          );
        })}

      {/* ---- Pieces & targets ---- */}
      {board.map((row, ri) =>
        row.map((p, ci) => {
          const sq = FILES[ci] + (9 - ri);
          const [x, y] = pos(ci, 9 - ri);
          const isSel = sel === sq;
          const isRed = p?.color === "r";
          const ink = isRed ? RED : BLACK;
          return (
            <g key={sq} onClick={() => click(sq, p)} className="cursor-pointer">
              <circle cx={x} cy={y} r={27} fill="transparent" />

              {targets.has(sq) &&
                (p ? (
                  <g>
                    <circle
                      cx={x}
                      cy={y}
                      r={29}
                      fill="none"
                      stroke={JADE}
                      strokeWidth={3.5}
                      filter={ref("glow")}
                    >
                      <animate
                        attributeName="r"
                        values="28;31;28"
                        dur="1.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                ) : (
                  <g>
                    <circle cx={x} cy={y} r={14} fill={JADE} opacity={0.18}>
                      <animate
                        attributeName="r"
                        values="10;16;10"
                        dur="1.6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={x}
                      cy={y}
                      r={7}
                      fill={JADE}
                      stroke="#d1fae5"
                      strokeWidth={1.5}
                      filter={ref("glow")}
                    />
                  </g>
                ))}

              {p && (
                <g
                  transform={`translate(${x} ${y - (isSel ? 4 : 0)}) scale(${isSel ? 1.1 : 1})`}
                  style={{ transition: "transform .15s ease" }}
                >
                  {isSel && (
                    <circle
                      r={31}
                      fill="none"
                      stroke={GOLD}
                      strokeWidth={3}
                      filter={ref("glow")}
                    >
                      <animate
                        attributeName="opacity"
                        values="1;0.4;1"
                        dur="1.3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <g filter={ref("shadow")}>
                    {/* rim */}
                    <circle r={25.5} fill={ref(isRed ? "rimR" : "rimB")} />
                    {/* wood face */}
                    <circle r={22.5} fill={ref("disc")} />
                  </g>
                  <circle
                    r={22.5}
                    fill="none"
                    stroke="#fff8e1"
                    strokeWidth={1}
                    opacity={0.7}
                  />
                  {/* engraved inner ring */}
                  <circle
                    r={18.5}
                    fill="none"
                    stroke={ink}
                    strokeWidth={1.6}
                    opacity={0.9}
                  />
                  <circle
                    r={20.3}
                    fill="none"
                    stroke={ink}
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                  {/* carved glyph: highlight + ink */}
                  <text
                    x={0.8}
                    y={10.2}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={700}
                    fontFamily={SERIF}
                    fill="#fff7dc"
                    opacity={0.9}
                  >
                    {CH[p.type][isRed ? 0 : 1]}
                  </text>
                  <text
                    y={9}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={700}
                    fontFamily={SERIF}
                    fill={ink}
                  >
                    {CH[p.type][isRed ? 0 : 1]}
                  </text>
                  {/* gloss */}
                  <ellipse
                    cx={-6}
                    cy={-12}
                    rx={10}
                    ry={4.5}
                    fill="#fff"
                    opacity={0.28}
                    transform="rotate(-25 -6 -12)"
                  />
                </g>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
