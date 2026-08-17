"use client";

import type { CrmLead } from "@/lib/crm/types";
import {
  displayValue,
  formatHouseParams,
  formatLeadDateParts,
} from "@/lib/crm/status";
import { LeadStatusSelect } from "@/components/crm/LeadStatusSelect";

type LeadTableProps = {
  leads: CrmLead[];
  onOpen: (lead: CrmLead) => void;
  onUpdated: (lead: CrmLead) => void;
  onError: (message: string) => void;
};

export function LeadTable({ leads, onOpen, onUpdated, onError }: LeadTableProps) {
  return (
    <div className="hidden overflow-x-auto rounded-3xl border border-[var(--line)] bg-[var(--paper)] md:block">
      <table className="w-full table-fixed text-left text-[13px] leading-snug">
        <colgroup>
          <col className="w-[92px]" />
          <col className="w-[17%]" />
          <col className="w-[148px]" />
          <col className="w-[14%]" />
          <col className="w-[116px]" />
          <col className="w-[10%]" />
          <col className="w-[168px]" />
          <col className="w-[108px]" />
        </colgroup>
        <thead className="border-b border-[var(--line)] bg-[var(--sand)]/50 text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
          <tr>
            <th className="px-3 py-2.5 font-medium">Дата</th>
            <th className="px-3 py-2.5 font-medium">Клиент</th>
            <th className="px-3 py-2.5 font-medium">Телефон</th>
            <th className="px-3 py-2.5 font-medium">Услуга</th>
            <th className="px-3 py-2.5 font-medium">Параметры</th>
            <th className="px-3 py-2.5 font-medium">Источник</th>
            <th className="px-3 py-2.5 font-medium">Статус</th>
            <th className="px-3 py-2.5 font-medium text-right">Действие</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const { date, time } = formatLeadDateParts(lead.createdAt);
            return (
              <tr
                key={lead.id}
                className="border-b border-[var(--line)] align-middle last:border-b-0 hover:bg-[var(--sand)]/30"
              >
                <td className="px-3 py-2.5 whitespace-nowrap text-[var(--muted)]">
                  <span className="block tabular-nums">{date}</span>
                  <span className="block text-[11px] tabular-nums opacity-80">
                    {time}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className="block truncate font-medium text-[var(--ink)]"
                    title={lead.name}
                  >
                    {lead.name}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <a
                    className="tabular-nums underline underline-offset-2"
                    href={`tel:${lead.phone}`}
                  >
                    {lead.phone}
                  </a>
                </td>
                <td className="px-3 py-2.5">
                  <span className="block truncate text-[var(--ink)]" title={lead.service}>
                    {lead.service}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-[var(--muted)]">
                  {formatHouseParams(lead.area, lead.floors)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className="block truncate text-[12px] text-[var(--muted)]"
                    title={lead.source ?? undefined}
                  >
                    {displayValue(lead.source)}
                  </span>
                </td>
                <td className="min-w-0 overflow-hidden px-3 py-2.5">
                  <LeadStatusSelect
                    layout="stack"
                    lead={lead}
                    onUpdated={onUpdated}
                    onError={onError}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onOpen(lead)}
                    className="inline-flex whitespace-nowrap rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--sand)]"
                  >
                    Подробнее
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
