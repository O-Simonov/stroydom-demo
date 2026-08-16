"use client";

import { useMemo, useState, useTransition } from "react";
import type { CrmLead } from "@/lib/crm/types";
import type { LeadStatusValue } from "@/lib/crm/status";
import { CrmEmptyState } from "@/components/crm/CrmEmptyState";
import { CrmHeader } from "@/components/crm/CrmHeader";
import { CrmStats } from "@/components/crm/CrmStats";
import { LeadCards } from "@/components/crm/LeadCards";
import { LeadDetails } from "@/components/crm/LeadDetails";
import { LeadFilters } from "@/components/crm/LeadFilters";
import { LeadTable } from "@/components/crm/LeadTable";

type CrmBoardProps = {
  initialLeads: CrmLead[];
};

export function CrmBoard({ initialLeads }: CrmBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [status, setStatus] = useState<"ALL" | LeadStatusValue>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, startRefresh] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== "ALL" && lead.status !== status) return false;
      if (!q) return true;
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        (lead.telegram ?? "").toLowerCase().includes(q)
      );
    });
  }, [leads, status, query]);

  const selected = selectedId
    ? (leads.find((lead) => lead.id === selectedId) ?? null)
    : null;

  function onUpdated(next: CrmLead) {
    setLeads((prev) => prev.map((lead) => (lead.id === next.id ? next : lead)));
  }

  function refresh() {
    startRefresh(async () => {
      setError("");
      try {
        const response = await fetch("/api/leads", { cache: "no-store" });
        if (!response.ok) {
          setError("Не удалось загрузить заявки.");
          return;
        }
        const data = (await response.json()) as { leads?: CrmLead[] };
        if (!data.leads) {
          setError("Не удалось загрузить заявки.");
          return;
        }
        setLeads(data.leads);
      } catch {
        setError("Не удалось загрузить заявки.");
      }
    });
  }

  const hasLeads = leads.length > 0;
  const hasFilters = status !== "ALL" || query.trim() !== "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <CrmHeader onRefresh={refresh} isRefreshing={isRefreshing} />
      <CrmStats leads={leads} />
      <LeadFilters
        status={status}
        query={query}
        onStatusChange={setStatus}
        onQueryChange={setQuery}
      />

      {error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div
        className={
          isRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"
        }
        aria-busy={isRefreshing}
      >
        {!hasLeads ? (
          <CrmEmptyState
            title="Заявок пока нет"
            description="Новые заявки с сайта появятся здесь автоматически — сразу после отправки формы и уведомления в Telegram."
          />
        ) : filtered.length === 0 ? (
          <CrmEmptyState
            title="Ничего не найдено"
            description="Попробуйте изменить статус или поисковый запрос — по текущим условиям заявок нет."
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setStatus("ALL");
                    setQuery("");
                  }}
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--sand)]"
                >
                  Сбросить фильтры
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <LeadTable
              leads={filtered}
              onOpen={(lead) => setSelectedId(lead.id)}
              onUpdated={onUpdated}
              onError={setError}
            />
            <LeadCards leads={filtered} onOpen={(lead) => setSelectedId(lead.id)} />
          </>
        )}
      </div>

      {selected ? (
        <LeadDetails
          lead={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={onUpdated}
          onError={setError}
        />
      ) : null}
    </div>
  );
}
