import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { handle, hashPass, requireUser } from "@/lib/server";
import { INITIAL_TIME, START_FEN } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const u = await requireUser(req);
    const { name, password, side } = await req.json();
    const code = randomBytes(3).toString("hex");
    const red =
      side === "black" ? false : side === "red" ? true : Math.random() < 0.5;
    await adminDb.doc(`rooms/${code}`).set({
      code,
      name: String(name || "Xiangqi Room").slice(0, 40),
      hasPass: !!password,
      isQuick: false,
      hostUid: u.uid,
      redUid: red ? u.uid : null,
      blackUid: red ? null : u.uid,
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
    if (password)
      await adminDb
        .doc(`rooms_private/${code}`)
        .set({ passHash: hashPass(String(password)) });
    return NextResponse.json({ code });
  } catch (e) {
    return handle(e);
  }
}
