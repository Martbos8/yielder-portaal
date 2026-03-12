// Common schemas
export {
  UUIDSchema,
  PaginationSchema,
  DateRangeSchema,
  SortDirectionSchema,
  createSortSchema,
  type PaginationInput,
  type DateRangeInput,
} from "./common.schema";

// Domain schemas
export {
  ContactRequestSchema,
  type ContactRequestInput,
} from "./contact.schema";

export {
  FeedbackSchema,
  type FeedbackInput,
} from "./feedback.schema";

export {
  TicketFilterSchema,
  type TicketFilterInput,
} from "./ticket.schema";

export {
  SyncRequestSchema,
  type SyncRequestInput,
} from "./sync.schema";

export {
  MarkAsReadSchema,
  MarkAllAsReadSchema,
  type MarkAsReadInput,
  type MarkAllAsReadInput,
} from "./notification.schema";
