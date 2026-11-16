import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { handle, requireUser } from "@/lib/server";
import { INITIAL_TIME, START_FEN } from "@/lib/types";

// Quick match: join the oldest waiting quick room, otherwise open one and wait.
export async function POST(req: NextRequest) {
  try {
    const u = await requireUser(req);
    const code = await adminDb.runTransaction(async (tx) => {
      const q = adminDb
        .collection("rooms")
        .where("isQuick", "==", true)
        .where("status", "==", "waiting")
        .orderBy("createdAt")
        .limit(5);
      const docs = (await tx.get(q)).docs;
      const open = docs.find((d) => d.data().hostUid !== u.uid);
      if (open) {
        const d = open.data();
        tx.update(open.ref, {
          [d.redUid ? "blackUid" : "redUid"]: u.uid,
          status: "playing",
          lastMoveAt: Date.now(),
        });
        return open.id;
      }
      const mine = docs.find((d) => d.data().hostUid === u.uid);
      if (mine) return mine.id;
      const c = randomBytes(3).toString("hex");
      tx.set(adminDb.doc(`rooms/${c}`), {
        code: c,
        name: "Quick Match",
        hasPass: false,
        isQuick: true,
        hostUid: u.uid,
        redUid: Math.random() < 0.5 ? u.uid : null,
        blackUid: null,
        status: "waiting",
        result: null,
        reason: null,
        fen: START_FEN,
        moves: [],
        lastMove: null,
        redTime: INITIAL_TIME,
        blackTime: INITIAL_TIME,
        lastMoveAt: Date.now(),
        drawOffer: null,
        rematchOffer: null,
        gameNo: 1,
        createdAt: Date.now(),
      });
      return c;
    });
    // fix-up: a host who got no red seat must sit black
    const ref = adminDb.doc(`rooms/${code}`);
    const r = (await ref.get()).data()!;
    if (!r.redUid && !r.blackUid) await ref.update({ blackUid: u.uid });
    return NextResponse.json({ code });
  } catch (e) {
    return handle(e);
  }
}
