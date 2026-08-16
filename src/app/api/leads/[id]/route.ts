import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isCrmConfigured,
  isSameOriginRequest,
  requireCrmSession,
} from "@/lib/crm/session";
import { leadStatusPatchSchema } from "@/lib/crm/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isCrmConfigured()) {
    return NextResponse.json(
      { success: false, error: "CRM is not configured" },
      { status: 503 },
    );
  }

  if (!requireCrmSession(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Недопустимый источник запроса." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (!id || id.length > 64) {
    return NextResponse.json(
      { success: false, error: "Некорректный идентификатор." },
      { status: 400 },
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

  const parsed = leadStatusPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Некорректный статус." },
      { status: 400 },
    );
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      success: true,
      id: lead.id,
      status: lead.status,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, error: "Заявка не найдена." },
        { status: 404 },
      );
    }

    console.error("[PATCH /api/leads/:id] failed to update lead");
    return NextResponse.json(
      { success: false, error: "Не удалось обновить заявку." },
      { status: 500 },
    );
  }
}
