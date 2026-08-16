import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export const CRM_COOKIE_NAME = "crm_session";
export const CRM_SESSION_MAX_AGE_SEC = 8 * 60 * 60;

type SessionPayload = {
  authenticated: true;
  exp: number;
};

export function isCrmConfigured(): boolean {
  const password = process.env.CRM_PASSWORD?.trim();
  const secret = process.env.CRM_SESSION_SECRET?.trim();
  return Boolean(password && secret && secret.length >= 16);
}

export function getCrmPassword(): string | null {
  const password = process.env.CRM_PASSWORD?.trim();
  return password || null;
}

export function getCrmSessionSecret(): string | null {
  const secret = process.env.CRM_SESSION_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function verifyCrmPassword(input: string): boolean {
  const expected = getCrmPassword();
  if (!expected || !isCrmConfigured()) return false;
  return safeEqual(input, expected);
}

export function createCrmSessionToken(secret: string): string {
  const payload: SessionPayload = {
    authenticated: true,
    exp: Date.now() + CRM_SESSION_MAX_AGE_SEC * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export function verifyCrmSessionToken(
  token: string | undefined | null,
  secret: string,
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return false;

  const expected = sign(payloadB64, secret);
  if (!safeEqual(signature, expected)) return false;

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (payload.authenticated !== true) return false;
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CRM_SESSION_MAX_AGE_SEC,
  };
}

export function applyCrmSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(CRM_COOKIE_NAME, token, getSessionCookieOptions());
}

export function clearCrmSessionCookie(response: NextResponse) {
  response.cookies.set(CRM_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export async function readCrmSessionFromCookies(): Promise<boolean> {
  if (!isCrmConfigured()) return false;
  const secret = getCrmSessionSecret();
  if (!secret) return false;
  const jar = await cookies();
  const token = jar.get(CRM_COOKIE_NAME)?.value;
  return verifyCrmSessionToken(token, secret);
}

export function readCrmSessionFromRequest(request: NextRequest): boolean {
  if (!isCrmConfigured()) return false;
  const secret = getCrmSessionSecret();
  if (!secret) return false;
  const token = request.cookies.get(CRM_COOKIE_NAME)?.value;
  return verifyCrmSessionToken(token, secret);
}

export function requireCrmSession(request: NextRequest): boolean {
  return readCrmSessionFromRequest(request);
}

/** Same-origin check for state-changing CRM requests. */
export function isSameOriginRequest(request: NextRequest): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return false;
}
