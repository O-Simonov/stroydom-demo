/**
 * Development helper: create obviously fake demo leads for screenshots.
 *
 * Run manually: npm run db:seed-demo
 * Production must never call this — phones and names are placeholders.
 */
import { PrismaClient, type Prisma } from "@prisma/client";

try {
  process.loadEnvFile();
} catch {
  // .env is optional when DATABASE_URL is already exported
}

// Fail fast before Prisma connects: never seed demo data into production.
if (process.env.NODE_ENV === "production") {
  console.error("[db:seed-demo] disabled in production. No records created.");
  process.exit(1);
}

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;

const DEMO_LEADS: Prisma.LeadCreateInput[] = [
  {
    name: "Анна Тестова",
    phone: "+7 (000) 000-00-01",
    telegram: "@anna_demo",
    comment: "Демо-заявка: участок готов, интересует одноэтажный дом.",
    service: "Строительство дома",
    area: 120,
    floors: 1,
    material: "Газобетон",
    package: "Тёплый контур",
    source: "website",
    utmSource: "yandex",
    utmMedium: "cpc",
    utmCampaign: "demo_search",
    landingUrl: "https://example.com/?utm_source=yandex&utm_medium=cpc",
    status: "NEW",
    createdAt: new Date(Date.now() - 2 * HOUR),
  },
  {
    name: "Иван Демонстрационный",
    phone: "+7 (000) 000-00-02",
    telegram: "@ivan_demo",
    comment: "Демо-заявка: нужен расчёт двухэтажного дома под ключ.",
    service: "Строительство дома",
    area: 150,
    floors: 2,
    material: "Кирпич",
    package: "Под ключ",
    source: "website",
    utmSource: "vk",
    utmMedium: "social",
    utmCampaign: "demo_social",
    landingUrl: "https://example.com/?utm_source=vk&utm_medium=social",
    status: "CONTACTED",
    createdAt: new Date(Date.now() - 26 * HOUR),
  },
  {
    name: "Пётр Примеров",
    phone: "+7 (000) 000-00-03",
    comment: "Демо-заявка: сравнивает смету с другими подрядчиками.",
    service: "Строительство дома",
    area: 180,
    floors: 2,
    material: "Клеёный брус",
    package: "Тёплый контур",
    source: "website",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "demo_brand",
    landingUrl: "https://example.com/?utm_source=google&utm_medium=cpc",
    status: "QUOTE_SENT",
    createdAt: new Date(Date.now() - 3 * 24 * HOUR),
  },
  {
    name: "Мария Образцова",
    phone: "+7 (000) 000-00-04",
    telegram: "@maria_demo",
    comment: "Демо-заявка: согласовываем сроки начала работ.",
    service: "Строительство дома",
    area: 220,
    floors: 2,
    material: "Газобетон",
    package: "Под ключ",
    source: "website",
    utmSource: "direct",
    landingUrl: "https://example.com/",
    status: "NEGOTIATION",
    createdAt: new Date(Date.now() - 5 * 24 * HOUR),
  },
  {
    name: "Сергей Пробный",
    phone: "+7 (000) 000-00-05",
    comment: "Демо-заявка: договор подписан, стройка запланирована.",
    service: "Строительство дома",
    area: 150,
    floors: 1,
    material: "Кирпич",
    package: "Под ключ",
    source: "website",
    utmSource: "yandex",
    utmMedium: "cpc",
    utmCampaign: "demo_search",
    landingUrl: "https://example.com/?utm_source=yandex&utm_medium=cpc",
    status: "WON",
    createdAt: new Date(Date.now() - 9 * 24 * HOUR),
  },
  {
    name: "Ольга Демидова-Тест",
    phone: "+7 (000) 000-00-06",
    comment: "Демо-заявка: отложила проект на следующий сезон.",
    service: "Проектирование",
    area: 120,
    floors: 1,
    material: "Газобетон",
    package: "Коробка",
    source: "website",
    utmSource: "telegram",
    utmMedium: "social",
    utmCampaign: "demo_channel",
    landingUrl: "https://example.com/?utm_source=telegram",
    status: "LOST",
    createdAt: new Date(Date.now() - 14 * 24 * HOUR),
  },
];

async function main() {
  for (const lead of DEMO_LEADS) {
    await prisma.lead.create({ data: lead });
  }

  const total = await prisma.lead.count();
  console.log(`[db:seed-demo] created: ${DEMO_LEADS.length}`);
  console.log(`[db:seed-demo] total leads: ${total}`);
}

main()
  .catch((error) => {
    console.error("[db:seed-demo] failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
