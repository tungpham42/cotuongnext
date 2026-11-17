// src/i18n/config.ts
export const locales = [
  "en",
  "vi",
  "zh",
  "ja",
  "ko",
  "de",
  "fr",
  "es",
  "ru",
] as const;
export type Locale = (typeof locales)[number];
// English is the default locale: it has NO URL prefix (/ai); Vietnamese and Chinese do (/vi/ai, /zh/ai).
export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { label: string; htmlLang: string }> = {
  en: { label: "English", htmlLang: "en" },
  vi: { label: "Tiếng Việt", htmlLang: "vi" },
  zh: { label: "中文", htmlLang: "zh-Hans" },
  ja: { label: "日本語", htmlLang: "ja" },
  ko: { label: "한국어", htmlLang: "ko" },
  de: { label: "Deutsch", htmlLang: "de" },
  fr: { label: "Français", htmlLang: "fr" },
  es: { label: "Español", htmlLang: "es" },
  ru: { label: "Русский", htmlLang: "ru" },
};
