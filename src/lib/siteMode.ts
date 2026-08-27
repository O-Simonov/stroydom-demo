/**
 * Public site operating mode.
 * SITE_MODE is not a secret — safe in .env.example.
 * Default: demo (portfolio / safe public demonstration).
 */
export type SiteMode = "demo" | "production";

export function getSiteMode(): SiteMode {
  const raw = process.env.SITE_MODE?.trim().toLowerCase();
  if (raw === "production") return "production";
  return "demo";
}

export function isDemoMode(): boolean {
  return getSiteMode() === "demo";
}

export function isProductionMode(): boolean {
  return getSiteMode() === "production";
}

/** Version of /personal-data-consent document shown to users. */
export const CONSENT_DOCUMENT_VERSION = "1.0";
