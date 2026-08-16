import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/crm/status";

export const crmLoginSchema = z.object({
  password: z.string().min(1).max(200),
});

export const leadStatusPatchSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});

export const leadListQuerySchema = z.object({
  status: z
    .union([z.enum(LEAD_STATUSES), z.literal("ALL")])
    .optional()
    .default("ALL"),
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined)),
});
