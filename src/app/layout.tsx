import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { getSiteUrl, isPublicSiteConfigured } from "@/lib/siteUrl";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const SITE_URL = getSiteUrl();
const TITLE = "СТРОЙДОМ — строительство загородных домов под ключ";
const DESCRIPTION =
  "Демонстрационный проект сайта строительной компании: проекты домов, подбор параметров дома, заявка и mini-CRM для обработки обращений.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s",
  },
  description: DESCRIPTION,
  applicationName: "СТРОЙДОМ",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "СТРОЙДОМ",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  // Indexing is enabled only once a real public URL is configured.
  robots: isPublicSiteConfigured()
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${unbounded.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
