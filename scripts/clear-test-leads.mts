/**
 * Development helper: remove all Lead rows.
 *
 * Run manually: npm run db:clear-leads
 * Never wired into install/build/start — schema and migrations stay untouched.
 */
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile();
} catch {
  // .env is optional when DATABASE_URL is already exported
}

// Fail fast before Prisma connects: never touch a production database.
if (process.env.NODE_ENV === "production") {
  console.error("[db:clear-leads] disabled in production. No records changed.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.lead.count();
  const result = await prisma.lead.deleteMany({});
  const after = await prisma.lead.count();

  console.log(`[db:clear-leads] before: ${before}`);
  console.log(`[db:clear-leads] deleted: ${result.count}`);
  console.log(`[db:clear-leads] remaining: ${after}`);
}

main()
  .catch((error) => {
    console.error("[db:clear-leads] failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
