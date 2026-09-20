import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
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

export const metadata: Metadata = {
  title: "СТРОЙДОМ — строительство загородных домов под ключ",
  description:
    "Демонстрационный лендинг строительной компании: проекты домов, этапы работ, калькулятор и заявка. Демонстрационный проект для портфолио.",
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
