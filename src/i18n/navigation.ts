// src/i18n/navigation.ts
// Locale-aware replacements for next/link and next/navigation. They add/remove the /vi and /zh prefix for you.
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
