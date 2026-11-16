"use client";
import { useId, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import { useDismiss } from "@/lib/useDismiss";
import { useAuth } from "./AuthProvider";
import { ChevronDownIcon } from "./Icons";

type UserMenuProps = {
  /** Text shown on the trigger button (already localized by the caller). */
  label: string;
  /** Shown above the actions, unless it would just repeat `label`. */
  email?: string | null;
};

export default function UserMenu({ label, email }: UserMenuProps) {
  const t = useTranslations("nav");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on outside click / Escape. Escape hands focus back to the trigger so
  // keyboard users don't lose their place.
  useDismiss(rootRef, open, (reason) => {
    setOpen(false);
    if (reason === "escape") triggerRef.current?.focus();
  });

  const handleSignOut = () => {
    setOpen(false);
    signOut(auth).catch((err) => console.error("Sign out failed", err));
  };

  // Guests (anonymous users) are never listed in the menu; they get a sign-in
  // link in the Nav instead. Placed after all hooks to keep hook order stable.
  if (!user || user.isAnonymous) return null;

  const showEmail = Boolean(email) && email !== label;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-stone-300 hover:bg-stone-800"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="max-w-[10rem] truncate">{label}</span>
        <ChevronDownIcon className="text-xs" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-lg border border-stone-700 bg-stone-800 p-1 shadow-xl"
        >
          {showEmail && (
            <p className="truncate px-3 py-2 text-xs text-stone-400">{email}</p>
          )}
          <button
            type="button"
            role="menuitem"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-stone-700"
            onClick={handleSignOut}
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
