"use client";

import type { ReactNode } from "react";
import type { CrmLead } from "@/lib/crm/types";
import {
  displayValue,
  formatLeadDate,
  safeHttpUrl,
  shortUrl,
  STATUS_LABELS,
  telegramHref,
} from "@/lib/crm/status";
import { LeadStatusSelect } from "@/components/crm/LeadStatusSelect";

type LeadDetailsProps = {
  lead: CrmLead;
  onClose: () => void;
  onUpdated: (lead: CrmLead) => void;
  onError: (message: string) => void;
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 border-b border-[var(--line)] py-2.5 text-sm last:border-b-0">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="break-words text-[var(--ink)]">{value}</dd>
    </div>
  );
}

export function LeadDetails({
  lead,
  onClose,
  onUpdated,
  onError,
}: LeadDetailsProps) {
  const tgLink = telegramHref(lead.telegram);
  const landingHref = safeHttpUrl(lead.landingUrl);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(20,24,22,0.42)] p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-[var(--paper)] shadow-[-20px_0_50px_rgba(20,24,22,0.12)] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              Заявка
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              {lead.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm"
          >
            Закрыть
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <LeadStatusSelect lead={lead} onUpdated={onUpdated} onError={onError} />

          <dl>
            <Row label="ID" value={lead.id} />
            <Row label="Дата" value={formatLeadDate(lead.createdAt)} />
            <Row label="Имя" value={lead.name} />
            <Row
              label="Телефон"
              value={
                <a className="underline underline-offset-2" href={`tel:${lead.phone}`}>
                  {lead.phone}
                </a>
              }
            />
            <Row
              label="Telegram"
              value={
                lead.telegram ? (
                  tgLink ? (
                    <a
                      className="underline underline-offset-2"
                      href={tgLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {lead.telegram}
                    </a>
                  ) : (
                    lead.telegram
                  )
                ) : null
              }
            />
            <Row label="Комментарий" value={lead.comment} />
            <Row label="Услуга" value={lead.service} />
            <Row
              label="Площадь"
              value={lead.area != null ? `${lead.area} м²` : null}
            />
            <Row label="Этажи" value={lead.floors} />
            <Row label="Материал" value={lead.material} />
            <Row label="Комплектация" value={lead.package} />
            <Row label="Статус" value={STATUS_LABELS[lead.status]} />
            <Row label="Источник" value={lead.source} />
            <Row label="utm_source" value={lead.utmSource} />
            <Row label="utm_medium" value={lead.utmMedium} />
            <Row label="utm_campaign" value={lead.utmCampaign} />
            <Row label="utm_content" value={lead.utmContent} />
            <Row label="utm_term" value={lead.utmTerm} />
            <Row
              label="Страница"
              value={
                lead.landingUrl ? (
                  landingHref ? (
                    <a
                      href={landingHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={lead.landingUrl}
                      className="underline underline-offset-2"
                    >
                      {shortUrl(lead.landingUrl)}
                    </a>
                  ) : (
                    <span title={lead.landingUrl}>{shortUrl(lead.landingUrl)}</span>
                  )
                ) : (
                  displayValue(null)
                )
              }
            />
          </dl>
        </div>
      </aside>
    </div>
  );
}
