import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api/middleware";
import type { JobName, JobResult } from "@/lib/jobs/types";

const JOB_RUNNERS: Record<JobName, () => Promise<JobResult>> = {
  "sync-connectwise": () => import("@/lib/jobs/sync-scheduler").then((m) => m.runSyncScheduler()),
  "refresh-prices": () => import("@/lib/jobs/price-refresher").then((m) => m.runPriceRefresher()),
  "generate-notifications": () => import("@/lib/jobs/notification-generator").then((m) => m.runNotificationGenerator()),
  "calculate-health": () => import("@/lib/jobs/health-calculator").then((m) => m.runHealthCalculator()),
};

const VALID_JOBS = Object.keys(JOB_RUNNERS) as JobName[];

/**
 * POST /api/cron
 * Vercel Cron handler — dispatches to the correct background job.
 *
 * Body: { "job": "sync-connectwise" | "refresh-prices" | "generate-notifications" | "calculate-health" }
 * Auth: CRON_SECRET header
 *
 * If no job is specified, runs all jobs sequentially.
 */
export const POST = createApiHandler({
  secretAuth: {
    headerName: "x-cron-secret",
    envVar: "CRON_SECRET",
  },
  rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  audit: "cron_job_executed",
  handler: async (req, { log: reqLog }) => {
    // Parse optional job name from body
    let requestedJob: JobName | undefined;
    try {
      const body = await req.clone().json() as Record<string, unknown>;
      const jobValue = body["job"];
      if (typeof jobValue === "string" && VALID_JOBS.includes(jobValue as JobName)) {
        requestedJob = jobValue as JobName;
      } else if (typeof jobValue === "string") {
        return NextResponse.json(
          {
            error: `Onbekende job: ${jobValue}`,
            valid_jobs: VALID_JOBS,
          },
          { status: 400 }
        );
      }
    } catch {
      // No body — run all jobs
    }

    const jobsToRun = requestedJob ? [requestedJob] : VALID_JOBS;
    const results: JobResult[] = [];

    reqLog.info("Cron execution started", {
      jobs: jobsToRun.join(", "),
      mode: requestedJob ? "single" : "all",
    });

    for (const jobName of jobsToRun) {
      const runner = JOB_RUNNERS[jobName];
      try {
        const result = await runner();
        results.push(result);

        reqLog.info(`Job completed: ${jobName}`, {
          success: result.success,
          durationMs: result.duration_ms,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        reqLog.error(`Job failed: ${jobName}`, { error });

        results.push({
          job: jobName,
          success: false,
          duration_ms: 0,
          details: {},
          error: message,
        });
      }
    }

    const allSuccess = results.every((r) => r.success);
    const totalDuration = results.reduce((sum, r) => sum + r.duration_ms, 0);

    reqLog.info("Cron execution completed", {
      allSuccess,
      totalDurationMs: totalDuration,
      jobCount: results.length,
    });

    return NextResponse.json({
      success: allSuccess,
      total_duration_ms: totalDuration,
      results,
    }, { status: allSuccess ? 200 : 207 });
  },
});
