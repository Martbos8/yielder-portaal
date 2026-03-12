// Shared types for background jobs

export type JobName = "sync-connectwise" | "refresh-prices" | "generate-notifications" | "calculate-health";

export interface JobResult {
  job: JobName;
  success: boolean;
  duration_ms: number;
  details: Record<string, unknown>;
  error?: string;
}
