import fs from "fs";

const base = process.env.BASE_URL || "http://localhost:3000";
const origin = base;
const envPath = new URL("../.env", import.meta.url);
const envText = fs.readFileSync(envPath, "utf8");
const pass = envText.match(/^\s*CRM_PASSWORD="?([^"\r\n]+)"?\s*$/m)?.[1]?.trim();

if (!pass) {
  console.error("CRM env missing");
  process.exit(2);
}

const results = [];
function add(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

function parseSetCookie(res) {
  const jar = new Map();
  for (const line of res.headers.getSetCookie?.() || []) {
    const [pair] = line.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return jar;
}

async function req(path, { method = "GET", body, jar, headers = {} } = {}) {
  const h = { ...headers };
  if (jar?.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
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
    /* html or plain text response */
  }
  const set = parseSetCookie(res);
  if (jar) for (const [k, v] of set) jar.set(k, v);
  return { res, text, json };
}

// --- public site ---
{
  const { res, text } = await req("/");
  add(
    "public landing",
    res.status === 200 && text.includes("СТРОЙДОМ"),
    `status=${res.status}`,
  );
}

{
  const { res, json } = await req("/api/health");
  const keys = json ? Object.keys(json).sort().join(",") : "";
  add(
    "health endpoint",
    res.status === 200 && json?.status === "ok" && keys === "status",
    `status=${res.status} body=${JSON.stringify(json)}`,
  );
}

{
  const { res, text } = await req("/robots.txt");
  const blocksCrm = text.includes("/leads");
  add(
    "robots.txt",
    res.status === 200 && blocksCrm,
    `status=${res.status} disallowLeads=${blocksCrm}`,
  );
}

{
  const { res, text } = await req("/sitemap.xml");
  const hasCrm = text.includes("/leads");
  add(
    "sitemap.xml",
    res.status === 200 && !hasCrm,
    `status=${res.status} containsCrm=${hasCrm}`,
  );
}

{
  const { res } = await req("/opengraph-image");
  add("opengraph image", res.status === 200, `status=${res.status}`);
}

{
  const { res, text } = await req("/leads/login");
  const noindex = /noindex/i.test(text);
  add(
    "login noindex",
    res.status === 200 && noindex,
    `status=${res.status} noindex=${noindex}`,
  );
}

// --- unauthorized ---
{
  const { res } = await req("/api/leads");
  add("GET leads unauthorized", res.status === 401, `status=${res.status}`);
}

{
  const { res } = await req("/leads");
  const loc = res.headers.get("location") || "";
  add(
    "/leads redirect",
    [302, 303, 307, 308].includes(res.status) && loc.includes("/leads/login"),
    `status=${res.status} loc=${loc}`,
  );
}

// --- public lead form regression ---
let newLeadId = null;
const marker = `Stage6 Regression ${new Date().toISOString().slice(11, 19)}`;
{
  const { res, json } = await req("/api/leads", {
    method: "POST",
    headers: { "x-forwarded-for": "198.51.100.77" },
    body: {
      name: marker,
      phone: "+7 (000) 000-99-99",
      telegram: "@stage6_demo",
      comment: "Финальная проверка ЭТАПА 6 (production build).",
      service: "Строительство дома",
      area: 150,
      floors: 2,
      material: "кирпич",
      package: "под ключ",
      source: "website",
      utmSource: "yandex",
      utmMedium: "cpc",
      utmCampaign: "stage6_final",
      landingUrl: `${base}/?utm_source=yandex&utm_medium=cpc&utm_campaign=stage6_final`,
      website: "",
    },
  });
  newLeadId = json?.id || null;
  add(
    "public POST /api/leads",
    res.status === 201 && json?.success === true && Boolean(newLeadId),
    `status=${res.status}`,
  );
}

// --- CRM auth ---
const jar = new Map();
{
  const { res } = await req("/api/crm/login", {
    method: "POST",
    headers: { Origin: origin },
    body: { password: "definitely-not-the-password" },
  });
  add("wrong password", res.status === 401, `status=${res.status}`);
}

{
  const { res } = await req("/api/crm/login", {
    method: "POST",
    headers: { Origin: origin },
    body: { password: pass },
    jar,
  });
  add(
    "correct password",
    res.status === 200 && Boolean(jar.get("crm_session")),
    `status=${res.status} cookie=${Boolean(jar.get("crm_session"))}`,
  );
}

{
  const fake = new Map([["crm_session", "forged.token"]]);
  const { res } = await req("/api/leads", { jar: fake });
  add("fake cookie", res.status === 401, `status=${res.status}`);
}

// --- CRM data ---
let demoLeadId = null;
{
  const { res, json } = await req("/api/leads", { jar });
  const leads = json?.leads || [];
  const found = leads.some((l) => l.id === newLeadId);
  const cache = res.headers.get("cache-control") || "";
  demoLeadId = leads.find((l) => l.status === "NEW" && l.id !== newLeadId)?.id ?? null;
  add(
    "GET leads authorized",
    res.status === 200 && found && cache.includes("no-store"),
    `status=${res.status} count=${leads.length} newLeadVisible=${found} cache=${cache}`,
  );
}

{
  const { res, json } = await req("/api/leads?status=WON", { jar });
  const leads = json?.leads || [];
  add(
    "filter WON",
    res.status === 200 && leads.every((l) => l.status === "WON") && leads.length > 0,
    `count=${leads.length}`,
  );
}

{
  const { res, json } = await req(
    `/api/leads?q=${encodeURIComponent("Анна Тестова")}`,
    { jar },
  );
  const leads = json?.leads || [];
  add(
    "search demo lead",
    res.status === 200 && leads.length > 0,
    `count=${leads.length}`,
  );
}

// --- status change regression ---
{
  const target = demoLeadId || newLeadId;
  const { res, json } = await req(`/api/leads/${target}`, {
    method: "PATCH",
    headers: { Origin: origin },
    body: { status: "CONTACTED" },
    jar,
  });
  const check = await req(`/api/leads?status=CONTACTED`, { jar });
  const persisted = (check.json?.leads || []).some((l) => l.id === target);
  add(
    "PATCH status persisted",
    res.status === 200 && json?.status === "CONTACTED" && persisted,
    `status=${res.status} inDb=${persisted}`,
  );
}

{
  const { res } = await req(`/api/leads/${newLeadId}`, {
    method: "PATCH",
    headers: { Origin: origin },
    body: { status: "HACKED" },
    jar,
  });
  add("invalid status rejected", res.status === 400, `status=${res.status}`);
}

{
  const { res } = await req("/api/leads/nonexistent-lead-id", {
    method: "PATCH",
    headers: { Origin: origin },
    body: { status: "CONTACTED" },
    jar,
  });
  add("unknown id 404", res.status === 404, `status=${res.status}`);
}

// --- logout regression ---
{
  const { res } = await req("/api/crm/logout", {
    method: "POST",
    headers: { Origin: origin },
    jar,
  });
  jar.delete("crm_session");
  const api = await req("/api/leads", { jar });
  const page = await req("/leads", { jar });
  const loc = page.res.headers.get("location") || "";
  add(
    "logout",
    res.status === 200 &&
      api.res.status === 401 &&
      [302, 303, 307, 308].includes(page.res.status) &&
      loc.includes("login"),
    `logout=${res.status} api=${api.res.status} page=${page.res.status}`,
  );
}

console.log("\n=== SUMMARY ===");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}\t${r.name}\t${r.detail}`);
const fail = results.filter((r) => !r.ok).length;
console.log(`FAILED: ${fail} / ${results.length}`);
console.log(`New lead id: ${newLeadId}`);
process.exit(fail ? 1 : 0);
