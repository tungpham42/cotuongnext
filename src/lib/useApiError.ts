"use client";
import { useTranslations } from "next-intl";

/**
 * The API returns stable error codes (e.g. "ROOM_NOT_FOUND").
 * This turns whatever was thrown into a message in the current language.
 */
export function useApiError() {
  const t = useTranslations("errors");
  return (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    return t.has(code) ? t(code) : t("UNKNOWN");
  };
}
