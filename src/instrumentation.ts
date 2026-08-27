/**
 * Next.js instrumentation — production fail-early for incomplete legal config.
 * Does not log secret or legal field values.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const mode = process.env.SITE_MODE?.trim().toLowerCase();
  if (mode !== "production") return;

  const { checkProductionLegalGate } = await import("@/lib/legalConfig");
  const gate = checkProductionLegalGate();
  if (gate.ok) return;

  console.error(
    "[compliance] SITE_MODE=production but required legal configuration is incomplete.",
    "Missing key count:",
    gate.missing.length,
  );

  // During `next build` only warn — hard-fail on actual server runtime.
  const phase = process.env.NEXT_PHASE ?? "";
  if (phase.includes("build")) {
    console.error(
      "[compliance] Build continues, but start/runtime must not serve production PD collection until config is complete.",
    );
    return;
  }

  throw new Error(
    "TECHNICAL_COMPLIANCE_GATE=FAIL: production legal configuration incomplete",
  );
}
