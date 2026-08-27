/**
 * Server-only legal / operator configuration for production mode.
 * Values come from environment — never invent placeholders as real data.
 * Do not log secret or full legal payloads in error messages.
 */

export type LegalOperatorStatus =
  | "ooo"
  | "ip"
  | "self_employed"
  | "individual"
  | "other"
  | "";

export type LegalConfig = {
  operatorName: string;
  operatorStatus: string;
  inn: string;
  ogrn: string;
  address: string;
  email: string;
  phone: string;
  privacyContactEmail: string;
  retentionDays: number | null;
  privacyPolicyVersion: string;
};

function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getLegalConfig(): LegalConfig {
  const retentionRaw = read("PERSONAL_DATA_RETENTION_DAYS");
  let retentionDays: number | null = null;
  if (retentionRaw) {
    const n = Number.parseInt(retentionRaw, 10);
    if (Number.isFinite(n) && n > 0) retentionDays = n;
  }

  return {
    operatorName: read("LEGAL_OPERATOR_NAME"),
    operatorStatus: read("LEGAL_OPERATOR_STATUS"),
    inn: read("LEGAL_INN"),
    ogrn: read("LEGAL_OGRN"),
    address: read("LEGAL_ADDRESS"),
    email: read("LEGAL_EMAIL"),
    phone: read("LEGAL_PHONE"),
    privacyContactEmail:
      read("PRIVACY_CONTACT_EMAIL") || read("LEGAL_EMAIL"),
    retentionDays,
    privacyPolicyVersion: read("PRIVACY_POLICY_VERSION") || "1.0",
  };
}

/** Fields required before production may collect personal data. */
export const PRODUCTION_LEGAL_REQUIRED_KEYS = [
  "LEGAL_OPERATOR_NAME",
  "LEGAL_OPERATOR_STATUS",
  "LEGAL_INN",
  "LEGAL_ADDRESS",
  "LEGAL_EMAIL",
  "LEGAL_PHONE",
  "PRIVACY_CONTACT_EMAIL",
  "PERSONAL_DATA_RETENTION_DAYS",
  "PRIVACY_POLICY_VERSION",
] as const;

export type ProductionLegalGateResult =
  | { ok: true; config: LegalConfig }
  | { ok: false; missing: string[] };

/**
 * Technical gate for production PD collection.
 * OGRN is optional (depends on legal status) — owner decides applicability.
 */
export function checkProductionLegalGate(): ProductionLegalGateResult {
  const config = getLegalConfig();
  const missing: string[] = [];

  if (!config.operatorName) missing.push("LEGAL_OPERATOR_NAME");
  if (!config.operatorStatus) missing.push("LEGAL_OPERATOR_STATUS");
  if (!config.inn) missing.push("LEGAL_INN");
  if (!config.address) missing.push("LEGAL_ADDRESS");
  if (!config.email) missing.push("LEGAL_EMAIL");
  if (!config.phone) missing.push("LEGAL_PHONE");
  if (!config.privacyContactEmail) missing.push("PRIVACY_CONTACT_EMAIL");
  if (config.retentionDays == null) missing.push("PERSONAL_DATA_RETENTION_DAYS");
  if (!config.privacyPolicyVersion) missing.push("PRIVACY_POLICY_VERSION");

  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, config };
}

export function isProductionLegallyConfigured(): boolean {
  return checkProductionLegalGate().ok;
}
