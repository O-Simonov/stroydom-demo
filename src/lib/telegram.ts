export type LeadNotificationPayload = {
  id: string;
  createdAt: Date;
};

export type TelegramSendResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

const TELEGRAM_TIMEOUT_MS = 5_000;

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

/**
 * Minimal Telegram message — lead id + CRM hint only.
 * Does not include name, phone, telegram, comment, or other PII.
 */
export function formatLeadTelegramMessage(lead: LeadNotificationPayload): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const crmPath = "/leads";
  const crmUrl = siteUrl ? `${siteUrl}${crmPath}` : crmPath;

  return [
    "Новая заявка — СТРОЙДОМ",
    "",
    `ID: ${lead.id}`,
    `Дата: ${formatMoscowDate(lead.createdAt)}`,
    `CRM: ${crmUrl}`,
    "",
    "Персональные данные не передаются в это уведомление — откройте CRM.",
  ].join("\n");
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
