"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CrmHeaderProps = {
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function CrmHeader({ onRefresh, isRefreshing = false }: CrmHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/crm/logout", { method: "POST" });
      router.replace("/leads/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.18em] text-[var(--brass)]">
          СТРОЙДОМ
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] sm:text-3xl">
          Учёт заявок
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--sand)] disabled:opacity-60"
          >
            {isRefreshing ? "Обновляем..." : "Обновить"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={logout}
          disabled={loading}
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--sand)] disabled:opacity-60"
        >
          {loading ? "Выходим..." : "Выйти"}
        </button>
      </div>
    </div>
  );
}
