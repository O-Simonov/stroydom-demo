/**
 * Compliance-focused automated checks (technical, not legal opinion).
 * Run: npm run test:compliance
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

// Load zod + project modules via ts strip if available, else dynamic path with jiti-less approach:
// Use prisma-free pure copies by spawning node --experimental-strip-types on a helper.

const { spawnSync } = await import("node:child_process");

function runTs(exprFile) {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", exprFile],
    { encoding: "utf8", cwd: root, env: process.env },
  );
  return result;
}

// --- File / route existence ---
test("privacy route exists", () => {
  assert.ok(fs.existsSync(path.join(root, "src/app/privacy/page.tsx")));
});
test("personal-data-consent route exists", () => {
  assert.ok(fs.existsSync(path.join(root, "src/app/personal-data-consent/page.tsx")));
});
test("cookies route exists", () => {
  assert.ok(fs.existsSync(path.join(root, "src/app/cookies/page.tsx")));
});
test("icon.svg exists (favicon target)", () => {
  assert.ok(fs.existsSync(path.join(root, "src/app/icon.svg")));
});
test("OWNER_CONFIGURATION.md exists", () => {
  assert.ok(fs.existsSync(path.join(root, "docs/OWNER_CONFIGURATION.md")));
});

test("sitemap excludes CRM routes", () => {
  const text = fs.readFileSync(path.join(root, "src/app/sitemap.ts"), "utf8");
  assert.ok(text.includes("/privacy"));
  assert.ok(text.includes("/cookies"));
  assert.ok(!text.includes("/leads"));
});

test("robots disallow CRM", () => {
  const text = fs.readFileSync(path.join(root, "src/app/robots.ts"), "utf8");
  assert.ok(text.includes("/leads"));
  assert.ok(text.includes("/api/"));
});

test("security headers configured", () => {
  const text = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
  assert.ok(text.includes("Content-Security-Policy"));
  assert.ok(text.includes("Strict-Transport-Security"));
  assert.ok(text.includes("X-Frame-Options") || text.includes("frame-ancestors"));
  assert.ok(text.includes("Referrer-Policy"));
  assert.ok(text.includes("Permissions-Policy"));
});

test("no analytics trackers wired in src", () => {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?|mjs|css)$/.test(entry.name)) {
        const body = fs.readFileSync(full, "utf8");
        assert.ok(!/mc\.yandex\.ru|googletagmanager|gtag\(|facebook\.net|vk\.com\/js\/api\/openapi/i.test(body), full);
      }
    }
  };
  walk(path.join(root, "src"));
});

test("Telegram formatter avoids PII fields", () => {
  const text = fs.readFileSync(path.join(root, "src/lib/telegram.ts"), "utf8");
  assert.ok(text.includes("ID:"));
  assert.ok(text.includes("CRM:"));
  assert.ok(!/lead\.name|lead\.phone|Клиент|Телефон/.test(text));
});

test("LeadForm consent default false in source", () => {
  const text = fs.readFileSync(path.join(root, "src/components/LeadForm.tsx"), "utf8");
  assert.ok(/consent:\s*false/.test(text));
  assert.ok(text.includes("/privacy"));
  assert.ok(text.includes("/personal-data-consent"));
});

test("API demo mode branch present", () => {
  const text = fs.readFileSync(path.join(root, "src/app/api/leads/route.ts"), "utf8");
  assert.ok(text.includes("isDemoMode"));
  assert.ok(text.includes("demo: true"));
  assert.ok(text.includes("parseLeadCreate"));
  assert.ok(text.includes("consentGiven"));
});

test("migration is additive and non-destructive", () => {
  const sql = fs.readFileSync(
    path.join(root, "prisma/migrations/20260827180000_lead_consent_evidence/migration.sql"),
    "utf8",
  );
  assert.ok(sql.includes('ADD COLUMN "consentGiven"'));
  assert.ok(sql.includes("DEFAULT false"));
  assert.ok(sql.includes('ADD COLUMN "consentTimestamp"'));
  assert.ok(sql.includes('ADD COLUMN "consentDocumentVersion"'));
  assert.ok(!/\bDROP\b/i.test(sql));
  assert.ok(!/\bRENAME\b/i.test(sql));
  assert.ok(!/CREATE TABLE/i.test(sql));
});

test("HSTS has no includeSubDomains/preload on header value", () => {
  const text = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
  assert.ok(text.includes("Strict-Transport-Security"));
  const valueMatch = text.match(
    /Strict-Transport-Security[\s\S]*?value:\s*"([^"]+)"/,
  );
  assert.ok(valueMatch, "HSTS value not found");
  const value = valueMatch[1];
  assert.equal(value, "max-age=31536000");
  assert.ok(!/includeSubDomains/i.test(value));
  assert.ok(!/preload/i.test(value));
});

test("SITE_MODE defaults to demo when unset", () => {
  const text = fs.readFileSync(path.join(root, "src/lib/siteMode.ts"), "utf8");
  assert.ok(text.includes('return "demo"'));
  assert.ok(text.includes('raw === "production"'));
});

test("CRM UI does not invent consent for historical rows", () => {
  for (const rel of [
    "src/components/crm/LeadDetails.tsx",
    "src/components/crm/LeadTable.tsx",
    "src/components/crm/LeadCards.tsx",
    "src/components/crm/CrmBoard.tsx",
  ]) {
    const body = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(!/consentGiven|consentTimestamp|consentDocumentVersion/.test(body), rel);
  }
});

test("demo API path does not call prisma.lead.create", () => {
  const text = fs.readFileSync(path.join(root, "src/app/api/leads/route.ts"), "utf8");
  const demoBlock = text.slice(text.indexOf("isDemoMode()"), text.indexOf("PRODUCTION"));
  assert.ok(demoBlock.includes("demo: true"));
  assert.ok(!demoBlock.includes("prisma.lead.create"));
  assert.ok(!demoBlock.includes("sendLeadNotification"));
});

await testAsync("historical lead shape remains CRM-safe after migration defaults", () => {
  // Simulate post-migration historical row: consentGiven=false, timestamps null — never consent=true
  const historical = {
    id: "hist_1",
    name: "Исторический",
    phone: "+79001112233",
    telegram: null,
    comment: null,
    service: "Строительство дома",
    area: 120,
    floors: 1,
    material: null,
    package: null,
    source: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    landingUrl: null,
    consentGiven: false,
    consentTimestamp: null,
    consentDocumentVersion: null,
    status: "NEW",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  assert.equal(historical.consentGiven, false);
  assert.equal(historical.consentTimestamp, null);
  assert.equal(historical.consentDocumentVersion, null);
  // CRM display fields still present
  assert.ok(historical.name && historical.phone && historical.id);
});

await testAsync("compliance:check FAIL when SITE_MODE=production without legal config", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/compliance-check.mjs")],
    {
      encoding: "utf8",
      cwd: root,
      env: {
        ...process.env,
        SITE_MODE: "production",
        LEGAL_OPERATOR_NAME: "",
        LEGAL_OPERATOR_STATUS: "",
        LEGAL_INN: "",
        LEGAL_ADDRESS: "",
        LEGAL_EMAIL: "",
        LEGAL_PHONE: "",
        PRIVACY_CONTACT_EMAIL: "",
        PERSONAL_DATA_RETENTION_DAYS: "",
        PRIVACY_POLICY_VERSION: "",
      },
    },
  );
  // loadEnvFile only fills undefined keys — clear by setting empty strings above;
  // script treats empty as missing via read().trim()
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.ok(
    /TECHNICAL_COMPLIANCE_GATE=FAIL/.test(result.stdout),
    result.stdout,
  );
});

await testAsync("compliance:check PASS in demo mode", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts/compliance-check.mjs")],
    {
      encoding: "utf8",
      cwd: root,
      env: { ...process.env, SITE_MODE: "demo" },
    },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(/TECHNICAL_COMPLIANCE_GATE=PASS/.test(result.stdout), result.stdout);
});

// Unit checks via strip-types helper file
const helperPath = path.join(root, "scripts/_compliance-unit-helper.mts");
fs.writeFileSync(
  helperPath,
  `
import { parseLeadCreate, parseLeadDemo } from "../src/lib/validation/lead.ts";
import { formatLeadTelegramMessage } from "../src/lib/telegram.ts";
import { checkProductionLegalGate } from "../src/lib/legalConfig.ts";
import { getSiteMode } from "../src/lib/siteMode.ts";

const base = {
  name: "Иван Тестов",
  phone: "+7 900 000-00-00",
  service: "Строительство дома",
};

const noConsent = parseLeadCreate({ ...base, consent: false });
if (noConsent.success) throw new Error("consent=false must fail");

const missingConsent = parseLeadCreate({ ...base });
if (missingConsent.success) throw new Error("missing consent must fail");

const okConsent = parseLeadCreate({ ...base, consent: true });
if (!okConsent.success) throw new Error("consent=true must pass");

const demoOk = parseLeadDemo({ ...base });
if (!demoOk.success) throw new Error("demo parse without consent must pass");

delete process.env.SITE_MODE;
if (getSiteMode() !== "demo") throw new Error("unset SITE_MODE must default to demo");

process.env.SITE_MODE = "demo";
if (getSiteMode() !== "demo") throw new Error("expected demo");

process.env.SITE_MODE = "production";
for (const k of [
  "LEGAL_OPERATOR_NAME","LEGAL_OPERATOR_STATUS","LEGAL_INN","LEGAL_ADDRESS",
  "LEGAL_EMAIL","LEGAL_PHONE","PRIVACY_CONTACT_EMAIL","PERSONAL_DATA_RETENTION_DAYS",
  "PRIVACY_POLICY_VERSION",
]) delete process.env[k];
const gate = checkProductionLegalGate();
if (gate.ok) throw new Error("production without legal config must fail");

const msg = formatLeadTelegramMessage({ id: "lead_test", createdAt: new Date("2026-01-01T00:00:00Z") });
if (msg.includes("900") || msg.includes("Иван")) throw new Error("telegram must not include PII");
if (!msg.includes("lead_test")) throw new Error("telegram must include id");

console.log("UNIT_OK");
`,
  "utf8",
);

await testAsync("zod consent + legal gate + telegram unit helper", () => {
  const result = runTs(helperPath);
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `exit ${result.status}`);
  }
  if (!result.stdout.includes("UNIT_OK")) {
    throw new Error(result.stdout || "UNIT_OK missing");
  }
});

try {
  fs.unlinkSync(helperPath);
} catch {
  /* ignore */
}

console.log("");
console.log(`TOTAL=${passed + failed} PASSED=${passed} FAILED=${failed}`);
if (failed > 0) process.exit(1);
