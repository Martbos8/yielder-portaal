import { z } from "zod";
import { PaginationSchema, createSortSchema } from "./common.schema";

const TICKET_STATUSES = [
  "New",
  "Open",
  "In Progress",
  "Waiting",
  "Closed",
  "Resolved",
] as const;

const TICKET_PRIORITIES = [
  "urgent",
  "high",
  "normal",
  "low",
] as const;

/** Schema for filtering tickets in list views. */
export const TicketFilterSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    search: z.string().max(200).optional(),
    isClosed: z.boolean().optional(),
  })
  .merge(PaginationSchema)
  .merge(
    createSortSchema(["summary", "status", "priority", "cw_created_at"] as const)
  );

export type TicketFilterInput = z.infer<typeof TicketFilterSchema>;
