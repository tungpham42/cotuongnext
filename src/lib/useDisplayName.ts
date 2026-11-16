"use client";
import { useTranslations } from "next-intl";

/**
 * Guests are stored as "Guest-AB12" (or plain "Guest") so the data stays
 * language-neutral. Translate that placeholder when rendering; any real
 * player name passes through untouched.
 */
export function useDisplayName() {
  const t = useTranslations("common");
  return (name?: string | null) => {
    if (!name) return "";
    const m = /^Guest(?:-([0-9A-Za-z]{4}))?$/.exec(name);
    if (!m) return name;
    return m[1] ? t("guestNamed", { id: m[1] }) : t("guest");
  };
}
