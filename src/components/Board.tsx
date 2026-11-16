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

// Palette — Hương (padauk) wood, carved ink, gold highlight, jade hints
const INK = "#2a1309"; // engraved lines on the board
const RED = "#b3121b"; // seal
const NUM_RED = "#7a0a10"; // carved red numerals
const NUM_BLK = "#1d0e07"; // carved black numerals
const PIECE_RED = "#9a0b13"; // red glyph ink on pieces
const BLACK = "#1b0f08"; // black glyph ink on pieces
const CARVE_LIGHT = "#f3b987"; // light lip under every carved groove
const GOLD = "#ffd24d";
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

  // Engraved line: dark groove + a faint light lip just below it.
  const line = (
    a: [number, number],
    b: [number, number],
    k: string,
    w = 1.5,
  ) => (
    <g key={k} strokeLinecap="round">
      <line
        x1={a[0]}
        y1={a[1]}
        x2={b[0]}
        y2={b[1]}
        stroke={CARVE_LIGHT}
        strokeWidth={w}
        opacity={0.38}
        transform="translate(0.6 0.9)"
      />
      <line
        x1={a[0]}
        y1={a[1]}
        x2={b[0]}
        y2={b[1]}
        stroke={INK}
        strokeWidth={w}
        opacity={0.92}
      />
    </g>
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
    const d = parts.join("");
    return (
      <g
        key={`m${file}${rank}`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d={d}
          stroke={CARVE_LIGHT}
          strokeWidth={1.4}
          opacity={0.38}
          transform="translate(0.6 0.9)"
        />
        <path d={d} stroke={INK} strokeWidth={1.4} opacity={0.92} />
      </g>
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
      <g key={k} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* dark underlay keeps the gold readable on warm wood */}
        <path d={d} stroke="#2a0f05" strokeWidth={6} opacity={0.45} />
        <path d={d} stroke={GOLD} strokeWidth={3.5} filter={ref("glow")} />
      </g>
    );
  };

  // Soft "figure" swirls that run along the slab, like the wavy bands of real Hương
  const figure = [
    { x: 0.12, bend: -0.08, w: 14, o: 0.07 },
    { x: 0.31, bend: 0.1, w: 6, o: 0.09 },
    { x: 0.52, bend: -0.12, w: 18, o: 0.06 },
    { x: 0.7, bend: 0.07, w: 8, o: 0.08 },
    { x: 0.88, bend: -0.09, w: 12, o: 0.07 },
  ];

  const rects = { x: 0, y: 0, width: W, height: H };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: boardWidth(reserved) }}
      className="mx-auto block h-auto w-full max-w-[560px] touch-manipulation select-none drop-shadow-[0_20px_30px_rgba(50,15,0,0.5)] md:mx-0"
    >
      <defs>
        <clipPath id={id("slab")}>
          <rect {...rects} rx={16} />
        </clipPath>

        {/* ---- Solid Hương slab ---- */}
        <linearGradient id={id("wood")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cb7440" />
          <stop offset="0.35" stopColor="#b65c2c" />
          <stop offset="0.7" stopColor="#c0652f" />
          <stop offset="1" stopColor="#9b4821" />
        </linearGradient>
        <radialGradient id={id("vig")} cx="0.5" cy="0.5" r="0.78">
          <stop offset="0.6" stopColor="#3a1206" stopOpacity="0" />
          <stop offset="1" stopColor="#3a1206" stopOpacity="0.5" />
        </radialGradient>
        {/* Oil-polish sheen */}
        <linearGradient id={id("sheen")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.28" stopColor="#ffe2bd" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#ffe2bd" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* Chamfered edge of the block: light on top-left, dark on bottom-right */}
        <linearGradient id={id("bevel")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5b27a" />
          <stop offset="0.5" stopColor="#7a3112" />
          <stop offset="1" stopColor="#2e0f05" />
        </linearGradient>

        {/* Grain: broad dark bands, light bands, fine pores — all running lengthwise */}
        <filter id={id("grainBand")} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.0035"
            numOctaves="3"
            seed="11"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.2  0 0 0 0 0.05  0 0 0 0 0.02  0 0 0 2.6 -1.05"
          />
        </filter>
        <filter id={id("grainLight")} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.1 0.006"
            numOctaves="2"
            seed="19"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.98  0 0 0 0 0.6  0 0 0 0 0.32  0 0 0 2.4 -1.12"
          />
        </filter>
        <filter id={id("grainFine")} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.6 0.014"
            numOctaves="2"
            seed="3"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.16  0 0 0 0 0.04  0 0 0 0 0.01  0 0 0 2.4 -0.95"
          />
        </filter>

        {/* ---- Hương pieces ---- */}
        <radialGradient id={id("faceR")} cx="0.38" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#f6c892" />
          <stop offset="0.5" stopColor="#dd9355" />
          <stop offset="1" stopColor="#b9622c" />
        </radialGradient>
        <radialGradient id={id("faceB")} cx="0.38" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#e9b27c" />
          <stop offset="0.5" stopColor="#c47a3e" />
          <stop offset="1" stopColor="#97491f" />
        </radialGradient>
        <radialGradient id={id("rimR")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.78" stopColor="#8a2a12" />
          <stop offset="1" stopColor="#3c1206" />
        </radialGradient>
        <radialGradient id={id("rimB")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.78" stopColor="#4a2210" />
          <stop offset="1" stopColor="#1a0a04" />
        </radialGradient>
        {/* Turned edge of each disc */}
        <linearGradient id={id("side")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6c08a" />
          <stop offset="0.55" stopColor="#8a3a16" />
          <stop offset="1" stopColor="#3a1307" />
        </linearGradient>
        {/* Cheap, reusable wood grain for the pieces (rotated per piece below) */}
        <pattern
          id={id("pgrain")}
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <g fill="none" strokeLinecap="round">
            <path
              d="M3 0q3 7.5 0 15t0 15"
              stroke="#5a2410"
              strokeWidth="0.7"
              opacity="0.38"
            />
            <path
              d="M10 0q-3 7.5 0 15t0 15"
              stroke="#5a2410"
              strokeWidth="0.5"
              opacity="0.28"
            />
            <path
              d="M16.5 0q2.5 7.5 0 15t0 15"
              stroke="#4a1a08"
              strokeWidth="1.1"
              opacity="0.3"
            />
            <path
              d="M22 0q-2 7.5 0 15t0 15"
              stroke="#6a2c10"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <path
              d="M27.5 0q1.5 7.5 0 15t0 15"
              stroke="#5a2410"
              strokeWidth="0.8"
              opacity="0.32"
            />
            <path
              d="M13 0q1 7.5 0 15t0 15"
              stroke="#f3b987"
              strokeWidth="0.6"
              opacity="0.25"
            />
            <path
              d="M25 0q-1 7.5 0 15t0 15"
              stroke="#f3b987"
              strokeWidth="0.5"
              opacity="0.22"
            />
          </g>
        </pattern>

        <filter id={id("shadow")} x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="2.2"
            floodColor="#2b1200"
            floodOpacity="0.55"
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
          <stop offset="0" stopColor="#3a1206" stopOpacity="0" />
          <stop offset="0.5" stopColor="#3a1206" stopOpacity="0.2" />
          <stop offset="1" stopColor="#3a1206" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ---- One solid block of Hương ---- */}
      <g clipPath={ref("slab")}>
        <rect {...rects} fill={ref("wood")} />
        <rect {...rects} filter={ref("grainBand")} opacity={0.6} />
        <rect {...rects} filter={ref("grainLight")} opacity={0.5} />
        <rect {...rects} filter={ref("grainFine")} opacity={0.5} />
        {figure.map((f, i) => {
          const x = W * f.x;
          const dx = W * f.bend;
          return (
            <path
              key={`fg${i}`}
              d={`M${x} 0C${x + dx} ${H * 0.3} ${x - dx} ${H * 0.65} ${x + dx * 0.4} ${H}`}
              fill="none"
              stroke="#4a1a08"
              strokeWidth={f.w}
              strokeLinecap="round"
              opacity={f.o}
            />
          );
        })}
        <rect {...rects} fill={ref("sheen")} />
        <rect {...rects} fill={ref("vig")} />
      </g>
      {/* chamfered edge */}
      <rect
        x={1.25}
        y={1.25}
        width={W - 2.5}
        height={H - 2.5}
        rx={15}
        fill="none"
        stroke={ref("bevel")}
        strokeWidth={2.5}
      />
      {/* routed groove running around the face (same wood, no separate frame) */}
      <rect
        x={10}
        y={11.2}
        width={W - 20}
        height={H - 20}
        rx={9}
        fill="none"
        stroke={CARVE_LIGHT}
        strokeWidth={1}
        opacity={0.3}
      />
      <rect
        x={10}
        y={10}
        width={W - 20}
        height={H - 20}
        rx={9}
        fill="none"
        stroke="#2a0f05"
        strokeWidth={1.8}
        opacity={0.75}
      />

      {/* ---- River (polished-in channel) ---- */}
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
          stroke="#3a1206"
          strokeWidth={1}
          opacity={0.2}
          strokeLinecap="round"
        />
      ))}

      {/* ---- Grid ---- */}
      <g>
        <rect
          x={tlx + 0.6}
          y={tly + 0.9}
          width={brx - tlx}
          height={bry - tly}
          rx={3}
          fill="none"
          stroke={CARVE_LIGHT}
          strokeWidth={3.2}
          opacity={0.38}
        />
        <rect
          x={tlx}
          y={tly}
          width={brx - tlx}
          height={bry - tly}
          rx={3}
          fill="none"
          stroke={INK}
          strokeWidth={3.2}
          opacity={0.92}
        />
      </g>
      {els}
      {markers}

      {/* River calligraphy (carved) */}
      {[
        { dx: 0.8, dy: 1.1, fill: CARVE_LIGHT, opacity: 0.45 },
        { dx: 0, dy: 0, fill: INK, opacity: 0.88 },
      ].map((t, i) => (
        <g
          key={`rv${i}`}
          fontFamily={SERIF}
          fontSize={30}
          fontWeight={700}
          fill={t.fill}
          opacity={t.opacity}
          textAnchor="middle"
          letterSpacing={6}
        >
          <text x={M + CELL * 2 + t.dx} y={M + CELL * 4.5 + 10 + t.dy}>
            楚 河
          </text>
          <text x={M + CELL * 6 + t.dx} y={M + CELL * 4.5 + 10 + t.dy}>
            漢 界
          </text>
        </g>
      ))}
      {/* Red seal */}
      <g transform={`translate(${W / 2 - 14} ${M + CELL * 4.5 - 14})`}>
        <rect
          width={28}
          height={28}
          rx={4}
          fill={RED}
          stroke="#5a070b"
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

      {/* Coordinate numerals (carved) */}
      <g fontFamily={SERIF} fontSize={16} fontWeight={700} textAnchor="middle">
        {topNums.map((n, i) => (
          <g key={`t${i}`}>
            <text
              x={M + i * CELL + 0.7}
              y={M - 20 + 0.9}
              fill={CARVE_LIGHT}
              opacity={0.45}
            >
              {n}
            </text>
            <text
              x={M + i * CELL}
              y={M - 20}
              fill={topIsRed ? NUM_RED : NUM_BLK}
              opacity={0.92}
            >
              {n}
            </text>
          </g>
        ))}
        {botNums.map((n, i) => (
          <g key={`b${i}`}>
            <text
              x={M + i * CELL + 0.7}
              y={H - M + 29 + 0.9}
              fill={CARVE_LIGHT}
              opacity={0.45}
            >
              {n}
            </text>
            <text
              x={M + i * CELL}
              y={H - M + 29}
              fill={topIsRed ? NUM_BLK : NUM_RED}
              opacity={0.92}
            >
              {n}
            </text>
          </g>
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
              <circle cx={x} cy={y} r={24} fill={GOLD} opacity={0.22} />
              <circle
                cx={x}
                cy={y}
                r={24}
                fill="none"
                stroke={GOLD}
                strokeWidth={2}
                strokeDasharray="4 5"
                opacity={0.95}
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
          const ink = isRed ? PIECE_RED : BLACK;
          // Give every piece its own grain direction / offset
          const rot = ((ci * 53 + ri * 97) % 12) * 15;
          const tx = (ci * 7 + ri * 11) % 30;
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
                    <circle cx={x} cy={y} r={14} fill={JADE} opacity={0.22}>
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
                    {/* turned rim */}
                    <circle r={25.5} fill={ref(isRed ? "rimR" : "rimB")} />
                    {/* chamfer */}
                    <circle
                      r={24}
                      fill="none"
                      stroke={ref("side")}
                      strokeWidth={2.4}
                    />
                    {/* Hương wood face */}
                    <circle r={22.5} fill={ref(isRed ? "faceR" : "faceB")} />
                  </g>
                  {/* grain on the face */}
                  <g transform={`rotate(${rot}) translate(${tx} 0)`}>
                    <circle
                      cx={-tx}
                      r={22.5}
                      fill={ref("pgrain")}
                      opacity={0.7}
                    />
                  </g>
                  <circle
                    r={22.5}
                    fill="none"
                    stroke="#ffd8a6"
                    strokeWidth={1}
                    opacity={0.55}
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
                  {/* carved glyph: light lip + ink */}
                  <text
                    x={0.8}
                    y={10.2}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={700}
                    fontFamily={SERIF}
                    fill="#f7cfa3"
                    opacity={0.6}
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
                    stroke={ink}
                    strokeWidth={0.4}
                  >
                    {CH[p.type][isRed ? 0 : 1]}
                  </text>
                  {/* satin oil gloss */}
                  <ellipse
                    cx={-6}
                    cy={-12}
                    rx={10}
                    ry={4.5}
                    fill="#fff"
                    opacity={0.2}
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
