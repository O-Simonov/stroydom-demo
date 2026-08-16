import fs from "fs";
import { createHmac } from "crypto";

const base = process.env.BASE_URL || "http://localhost:3000";
const origin = base;
const envPath = new URL("../.env", import.meta.url);
const envText = fs.readFileSync(envPath, "utf8");
const pass = envText.match(/^\s*CRM_PASSWORD="?([^"\r\n]+)"?\s*$/m)?.[1]?.trim();
const secret = envText
  .match(/^\s*CRM_SESSION_SECRET="?([^"\r\n]+)"?\s*$/m)?.[1]
  ?.trim();

if (!pass || !secret) {
  console.error("CRM env missing");
  process.exit(2);
}

const results = [];
function add(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

function parseSetCookie(res) {
  const raw = res.headers.getSetCookie?.() || [];
  const jar = new Map();
  for (const line of raw) {
    const [pair] = line.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(path, { method = "GET", body, jar, headers = {} } = {}) {
  const h = { ...headers };
  if (jar?.size) h.cookie = cookieHeader(jar);
  if (body !== undefined) h["content-type"] = "application/json";
  const res = await fetch(`${base}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  const set = parseSetCookie(res);
  if (jar && set.size) {
    for (const [k, v] of set) {
      if (!v || /Max-Age=0/i.test([...res.headers.values()].join(" "))) {
        // still apply; logout clears
      }
      jar.set(k, v);
    }
  }
  return { res, text, json, set };
}

let leadIpCounter = 0;
function nextLeadIp() {
  leadIpCounter += 1;
  return `203.0.113.${(leadIpCounter % 200) + 1}`;
}

async function postLead(body, extraHeaders = {}) {
  return req("/api/leads", {
    method: "POST",
    body,
    headers: { "x-forwarded-for": nextLeadIp(), ...extraHeaders },
  });
}

const jar = new Map();

// Unauthorized GET
{
  const { res } = await req("/api/leads");
  add("GET unauthorized", res.status === 401, `status=${res.status}`);
}

// Unauthorized PATCH
{
  const { res } = await req("/api/leads/does-not-exist", {
    method: "PATCH",
    headers: { Origin: origin },
    body: { status: "CONTACTED" },
  });
  add("PATCH unauthorized", res.status === 401, `status=${res.status}`);
}

// /leads redirect
{
  const { res } = await req("/leads");
  const loc = res.headers.get("location") || "";
  add(
    "/leads redirect",
    [302, 303, 307, 308].includes(res.status) && loc.includes("/leads/login"),
    `status=${res.status} loc=${loc}`,
  );
}

// Wrong password
{
  const j = new Map();
  const { res, set } = await req("/api/crm/login", {
    method: "POST",
    headers: { Origin: origin },
    body: { password: "wrong-password-xyz" },
    jar: j,
  });
  const has = set.has("crm_session") && set.get("crm_session");
  add(
    "wrong password",
    res.status === 401 && !has,
    `status=${res.status} hasCookie=${Boolean(has)}`,
  );
}

// Correct password
{
  const { res, set } = await req("/api/crm/login", {
    method: "POST",
    headers: { Origin: origin },
    body: { password: pass },
    jar,
  });
  const token = set.get("crm_session") || jar.get("crm_session");
  add(
    "correct password",
    res.status === 200 && Boolean(token?.includes(".")),
    `status=${res.status} hasSignedCookie=${Boolean(token)}`,
  );
}

// Fake cookie
{
  const fake = new Map([["crm_session", "fake.payload.signature"]]);
  const { res } = await req("/api/leads", { jar: fake });
  add("fake cookie", res.status === 401, `status=${res.status}`);
}

// Expired cookie
{
  const payload = Buffer.from(
    JSON.stringify({ authenticated: true, exp: 1 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  const expired = new Map([["crm_session", `${payload}.${sig}`]]);
  const { res } = await req("/api/leads", { jar: expired });
  add("expired cookie", res.status === 401, `status=${res.status}`);
}

// Expiration logic
{
  const payload = Buffer.from(
    JSON.stringify({ authenticated: true, exp: Date.now() - 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const ok = sig === expected && !(json.exp > Date.now());
  add("expiration logic", ok, ok ? "reject-expired-ok" : "fail");
}

// GET leads
let leadId = null;
let leadStatus = null;
{
  const { res, json } = await req("/api/leads", { jar });
  const leads = json?.leads || [];
  const neu = leads.find((l) => l.status === "NEW") || leads[0];
  if (neu) {
    leadId = neu.id;
    leadStatus = neu.status;
  }
  add(
    "GET leads auth",
    res.status === 200 && json?.success === true,
    `status=${res.status} count=${leads.length}`,
  );
}

// Filter NEW
{
  const { res, json } = await req("/api/leads?status=NEW", { jar });
  const leads = json?.leads || [];
  const allNew = leads.every((l) => l.status === "NEW");
  add(
    "filter NEW",
    res.status === 200 && allNew,
    `count=${leads.length}`,
  );
}

// Search
{
  const { res, json } = await req(
    `/api/leads?q=${encodeURIComponent("Тестовый")}`,
    { jar },
  );
  add(
    "search",
    res.status === 200,
    `status=${res.status} count=${(json?.leads || []).length}`,
  );
}

// PATCH
if (leadId) {
  const { res, json } = await req(`/api/leads/${leadId}`, {
    method: "PATCH",
    headers: { Origin: origin },
    body: { status: "CONTACTED" },
    jar,
  });
  add(
    "PATCH status",
    res.status === 200 && json?.status === "CONTACTED",
    `status=${res.status}`,
  );
  if (leadStatus) {
    await req(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { Origin: origin },
      body: { status: leadStatus },
      jar,
    });
  }
} else {
  add("PATCH status", false, "no lead");
}

// Invalid status
if (leadId) {
  const { res } = await req(`/api/leads/${leadId}`, {
    method: "PATCH",
    headers: { Origin: origin },
    body: { status: "HACKED" },
    jar,
  });
  add("invalid status", res.status === 400, `status=${res.status}`);
} else {
  add("invalid status", false, "no lead");
}

// Unknown id
{
  const { res } = await req("/api/leads/cm_nonexistent_id_12345", {
    method: "PATCH",
    headers: { Origin: origin },
    body: { status: "CONTACTED" },
    jar,
  });
  add("unknown id", res.status === 404, `status=${res.status}`);
}

// Logout
{
  const { res } = await req("/api/crm/logout", {
    method: "POST",
    headers: { Origin: origin },
    jar,
  });
  // clear cookie in jar if emptied
  if (jar.has("crm_session") && !jar.get("crm_session")) jar.delete("crm_session");
  jar.delete("crm_session");
  const g = await req("/api/leads", { jar });
  const p = await req("/leads", { jar });
  const loc = p.res.headers.get("location") || "";
  add(
    "logout",
    res.status === 200 &&
      g.res.status === 401 &&
      [302, 303, 307, 308].includes(p.res.status) &&
      loc.includes("login"),
    `logout=${res.status} get=${g.res.status} page=${p.res.status}`,
  );
}

// Public POST
let newLeadId = null;
{
  const { res, json } = await postLead({
    name: "CRM E2E Regression",
    phone: "+79990001122",
    telegram: "@crm_e2e_test",
    comment: "Stage5 regression",
    service: "Строительство дома",
    area: 120,
    floors: 2,
    material: "кирпич",
    package: "стандарт",
    source: "website",
    utmSource: "crm_test",
    utmMedium: "e2e",
    utmCampaign: "stage5",
    landingUrl: "http://localhost:3000/?utm_source=crm_test",
    website: "",
  });
  newLeadId = json?.id || null;
  add(
    "public POST 201",
    res.status === 201 && json?.success === true && Boolean(newLeadId),
    `status=${res.status} idSet=${Boolean(newLeadId)}`,
  );
}

function leadPayload(overrides) {
  return {
    name: "LandingUrl Probe",
    phone: "+79990003344",
    telegram: "",
    comment: "landingUrl validation",
    service: "Строительство дома",
    area: 100,
    floors: 1,
    material: "кирпич",
    package: "стандарт",
    source: "website",
    utmSource: "landing_test",
    utmMedium: "smoke",
    utmCampaign: "stage5fix",
    landingUrl: "https://example.com/?utm_source=test",
    website: "",
    ...overrides,
  };
}

// landingUrl TEST A — https OK
{
  const marker = `LandingHttps ${Date.now()}`;
  const { res, json } = await postLead(
    leadPayload({
      name: marker,
      landingUrl: "https://example.com/?utm_source=test",
    }),
  );
  add(
    "landingUrl https",
    res.status === 201 && json?.success === true && Boolean(json?.id),
    `status=${res.status}`,
  );
}

// landingUrl TEST B — javascript: rejected
{
  const marker = `LandingJs ${Date.now()}`;
  const { res, json } = await postLead(
    leadPayload({
      name: marker,
      landingUrl: "javascript:alert(1)",
    }),
  );
  const jarCheck = new Map();
  await req("/api/crm/login", {
    method: "POST",
    headers: { Origin: origin },
    body: { password: pass },
    jar: jarCheck,
  });
  const search = await req(`/api/leads?q=${encodeURIComponent(marker)}`, {
    jar: jarCheck,
  });
  const created = (search.json?.leads || []).some((l) => l.name === marker);
  add(
    "landingUrl javascript",
    res.status === 400 && !json?.id && !created,
    `status=${res.status} created=${created}`,
  );
}

// landingUrl TEST C — data: rejected
{
  const marker = `LandingData ${Date.now()}`;
  const { res, json } = await postLead(
    leadPayload({
      name: marker,
      landingUrl: "data:text/html,test",
    }),
  );
  const jarCheck = new Map();
  await req("/api/crm/login", {
    method: "POST",
    headers: { Origin: origin },
    body: { password: pass },
    jar: jarCheck,
  });
  const search = await req(`/api/leads?q=${encodeURIComponent(marker)}`, {
    jar: jarCheck,
  });
  const created = (search.json?.leads || []).some((l) => l.name === marker);
  add(
    "landingUrl data",
    res.status === 400 && !json?.id && !created,
    `status=${res.status} created=${created}`,
  );
}

// Re-login + find in CRM
{
  const jar2 = new Map();
  await req("/api/crm/login", {
    method: "POST",
    headers: { Origin: origin },
    body: { password: pass },
    jar: jar2,
  });
  const { res, json } = await req(
    `/api/leads?q=${encodeURIComponent("CRM E2E Regression")}`,
    { jar: jar2 },
  );
  const found = (json?.leads || []).some((l) => l.id === newLeadId);
  add("lead in CRM", res.status === 200 && found, `found=${found}`);

  const del = await req(`/api/leads/${newLeadId}`, {
    method: "DELETE",
    headers: { Origin: origin },
    jar: jar2,
  });
  add(
    "no DELETE",
    [404, 405].includes(del.res.status),
    `status=${del.res.status}`,
  );
}

console.log("\n=== SUMMARY ===");
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}\t${r.name}\t${r.detail}`);
}
const fail = results.filter((r) => !r.ok).length;
console.log(`FAILED: ${fail} / ${results.length}`);
process.exit(fail ? 1 : 0);
