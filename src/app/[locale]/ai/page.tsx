"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Xiangqi } from "@/lib/xiangqi";
import Board from "@/components/Board";
import { AI_LEVELS, bestMove } from "@/lib/ai";
import { disposeEngine } from "@/lib/pikafish";
import { START_FEN } from "@/lib/types";

const COI_RELOAD_KEY = "coi-reload";

export default function PlayAI() {
  const t = useTranslations("ai");
  const [fen, setFen] = useState(START_FEN);
  const [last, setLast] = useState<{ from: string; to: string } | null>(null);
  const [level, setLevel] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [loadPct, setLoadPct] = useState<number | null>(null); // Pikafish network download, 0-100
  const [fallback, setFallback] = useState(false); // true once the built-in AI had to step in
  const hist = useRef<string[]>([START_FEN]);
  const moves = useRef<string[]>([]); // UCCI moves since START_FEN, so Pikafish sees the whole game
  const levelRef = useRef(level);
  levelRef.current = level;
  const g = new Xiangqi(fen);
  const over = g.game_over();

  // Pikafish needs a cross-origin isolated page (headers set in next.config.mjs for this route only).
  // Client-side navigation keeps the old, non-isolated document, so reload once to pick the headers up.
  useEffect(() => {
    try {
      if (window.crossOriginIsolated) return sessionStorage.removeItem(COI_RELOAD_KEY);
      if (sessionStorage.getItem(COI_RELOAD_KEY)) return; // already tried: browser can't isolate, use fallback
      sessionStorage.setItem(COI_RELOAD_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  }, []);
  // Free the worker and its WebAssembly heap when leaving the page.
  useEffect(() => disposeEngine, []);

  const apply = (from: string, to: string) => {
    const x = new Xiangqi(fen);
    const m = x.move({ from, to });
    if (!m) return;
    hist.current.push(x.fen());
    moves.current.push(from + to);
    setFen(x.fen());
    setLast({ from, to });
  };
  useEffect(() => {
    if (g.turn() !== "b" || over) {
      setThinking(false);
      return;
    }
    setThinking(true);
    const ctl = new AbortController();
    // Small delay so the player's move renders before the engine starts working.
    const timer = setTimeout(() => {
      bestMove(START_FEN, moves.current, levelRef.current, ctl.signal, setLoadPct)
        .then((m) => {
          if (ctl.signal.aborted) return;
          if (m) {
            if (m.engine === "fallback") setFallback(true);
            apply(m.from, m.to);
          }
          setThinking(false);
        })
        .catch(() => {
          if (!ctl.signal.aborted) setThinking(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      ctl.abort(); // new game / undo / unmount: stop the search in progress
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const undo = () => {
    if (hist.current.length >= 3) {
      hist.current.length -= 2;
      moves.current.length -= 2;
      setFen(hist.current.at(-1)!);
      setLast(null);
    }
  };
  const loading = thinking && loadPct !== null && loadPct < 100;
  const status = g.in_checkmate()
    ? g.turn() === "b"
      ? t("youWin")
      : t("computerWins")
    : over
      ? t("draw")
      : loading
        ? t("loadingEngine", { pct: loadPct })
        : thinking
          ? t("thinking")
          : g.in_check()
            ? t("check")
            : t("yourTurn");
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <Board fen={fen} playAs="r" last={last} onMove={apply} />
      <div className="space-y-3">
        <p className="text-xl font-bold">{status}</p>
        <select
          className="input"
          value={level}
          onChange={(e) => setLevel(+e.target.value)}
        >
          {AI_LEVELS.map((l, i) => (
            <option key={l.key} value={i}>
              {t(`levels.${l.key}`)}
            </option>
          ))}
        </select>
        <button className="btn-ghost w-full" onClick={undo}>
          {t("undo")}
        </button>
        <button
          className="btn w-full"
          onClick={() => {
            hist.current = [START_FEN];
            moves.current = [];
            setFen(START_FEN);
            setLast(null);
          }}
        >
          {t("newGame")}
        </button>
        {fallback && <p className="text-sm opacity-70">{t("fallbackNote")}</p>}
      </div>
    </div>
  );
}
