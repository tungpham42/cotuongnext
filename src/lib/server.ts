import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { FieldValue, Transaction } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "./firebase-admin";
import { Room } from "./types";

export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

export async function requireUser(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) throw new HttpError(401, "Chưa đăng nhập");
  try { return await adminAuth.verifyIdToken(token); }
  catch { throw new HttpError(401, "Token không hợp lệ"); }
}
export const handle = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: e instanceof HttpError ? e.status : 500 });

/** Elo K=32, plus karma "gems" (+10 finished game, +20 extra for a win). */
export function finishGame(
  tx: Transaction, room: Room, players: Record<string, any>,
  result: "red" | "black" | "draw", reason: string
): Partial<Room> {
  const r = players[room.redUid!], b = players[room.blackUid!];
  const er = r?.elo ?? 1200, eb = b?.elo ?? 1200;
  const expR = 1 / (1 + 10 ** ((eb - er) / 400));
  const sR = result === "red" ? 1 : result === "draw" ? 0.5 : 0;
  const K = 32;
  const upd = (uid: string, elo: number, s: number) =>
    tx.set(adminDb.doc(`users/${uid}`), {
      elo: Math.round(elo),
      wins: FieldValue.increment(s === 1 ? 1 : 0),
      losses: FieldValue.increment(s === 0 ? 1 : 0),
      draws: FieldValue.increment(s === 0.5 ? 1 : 0),
      karma: FieldValue.increment(10 + (s === 1 ? 20 : 0)),
    }, { merge: true });
  upd(room.redUid!, er + K * (sR - expR), sR);
  upd(room.blackUid!, eb + K * ((1 - sR) - (1 - expR)), 1 - sR);
  return { status: "finished", result, reason };
}
export const hashPass = (p: string) => createHash("sha256").update(p).digest("hex");
