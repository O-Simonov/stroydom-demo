import { NextResponse, type NextRequest } from "next/server";
import {
  clearCrmSessionCookie,
  isSameOriginRequest,
} from "@/lib/crm/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Недопустимый источник запроса." },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });
  clearCrmSessionCookie(response);
  return response;
}
