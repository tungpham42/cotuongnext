"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { api, auth } from "@/lib/firebase";

const Ctx = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u); setReady(true);
    if (u) api("/api/me").catch(() => {});
  }), []);
  return <Ctx.Provider value={{ user, ready }}>{children}</Ctx.Provider>;
}
