import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for demo rate limiting.
 *
 * Order matters: behind the documented Nginx config X-Real-IP is rewritten by
 * the proxy on every request, so it cannot be spoofed by the client.
 * X-Forwarded-For is only a fallback for other setups and must never take
 * priority, otherwise a client could prepend a fake IP and reset its limit.
 */
export function getRequestIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }

  return "unknown";
}
