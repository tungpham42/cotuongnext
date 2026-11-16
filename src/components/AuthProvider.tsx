"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  User,
} from "firebase/auth";
import { api, auth } from "@/lib/firebase";

type AuthCtx = {
  user: User | null;
  ready: boolean;
  /**
   * Resolves with the signed-in user. If nobody is signed in yet, quietly
   * creates a guest seat first, so players never hit a login wall.
   */
  ensureUser: () => Promise<User>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  ready: false,
  ensureUser: () => Promise.reject(new Error("NO_AUTH_PROVIDER")),
});
export const useAuth = () => useContext(Ctx);

/** Guests have no name: give them a stable one (same uid -> same name),
 *  then refresh the ID token so the server sees it in the `name` claim. */
async function nameGuest(u: User) {
  if (!u.isAnonymous || u.displayName) return;
  try {
    await updateProfile(u, {
      displayName: `Guest-${u.uid.slice(0, 4).toUpperCase()}`,
    });
    await u.getIdToken(true);
  } catch {}
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const pending = useRef<Promise<User> | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        setReady(true);
        if (!u) return;
        await nameGuest(u);
        api("/api/me").catch(() => {});
      }),
    [],
  );

  // De-duplicated: many callers (auto-guest effect + a click) share one sign-in.
  const ensureUser = useCallback(async () => {
    if (auth.currentUser) return auth.currentUser;
    pending.current ??= (async () => {
      try {
        const { user: u } = await signInAnonymously(auth);
        await nameGuest(u);
        await api("/api/me").catch(() => {});
        return u;
      } finally {
        pending.current = null;
      }
    })();
    return pending.current;
  }, []);

  return (
    <Ctx.Provider value={{ user, ready, ensureUser }}>{children}</Ctx.Provider>
  );
}
