"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { api, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { Room } from "@/lib/types";
import { useApiError } from "@/lib/useApiError";

const SIDES = [
  { v: "random", key: "sideRandom", glyph: "?" },
  { v: "red", key: "sideRed", glyph: "帥" },
  { v: "black", key: "sideBlack", glyph: "將" },
];

export default function Lobby() {
  const { user, ready } = useAuth();
  const t = useTranslations("lobby");
  const apiError = useApiError();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [side, setSide] = useState("random");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<null | "create" | "quick">(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, "rooms"), orderBy("createdAt", "desc"), limit(30)),
      (s) => {
        setRooms(s.docs.map((d) => d.data() as Room));
        setLoaded(true);
      },
    );
  }, [user]);

  const run = async (
    kind: "create" | "quick",
    fn: () => Promise<{ code: string }>,
  ) => {
    setBusy(kind);
    setErr("");
    try {
      router.push(`/room/${(await fn()).code}`);
    } catch (e: any) {
      setErr(apiError(e));
      setBusy(null);
    }
  };

  if (ready && !user)
    return (
      <section className="card mx-auto mt-10 flex max-w-md flex-col items-center gap-4 px-6 py-10 text-center">
        <span className="piece size-20 text-5xl text-lacquer">戰</span>
        <h1 className="font-display text-3xl font-bold">
          {t("signInTitle")}
        </h1>
        <p className="text-mist">
          {t("signInBody")}
        </p>
        <Link href="/login" className="btn mt-2">
          {t("signInCta")}
        </Link>
      </section>
    );

  return (
    <div>
      {/* Hero: one obvious thing to do */}
      <section className="flex flex-col items-center gap-8 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-3 text-lg text-mist">
            {t("heroBody")}
          </p>
        </div>

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("quick", () => api("/api/match/find"))}
          className="group flex shrink-0 flex-col items-center gap-4 disabled:opacity-80 cursor-pointer"
        >
          <span className="relative">
            {busy === "quick" && (
              <span className="absolute inset-0 animate-ping rounded-full bg-brass/40" />
            )}
            <span className="relative grid size-36 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff6dc,#e9d3a0_65%,#c9aa6a)] shadow-[0_8px_0_#8d6b34,0_18px_30px_rgb(0_0_0/.45)] ring-4 ring-brass/70 transition group-hover:-translate-y-1 group-active:translate-y-1.5 group-active:shadow-[0_2px_0_#8d6b34,0_6px_12px_rgb(0_0_0/.4)]">
              <span className="grid size-28 place-items-center rounded-full border-2 border-lacquer font-han text-6xl font-bold text-lacquer">
                戰
              </span>
            </span>
          </span>
          <span className="font-display text-xl font-semibold">
            {busy === "quick" ? t("quickFinding") : t("quickMatch")}
          </span>
        </button>
      </section>

      {err && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-lacquer/40 bg-lacquer/10 px-4 py-3 text-sm text-[#ff9d8c]"
        >
          {err}
        </p>
      )}

      {/* The river divides the hero from the rooms */}
      <div
        className="river my-8 flex items-center justify-between py-4"
        aria-hidden="true"
      >
        <span className="bg-night pr-4 font-han text-2xl text-river">楚河</span>
        <span className="bg-night pl-4 font-han text-2xl text-river">漢界</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">{t("openRooms")}</h2>
            <span className="flex items-center gap-2 text-sm text-mist">
              <span className="size-2 animate-pulse rounded-full bg-river" />
              {t("live")}
            </span>
          </div>

          {!loaded ? (
            <ul className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="card h-[68px] animate-pulse bg-pine/50"
                />
              ))}
            </ul>
          ) : rooms.length ? (
            <ul className="space-y-2">
              {rooms.map((r) => (
                <RoomRow key={r.code} r={r} />
              ))}
            </ul>
          ) : (
            <div className="card px-6 py-10 text-center">
              <p className="font-display text-xl font-semibold">{t("noRooms")}</p>
              <p className="mt-1 text-mist">
                {t("noRoomsBody")}
              </p>
            </div>
          )}
        </section>

        <section className="card h-fit space-y-4 p-5 lg:sticky lg:top-6">
          <div>
            <h2 className="font-display text-xl font-semibold">{t("hostTitle")}</h2>
            <p className="text-sm text-mist">
              {t("hostBody")}
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm text-mist">{t("roomName")}</span>
            <input
              className="input"
              placeholder={t("roomNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-mist">{t("password")}</span>
            <input
              className="input"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <fieldset className="space-y-1.5">
            <legend className="text-sm text-mist">{t("youPlay")}</legend>
            <div className="grid grid-cols-3 gap-2">
              {SIDES.map((s) => (
                <label key={s.v} className="cursor-pointer">
                  <input
                    type="radio"
                    name="side"
                    value={s.v}
                    checked={side === s.v}
                    onChange={() => setSide(s.v)}
                    className="peer sr-only"
                  />
                  <span className="flex flex-col items-center gap-1.5 rounded-xl border border-bone/15 px-2 py-3 text-sm transition hover:bg-bone/5 peer-checked:border-brass peer-checked:bg-brass/10 peer-focus-visible:outline-2 peer-focus-visible:outline-brass">
                    <span
                      className={`piece size-9 text-lg ${
                        s.v === "red" ? "text-lacquer" : "text-night"
                      }`}
                    >
                      {s.glyph}
                    </span>
                    {t(s.key)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            className="btn w-full"
            disabled={busy !== null}
            onClick={() =>
              run("create", () =>
                api("/api/rooms", {
                  name: name.trim() || t("defaultRoomName"),
                  password,
                  side,
                }),
              )
            }
          >
            {busy === "create" ? t("creating") : t("create")}
          </button>
        </section>
      </div>
    </div>
  );
}

function RoomRow({ r }: { r: Room }) {
  const t = useTranslations("lobby");
  const waiting = r.status === "waiting";
  const playing = r.status === "playing";
  return (
    <li>
      <Link
        href={`/room/${r.code}`}
        className="card group flex items-center gap-4 px-4 py-3 transition hover:border-brass/50 hover:bg-moss"
      >
        <span
          aria-hidden="true"
          className={`size-2.5 shrink-0 rounded-full ${
            waiting
              ? "animate-pulse bg-river"
              : playing
                ? "bg-brass"
                : "bg-mist/40"
          }`}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {r.hasPass && (
              <span role="img" aria-label={t("passwordProtected")}>
                🔒{" "}
              </span>
            )}
            {r.isQuick ? t("quickRoomName") : r.name}{" "}
            <span className="text-mist">#{r.code}</span>
          </span>
          <span className="text-sm text-mist">
            {waiting
              ? t("waitingOpp")
              : playing
                ? t("inProgress")
                : t("finished")}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            waiting
              ? "bg-brass text-night group-hover:bg-[#e6b555]"
              : "border border-bone/25 group-hover:bg-bone/10"
          }`}
        >
          {waiting ? t("join") : playing ? t("watch") : t("view")}
        </span>
      </Link>
    </li>
  );
}
