"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { api, auth } from "@/lib/firebase";

const Ctx = createContext<{ user: User | null; ready: boolean }>({
  user: null,
  ready: false,
});
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        setReady(true);
        if (!u) return;
        // Guests have no name: give them a stable one (same uid -> same name),
        // then refresh the ID token so the server sees it in the `name` claim.
        if (u.isAnonymous && !u.displayName) {
          try {
            await updateProfile(u, {
              displayName: `Guest-${u.uid.slice(0, 4).toUpperCase()}`,
            });
            await u.getIdToken(true);
          } catch {}
        }
        api("/api/me").catch(() => {});
      }),
    [],
  );
  return <Ctx.Provider value={{ user, ready }}>{children}</Ctx.Provider>;
}
