"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthProvider";
import { useDisplayName } from "@/lib/useDisplayName";
import LocaleSwitcher from "./LocaleSwitcher";
import SoundToggle from "./SoundToggle";
import UserMenu from "./UserMenu";
import { BrandIcon } from "./Icons";

export default function Nav() {
  const { user } = useAuth();
  const t = useTranslations("nav");
  const dn = useDisplayName();
  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-stone-700 px-4 py-3 sm:px-6">
      <Link href="/" className="text-lg font-bold text-amber-400">
        <BrandIcon className="mr-1.5 inline-block -translate-y-px" />
        {t("brand")}
      </Link>
      <Link href="/play-ai" className="hover:text-amber-300">
        {t("playAi")}
      </Link>
      <Link href="/ranking" className="hover:text-amber-300">
        {t("ranking")}
      </Link>
      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <UserMenu
            label={dn(user.displayName) || user.email || ""}
            email={user.email}
          />
        ) : (
          <Link className="btn" href="/login">
            {t("signIn")}
          </Link>
        )}
        <SoundToggle />
        <LocaleSwitcher />
      </div>
    </nav>
  );
}
