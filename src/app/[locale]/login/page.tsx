"use client";
import { ComponentType, FormEvent, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { auth } from "@/lib/firebase";
import { MailIcon, SpinnerIcon, UserIcon } from "@/components/Icons";

type Mode = "in" | "up";
type Method = "google" | "facebook" | "guest" | "email";

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
    case "auth/account-exists-with-different-credential":
      return "accountExistsWithDifferentCredential";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null; // the player closed the popup on purpose
    default:
      return "generic";
  }
}

type Social = {
  method: Exclude<Method, "email">;
  icon: ComponentType<{ className?: string }>;
  className?: string; // brand colours; falls back to the default ghost look
  label: string; // message key
  opening: string; // message key shown while busy
  run: () => Promise<unknown>;
};

const SOCIALS: Social[] = [
  {
    method: "google",
    icon: FcGoogle,
    // White button, dark grey text, light grey border.
    className:
      "!border-[#dadce0] !bg-white !text-[#3c4043] hover:!bg-[#f8f9fa]",
    label: "google",
    opening: "googleOpening",
    run: () => signInWithPopup(auth, new GoogleAuthProvider()),
  },
  {
    method: "facebook",
    icon: FaFacebook,
    // Facebook blue with white text.
    className:
      "!border-[#1877F2] !bg-[#1877F2] !text-white hover:!bg-[#166fe5]",
    label: "facebook",
    opening: "facebookOpening",
    run: () => signInWithPopup(auth, new FacebookAuthProvider()),
  },
  {
    method: "guest",
    icon: UserIcon,
    label: "guest",
    opening: "guestOpening",
    run: () => signInAnonymously(auth),
  },
];

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
        <p className="text-sm text-mist">{t("guestsHint")}</p>
      </div>

      <div className="space-y-2">
        {SOCIALS.map(
          ({ method, icon: Icon, className, label, opening, run }) => (
            <button
              key={method}
              type="button"
              className={`btn-ghost w-full ${className ?? ""}`}
              disabled={busy !== null}
              onClick={() => go(method, run)}
            >
              {busy === method ? (
                <SpinnerIcon className="text-xl" />
              ) : (
                <Icon className="text-xl" />
              )}
              {busy === method ? t(opening) : t(label)}
            </button>
          ),
        )}
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
          {busy === "email" ? (
            <SpinnerIcon className="text-xl" />
          ) : (
            <MailIcon className="text-xl" />
          )}
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
