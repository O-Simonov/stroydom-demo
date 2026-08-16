/**
 * Public site origin, used for canonical/OpenGraph/sitemap URLs.
 * Production value comes from NEXT_PUBLIC_SITE_URL; no domain is hardcoded.
 */
const FALLBACK_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return FALLBACK_SITE_URL;
    }
    return url.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/** True once a real public URL is configured (used to gate indexing). */
export function isPublicSiteConfigured(): boolean {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return Boolean(raw) && getSiteUrl() !== FALLBACK_SITE_URL;
}
