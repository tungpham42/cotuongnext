"use client";
import { use, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Board, { boardWidth } from "@/components/Board";
import { useAuth } from "@/components/AuthProvider";
import { api, db } from "@/lib/firebase";
import { MOVE_LIMIT, Profile, Room } from "@/lib/types";
import { useApiError } from "@/lib/useApiError";
import { useDisplayName } from "@/lib/useDisplayName";

// Vertical space used by nav + page padding + the two player labels (keeps the board on-screen).
const ROOM_RESERVED = "13rem";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { user, ready } = useAuth();
  const t = useTranslations("room");
  const tReason = useTranslations("reasons");
  const tLobby = useTranslations("lobby");
  const apiError = useApiError();
  const dn = useDisplayName();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [names, setNames] = useState<Record<string, Profile>>({});
  const [msgs, setMsgs] = useState<
    { id: string; name: string; text: string }[]
  >([]);
  const [text, setText] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (user)
      return onSnapshot(doc(db, "rooms", code), (s) =>
        setRoom(s.exists() ? (s.data() as Room) : null),
      );
  }, [user, code]);
  useEffect(() => {
    if (user)
      return onSnapshot(
        query(
          collection(db, "rooms", code, "messages"),
          orderBy("at", "desc"),
          limit(50),
        ),
        (s) =>
          setMsgs(
            s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).reverse(),
          ),
      );
  }, [user, code]);
  useEffect(() => {
    if (!room) return;
    [room.redUid, room.blackUid]
      .filter(Boolean)
      .forEach((u) =>
        onSnapshot(
          doc(db, "users", u!),
          (s) =>
            s.exists() &&
            setNames((n) => ({ ...n, [u!]: s.data() as Profile })),
        ),
      );
  }, [room?.redUid, room?.blackUid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const act = (type: string, extra: object = {}) =>
    api(`/api/rooms/${code}`, { type, ...extra }).catch((e) =>
      setErr(apiError(e)),
    );

  // Whoever is playing reports timeouts; the server re-checks the clock.
  const me =
    room && user
      ? room.redUid === user.uid
        ? "r"
        : room.blackUid === user.uid
          ? "b"
          : null
      : null;
  const turn = room?.fen.split(" ")[1] as "r" | "b" | undefined;
  const elapsed = room ? now - room.lastMoveAt : 0;
  const left = (c: "r" | "b") =>
    room
      ? (c === "r" ? room.redTime : room.blackTime) -
        (room.status === "playing" && turn === c ? elapsed : 0)
      : 0;
  const perMove = room && room.status === "playing" ? MOVE_LIMIT - elapsed : 0;
  useEffect(() => {
    if (me && room?.status === "playing" && (left(turn!) <= 0 || perMove <= 0))
      act("timeout");
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (ready && !user)
    return (
      <p>
        {t.rich("signInPrompt", {
          link: (chunks) => (
            <Link href="/login" className="text-amber-400 underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    );
  if (room === undefined) return <p>{t("loading")}</p>;
  if (room === null) return <p>{t("notFound")}</p>;

  const flipped = me === "b";
  const label = (c: "r" | "b") => {
    const uid = c === "r" ? room.redUid : room.blackUid;
    const p = uid ? names[uid] : null;
    return (
      <div
        className={`flex justify-between rounded-lg px-4 py-2 ${turn === c && room.status === "playing" ? "bg-amber-700" : "bg-stone-800"}`}
      >
        <span>
          {c === "r" ? "🔴" : "⚫"}{" "}
          {p ? `${dn(p.name)} (${p.elo})` : t("waitingSeat")}
        </span>
        <span className="font-mono text-lg">{fmt(left(c))}</span>
      </div>
    );
  };
  const result =
    room.result === "draw"
      ? t("resultDraw")
      : room.result === "red"
        ? t("resultRed")
        : room.result === "black"
          ? t("resultBlack")
          : "";
  const reason =
    room.reason && tReason.has(room.reason)
      ? tReason(room.reason)
      : (room.reason ?? "");

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,560px)_1fr]">
      <div
        className="mx-auto space-y-2 md:mx-0"
        style={{ width: boardWidth(ROOM_RESERVED), maxWidth: "100%" }}
      >
        {label(flipped ? "r" : "b")}
        <Board
          fen={room.fen}
          flipped={flipped}
          last={room.lastMove}
          reserved={ROOM_RESERVED}
          playAs={room.status === "playing" ? me : null}
          onMove={(from, to) => act("move", { from, to })}
        />
        {label(flipped ? "b" : "r")}
      </div>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">
          {room.isQuick ? tLobby("quickRoomName") : room.name}{" "}
          <span className="text-stone-400">#{room.code}</span>
        </h1>
        {!me && room.status !== "playing" && (
          <p className="text-stone-400">{t("spectating")}</p>
        )}
        {room.status === "playing" && (
          <p className="text-sm text-stone-400">
            {t("moveTimeLeft", {
              time: fmt(perMove),
              max: MOVE_LIMIT / 1000,
            })}
          </p>
        )}
        {room.status === "finished" && (
          <p className="text-xl font-bold text-amber-400">
            {t("finishedLine", { result, reason })}
          </p>
        )}
        {room.status === "waiting" && !me && (
          <div className="flex gap-2">
            {room.hasPass && (
              <input
                className="input"
                placeholder={t("passwordPlaceholder")}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            )}
            <button
              className="btn"
              onClick={() => act("join", { password: pw })}
            >
              {t("joinGame")}
            </button>
          </div>
        )}
        {room.status === "waiting" && me && (
          <p>
            {t.rich("waitingShare", {
              code: room.code,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </p>
        )}
        {me && room.status === "playing" && (
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => act("resign")}>
              {t("resign")}
            </button>
            <button className="btn-ghost" onClick={() => act("draw-offer")}>
              {t("offerDraw")}
            </button>
            {room.drawOffer && room.drawOffer !== me && (
              <button className="btn" onClick={() => act("draw-accept")}>
                {t("acceptDraw")}
              </button>
            )}
          </div>
        )}
        {err && <p className="text-red-400">{err}</p>}
        <div className="rounded-lg bg-stone-800 p-3">
          <div className="mb-2 h-48 space-y-1 overflow-y-auto text-sm">
            {msgs.map((m) => (
              <p key={m.id}>
                <b className="text-amber-400">{dn(m.name)}:</b> {m.text}
              </p>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim() || !user) return;
              addDoc(collection(db, "rooms", code, "messages"), {
                uid: user.uid,
                name: user.displayName || user.email?.split("@")[0],
                text: text.trim(),
                at: Date.now(),
              });
              setText("");
            }}
          >
            <input
              className="input"
              placeholder={t("chatPlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn">{t("send")}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
