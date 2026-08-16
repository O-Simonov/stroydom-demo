"use client";

import { LEAD_STATUSES, STATUS_LABELS, type LeadStatusValue } from "@/lib/crm/status";

type LeadFiltersProps = {
  status: "ALL" | LeadStatusValue;
  query: string;
  onStatusChange: (status: "ALL" | LeadStatusValue) => void;
  onQueryChange: (query: string) => void;
};

const FILTERS: Array<{ value: "ALL" | LeadStatusValue; label: string }> = [
  { value: "ALL", label: "Все" },
  ...LEAD_STATUSES.map((status) => ({
    value: status,
    label:
      status === "QUOTE_SENT"
        ? "Расчёт"
        : STATUS_LABELS[status],
  })),
];

export function LeadFilters({
  status,
  query,
  onStatusChange,
  onQueryChange,
}: LeadFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = status === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onStatusChange(item.value)}
              className={`rounded-full px-3.5 py-2 text-sm transition ${
                active
                  ? "bg-[var(--forest)] text-[var(--paper)]"
                  : "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--sand)]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <label className="block">
        <span className="sr-only">Поиск</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Поиск по имени, телефону или Telegram"
          className="field-input"
        />
      </label>
    </div>
  );
}
