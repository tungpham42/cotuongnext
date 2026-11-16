import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Cờ Tướng Online",
  description: "Thi đấu cờ tướng trực tuyến, chơi với máy, xếp hạng Elo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <Nav />
          <main className="mx-auto max-w-5xl p-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
