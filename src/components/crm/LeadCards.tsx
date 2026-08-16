"use client";

import type { CrmLead } from "@/lib/crm/types";
import {
  displayValue,
  formatHouseParams,
  formatLeadDate,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
} from "@/lib/crm/status";

type LeadCardsProps = {
  leads: CrmLead[];
  onOpen: (lead: CrmLead) => void;
};

export function LeadCards({ leads, onOpen }: LeadCardsProps) {
  return (
    <ul className="grid gap-3 md:hidden">
      {leads.map((lead) => (
        <li
          key={lead.id}
          className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--ink)]">{lead.name}</p>
              <a
                href={`tel:${lead.phone}`}
                className="mt-1 block text-sm underline underline-offset-2"
              >
                {lead.phone}
              </a>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[lead.status]}`}
            >
              {STATUS_LABELS[lead.status]}
            </span>
          </div>
          <dl className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
            <div>Дата: {formatLeadDate(lead.createdAt)}</div>
            <div>{formatHouseParams(lead.area, lead.floors)}</div>
            <div>Источник: {displayValue(lead.source)}</div>
          </dl>
          <button
            type="button"
            onClick={() => onOpen(lead)}
            className="mt-4 w-full rounded-full bg-[var(--forest)] px-4 py-2.5 text-sm font-medium text-[var(--paper)]"
          >
            Подробнее
          </button>
        </li>
      ))}
    </ul>
  );
}
