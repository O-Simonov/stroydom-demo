export type Attribution = {
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingUrl: string;
};

function pickParam(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value.slice(0, 180) : undefined;
}

/** Read UTM + landing URL from the current browser location. */
export function readAttributionFromLocation(): Attribution {
  if (typeof window === "undefined") {
    return { source: "website", landingUrl: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = pickParam(params, "utm_source");
  const utmMedium = pickParam(params, "utm_medium");
  const utmCampaign = pickParam(params, "utm_campaign");
  const utmContent = pickParam(params, "utm_content");
  const utmTerm = pickParam(params, "utm_term");

  return {
    source: utmSource ?? "website",
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    landingUrl: window.location.href.slice(0, 500),
  };
}
