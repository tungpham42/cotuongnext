// next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Pikafish (WebAssembly threads) needs SharedArrayBuffer, which browsers only expose on
// cross-origin isolated pages. These headers are limited to the AI route on purpose: COOP
// `same-origin` would break the Google/Facebook sign-in popups on the rest of the site.
// `credentialless` (rather than `require-corp`) lets third-party scripts and avatars keep
// loading; browsers without support (Safari) simply get the built-in fallback AI.
const isolationHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // Default locale is served without a prefix ("/ai"); the others as "/vi/ai", "/ja/ai", ...
      { source: "/ai", headers: isolationHeaders },
      { source: "/:locale/ai", headers: isolationHeaders },
    ];
  },
};

export default withNextIntl(nextConfig);
