import { z } from "zod";

export const cityEnum = z.enum([
  "Chandigarh",
  "Mohali",
  "Zirakpur",
  "Panchkula",
  "Other",
]);
export const propertyTypeEnum = z.enum([
  "Apartment",
  "Villa",
  "Plot",
  "Office",
  "Retail",
]);
export const bhkEnum = z.enum(["1", "2", "3", "4", "Studio"]);
export const purposeEnum = z.enum(["Buy", "Rent"]);
export const timelineEnum = z.enum(["0-3m", "3-6m", ">6m", "Exploring"]);
export const sourceEnum = z.enum([
  "Website",
  "Referral",
  "Walk-in",
  "Call",
  "Other",
]);
export const statusEnum = z.enum([
  "New",
  "Qualified",
  "Contacted",
  "Visited",
  "Negotiation",
  "Converted",
  "Dropped",
]);

export const buyerCreateSchema = z
  .object({
    full_name: z.string().min(2).max(80),
    email: z
      .string()
      .email()
      .max(255)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v === "" ? undefined : v)),
    phone: z.string().regex(/^[0-9]{10,15}$/),
    city: cityEnum,
    property_type: propertyTypeEnum,
    bhk: bhkEnum.optional().nullable(),
    purpose: purposeEnum,
    budget_min: z.number().int().nonnegative().optional().nullable(),
    budget_max: z.number().int().optional().nullable(),
    timeline: timelineEnum,
    source: sourceEnum,
    status: statusEnum.optional(),
    notes: z.string().max(1000).optional().nullable(),
    tags: z.array(z.string()).max(50).optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional: bhk required for Apartment/Villa
    if (
      (data.property_type === "Apartment" || data.property_type === "Villa") &&
      !data.bhk
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bhk is required when property_type is Apartment or Villa",
        path: ["bhk"],
      });
    }
    // Budget validation: max >= min when both present
    if (
      data.budget_min != null &&
      data.budget_max != null &&
      data.budget_max < data.budget_min
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "budget_max must be greater than or equal to budget_min",
        path: ["budget_max"],
      });
    }
  });

export const buyerUpdateSchema = buyerCreateSchema.partial();

export const buyerSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  city: cityEnum.optional(),
  propertyType: propertyTypeEnum.optional(),
  status: statusEnum.optional(),
  timeline: timelineEnum.optional(),
  sort: z.enum(["updatedAt", "createdAt", "fullName"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const buyerCsvRowSchema = buyerCreateSchema; // same fields as create

export const buyerCsvSchema = z
  .array(buyerCsvRowSchema)
  .max(200, { message: "Max 200 rows allowed per import" });
