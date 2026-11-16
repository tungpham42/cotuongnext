import type { Metadata, Viewport } from "next";
import {
  Be_Vietnam_Pro,
  Bricolage_Grotesque,
  Noto_Serif_TC,
} from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Nav from "@/components/Nav";

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

export const metadata: Metadata = {
  title: "Xiangqi Online",
  description: "Play Xiangqi online, play against the computer, Elo rankings.",
};

export const viewport: Viewport = {
  themeColor: "#0f1a17",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${body.variable} ${display.variable} ${han.variable}`}
    >
      <body suppressHydrationWarning>
        <AuthProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
