import { NextRequest, NextResponse } from "next/server";
import { Xiangqi } from "@/lib/xiangqi";
import { adminDb } from "@/lib/firebase-admin";
import {
  finishGame,
  freshGameState,
  handle,
  hashPass,
  HttpError,
  requireUser,
} from "@/lib/server";
import { MOVE_LIMIT, Room } from "@/lib/types";

/**
 * One endpoint, many actions:
 * join | move | resign | draw-offer | draw-accept | timeout | rematch | rematch-decline
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const u = await requireUser(req);
    const body = await req.json();
    const ref = adminDb.doc(`rooms/${code}`);

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "ROOM_NOT_FOUND");
      const room = snap.data() as Room;
      const uids = [room.redUid, room.blackUid].filter(Boolean) as string[];
      const us = await Promise.all(
        uids.map((id) => tx.get(adminDb.doc(`users/${id}`))),
      );
      const players = Object.fromEntries(us.map((s) => [s.id, s.data()]));
      const me: "r" | "b" | null =
        room.redUid === u.uid ? "r" : room.blackUid === u.uid ? "b" : null;
      const now = Date.now();
      const elapsed = now - room.lastMoveAt;
      const turn = room.fen.split(" ")[1] as "r" | "b";

      if (body.type === "join") {
        if (room.status !== "waiting" || me)
          throw new HttpError(400, "CANNOT_JOIN");
        if (room.hasPass) {
          const p = (await tx.get(adminDb.doc(`rooms_private/${code}`))).data();
          if (p?.passHash !== hashPass(String(body.password || "")))
            throw new HttpError(403, "WRONG_PASSWORD");
        }
        tx.update(ref, {
          [room.redUid ? "blackUid" : "redUid"]: u.uid,
          status: "playing",
          lastMoveAt: now,
        });
        return;
      }

      // Anyone signed in (a spectator, or the lobby) may report an expired
      // clock: the server re-checks it here, so a game whose players have both
      // left still gets settled instead of showing "in progress" forever.
      if (body.type === "timeout") {
        if (room.status !== "playing")
          throw new HttpError(400, "GAME_NOT_ACTIVE");
        const t = turn === "r" ? room.redTime : room.blackTime;
        if (t - elapsed > 0 && elapsed <= MOVE_LIMIT)
          throw new HttpError(400, "TIME_NOT_UP");
        tx.update(
          ref,
          finishGame(
            tx,
            room,
            players,
            turn === "r" ? "black" : "red",
            "timeout",
          ),
        );
        return;
      }

      if (!me) throw new HttpError(403, "NOT_A_PLAYER");

      // Rematch: only once the game is over, and it reuses this same room.
      if (body.type === "rematch" || body.type === "rematch-decline") {
        if (room.status !== "finished")
          throw new HttpError(400, "GAME_NOT_FINISHED");
        if (body.type === "rematch-decline") {
          // Either player can decline the other's offer or withdraw their own.
          tx.update(ref, { rematchOffer: null });
          return;
        }
        if (room.rematchOffer && room.rematchOffer !== me) {
          // Opponent already asked: start the next game, swapping colours.
          tx.update(ref, {
            ...freshGameState(now),
            redUid: room.blackUid,
            blackUid: room.redUid,
            gameNo: (room.gameNo ?? 1) + 1,
          });
          return;
        }
        tx.update(ref, { rematchOffer: me });
        return;
      }

      if (room.status !== "playing" && body.type !== "rematch")
        throw new HttpError(400, "GAME_NOT_ACTIVE");
      const other = me === "r" ? "black" : "red";
      const mine = me === "r" ? "red" : "black";

      switch (body.type) {
        case "move": {
          if (turn !== me) throw new HttpError(400, "NOT_YOUR_TURN");
          const left = (me === "r" ? room.redTime : room.blackTime) - elapsed;
          if (left <= 0 || elapsed > MOVE_LIMIT) {
            tx.update(ref, finishGame(tx, room, players, other, "timeout"));
            return;
          }
          const g = new Xiangqi(room.fen);
          const m = g.move({ from: body.from, to: body.to });
          if (!m) throw new HttpError(400, "INVALID_MOVE");
          const upd: Record<string, unknown> = {
            fen: g.fen(),
            moves: [...room.moves, m.iccs],
            lastMove: { from: m.from, to: m.to },
            lastMoveAt: now,
            drawOffer: null,
            [me === "r" ? "redTime" : "blackTime"]: left,
          };
          if (g.in_checkmate())
            Object.assign(
              upd,
              finishGame(tx, room, players, mine, "checkmate"),
            );
          else if (g.in_stalemate())
            Object.assign(
              upd,
              finishGame(tx, room, players, mine, "stalemate"),
            );
          // xiangqi: stalemated side loses
          else if (g.game_over())
            Object.assign(upd, finishGame(tx, room, players, "draw", "draw"));
          tx.update(ref, upd);
          return;
        }
        case "resign":
          tx.update(ref, finishGame(tx, room, players, other, "resign"));
          return;
        case "draw-offer":
          tx.update(ref, { drawOffer: me });
          return;
        case "draw-accept":
          if (!room.drawOffer || room.drawOffer === me)
            throw new HttpError(400, "NO_DRAW_OFFER");
          tx.update(ref, finishGame(tx, room, players, "draw", "agreement"));
          return;
        default:
          throw new HttpError(400, "INVALID_ACTION");
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handle(e);
  }
}
