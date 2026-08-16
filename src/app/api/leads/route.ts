import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/requestIp";
import { sendLeadNotification } from "@/lib/telegram";
import { parseLeadCreate } from "@/lib/validation/lead";
import {
  isCrmConfigured,
  requireCrmSession,
} from "@/lib/crm/session";
import { leadListQuerySchema } from "@/lib/crm/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isCrmConfigured()) {
    return NextResponse.json(
      { success: false, error: "CRM is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!requireCrmSession(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = leadListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректные параметры фильтра." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { status, q } = parsed.data;
  const where: Prisma.LeadWhereInput = {};

  if (status !== "ALL") {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { telegram: { contains: q } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    { success: true, leads },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const limited = rateLimit(`leads:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Слишком много попыток. Попробуйте немного позже.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limited.retryAfterSec),
        },
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

  const parsed = parseLeadCreate(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Проверьте заполнение формы.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if (data.website && data.website.trim() !== "") {
    return NextResponse.json({ success: true, id: "accepted" }, { status: 201 });
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        telegram: data.telegram,
        comment: data.comment,
        service: data.service,
        area: data.area,
        floors: data.floors,
        material: data.material,
        package: data.package,
        source: data.source,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmContent: data.utmContent,
        utmTerm: data.utmTerm,
        landingUrl: data.landingUrl,
        status: "NEW",
      },
    });

    try {
      const telegramResult = await sendLeadNotification(lead);
      if (!telegramResult.ok) {
        console.error("[POST /api/leads] Telegram notification failed");
      }
    } catch {
      console.error("[POST /api/leads] Telegram notification threw");
    }

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch {
    console.error("[POST /api/leads] failed to create lead");
    return NextResponse.json(
      {
        success: false,
        error: "Не удалось отправить заявку. Попробуйте ещё раз.",
      },
      { status: 500 },
    );
  }
}
