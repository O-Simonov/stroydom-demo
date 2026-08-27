import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess((value) => {
    if (value == null || value === "") return undefined;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().max(max).optional());

function isHttpOrHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Optional landing URL — only http/https, max 500 chars. */
const optionalLandingUrl = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().max(500).refine(isHttpOrHttpsUrl, "Некорректный landingUrl").optional());

function phoneLooksValid(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return false;
  return /^[\d\s+()\-./]+$/.test(phone);
}

/**
 * Base fields shared by demo simulation and production create.
 * Client validation is UX only and must not replace this.
 */
const leadFieldsSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(100, "Слишком длинное имя"),
  phone: z
    .string()
    .trim()
    .min(1, "Укажите телефон")
    .max(40, "Слишком длинный телефон")
    .refine(phoneLooksValid, "Проверьте номер телефона"),
  telegram: optionalText(64),
  comment: optionalText(2000),
  service: z.string().trim().min(1, "Укажите услугу").max(120),
  area: z
    .number()
    .int()
    .min(20)
    .max(1000)
    .optional()
    .nullable()
    .transform((value) => (value == null ? undefined : value)),
  floors: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .nullable()
    .transform((value) => (value == null ? undefined : value)),
  material: optionalText(80),
  package: optionalText(80),
  source: optionalText(120),
  utmSource: optionalText(120),
  utmMedium: optionalText(120),
  utmCampaign: optionalText(180),
  utmContent: optionalText(180),
  utmTerm: optionalText(180),
  landingUrl: optionalLandingUrl,
  /** Honeypot — must stay empty for real users */
  website: z.string().max(200).optional().nullable(),
});

/**
 * Production create — consent must be explicitly true (Zod literal).
 * consent=false or missing → rejected.
 */
export const leadCreateSchema = leadFieldsSchema.extend({
  consent: z.literal(true, {
    error: "Необходимо согласие на обработку персональных данных",
  }),
});

/** Demo simulation may omit consent (no PD persistence). */
export const leadDemoSchema = leadFieldsSchema.extend({
  consent: z.boolean().optional(),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadDemoInput = z.infer<typeof leadDemoSchema>;

export function parseLeadCreate(data: unknown) {
  return leadCreateSchema.safeParse(data);
}

export function parseLeadDemo(data: unknown) {
  return leadDemoSchema.safeParse(data);
}
