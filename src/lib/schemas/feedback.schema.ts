import { z } from "zod";
import { UUIDSchema } from "./common.schema";

/** Schema for recording recommendation feedback. */
export const FeedbackSchema = z.object({
  companyId: UUIDSchema,
  productId: UUIDSchema,
  action: z.enum(["shown", "clicked", "contacted", "purchased", "dismissed"]),
  recommendationScore: z.number().min(0).max(100).default(0),
});

export type FeedbackInput = z.input<typeof FeedbackSchema>;
