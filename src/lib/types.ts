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
  /** Who asked for a rematch once the game is finished (absent on older rooms). */
  rematchOffer?: "r" | "b" | null;
  /** How many games have been played in this room (absent on older rooms = 1). */
  gameNo?: number;
  createdAt: number;
}

/**
 * True when a "playing" room has run out of time (either the side to move has
 * no clock left or the per-move limit passed) but nobody has settled it yet.
 * Timeouts are only recorded when somebody reports them, so abandoned rooms
 * stay "playing" in the database until a client calls the timeout action.
 */
export const isExpired = (room: Room, now: number) => {
  if (room.status !== "playing") return false;
  const elapsed = now - room.lastMoveAt;
  const turn = room.fen.split(" ")[1];
  const clock = turn === "r" ? room.redTime : room.blackTime;
  return clock - elapsed <= 0 || elapsed > MOVE_LIMIT;
};

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
/**
 * Guests are stored as "Guest-AB12" (or plain "Guest"); see /api/me. There is
 * no separate flag on the profile, so the name is how we recognise them.
 */
export const isGuestName = (name?: string | null) =>
  !!name && /^Guest(?:-[0-9A-Za-z]{4})?$/.test(name);
export const TIERS = [
  { min: 0, key: "bronze", icon: "shield" as const },
  { min: 100, key: "silver", icon: "star" as const },
  { min: 300, key: "gold", icon: "medal" as const },
  { min: 700, key: "platinum", icon: "trophy" as const },
  { min: 1500, key: "diamond", icon: "gem" as const },
  { min: 3000, key: "legend", icon: "crown" as const },
];
export const tierOf = (karma: number) =>
  [...TIERS].reverse().find((t) => karma >= t.min)!;
