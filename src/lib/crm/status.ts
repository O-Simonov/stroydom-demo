import type { LeadStatus } from "@prisma/client";

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTE_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type LeadStatusValue = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatusValue, string> = {
  NEW: "Новая",
  CONTACTED: "Связались",
  QUOTE_SENT: "Расчёт отправлен",
  NEGOTIATION: "Переговоры",
  WON: "Продажа",
  LOST: "Отказ",
};

export function isLeadStatus(value: unknown): value is LeadStatusValue {
  return (
    typeof value === "string" &&
    (LEAD_STATUSES as readonly string[]).includes(value)
  );
}

export function statusLabel(status: LeadStatus | LeadStatusValue): string {
  return STATUS_LABELS[status as LeadStatusValue] ?? status;
}

export function formatLeadDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

/** Split date/time so compact table cells can stack them on two lines. */
export function formatLeadDateParts(date: Date | string): {
  date: string;
  time: string;
} {
  const value = typeof date === "string" ? new Date(date) : date;
  const common = { timeZone: "Europe/Moscow" } as const;
  return {
    date: new Intl.DateTimeFormat("ru-RU", {
      ...common,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(value),
    time: new Intl.DateTimeFormat("ru-RU", {
      ...common,
      hour: "2-digit",
      minute: "2-digit",
    }).format(value),
  };
}

export function displayValue(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const text = String(value).trim();
  return text ? text : "—";
}

export function telegramHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const username = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) return null;
  return `https://t.me/${username}`;
}

/** Compact "120 м² · 2 эт." summary for narrow table cells. */
export function formatHouseParams(
  area: number | null | undefined,
  floors: number | null | undefined,
): string {
  const parts: string[] = [];
  if (area != null) parts.push(`${area} м²`);
  if (floors != null) parts.push(`${floors} эт.`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function shortUrl(url: string, max = 48): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

/** Defense-in-depth: only return href-safe http/https URLs. */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const STATUS_BADGE_CLASS: Record<LeadStatusValue, string> = {
  NEW: "bg-[color-mix(in_srgb,var(--brass)_22%,var(--paper))] text-[var(--ink)]",
  CONTACTED: "bg-[color-mix(in_srgb,#3b6ea5_16%,var(--paper))] text-[#234866]",
  QUOTE_SENT: "bg-[color-mix(in_srgb,var(--brass)_28%,var(--paper))] text-[#6a5228]",
  NEGOTIATION: "bg-[color-mix(in_srgb,#6b5b95_14%,var(--paper))] text-[#3d3558]",
  WON: "bg-[color-mix(in_srgb,var(--forest)_18%,var(--paper))] text-[var(--forest-deep)]",
  LOST: "bg-[color-mix(in_srgb,#8a6a6a_14%,var(--paper))] text-[#5a4040]",
};

export const IN_PROGRESS_STATUSES: LeadStatusValue[] = [
  "CONTACTED",
  "QUOTE_SENT",
  "NEGOTIATION",
];
