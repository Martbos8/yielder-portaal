import { z } from "zod";
import { UUIDSchema } from "./common.schema";

/** Schema for creating a contact request. */
export const ContactRequestSchema = z.object({
  companyId: UUIDSchema,
  subject: z
    .string()
    .min(1, "Onderwerp is verplicht")
    .max(200, "Onderwerp mag maximaal 200 tekens zijn"),
  message: z
    .string()
    .max(2000, "Bericht mag maximaal 2000 tekens zijn")
    .optional(),
  productId: UUIDSchema.optional(),
  urgency: z.enum(["normaal", "hoog"]).default("normaal"),
});

export type ContactRequestInput = z.input<typeof ContactRequestSchema>;
