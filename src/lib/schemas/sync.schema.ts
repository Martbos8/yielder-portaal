import { z } from "zod";

/** Schema for triggering a sync request. */
export const SyncRequestSchema = z.object({
  entities: z
    .array(z.enum(["tickets", "hardware", "agreements", "contacts", "all"]))
    .min(1, "Minstens één entity type vereist")
    .default(["all"]),
  force: z.boolean().default(false),
});

export type SyncRequestInput = z.infer<typeof SyncRequestSchema>;
