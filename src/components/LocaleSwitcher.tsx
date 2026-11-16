"use client";
import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeMeta, locales, type Locale } from "@/i18n/config";

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname(); // path WITHOUT the locale prefix, e.g. /room/ab12cd
  const [pending, start] = useTransition();

  return (
    <select
      className="input !w-auto !px-2 !py-1 text-sm"
      aria-label={localeMeta[locale].label}
      title={localeMeta[locale].label}
      value={locale}
      disabled={pending}
      onChange={(e) =>
        start(() =>
          router.replace(pathname, { locale: e.target.value as Locale }),
        )
      }
    >
      {locales.map((l) => (
        // Short code (EN / VI / ZH) keeps the control compact; the full name shows as a tooltip.
        <option key={l} value={l} title={localeMeta[l].label}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
