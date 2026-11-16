// src/i18n/routing.ts
import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // "as-needed" = the default locale (en) is served without a prefix, every other locale gets one.
  localePrefix: "as-needed",
});
