"use client";
import { useEffect, useRef, useState } from "react";
import { Xiangqi } from "@/lib/xiangqi";
import Board from "@/components/Board";
import { AI_LEVELS, bestMove } from "@/lib/ai";
import { START_FEN } from "@/lib/types";

export default function PlayAI() {
  const [fen, setFen] = useState(START_FEN);
  const [last, setLast] = useState<{ from: string; to: string } | null>(null);
  const [level, setLevel] = useState(1);
  const [thinking, setThinking] = useState(false);
  const hist = useRef<string[]>([START_FEN]);
  const g = new Xiangqi(fen);
  const over = g.game_over();

  const apply = (from: string, to: string) => {
    const x = new Xiangqi(fen); const m = x.move({ from, to });
    if (!m) return; hist.current.push(x.fen()); setFen(x.fen()); setLast({ from, to });
  };
  useEffect(() => {
    if (g.turn() !== "b" || over) return;
    setThinking(true);
    const t = setTimeout(() => { const m = bestMove(fen, level); if (m) apply(m.from, m.to); setThinking(false); }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const undo = () => { if (hist.current.length >= 3) { hist.current.length -= 2; setFen(hist.current.at(-1)!); setLast(null); } };
  const status = g.in_checkmate() ? (g.turn() === "b" ? "Bạn thắng! 🎉" : "Máy thắng") : over ? "Hòa / kết thúc" : thinking ? "Máy đang nghĩ…" : g.in_check() ? "Chiếu tướng!" : "Lượt của bạn (Đỏ)";
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <Board fen={fen} playAs="r" last={last} onMove={apply} />
      <div className="space-y-3">
        <p className="text-xl font-bold">{status}</p>
        <select className="input" value={level} onChange={(e) => setLevel(+e.target.value)}>
          {AI_LEVELS.map((l, i) => <option key={l.name} value={i}>{l.name}</option>)}
        </select>
        <button className="btn-ghost w-full" onClick={undo}>Đi lại</button>
        <button className="btn w-full" onClick={() => { hist.current = [START_FEN]; setFen(START_FEN); setLast(null); }}>Ván mới</button>
      </div>
    </div>
  );
}
