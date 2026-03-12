import { z } from "zod";

/** UUID v4 string schema. */
export const UUIDSchema = z.string().uuid("Ongeldig UUID formaat");

/** Pagination parameters for list queries. */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/** Date range filter schema. */
export const DateRangeSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((data) => data.from <= data.to, {
    message: "Startdatum moet voor einddatum liggen",
    path: ["from"],
  });

export type DateRangeInput = z.infer<typeof DateRangeSchema>;

/** Sort direction. */
export const SortDirectionSchema = z.enum(["asc", "desc"]).default("asc");

/** Generic sort parameters. */
export function createSortSchema<T extends string>(allowedFields: readonly T[]) {
  return z.object({
    sortBy: z.enum(allowedFields as unknown as [T, ...T[]]).optional(),
    sortDirection: SortDirectionSchema,
  });
}
