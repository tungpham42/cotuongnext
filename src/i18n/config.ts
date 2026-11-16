// src/i18n/config.ts
export const locales = ["en", "vi", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeMeta: Record<Locale, { label: string; htmlLang: string }> = {
  en: { label: "English", htmlLang: "en" },
  vi: { label: "Tiếng Việt", htmlLang: "vi" },
  zh: { label: "中文", htmlLang: "zh-Hans" },
};

export const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (locales as readonly string[]).includes(v);
