import type { Metadata, Viewport } from "next";
import {
  Be_Vietnam_Pro,
  Bricolage_Grotesque,
  Noto_Serif_TC,
} from "next/font/google";
import "../globals.css";
import AuthProvider from "@/components/AuthProvider";
import Nav from "@/components/Nav";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { localeMeta, locales, type Locale } from "@/i18n/config";
import Script from "next/script";

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
  en: "en_US",
  vi: "vi_VN",
  zh: "zh_CN",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const locale = (await getLocale()) as Locale;
  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("ogTitle"),
      description: t("ogDescription"),
      locale: OG_LOCALE[locale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
      images: [
        {
          url: `/${locale}/og.png`,
          width: 1200,
          height: 630,
          alt: t("ogTitle"),
        },
      ],
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
      <head>
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
              {children}
            </main>
          </AuthProvider>
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
