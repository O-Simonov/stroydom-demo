import { NextResponse, type NextRequest } from "next/server";
import { getRequestIp } from "@/lib/requestIp";
import { hitRateLimit, isRateLimited } from "@/lib/rateLimit";
import {
  applyCrmSessionCookie,
  createCrmSessionToken,
  getCrmSessionSecret,
  isCrmConfigured,
  isSameOriginRequest,
  verifyCrmPassword,
} from "@/lib/crm/session";
import { crmLoginSchema } from "@/lib/crm/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isCrmConfigured()) {
    return NextResponse.json(
      { success: false, error: "CRM is not configured" },
      { status: 503 },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Недопустимый источник запроса." },
      { status: 403 },
    );
  }

  const ip = getRequestIp(request);
  const limited = isRateLimited(`crm-login-fail:${ip}`, 5);
  if (limited.limited) {
    return NextResponse.json(
      {
        success: false,
        error: "Слишком много попыток. Попробуйте позже.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Некорректный формат запроса." },
      { status: 400 },
    );
  }

  const parsed = crmLoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Неверный пароль" },
      { status: 401 },
    );
  }

  if (!verifyCrmPassword(parsed.data.password)) {
    hitRateLimit(`crm-login-fail:${ip}`, 5, 10 * 60 * 1000);
    return NextResponse.json(
      { success: false, error: "Неверный пароль" },
      { status: 401 },
    );
  }

  const secret = getCrmSessionSecret();
  if (!secret) {
    return NextResponse.json(
      { success: false, error: "CRM is not configured" },
      { status: 503 },
    );
  }

  const token = createCrmSessionToken(secret);
  const response = NextResponse.json({ success: true });
  applyCrmSessionCookie(response, token);
  return response;
}
