import type { Metadata, Viewport } from "next";
import {
  Be_Vietnam_Pro,
  Bricolage_Grotesque,
  Noto_Serif_TC,
} from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Nav from "@/components/Nav";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { localeMeta, locales, type Locale } from "@/i18n/config";

// Body: friendly, full Vietnamese diacritics support
const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--f-body",
  display: "swap",
});

// Headlines: characterful grotesque
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--f-display",
  display: "swap",
});

// Chinese characters on pieces and the river (戰, 楚河, 漢界)
const han = Noto_Serif_TC({
  weight: ["700"],
  preload: false,
  variable: "--f-han",
  display: "swap",
});

const OG_LOCALE: Record<Locale, string> = {
  vi: "vi_VN",
  en: "en_US",
  zh: "zh_CN",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const locale = (await getLocale()) as Locale;
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("ogTitle"),
      description: t("ogDescription"),
      locale: OG_LOCALE[locale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f1a17",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  return (
    <html
      suppressHydrationWarning
      lang={localeMeta[locale].htmlLang}
      className={`${body.variable} ${display.variable} ${han.variable}`}
    >
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
              {children}
            </main>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
