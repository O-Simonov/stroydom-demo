import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/LegalPageShell";
import { isDemoMode } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Файлы cookie — СТРОЙДОМ",
  description: "Какие файлы cookie использует сайт СТРОЙДОМ.",
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  const demo = isDemoMode();

  return (
    <LegalPageShell title="Файлы cookie">
      <p>
        На сайте используются только необходимые (essential) cookie. Аналитические и
        маркетинговые трекеры не подключены. Отдельный сложный cookie-banner не
        показывается.
      </p>

      <h2 className="pt-4 text-lg font-semibold">crm_session</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Назначение: вход в закрытый раздел учёта заявок (CRM).</li>
        <li>Сторона: собственный домен сайта (first-party).</li>
        <li>Категория: ESSENTIAL (только для авторизованной работы CRM).</li>
        <li>Срок: до 8 часов (maxAge).</li>
        <li>Флаги: HttpOnly; SameSite=Lax; Secure в production (NODE_ENV=production).</li>
        <li>Устанавливается после успешного входа в CRM, не на публичной форме заявки.</li>
      </ul>

      <p className="pt-4">
        {demo
          ? "В демонстрационном режиме публичная форма не сохраняет персональные данные; cookie заявки для посетителя не создаются."
          : "Подробнее об обработке персональных данных — в "}
        {!demo ? (
          <Link href="/privacy" className="underline underline-offset-2">
            политике
          </Link>
        ) : null}
        {!demo ? "." : null}
      </p>
    </LegalPageShell>
  );
}
