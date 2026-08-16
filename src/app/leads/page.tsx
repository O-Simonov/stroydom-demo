import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CrmBoard } from "@/components/crm/CrmBoard";
import {
  isCrmConfigured,
  readCrmSessionFromCookies,
} from "@/lib/crm/session";
import type { CrmLead } from "@/lib/crm/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "СТРОЙДОМ — Mini CRM",
  robots: { index: false, follow: false },
};

export default async function LeadsPage() {
  if (!isCrmConfigured()) {
    redirect("/leads/login");
  }

  if (!(await readCrmSessionFromCookies())) {
    redirect("/leads/login");
  }

  const rows = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const initialLeads: CrmLead[] = rows.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f5f0_0%,#f1ece2_100%)]">
      <CrmBoard initialLeads={initialLeads} />
    </main>
  );
}
