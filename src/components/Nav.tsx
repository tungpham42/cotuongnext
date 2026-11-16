"use client";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useDisplayName } from "@/lib/useDisplayName";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Nav() {
  const { user } = useAuth();
  const t = useTranslations("nav");
  const dn = useDisplayName();
  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-stone-700 px-4 py-3 sm:px-6">
      <Link href="/" className="text-lg font-bold text-amber-400">
        ♟ {t("brand")}
      </Link>
      <Link href="/play-ai" className="hover:text-amber-300">
        {t("playAi")}
      </Link>
      <Link href="/ranking" className="hover:text-amber-300">
        {t("ranking")}
      </Link>
      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-stone-300">
              {dn(user.displayName) || user.email}
            </span>
            <button className="btn-ghost" onClick={() => signOut(auth)}>
              {t("signOut")}
            </button>
          </>
        ) : (
          <Link className="btn" href="/login">
            {t("signIn")}
          </Link>
        )}
        <LanguageSwitcher />
      </div>
    </nav>
  );
}
