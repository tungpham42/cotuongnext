"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LockIcon, SpinnerIcon } from "@/components/Icons";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { api, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import HeroBoard from "@/components/HeroBoard";
import { isExpired, Room } from "@/lib/types";
import { useApiError } from "@/lib/useApiError";
import { useDisplayName } from "@/lib/useDisplayName";

const SIDES = [
  { v: "random", key: "sideRandom", glyph: "?" },
  { v: "red", key: "sideRed", glyph: "帥" },
  { v: "black", key: "sideBlack", glyph: "將" },
];

type Busy = null | "create" | "quick";

export default function Lobby() {
  const { user, ready, ensureUser } = useAuth();
  const t = useTranslations("lobby");
  const apiError = useApiError();
  const dn = useDisplayName();
  const router = useRouter();
  const hostRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [side, setSide] = useState("random");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<Busy>(null);

  // Nobody is forced to sign in: visitors quietly get a guest seat so the live
  // room list and one-tap play work straight away.
  useEffect(() => {
    if (ready && !user) ensureUser().catch((e) => setErr(apiError(e)));
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

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
    kind: Exclude<Busy, null>,
    fn: () => Promise<{ code: string }>,
  ) => {
    setBusy(kind);
    setErr("");
    try {
      await ensureUser(); // covers the "clicked before the guest seat was ready" case
      router.push(`/${(await fn()).code}`);
    } catch (e: any) {
      setErr(apiError(e));
      setBusy(null);
    }
  };

  const quickMatch = () => run("quick", () => api("/api/match/find"));

  // Tick so rooms whose clock runs out while the lobby is open flip over too.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // A room can read "playing" long after its clock ran out (e.g. both players
  // left before anyone reported the timeout). Treat those as finished here and
  // ask the server to settle them, once per room, so the status sticks.
  const settled = useRef(new Set<string>());
  useEffect(() => {
    if (!user) return;
    for (const r of rooms) {
      if (!isExpired(r, now)) continue;
      const key = `${r.code}:${r.lastMoveAt}`;
      if (settled.current.has(key)) continue;
      settled.current.add(key);
      api(`/api/rooms/${r.code}`, { type: "timeout" }).catch(() => {});
    }
  }, [rooms, now, user]);

  const stats = useMemo(
    () => ({
      waiting: rooms.filter((r) => r.status === "waiting").length,
      live: rooms.filter((r) => r.status === "playing" && !isExpired(r, now))
        .length,
    }),
    [rooms, now],
  );

  const hostFriend = () => {
    hostRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    nameRef.current?.focus({ preventScroll: true });
  };

  return (
    <div>
      {/* ───────── Hero: one obvious thing to do ───────── */}
      <section className="hero-glow relative -mx-2 overflow-hidden rounded-3xl px-2 py-6 sm:mx-0 sm:px-8 sm:py-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rise-in text-center lg:text-left">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-brass/30 bg-brass/10 px-3.5 py-1 text-sm font-medium text-brass lg:mx-0">
              <span className="size-1.5 rounded-full bg-brass" />
              {t("heroEyebrow")}
            </p>

            <h1 className="mt-4 bg-gradient-to-br from-bone via-bone to-brass bg-clip-text font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-lg text-mist lg:mx-0">
              {t("heroBody")}
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <button
                type="button"
                className="btn-hero w-full sm:w-auto"
                disabled={busy !== null}
                onClick={quickMatch}
              >
                {busy === "quick" ? (
                  <>
                    <SpinnerIcon className="text-2xl" />
                    {t("quickFinding")}
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="piece size-9 text-xl text-lacquer"
                    >
                      戰
                    </span>
                    {t("playNow")}
                  </>
                )}
              </button>
              <Link
                href="/ai"
                className="btn-ghost w-full !py-4 text-base sm:w-auto"
              >
                {t("practice")}
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-mist lg:justify-start">
              {["chipFree", "chipNoSignup", "chipElo"].map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-river">
                    ✓
                  </span>
                  {t(k)}
                </li>
              ))}
            </ul>

            {/* Live pulse + gentle guest status: social proof without a login wall */}
            <div className="mt-6 flex min-h-8 flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm lg:justify-start">
              {loaded && (
                <span className="flex items-center gap-2 rounded-full bg-night/60 px-3 py-1 text-mist ring-1 ring-bone/10">
                  <span className="size-2 animate-pulse rounded-full bg-river" />
                  {t("waitingCount", { count: stats.waiting })}
                  <span aria-hidden="true">·</span>
                  {t("liveCount", { count: stats.live })}
                </span>
              )}
              {user?.isAnonymous && (
                <span className="text-mist">
                  {t("playingAs", { name: dn(user.displayName) })}
                  {" · "}
                  <Link href="/login" className="text-brass hover:underline">
                    {t("saveRating")}
                  </Link>
                </span>
              )}
            </div>
          </div>

          <div className="rise-in mx-auto w-full max-w-[250px] sm:max-w-[340px] lg:max-w-[400px] [animation-delay:.15s]">
            <HeroBoard />
          </div>
        </div>
      </section>

      {err && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-lacquer/40 bg-lacquer/10 px-4 py-3 text-sm text-[#ff9d8c]"
        >
          {err}
        </p>
      )}

      {/* ───────── Ways to play ───────── */}
      <section className="mt-10" aria-labelledby="ways-title">
        <h2 id="ways-title" className="sr-only">
          {t("waysTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <WayCard
            glyph="戰"
            title={t("wayQuickTitle")}
            body={t("wayQuickBody")}
            go={t("wayGo")}
            onClick={quickMatch}
            disabled={busy !== null}
          />
          <WayCard
            glyph="友"
            title={t("wayFriendTitle")}
            body={t("wayFriendBody")}
            go={t("wayGo")}
            onClick={hostFriend}
          />
          <WayCard
            glyph="機"
            title={t("wayAiTitle")}
            body={t("wayAiBody")}
            go={t("wayGo")}
            href="/ai"
          />
        </div>
      </section>

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
            <h2 className="font-display text-2xl font-semibold">
              {t("openRooms")}
            </h2>
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
                <RoomRow key={r.code} r={r} now={now} />
              ))}
            </ul>
          ) : (
            <div className="card flex flex-col items-center px-6 py-10 text-center">
              <span className="piece mb-3 size-14 text-3xl text-lacquer">
                戰
              </span>
              <p className="font-display text-xl font-semibold">
                {t("noRooms")}
              </p>
              <p className="mt-1 text-mist">{t("noRoomsBody")}</p>
              <button
                type="button"
                className="btn mt-5"
                disabled={busy !== null}
                onClick={quickMatch}
              >
                {t("playNow")}
              </button>
            </div>
          )}
        </section>

        <section
          id="host"
          ref={hostRef}
          className="card h-fit space-y-4 p-5 lg:sticky lg:top-6"
        >
          <div>
            <h2 className="font-display text-xl font-semibold">
              {t("hostTitle")}
            </h2>
            <p className="text-sm text-mist">{t("hostBody")}</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm text-mist">{t("roomName")}</span>
            <input
              ref={nameRef}
              className="input"
              placeholder={t("roomNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          {/* Password is rarely needed: tuck it away so the form stays light */}
          <details className="group">
            <summary className="cursor-pointer list-none text-sm text-brass hover:underline">
              <span className="group-open:hidden">+ {t("hostMore")}</span>
              <span className="hidden group-open:inline">
                − {t("hostMore")}
              </span>
            </summary>
            <label className="mt-3 block space-y-1.5">
              <span className="text-sm text-mist">{t("password")}</span>
              <input
                className="input"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </details>

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
          <p className="text-center text-xs text-mist">{t("copyHint")}</p>
        </section>
      </div>
    </div>
  );
}

function WayCard({
  glyph,
  title,
  body,
  go,
  href,
  onClick,
  disabled,
}: {
  glyph: string;
  title: string;
  body: string;
  go: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cls =
    "card group flex h-full w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:border-brass/50 hover:bg-moss disabled:pointer-events-none disabled:opacity-60 sm:flex-col sm:items-start sm:gap-3 sm:p-5";
  const inner = (
    <>
      <span className="piece size-14 shrink-0 text-3xl text-lacquer transition group-hover:scale-105 group-hover:-rotate-6">
        {glyph}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-mist">{body}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-brass transition group-hover:translate-x-1 sm:mt-auto">
        {go} →
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}

function RoomRow({ r, now }: { r: Room; now: number }) {
  const t = useTranslations("lobby");
  const waiting = r.status === "waiting";
  const playing = r.status === "playing" && !isExpired(r, now);
  return (
    <li>
      <Link
        href={`/${r.code}`}
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
              <LockIcon
                role="img"
                aria-label={t("passwordProtected")}
                className="mr-1 inline-block -translate-y-px"
              />
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
