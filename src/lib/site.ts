const FALLBACK_SITE_URL = "https://play.cotuong.top";

function resolveSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configuredUrl || FALLBACK_SITE_URL).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/**
 * Canonical public origin used by metadata, the sitemap, and robots.txt.
 * Configure NEXT_PUBLIC_SITE_URL for deployments on a different domain.
 */
export const SITE_URL = resolveSiteUrl();
