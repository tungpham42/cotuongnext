"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

/** Turn Firebase error codes into messages a player can act on. */
function friendlyError(e: unknown): string {
  switch ((e as { code?: string })?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/email-already-in-use":
      return "That email already has an account. Try signing in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled yet.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return ""; // the player closed the popup on purpose
    default:
      return (e as Error)?.message || "Something went wrong. Try again.";
  }
}

export default function Login() {
  const router = useRouter();
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
      setMsg(friendlyError(e));
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
          {mode === "in" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-sm text-mist">
          Guests can start playing right away.
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
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>
        <button
          type="button"
          className="btn-ghost w-full"
          disabled={busy !== null}
          onClick={() => go("guest", () => signInAnonymously(auth))}
        >
          {busy === "guest" ? "Setting up your seat…" : "Play as guest"}
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-mist">
        <span className="h-px flex-1 bg-bone/15" />
        or use email
        <span className="h-px flex-1 bg-bone/15" />
      </div>

      <form onSubmit={submitEmail} className="space-y-3">
        <input
          className="input"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <button className="btn w-full" disabled={busy !== null}>
          {busy === "email"
            ? "Please wait…"
            : mode === "in"
              ? "Sign in"
              : "Create account"}
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
        {mode === "in"
          ? "Don't have an account? Create one"
          : "Already have an account? Sign in"}
      </button>
    </section>
  );
}
