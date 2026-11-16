// src/components/LanguageSwitcher.tsx
"use client";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";

export default function LanguageSwitcher() {
  const current = useLocale() as Locale;
  const t = useTranslations("nav");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <select
      aria-label={t("language")}
      value={current}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          await setLocale(e.target.value);
          router.refresh();
        })
      }
      className="rounded-lg border border-white/20 bg-transparent p-3 text-md text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {locales.map((l) => (
        <option key={l} value={l} className="text-black">
          {localeMeta[l].label}
        </option>
      ))}
    </select>
  );
}
