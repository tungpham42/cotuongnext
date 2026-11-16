"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const go = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      router.push("/");
    } catch (e: any) {
      setMsg(e.message);
    }
  };
  return (
    <div className="mx-auto max-w-sm space-y-3">
      <h1 className="text-2xl font-bold">
        {mode === "in" ? "Sign in" : "Sign up"}
      </h1>
      <button
        className="btn-ghost w-full"
        onClick={() =>
          go(() => signInWithPopup(auth, new GoogleAuthProvider()))
        }
      >
        Continue with Google
      </button>
      <input
        className="input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input"
        type="password"
        placeholder="Password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <button
        className="btn w-full"
        onClick={() =>
          go(() =>
            mode === "in"
              ? signInWithEmailAndPassword(auth, email, pw)
              : createUserWithEmailAndPassword(auth, email, pw),
          )
        }
      >
        {mode === "in" ? "Sign in" : "Create account"}
      </button>
      <div className="flex justify-between text-sm text-stone-400">
        <button onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in"
            ? "Don't have an account?"
            : "Already have an account?"}
        </button>
        <button
          onClick={() =>
            sendPasswordResetEmail(auth, email)
              .then(() => setMsg("Password reset email sent"))
              .catch((e) => setMsg(e.message))
          }
        >
          Forgot password
        </button>
      </div>
      {msg && <p className="text-amber-400">{msg}</p>}
    </div>
  );
}
