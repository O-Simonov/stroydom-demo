export type LeadNotificationPayload = {
  id: string;
  name: string;
  phone: string;
  telegram: string | null;
  comment: string | null;
  service: string;
  area: number | null;
  floors: number | null;
  material: string | null;
  package: string | null;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingUrl: string | null;
  createdAt: Date;
};

export type TelegramSendResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

const TELEGRAM_TIMEOUT_MS = 5_000;
const MAX_LANDING_URL_CHARS = 180;

function formatMoscowDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function truncateUrl(url: string): string {
  if (url.length <= MAX_LANDING_URL_CHARS) return url;
  return `${url.slice(0, MAX_LANDING_URL_CHARS - 1)}…`;
}

function line(label: string, value: string | number | null | undefined): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return `${label}: ${text}`;
}

/** Build a plain-text Telegram message for a new lead. */
export function formatLeadTelegramMessage(lead: LeadNotificationPayload): string {
  const blocks: string[] = ["Новая заявка — СТРОЙДОМ", ""];

  const contacts = [
    line("Клиент", lead.name),
    line("Телефон", lead.phone),
    line("Telegram", lead.telegram),
  ].filter(Boolean) as string[];
  blocks.push(...contacts);

  blocks.push("", `Услуга: ${lead.service}`);

  const house = [
    line("Площадь", lead.area != null ? `${lead.area} м²` : null),
    line("Этажи", lead.floors),
    line("Материал", lead.material),
    line("Комплектация", lead.package),
  ].filter(Boolean) as string[];

  if (house.length > 0) {
    blocks.push("", "Параметры дома:", ...house);
  }

  if (lead.comment?.trim()) {
    blocks.push("", "Комментарий:", lead.comment.trim());
  }

  if (lead.source?.trim()) {
    blocks.push("", `Источник: ${lead.source.trim()}`);
  }

  const marketing = [
    line("utm_source", lead.utmSource),
    line("utm_medium", lead.utmMedium),
    line("utm_campaign", lead.utmCampaign),
    line("utm_content", lead.utmContent),
    line("utm_term", lead.utmTerm),
  ].filter(Boolean) as string[];

  if (marketing.length > 0) {
    blocks.push("", "Маркетинг:", ...marketing);
  }

  if (lead.landingUrl?.trim()) {
    blocks.push("", "Страница:", truncateUrl(lead.landingUrl.trim()));
  }

  blocks.push("", `Дата: ${formatMoscowDate(lead.createdAt)}`, `ID: ${lead.id}`);

  return blocks.join("\n");
}

/**
 * Best-effort Telegram notification.
 * Never throws to the caller — returns a result object instead.
 * Does not log TELEGRAM_BOT_TOKEN or bot API URLs with the token.
 */
export async function sendLeadNotification(
  lead: LeadNotificationPayload,
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.warn(
      "[Telegram] Notification skipped: Telegram is not configured.",
    );
    return {
      ok: true,
      skipped: true,
      reason: "Telegram is not configured",
    };
  }

  const text = formatLeadTelegramMessage(lead);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          link_preview_options: {
            is_disabled: true,
          },
        }),
        signal: controller.signal,
      },
    );

    let payload: { ok?: boolean; description?: string } | null = null;
    try {
      payload = (await response.json()) as { ok?: boolean; description?: string };
    } catch {
      payload = null;
    }

    if (!response.ok || payload?.ok !== true) {
      console.error(
        "[Telegram] sendMessage failed:",
        response.status,
        payload?.description ? "telegram_api_error" : "invalid_response",
      );
      return {
        ok: false,
        error: `Telegram API status ${response.status}`,
      };
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[Telegram] request timeout");
      return { ok: false, error: "timeout" };
    }

    console.error("[Telegram] network error");
    return { ok: false, error: "network_error" };
  } finally {
    clearTimeout(timer);
  }
}
