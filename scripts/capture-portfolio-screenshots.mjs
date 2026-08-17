/**
 * Capture portfolio PNGs for STROYDOM.
 *
 * Public landing shots come from production.
 * CRM shots come only from a local demo database.
 * Never submits the production lead form. Never opens production CRM.
 * Never prints secrets.
 */
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const DB_PATH = path.join(ROOT, "prisma", "dev.db");
const BACKUP_PATH = path.join(ROOT, "backups", "dev-before-screenshots.db");
const PRODUCTION_ORIGIN = "https://stroydom-project.ru";

const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 390, height: 844 };
const CRM_LAYOUT_WIDTHS = [1280, 1440, 1600, 1680];

function parseOnlySet() {
  const raw = process.argv.find((arg) => arg.startsWith("--only="));
  if (!raw) return null;
  return new Set(
    raw
      .slice("--only=".length)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function shouldCapture(only, id) {
  return !only || only.has(id);
}

const REQUIRED_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTE_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const DEMO_LEAD_NAMES = [
  "Анна Тестова",
  "Иван Демонстрационный",
  "Пётр Примеров",
  "Мария Образцова",
  "Сергей Пробный",
  "Ольга Демидова-Тест",
];

const DISABLE_MOTION_CSS = `
  *, *::before, *::after {
    animation: none !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
  .hero-rise {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  nextjs-portal,
  [data-next-badge-root],
  [data-nextjs-dev-overlay] {
    display: none !important;
  }
`;

const SECRET_ENV_KEYS = [
  "CRM_PASSWORD",
  "CRM_SESSION_SECRET",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
];

try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch {
  // Local .env is required only for CRM screenshots.
}

function fail(message) {
  console.error(`[screenshots] ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function log(message) {
  console.log(`[screenshots] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
    fail(`Not a PNG: ${path.basename(filePath)}`);
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    const done = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(1000, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

async function waitForHealth(origin, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${origin}/api/health`, { cache: "no-store" });
      if (response.status === 200) {
        const body = await response.json();
        if (body?.status === "ok") return;
      }
    } catch {
      // App is still starting.
    }
    await sleep(500);
  }
  fail(`Local app was not ready at ${origin}/api/health`);
}

const NPM_CMD = process.platform === "win32" ? "npm.cmd" : "npm";

function spawnNpm(args, options = {}) {
  return spawn(NPM_CMD, args, {
    cwd: ROOT,
    windowsHide: true,
    shell: process.platform === "win32",
    ...options,
  });
}

function runNpm(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawnNpm(["run", scriptName], {
      env: { ...process.env, NODE_ENV: "development" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      if (!looksLikeSecretLeak(text)) process.stdout.write(text);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with ${code}${stderr ? `: ${stderr.trim()}` : ""}`));
    });
  });
}

function looksLikeSecretLeak(text) {
  return SECRET_ENV_KEYS.some((key) => {
    const value = process.env[key];
    return Boolean(value) && text.includes(value);
  });
}

function startLocalDev(port) {
  const nextCli = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "dev", "-p", String(port)], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: "development",
      BROWSER: "none",
      NEXT_DISABLE_DEV_INDICATOR: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child.once("error", (error) => {
    log(`Local app process error: ${error.message}`);
  });
  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    if (!looksLikeSecretLeak(text) && /ready|started|local/i.test(text)) {
      process.stdout.write(text);
    }
  });
  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    if (!looksLikeSecretLeak(text)) process.stderr.write(text);
  });
  return child;
}

function stopProcessTree(child) {
  if (!child?.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  child.kill("SIGTERM");
}

async function inspectLocalLeads() {
  const prisma = new PrismaClient();
  try {
    const leads = await prisma.lead.findMany({
      select: { name: true, phone: true, status: true },
    });
    return leads;
  } finally {
    await prisma.$disconnect();
  }
}

function isExactDemoSet(leads) {
  if (leads.length !== 6) return false;
  const names = new Set(leads.map((lead) => lead.name));
  const statuses = new Set(leads.map((lead) => lead.status));
  if (DEMO_LEAD_NAMES.some((name) => !names.has(name))) return false;
  if (REQUIRED_STATUSES.some((status) => !statuses.has(status))) return false;
  return leads.every((lead) => /^\+7 \(000\) 000-00-0[1-6]$/.test(lead.phone));
}

function assertDemoOnly(leads, where) {
  if (!isExactDemoSet(leads)) {
    fail(`${where}: expected exactly 6 demo leads, one per CRM status`);
  }
  log(`${where}: COUNT = ${leads.length}, statuses = ${REQUIRED_STATUSES.join(", ")}`);
}

async function prepareLocalDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    fail("Local prisma/dev.db is missing. CRM screenshots require a local demo database.");
  }

  fs.mkdirSync(path.join(ROOT, "backups"), { recursive: true });
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const extra = `${DB_PATH}${suffix}`;
    if (fs.existsSync(extra)) {
      fs.copyFileSync(extra, `${BACKUP_PATH}${suffix}`);
    }
  }
  log("Local database backup saved to backups/dev-before-screenshots.db");

  const before = await inspectLocalLeads();
  log(`Local database before screenshots: ${before.length} lead(s)`);
  const seeded = !isExactDemoSet(before);
  if (!seeded) {
    log("Local demo set already present. Skipping seed.");
    return { seeded: false, beforeCount: before.length };
  }

  log("Local demo set differs. Running db:clear-leads and db:seed-demo locally.");
  await runNpm("db:clear-leads");
  await runNpm("db:seed-demo");
  const after = await inspectLocalLeads();
  assertDemoOnly(after, "After local seed");
  return { seeded: true, beforeCount: before.length };
}

async function resolveLocalOrigin() {
  const candidates = [3000, 3001, 3002];
  for (const port of candidates) {
    if (!(await portInUse(port))) continue;
    const origin = `http://localhost:${port}`;
    try {
      const response = await fetch(`${origin}/api/health`, { cache: "no-store" });
      if (response.status === 200) {
        log(`Reusing local app on ${origin}`);
        return { origin, child: null };
      }
    } catch {
      // Occupied by something else.
    }
  }

  let chosen = 3000;
  if (await portInUse(3000)) {
    chosen = (await portInUse(3001)) ? 3002 : 3001;
    log(`Port 3000 is busy. Starting local app on ${chosen}`);
  } else {
    log("Starting local app on 3000");
  }

  const child = startLocalDev(chosen);
  const origin = `http://localhost:${chosen}`;
  await waitForHealth(origin);
  log(`Local app ready at ${origin}`);
  return { origin, child };
}

function createBrowserContext(browser, viewport) {
  return browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "light",
    locale: "ru-RU",
    hasTouch: viewport.width < 500,
    isMobile: viewport.width < 500,
  });
}

async function preparePage(page, { blockProductionLeads = false } = {}) {
  await page.addStyleTag({ content: DISABLE_MOTION_CSS });
  page.on("request", (request) => {
    const url = request.url();
    if (
      blockProductionLeads &&
      request.method() === "POST" &&
      url.startsWith(`${PRODUCTION_ORIGIN}/api/leads`)
    ) {
      fail("Production POST /api/leads was attempted. Aborting.");
    }
    if (url.startsWith(`${PRODUCTION_ORIGIN}/leads`)) {
      fail("Production CRM navigation was attempted. Aborting.");
    }
  });
  if (blockProductionLeads) {
    await page.route("**/api/leads", async (route) => {
      const request = route.request();
      const url = request.url();
      if (request.method() === "POST" && url.startsWith(PRODUCTION_ORIGIN)) {
        await route.abort("blockedbyclient");
        fail("Blocked production POST /api/leads");
      }
      await route.continue();
    });
  }
}

async function gotoStable(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 20000 });
  } catch {
    log("networkidle timed out; continuing after load");
  }
  await page.waitForLoadState("load");
  await page.addStyleTag({ content: DISABLE_MOTION_CSS });
}

async function waitForHero(page) {
  await page.getByRole("link", { name: "СТРОЙДОМ" }).first().waitFor();
  await page.getByRole("heading", { name: /Строительство загородных домов/ }).waitFor();
  await page.getByRole("button", { name: "Получить расчёт" }).first().waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector("#top img");
    return Boolean(image && image.complete && image.naturalWidth > 50);
  });
  await sleep(400);
}

async function blurActive(page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
}

async function settleAfterScroll(page, extraY = -96) {
  await page.evaluate((y) => window.scrollBy(0, y), extraY);
  await sleep(450);
  await blurActive(page);
}

async function screenshotViewport(page, fileName) {
  const filePath = path.join(OUT_DIR, fileName);
  await blurActive(page);
  await page.screenshot({
    path: filePath,
    type: "png",
    fullPage: false,
    animations: "disabled",
    caret: "hide",
  });
  const size = pngSize(filePath);
  log(`Wrote ${fileName} (${size.width}x${size.height})`);
  return { fileName, ...size };
}

async function fillCalculator(page) {
  await page.locator("#calculator").waitFor();
  await page.locator("#calc-area").fill("150");
  await page.locator("#calc-floors").selectOption("2");
  await page.locator("#calc-material").selectOption("газобетон");
  await page.locator("#calc-package").selectOption("под ключ");
}

async function fillLeadForm(page) {
  await page.locator("#lead-form").waitFor();
  await page.locator("#lead-name").fill("Демо Клиент");
  await page.locator("#lead-phone").fill("+7 900 000-00-00");
  await page.locator("#lead-telegram").fill("@demo_client");
  await page.locator("#lead-comment").fill("Хочу получить предварительный расчёт");
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 8) {
    fail(`${label}: horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }
}

async function isolateCalculatorSection(page) {
  await page.evaluate(() => {
    const calc = document.querySelector("#calculator");
    if (!(calc instanceof HTMLElement)) return;
    const keep = new Set();
    let node = calc;
    while (node) {
      keep.add(node);
      node = node.parentElement;
    }
    document.querySelectorAll("header, footer, section, nav").forEach((el) => {
      if (!keep.has(el) && !el.contains(calc)) {
        el.remove();
      }
    });
    const ink = getComputedStyle(calc).backgroundColor;
    document.documentElement.style.background = ink;
    document.body.style.background = ink;
    document.body.style.margin = "0";
    document.body.style.minHeight = "100vh";
    calc.style.minHeight = "100vh";
    calc.style.display = "flex";
    calc.style.alignItems = "center";
  });
}

async function captureParametersDesktop(browser) {
  const context = await createBrowserContext(browser, DESKTOP);
  const page = await context.newPage();
  await preparePage(page, { blockProductionLeads: true });
  await gotoStable(page, PRODUCTION_ORIGIN);
  await waitForHero(page);
  await fillCalculator(page);
  await page.getByRole("heading", { name: "Подберите параметры дома" }).waitFor();
  await isolateCalculatorSection(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await blurActive(page);
  const shot02 = await screenshotViewport(page, "02-parameters-desktop.png");
  await context.close();
  return shot02;
}

async function capturePublicDesktop(browser) {
  const context = await createBrowserContext(browser, DESKTOP);
  const page = await context.newPage();
  await preparePage(page, { blockProductionLeads: true });
  await gotoStable(page, PRODUCTION_ORIGIN);
  await waitForHero(page);
  const shot01 = await screenshotViewport(page, "01-home-desktop.png");
  await context.close();

  const shot02 = await captureParametersDesktop(browser);

  const formContext = await createBrowserContext(browser, DESKTOP);
  const formPage = await formContext.newPage();
  await preparePage(formPage, { blockProductionLeads: true });
  await gotoStable(formPage, PRODUCTION_ORIGIN);
  await waitForHero(formPage);
  await fillCalculator(formPage);
  await formPage.locator("#calculator button[type='submit']").click();
  await formPage.locator("#contact").waitFor();
  await fillLeadForm(formPage);
  await formPage.locator("#contact").evaluate((el) => {
    el.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await settleAfterScroll(formPage, -48);
  const shot03 = await screenshotViewport(formPage, "03-form-desktop.png");
  await formContext.close();
  return [shot01, shot02, shot03];
}

async function capturePublicMobile(browser) {
  const homeContext = await createBrowserContext(browser, MOBILE);
  const homePage = await homeContext.newPage();
  await preparePage(homePage, { blockProductionLeads: true });
  await gotoStable(homePage, PRODUCTION_ORIGIN);
  await waitForHero(homePage);
  await assertNoHorizontalOverflow(homePage, "04-home-mobile");
  const shot04 = await screenshotViewport(homePage, "04-home-mobile.png");
  await homeContext.close();

  const formContext = await createBrowserContext(browser, MOBILE);
  const formPage = await formContext.newPage();
  await preparePage(formPage, { blockProductionLeads: true });
  await gotoStable(formPage, PRODUCTION_ORIGIN);
  await waitForHero(formPage);
  await fillCalculator(formPage);
  await formPage.locator("#calculator button[type='submit']").click();
  await fillLeadForm(formPage);
  await formPage.locator("#lead-form").evaluate((el) => {
    el.scrollIntoView({ block: "start", inline: "nearest" });
  });
  await settleAfterScroll(formPage, -72);
  await assertNoHorizontalOverflow(formPage, "05-form-mobile");
  const shot05 = await screenshotViewport(formPage, "05-form-mobile.png");
  await formContext.close();
  return [shot04, shot05];
}

async function loginCrm(page, origin) {
  if (!process.env.CRM_PASSWORD) {
    fail("Local CRM_PASSWORD is missing. Refusing to continue CRM screenshots.");
  }
  await gotoStable(page, `${origin}/leads/login`);
  await page.locator("#crm-password").fill(process.env.CRM_PASSWORD);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/crm/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Войти" }).click();
  const response = await loginResponse;
  if (!response.ok()) {
    fail(`CRM login failed with HTTP ${response.status()}`);
  }
  await page.waitForURL((url) => url.pathname === "/leads" || url.pathname === "/leads/", {
    timeout: 20000,
    waitUntil: "domcontentloaded",
  });
  const cookies = await page.context().cookies();
  if (!cookies.some((cookie) => cookie.name === "crm_session" && cookie.value)) {
    fail("CRM login did not set a session cookie.");
  }
  await page.getByRole("heading", { name: "Mini CRM" }).waitFor();
  await blurActive(page);
}

function assertCrmLooksDemo(text) {
  const forbidden = ["CRM_PASSWORD", "TELEGRAM_BOT_TOKEN", "BEGIN OPENSSH", ".env"];
  if (forbidden.some((item) => text.includes(item))) {
    fail("CRM screenshot source contains secret-like text.");
  }
  const demoHits = DEMO_LEAD_NAMES.filter((name) => text.includes(name));
  if (demoHits.length < 4) {
    fail("CRM page does not look like the local demo set. Stopping.");
  }
  if (/\+7 \(\d{3}\) (?!000)/.test(text) && !text.includes("+7 (000)")) {
    fail("CRM page appears to contain non-demo phone numbers.");
  }
}

async function measureCrmTableOverlap(page) {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll("table tbody tr")];
    return rows.map((row, index) => {
      const statusCell = row.querySelectorAll("td")[6];
      const actionCell = row.querySelectorAll("td")[7];
      const select = row.querySelector("select");
      const button = actionCell?.querySelector("button");
      const badge = statusCell?.querySelector("span");
      const box = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
      };
      const a = box(select);
      const b = box(button);
      const s = box(statusCell);
      const action = box(actionCell);
      const overlaps = Boolean(
        a &&
          b &&
          !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1),
      );
      const selectOverflowsCell = Boolean(a && s && a.right > s.right + 1);
      const buttonOverflowsCell = Boolean(
        b && action && (b.right > action.right + 1 || b.left < action.left - 1),
      );
      return {
        index,
        overlaps,
        selectOverflowsCell,
        buttonOverflowsCell,
        selectWidth: a?.width ?? 0,
        statusCellWidth: s?.width ?? 0,
        actionCellWidth: action?.width ?? 0,
        badgeWidth: box(badge)?.width ?? 0,
      };
    });
  });
}

async function captureCrmBoardAtWidth(browser, origin, width) {
  const context = await createBrowserContext(browser, { width, height: 1000 });
  const page = await context.newPage();
  await preparePage(page);
  await loginCrm(page, origin);
  await page.getByRole("button", { name: "Все" }).waitFor();
  await page.getByPlaceholder("Поиск по имени, телефону или Telegram").waitFor();
  await page.locator("table").waitFor();
  const bodyText = await page.locator("body").innerText();
  assertCrmLooksDemo(bodyText);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  const overlap = await measureCrmTableOverlap(page);
  const overlapping = overlap.filter(
    (row) => row.overlaps || row.selectOverflowsCell || row.buttonOverflowsCell,
  );
  log(
    `CRM desktop ${width}x1000: ${overlapping.length}/${overlap.length} rows have status/action collision`,
  );
  if (overlapping.length) {
    const sample = overlapping[0];
    log(
      `CRM collision sample: statusCell=${Math.round(sample.statusCellWidth)}px select=${Math.round(sample.selectWidth)}px actionCell=${Math.round(sample.actionCellWidth)}px`,
    );
  }
  return { context, page, overlap, overlapping };
}

async function inspectMobileCrm(browser, origin) {
  const context = await createBrowserContext(browser, MOBILE);
  const page = await context.newPage();
  await preparePage(page);
  await loginCrm(page, origin);
  await page.locator("ul").getByText("Анна Тестова").waitFor();
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 8) {
    fail(`Mobile CRM horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }
  const text = await page.locator("body").innerText();
  assertCrmLooksDemo(text);
  const tableVisible = await page.locator("table").first().isVisible().catch(() => false);
  if (tableVisible) {
    fail("Mobile CRM is showing the desktop table.");
  }
  await context.close();
  log("Mobile CRM 390x844: cards visible, no horizontal overflow.");
}

async function patchThenRestoreDemoLead(browser, origin) {
  const context = await createBrowserContext(browser, DESKTOP);
  const page = await context.newPage();
  await preparePage(page);
  await loginCrm(page, origin);
  const row = page.locator("tr", { hasText: "Анна Тестова" });
  await row.waitFor();
  const select = row.locator("select");
  const patch = page.waitForResponse(
    (response) =>
      response.url().includes("/api/leads/") &&
      response.request().method() === "PATCH",
  );
  await select.selectOption("CONTACTED");
  const response = await patch;
  if (!response.ok()) {
    fail(`Local status PATCH failed with HTTP ${response.status()}`);
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("table").waitFor();
  const persisted = await page
    .locator("tr", { hasText: "Анна Тестова" })
    .locator("select")
    .inputValue();
  if (persisted !== "CONTACTED") {
    fail("Local status change did not persist after refresh.");
  }
  await context.close();
  log("Local PATCH NEW → CONTACTED persisted after refresh.");

  await runNpm("db:clear-leads");
  await runNpm("db:seed-demo");
  const restored = await inspectLocalLeads();
  assertDemoOnly(restored, "After restoring demo set");
}

async function captureCrmDesktopBoard(browser, origin) {
  for (const width of CRM_LAYOUT_WIDTHS) {
    const attempt = await captureCrmBoardAtWidth(browser, origin, width);
    const ok = attempt.overlapping.length === 0;
    await attempt.context.close();
    if (!ok) {
      fail(`CRM status/action overlap remains at ${width}x1000`);
    }
  }

  const shot = await captureCrmBoardAtWidth(browser, origin, DESKTOP.width);
  const bodyText = await shot.page.locator("body").innerText();
  for (const name of DEMO_LEAD_NAMES) {
    if (!bodyText.includes(name)) {
      fail(`06 screenshot source is missing demo lead: ${name}`);
    }
  }
  const shot06 = await screenshotViewport(shot.page, "06-crm-desktop.png");
  await shot.context.close();
  log("06-crm-desktop.png captured at 1440x1000 without status/action overlap");
  return shot06;
}

async function captureCrmDesktop(browser, origin) {
  const shot06 = await captureCrmDesktopBoard(browser, origin);
  const context = await createBrowserContext(browser, DESKTOP);
  const page = await context.newPage();
  await preparePage(page);
  await loginCrm(page, origin);
  const preferred = page.locator("tr", { hasText: "Иван Демонстрационный" });
  await preferred.getByRole("button", { name: "Подробнее" }).click();
  const details = page.locator("aside");
  await details.getByRole("heading", { name: "Иван Демонстрационный" }).waitFor();
  await details.getByText("@ivan_demo").waitFor();
  await details.getByText("150 м²", { exact: true }).waitFor();
  const detailsText = await details.innerText();
  if (!detailsText.includes("Иван Демонстрационный") || !detailsText.includes("+7 (000) 000-00-02")) {
    fail("CRM details are not the expected demo lead.");
  }
  await sleep(300);
  const shot07 = await screenshotViewport(page, "07-crm-details.png");
  await context.close();
  return [shot06, shot07].filter(Boolean);
}

async function captureCrmMobile(browser, origin) {
  const context = await createBrowserContext(browser, MOBILE);
  const page = await context.newPage();
  await preparePage(page);
  await loginCrm(page, origin);
  await page.locator("ul").getByText("Анна Тестова").waitFor();
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 8) {
    log("Mobile CRM has horizontal overflow. Skipping 08-crm-mobile.png.");
    await context.close();
    return null;
  }
  const text = await page.locator("body").innerText();
  assertCrmLooksDemo(text);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  const shot08 = await screenshotViewport(page, "08-crm-mobile.png");
  await context.close();
  return shot08;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const only = parseOnlySet();
  const needsCrm = shouldCapture(only, "06") || shouldCapture(only, "07") || shouldCapture(only, "08");
  const needsLocal = !only || needsCrm;
  const db = needsLocal ? await prepareLocalDatabase() : { seeded: false };
  const local = needsLocal ? await resolveLocalOrigin() : { origin: null, child: null };
  let browser;
  const written = [];
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--hide-scrollbars", "--disable-extensions"],
    });
    if (!only) {
      written.push(...(await capturePublicDesktop(browser)));
      written.push(...(await capturePublicMobile(browser)));
      written.push(...(await captureCrmDesktop(browser, local.origin)));
      const mobileCrm = await captureCrmMobile(browser, local.origin);
      if (mobileCrm) written.push(mobileCrm);
    } else {
      if (shouldCapture(only, "02")) {
        written.push(await captureParametersDesktop(browser));
      }
      if (shouldCapture(only, "06")) {
        await inspectMobileCrm(browser, local.origin);
        await patchThenRestoreDemoLead(browser, local.origin);
        const shot06 = await captureCrmDesktopBoard(browser, local.origin);
        if (shot06) written.push(shot06);
      }
    }
    if (local.origin) log(`Local CRM URL: ${local.origin}/leads`);
    if (needsLocal) log(`Local seed ran: ${db.seeded ? "yes" : "no"}`);
  } finally {
    if (browser) await browser.close();
    if (local.child) stopProcessTree(local.child);
  }
}

main().catch((error) => {
  if (!process.exitCode) process.exitCode = 1;
  const message = error instanceof Error ? error.message : String(error);
  if (!looksLikeSecretLeak(message)) {
    console.error(`[screenshots] failed: ${message}`);
  } else {
    console.error("[screenshots] failed: a secret was present in an error message and was withheld");
  }
});
