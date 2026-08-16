import type { LeadStatus } from "@prisma/client";

export type CrmLead = {
  id: string;
  name: string;
  phone: string;
  telegram: string | null;
  comment: string | null;
  service: string;
  area: number | null;
  floors: number | null;
  material: string | null;
  package: string | null;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingUrl: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};
