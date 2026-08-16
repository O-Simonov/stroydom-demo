"use client";

import { useState } from "react";
import type { CrmLead } from "@/lib/crm/types";
import {
  LEAD_STATUSES,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  type LeadStatusValue,
} from "@/lib/crm/status";

type LeadStatusSelectProps = {
  lead: CrmLead;
  onUpdated: (lead: CrmLead) => void;
  onError: (message: string) => void;
};

export function LeadStatusSelect({
  lead,
  onUpdated,
  onError,
}: LeadStatusSelectProps) {
  const [loading, setLoading] = useState(false);

  async function changeStatus(status: LeadStatusValue) {
    if (status === lead.status || loading) return;
    setLoading(true);
    onError("");
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        status?: LeadStatusValue;
        error?: string;
      };
      if (!response.ok || !data.success || !data.status) {
        onError(data.error || "Не удалось обновить статус.");
        return;
      }
      onUpdated({ ...lead, status: data.status });
    } catch {
      onError("Не удалось обновить статус.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[lead.status]}`}
      >
        {STATUS_LABELS[lead.status]}
      </span>
      <select
        aria-label="Сменить статус"
        disabled={loading}
        value={lead.status}
        onChange={(e) => changeStatus(e.target.value as LeadStatusValue)}
        className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm disabled:opacity-60"
      >
        {LEAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {loading ? (
        <span className="text-xs text-[var(--muted)]">Сохраняем...</span>
      ) : null}
    </div>
  );
}
