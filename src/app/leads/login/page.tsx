import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CrmLoginForm } from "@/components/crm/CrmLoginForm";
import {
  isCrmConfigured,
  readCrmSessionFromCookies,
} from "@/lib/crm/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "СТРОЙДОМ — Вход в CRM",
  robots: { index: false, follow: false },
};

export default async function CrmLoginPage() {
  if (isCrmConfigured() && (await readCrmSessionFromCookies())) {
    redirect("/leads");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f5f0_0%,#f1ece2_100%)] px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        {!isCrmConfigured() ? (
          <p className="rounded-2xl border border-[var(--line)] bg-[var(--sand)]/60 px-4 py-3 text-sm text-[var(--muted)]">
            CRM временно недоступна.
          </p>
        ) : null}

        <CrmLoginForm />

        <p className="text-center text-xs text-[var(--muted)]">
          <Link
            href="/"
            className="underline underline-offset-2 transition hover:text-[var(--ink)]"
          >
            Вернуться на сайт
          </Link>
          <span className="mx-2 opacity-40">·</span>
          Демонстрационный проект для портфолио
        </p>
      </div>
    </main>
  );
}
