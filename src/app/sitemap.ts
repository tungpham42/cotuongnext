import type { MetadataRoute } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";

type PublicPage = {
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
};

const publicPages: PublicPage[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/ai", changeFrequency: "monthly", priority: 0.8 },
  { path: "/ranking", changeFrequency: "daily", priority: 0.7 },
];

/**
 * English is the default locale and has no URL prefix.
 * All other locales use their locale prefix (for example, /vi or /zh/ai).
 */
function localizedPath(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    publicPages.map((page) => {
      const languages: Record<string, string> = {};

      for (const alternateLocale of locales) {
        languages[alternateLocale] = absoluteUrl(
          localizedPath(alternateLocale, page.path),
        );
      }

      // The default English URL is the x-default version for language-neutral visitors.
      languages["x-default"] = languages[defaultLocale];

      return {
        url: absoluteUrl(localizedPath(locale, page.path)),
        alternates: { languages },
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      };
    }),
  );
}
