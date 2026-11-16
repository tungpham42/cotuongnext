"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import { ChevronDownIcon } from "./Icons";

export default function UserMenu({
  label,
  email,
}: {
  label: string;
  email?: string | null;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-stone-300 hover:bg-stone-800"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="max-w-[10rem] truncate">{label}</span>
        <ChevronDownIcon className="text-xs" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-lg border border-stone-700 bg-stone-800 p-1 shadow-xl"
        >
          {email && email !== label && (
            <p className="truncate px-3 py-2 text-xs text-stone-400">{email}</p>
          )}
          <button
            type="button"
            role="menuitem"
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-stone-700"
            onClick={() => {
              setOpen(false);
              signOut(auth);
            }}
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
