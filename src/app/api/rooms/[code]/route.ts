import { NextRequest, NextResponse } from "next/server";
import { Xiangqi } from "@/lib/xiangqi";
import { adminDb } from "@/lib/firebase-admin";
import { finishGame, handle, hashPass, HttpError, requireUser } from "@/lib/server";
import { MOVE_LIMIT, Room } from "@/lib/types";

/** One endpoint, many actions: join | move | resign | draw-offer | draw-accept | timeout */
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const u = await requireUser(req);
    const body = await req.json();
    const ref = adminDb.doc(`rooms/${code}`);

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "Không tìm thấy phòng");
      const room = snap.data() as Room;
      const uids = [room.redUid, room.blackUid].filter(Boolean) as string[];
      const us = await Promise.all(uids.map((id) => tx.get(adminDb.doc(`users/${id}`))));
      const players = Object.fromEntries(us.map((s) => [s.id, s.data()]));
      const me: "r" | "b" | null = room.redUid === u.uid ? "r" : room.blackUid === u.uid ? "b" : null;
      const now = Date.now();
      const elapsed = now - room.lastMoveAt;
      const turn = room.fen.split(" ")[1] as "r" | "b";

      if (body.type === "join") {
        if (room.status !== "waiting" || me) throw new HttpError(400, "Không thể vào phòng");
        if (room.hasPass) {
          const p = (await tx.get(adminDb.doc(`rooms_private/${code}`))).data();
          if (p?.passHash !== hashPass(String(body.password || ""))) throw new HttpError(403, "Sai mật khẩu");
        }
        tx.update(ref, { [room.redUid ? "blackUid" : "redUid"]: u.uid, status: "playing", lastMoveAt: now });
        return;
      }
      if (!me) throw new HttpError(403, "Bạn không phải người chơi");
      if (room.status !== "playing") throw new HttpError(400, "Ván cờ không diễn ra");
      const other = me === "r" ? "black" : "red";
      const mine = me === "r" ? "red" : "black";

      switch (body.type) {
        case "move": {
          if (turn !== me) throw new HttpError(400, "Chưa đến lượt bạn");
          const left = (me === "r" ? room.redTime : room.blackTime) - elapsed;
          if (left <= 0 || elapsed > MOVE_LIMIT) {
            tx.update(ref, finishGame(tx, room, players, other, "timeout")); return;
          }
          const g = new Xiangqi(room.fen);
          const m = g.move({ from: body.from, to: body.to });
          if (!m) throw new HttpError(400, "Nước đi không hợp lệ");
          const upd: Record<string, unknown> = {
            fen: g.fen(), moves: [...room.moves, m.iccs], lastMove: { from: m.from, to: m.to },
            lastMoveAt: now, drawOffer: null,
            [me === "r" ? "redTime" : "blackTime"]: left,
          };
          if (g.in_checkmate()) Object.assign(upd, finishGame(tx, room, players, mine, "checkmate"));
          else if (g.in_stalemate()) Object.assign(upd, finishGame(tx, room, players, mine, "stalemate")); // xiangqi: stalemated side loses
          else if (g.game_over()) Object.assign(upd, finishGame(tx, room, players, "draw", "draw"));
          tx.update(ref, upd);
          return;
        }
        case "resign": tx.update(ref, finishGame(tx, room, players, other, "resign")); return;
        case "draw-offer": tx.update(ref, { drawOffer: me }); return;
        case "draw-accept":
          if (!room.drawOffer || room.drawOffer === me) throw new HttpError(400, "Không có lời cầu hòa");
          tx.update(ref, finishGame(tx, room, players, "draw", "agreement")); return;
        case "timeout": {
          const t = turn === "r" ? room.redTime : room.blackTime;
          if (t - elapsed > 0 && elapsed <= MOVE_LIMIT) throw new HttpError(400, "Chưa hết giờ");
          tx.update(ref, finishGame(tx, room, players, turn === "r" ? "black" : "red", "timeout")); return;
        }
        default: throw new HttpError(400, "Hành động không hợp lệ");
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) { return handle(e); }
}
