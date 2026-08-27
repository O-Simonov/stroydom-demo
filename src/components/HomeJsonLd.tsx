import { getSiteUrl } from "@/lib/siteUrl";
import { isDemoMode } from "@/lib/siteMode";

/** Safe JSON-LD only — no fake Organization/LocalBusiness/ratings. */
export function HomeJsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "СТРОЙДОМ",
    url,
    description: isDemoMode()
      ? "Демонстрационный проект сайта строительной компании для портфолио."
      : "Сайт строительной компании СТРОЙДОМ.",
    inLanguage: "ru-RU",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
