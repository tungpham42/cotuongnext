// src/middleware.ts  (Next.js 16: rename this file to src/proxy.ts, the contents stay the same)
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and static files (anything with a dot).
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
