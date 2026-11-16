"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type Mode = "in" | "up";
type Method = "google" | "guest" | "email";

/** Map Firebase error codes to keys in the "authErrors" messages namespace. */
function authErrorKey(e: unknown): string | null {
  switch ((e as { code?: string })?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "wrongCredentials";
    case "auth/email-already-in-use":
      return "emailInUse";
    case "auth/weak-password":
      return "weakPassword";
    case "auth/invalid-email":
      return "invalidEmail";
    case "auth/too-many-requests":
      return "tooMany";
    case "auth/operation-not-allowed":
      return "notEnabled";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null; // the player closed the popup on purpose
    default:
      return "generic";
  }
}

export default function Login() {
  const router = useRouter();
  const t = useTranslations("login");
  const te = useTranslations("authErrors");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<Mode>("in");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<Method | null>(null);

  const go = async (method: Method, fn: () => Promise<unknown>) => {
    setBusy(method);
    setMsg("");
    try {
      await fn();
      router.push("/");
    } catch (e) {
      const key = authErrorKey(e);
      setMsg(key ? te(key) : "");
      setBusy(null);
    }
  };

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    go("email", () =>
      mode === "in"
        ? signInWithEmailAndPassword(auth, email, pw)
        : createUserWithEmailAndPassword(auth, email, pw),
    );
  };

  return (
    <section className="card mx-auto mt-4 max-w-sm space-y-4 p-6 sm:mt-10">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold">
          {mode === "in" ? t("signIn") : t("createAccount")}
        </h1>
        <p className="text-sm text-mist">
          {t("guestsHint")}
        </p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          className="btn-ghost w-full"
          disabled={busy !== null}
          onClick={() =>
            go("google", () => signInWithPopup(auth, new GoogleAuthProvider()))
          }
        >
          {busy === "google" ? t("googleOpening") : t("google")}
        </button>
        <button
          type="button"
          className="btn-ghost w-full"
          disabled={busy !== null}
          onClick={() => go("guest", () => signInAnonymously(auth))}
        >
          {busy === "guest" ? t("guestOpening") : t("guest")}
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-mist">
        <span className="h-px flex-1 bg-bone/15" />
        {t("orEmail")}
        <span className="h-px flex-1 bg-bone/15" />
      </div>

      <form onSubmit={submitEmail} className="space-y-3">
        <input
          className="input"
          type="email"
          placeholder={t("email")}
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder={t("password")}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <button className="btn w-full" disabled={busy !== null}>
          {busy === "email"
            ? t("wait")
            : mode === "in"
              ? t("signIn")
              : t("createAccount")}
        </button>
      </form>

      {msg && (
        <p
          role="alert"
          className="rounded-xl border border-lacquer/40 bg-lacquer/10 px-4 py-3 text-sm text-[#ff9d8c]"
        >
          {msg}
        </p>
      )}

      <button
        type="button"
        className="text-sm text-brass hover:underline"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setMsg("");
        }}
      >
        {mode === "in" ? t("noAccount") : t("haveAccount")}
      </button>
    </section>
  );
}
