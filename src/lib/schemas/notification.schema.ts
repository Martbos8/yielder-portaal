import { z } from "zod";
import { UUIDSchema } from "./common.schema";

/** Schema for marking a single notification as read. */
export const MarkAsReadSchema = z.object({
  notificationId: UUIDSchema,
});

export type MarkAsReadInput = z.input<typeof MarkAsReadSchema>;

/** Schema for marking multiple notifications as read. */
export const MarkAllAsReadSchema = z.object({
  notificationIds: z.array(UUIDSchema).min(1, "Geen notificaties opgegeven"),
});

export type MarkAllAsReadInput = z.input<typeof MarkAllAsReadSchema>;
