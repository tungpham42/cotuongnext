import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { FieldValue, Transaction } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "./firebase-admin";
import { INITIAL_TIME, Room, START_FEN } from "./types";

export class HttpError extends Error {
  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg);
  }
}

export async function requireUser(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) throw new HttpError(401, "NOT_SIGNED_IN");
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    throw new HttpError(401, "INVALID_TOKEN");
  }
}
export const handle = (e: unknown) =>
  NextResponse.json(
    { error: e instanceof HttpError ? e.message : "UNKNOWN" },
    { status: e instanceof HttpError ? e.status : 500 },
  );

/** Elo K=32, plus karma "gems" (+10 finished game, +20 extra for a win). */
export function finishGame(
  tx: Transaction,
  room: Room,
  players: Record<string, any>,
  result: "red" | "black" | "draw",
  reason: string,
): Partial<Room> {
  const r = players[room.redUid!],
    b = players[room.blackUid!];
  const er = r?.elo ?? 1200,
    eb = b?.elo ?? 1200;
  const expR = 1 / (1 + 10 ** ((eb - er) / 400));
  const sR = result === "red" ? 1 : result === "draw" ? 0.5 : 0;
  const K = 32;
  const upd = (uid: string, elo: number, s: number) =>
    tx.set(
      adminDb.doc(`users/${uid}`),
      {
        elo: Math.round(elo),
        wins: FieldValue.increment(s === 1 ? 1 : 0),
        losses: FieldValue.increment(s === 0 ? 1 : 0),
        draws: FieldValue.increment(s === 0.5 ? 1 : 0),
        karma: FieldValue.increment(10 + (s === 1 ? 20 : 0)),
      },
      { merge: true },
    );
  upd(room.redUid!, er + K * (sR - expR), sR);
  upd(room.blackUid!, eb + K * (1 - sR - (1 - expR)), 1 - sR);
  return { status: "finished", result, reason };
}
/**
 * Load both players' profiles inside a transaction. Only needed when a game is
 * about to finish (Elo update), so callers should not read them on every move.
 */
export async function loadPlayers(tx: Transaction, room: Room) {
  const uids = [room.redUid, room.blackUid].filter(Boolean) as string[];
  const snaps = await Promise.all(
    uids.map((id) => tx.get(adminDb.doc(`users/${id}`))),
  );
  return Object.fromEntries(snaps.map((s) => [s.id, s.data()])) as Record<
    string,
    any
  >;
}

/** Finish the game: load the players, then apply Elo/karma and build the update. */
export async function settleGame(
  tx: Transaction,
  room: Room,
  result: "red" | "black" | "draw",
  reason: string,
) {
  return finishGame(tx, room, await loadPlayers(tx, room), result, reason);
}

/**
 * Board/clock state for a fresh game. Used to reset an existing room for a
 * rematch, so the same room (code, chat, spectators) carries on.
 */
export const freshGameState = (now: number): Partial<Room> => ({
  status: "playing",
  result: null,
  reason: null,
  fen: START_FEN,
  moves: [],
  lastMove: null,
  redTime: INITIAL_TIME,
  blackTime: INITIAL_TIME,
  lastMoveAt: now,
  drawOffer: null,
  rematchOffer: null,
});
export const hashPass = (p: string) =>
  createHash("sha256").update(p).digest("hex");
