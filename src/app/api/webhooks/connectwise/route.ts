import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api/middleware";

/**
 * POST /api/webhooks/connectwise
 *
 * Stub endpoint for ConnectWise callback webhooks.
 * When CW is configured to send webhook notifications on entity changes,
 * this endpoint receives them and can trigger targeted delta syncs.
 *
 * CW webhook payload typically contains:
 * - Action: "added" | "updated" | "deleted"
 * - Type: entity type (e.g., "ticket", "company", "configuration")
 * - ID: entity ID that changed
 * - MemberId: CW member who made the change
 *
 * TODO: Implement targeted sync per entity when CW webhooks are enabled.
 */
export const POST = createApiHandler({
  secretAuth: {
    headerName: "x-webhook-secret",
    envVar: "CW_WEBHOOK_SECRET",
  },
  rateLimit: { maxRequests: 100, windowMs: 60 * 1000 },
  audit: "connectwise_webhook_received",
  handler: async (req, { log: reqLog }) => {
    let payload: Record<string, unknown> = {};
    try {
      payload = await req.json() as Record<string, unknown>;
    } catch {
      // Invalid JSON — log and acknowledge
    }

    const action = typeof payload["Action"] === "string" ? payload["Action"] : "unknown";
    const entityType = typeof payload["Type"] === "string" ? payload["Type"] : "unknown";
    const entityId = payload["ID"];

    reqLog.info("ConnectWise webhook received", {
      action,
      entityType,
      entityId: String(entityId ?? ""),
    });

    // Acknowledge receipt — actual sync processing will be implemented
    // when CW webhook integration is enabled
    return NextResponse.json({
      received: true,
      action,
      entity_type: entityType,
      entity_id: entityId,
      message: "Webhook ontvangen — verwerking wordt later geïmplementeerd",
    });
  },
});
