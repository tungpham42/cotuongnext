// src/i18n/config.ts
export const locales = ["en", "vi", "zh"] as const;
export type Locale = (typeof locales)[number];
// English is the default locale: it has NO URL prefix (/play-ai); Vietnamese and Chinese do (/vi/play-ai, /zh/play-ai).
export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { label: string; htmlLang: string }> = {
  en: { label: "English", htmlLang: "en" },
  vi: { label: "Tiếng Việt", htmlLang: "vi" },
  zh: { label: "中文", htmlLang: "zh-Hans" },
};
