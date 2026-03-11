// Sync service types — defines the contract for entity synchronization

import type { SyncEntityType } from "@/types/database";

export type SyncDirection = "pull" | "push" | "bidirectional";

export type SyncConfig = {
  entityType: SyncEntityType;
  direction: SyncDirection;
  batchSize: number;
  /** Maximum number of retries per batch */
  maxRetries: number;
  /** Whether to continue syncing remaining entities when one fails */
  continueOnError: boolean;
};

export type SyncResult = {
  entityType: SyncEntityType;
  status: "completed" | "failed" | "partial";
  recordsSynced: number;
  recordsFailed: number;
  recordsSkipped: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
};

export type TransformFunction<TSource, TTarget> = (
  source: TSource,
  context: TransformContext
) => TTarget | null;

export type TransformContext = {
  /** Map of external IDs to internal company UUIDs */
  companyIdMap: Map<number, string>;
  /** Current sync timestamp */
  syncTimestamp: string;
};

/** Default sync configurations per entity type */
export const DEFAULT_SYNC_CONFIGS: Record<SyncEntityType, SyncConfig> = {
  companies: {
    entityType: "companies",
    direction: "pull",
    batchSize: 100,
    maxRetries: 3,
    continueOnError: true,
  },
  tickets: {
    entityType: "tickets",
    direction: "pull",
    batchSize: 200,
    maxRetries: 3,
    continueOnError: true,
  },
  agreements: {
    entityType: "agreements",
    direction: "pull",
    batchSize: 100,
    maxRetries: 3,
    continueOnError: true,
  },
  hardware: {
    entityType: "hardware",
    direction: "pull",
    batchSize: 200,
    maxRetries: 3,
    continueOnError: true,
  },
  contacts: {
    entityType: "contacts",
    direction: "pull",
    batchSize: 100,
    maxRetries: 3,
    continueOnError: true,
  },
  licenses: {
    entityType: "licenses",
    direction: "pull",
    batchSize: 100,
    maxRetries: 3,
    continueOnError: true,
  },
};
