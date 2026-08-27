import { checkProductionLegalGate } from "@/lib/legalConfig";
import { getSiteMode, isProductionMode } from "@/lib/siteMode";

export type ComplianceCheckResult = {
  siteMode: string;
  technicalGate: "PASS" | "FAIL";
  failures: string[];
  notes: string[];
};

/**
 * Technical compliance gate (not a legal conclusion).
 * Does not print env secret values.
 */
export function runTechnicalComplianceCheck(options?: {
  missingRoutes?: string[];
}): ComplianceCheckResult {
  const failures: string[] = [...(options?.missingRoutes ?? [])];
  const notes: string[] = [];
  const siteMode = getSiteMode();

  if (isProductionMode()) {
    const gate = checkProductionLegalGate();
    if (!gate.ok) {
      failures.push(
        `SITE_MODE=production but legal config incomplete (missing keys: ${gate.missing.join(", ")})`,
      );
    } else {
      const suspicious = [
        gate.config.operatorName,
        gate.config.email,
        gate.config.phone,
      ].some((v) =>
        /demo|example\.|000-00-00|stroydom\.demo|placeholder|тест|заглуш/i.test(
          v,
        ),
      );
      if (suspicious) {
        failures.push(
          "Production legal config appears to contain demo/placeholder values",
        );
      }
    }
    notes.push(
      "Production mode requires owner-supplied legal env vars before PD collection.",
    );
  } else {
    notes.push("Demo mode: public lead API must not persist visitor PII.");
  }

  return {
    siteMode,
    technicalGate: failures.length === 0 ? "PASS" : "FAIL",
    failures,
    notes,
  };
}
