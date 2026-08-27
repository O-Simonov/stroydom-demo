import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { getSiteMode } from "@/lib/siteMode";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const siteMode = getSiteMode();

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg tracking-[0.06em] text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--forest)]"
          >
            СТРОЙДОМ
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--muted)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--forest)]"
          >
            На главную
          </Link>
        </div>
      </header>
      <main className="bg-[var(--sand)]/30">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          <div className="prose-legal mt-8 space-y-4 text-sm leading-relaxed text-[var(--ink)]">
            {children}
          </div>
        </article>
      </main>
      <Footer siteMode={siteMode} />
    </>
  );
}
