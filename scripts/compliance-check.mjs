/**
 * Technical compliance gate (not a legal conclusion).
 * Usage: node scripts/compliance-check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env"));

const requiredRoutes = [
  "src/app/privacy/page.tsx",
  "src/app/personal-data-consent/page.tsx",
  "src/app/cookies/page.tsx",
  "src/lib/siteMode.ts",
  "src/lib/legalConfig.ts",
  "docs/OWNER_CONFIGURATION.md",
];

const missingRoutes = requiredRoutes
  .filter((rel) => !fs.existsSync(path.join(root, rel)))
  .map((rel) => `Missing required file: ${rel}`);

// Prefer compiled-free check via duplicated logic for reliability without tsx
const siteMode = (process.env.SITE_MODE || "demo").trim().toLowerCase() === "production"
  ? "production"
  : "demo";

const failures = [...missingRoutes];
const notes = [];

function read(name) {
  return (process.env[name] || "").trim();
}

if (siteMode === "production") {
  const required = [
    "LEGAL_OPERATOR_NAME",
    "LEGAL_OPERATOR_STATUS",
    "LEGAL_INN",
    "LEGAL_ADDRESS",
    "LEGAL_EMAIL",
    "LEGAL_PHONE",
    "PRIVACY_CONTACT_EMAIL",
    "PERSONAL_DATA_RETENTION_DAYS",
    "PRIVACY_POLICY_VERSION",
  ];
  const missing = required.filter((k) => !read(k));
  if (missing.length) {
    failures.push(
      `SITE_MODE=production but legal config incomplete (missing keys: ${missing.join(", ")})`,
    );
  } else {
    const suspicious = [read("LEGAL_OPERATOR_NAME"), read("LEGAL_EMAIL"), read("LEGAL_PHONE")].some(
      (v) => /demo|example\.|000-00-00|stroydom\.demo|placeholder|тест|заглуш/i.test(v),
    );
    if (suspicious) {
      failures.push("Production legal config appears to contain demo/placeholder values");
    }
  }
  notes.push("Production mode requires owner-supplied legal env vars before PD collection.");
} else {
  notes.push("Demo mode: public lead API must not persist visitor PII.");
}

// Favicon redirect present in next.config
const nextConfigPath = path.join(root, "next.config.ts");
const nextConfigText = fs.readFileSync(nextConfigPath, "utf8");
if (!nextConfigText.includes("favicon.ico") || !nextConfigText.includes("Strict-Transport-Security")) {
  failures.push("next.config.ts missing expected security/favicon configuration markers");
}

const iconSvg = path.join(root, "src/app/icon.svg");
if (!fs.existsSync(iconSvg)) {
  failures.push("Missing src/app/icon.svg");
}

const gate = failures.length === 0 ? "PASS" : "FAIL";
console.log(`SITE_MODE=${siteMode}`);
console.log(`TECHNICAL_COMPLIANCE_GATE=${gate}`);
for (const n of notes) console.log(`NOTE: ${n}`);
for (const f of failures) console.log(`FAIL: ${f}`);

if (gate !== "PASS") process.exit(1);
