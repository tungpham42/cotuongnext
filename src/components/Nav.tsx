"use client";
import type { User } from "firebase/auth";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthProvider";
import { useDisplayName } from "@/lib/useDisplayName";
import LocaleSwitcher from "./LocaleSwitcher";
import SoundToggle from "./SoundToggle";
import UserMenu from "./UserMenu";
import { BrandIcon } from "./Icons";

/** Primary links, in display order. `labelKey` is a key under the "nav" messages. */
const NAV_LINKS = [
  { href: "/play-ai", labelKey: "playAi" },
  { href: "/ranking", labelKey: "ranking" },
] as const;

const LINK_CLASS = "hover:text-amber-300";

/** User menu (when signed in) plus a sign-in link for guests and signed-out visitors. */
function AuthControls({ user }: { user: User | null }) {
  const t = useTranslations("nav");
  const displayName = useDisplayName();

  // Anonymous users still get the menu (their guest name), plus a prompt to sign in.
  const showSignIn = !user || user.isAnonymous;

  return (
    <>
      {user && (
        <UserMenu
          label={displayName(user.displayName) || user.email || ""}
          email={user.email}
        />
      )}
      {showSignIn && (
        <Link
          href="/login"
          className={user ? "btn-ghost !py-1.5 text-sm" : "btn"}
        >
          {t("signIn")}
        </Link>
      )}
    </>
  );
}

export default function Nav() {
  const { user } = useAuth();
  const t = useTranslations("nav");

  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-stone-700 px-4 py-3 sm:px-6">
      <Link href="/" className="text-lg font-bold text-amber-400">
        <BrandIcon className="mr-1.5 inline-block -translate-y-px" />
        {t("brand")}
      </Link>

      {NAV_LINKS.map(({ href, labelKey }) => (
        <Link key={href} href={href} className={LINK_CLASS}>
          {t(labelKey)}
        </Link>
      ))}

      <div className="ml-auto flex items-center gap-3">
        <AuthControls user={user} />
        <SoundToggle />
        <LocaleSwitcher />
      </div>
    </nav>
  );
}
