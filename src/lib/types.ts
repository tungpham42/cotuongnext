export const START_FEN =
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1";
export const INITIAL_TIME = 10 * 60 * 1000; // 10 min per side
export const MOVE_LIMIT = 120 * 1000; // 120 s per move

export interface Room {
  code: string;
  name: string;
  hasPass: boolean;
  isQuick: boolean;
  hostUid: string;
  redUid: string | null;
  blackUid: string | null;
  status: "waiting" | "playing" | "finished";
  result: "red" | "black" | "draw" | null;
  reason: string | null;
  fen: string;
  moves: string[];
  lastMove: { from: string; to: string } | null;
  redTime: number;
  blackTime: number;
  lastMoveAt: number;
  drawOffer: "r" | "b" | null;
  createdAt: number;
}
export interface Profile {
  uid: string;
  name: string;
  photo: string | null;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  karma: number;
}
export const TIERS = [
  { min: 0, key: "bronze", icon: "🛡️" },
  { min: 100, key: "silver", icon: "⭐" },
  { min: 300, key: "gold", icon: "🏅" },
  { min: 700, key: "platinum", icon: "🏆" },
  { min: 1500, key: "diamond", icon: "💎" },
  { min: 3000, key: "legend", icon: "👑" },
];
export const tierOf = (karma: number) =>
  [...TIERS].reverse().find((t) => karma >= t.min)!;
