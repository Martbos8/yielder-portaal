import { portalMetadata } from "@/lib/metadata";

export const metadata = portalMetadata("/admin");

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MaterialIcon } from "@/components/icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AdminProfile = {
  is_yielder: boolean;
};

type SyncLogEntry = {
  id: string;
  entity_type: string;
  status: string;
  records_synced: number;
  records_failed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

type AuditLogEntry = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("is_yielder")
    .eq("id", user.id)
    .single();

  return (data as AdminProfile | null)?.is_yielder === true;
}

async function getSyncLogs(): Promise<SyncLogEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sync_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);

  return (data ?? []) as SyncLogEntry[];
}

async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as AuditLogEntry[];
}

async function getRecommendationStats(): Promise<{
  totalActive: number;
  totalFeedback: number;
}> {
  const supabase = await createClient();

  const [productsRes, feedbackRes] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("recommendation_feedback")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    totalActive: productsRes.count ?? 0,
    totalFeedback: feedbackRes.count ?? 0,
  };
}

const CW_ENV_VARS = [
  "CW_BASE_URL",
  "CW_COMPANY_ID",
  "CW_PUBLIC_KEY",
  "CW_PRIVATE_KEY",
  "CW_CLIENT_ID",
];

const DISTRIBUTORS = [
  { name: "Copaco", envVar: "COPACO_API_KEY" },
  { name: "Ingram Micro", envVar: "INGRAM_API_KEY" },
  { name: "TD Synnex", envVar: "TD_SYNNEX_API_KEY" },
] as const;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const admin = await isAdmin();

  if (!admin) {
    redirect("/dashboard");
  }

  const [syncLogs, auditLogs, recStats] = await Promise.all([
    getSyncLogs(),
    getAuditLogs(),
    getRecommendationStats(),
  ]);

  // Check API configurations
  const cwConfigured = CW_ENV_VARS.every(
    (key) => !!process.env[key]
  );

  // Group sync logs by entity for latest status
  const latestSync = new Map<string, SyncLogEntry>();
  for (const log of syncLogs) {
    if (!latestSync.has(log.entity_type)) {
      latestSync.set(log.entity_type, log);
    }
  }

  const syncEntities = ["tickets", "agreements", "hardware", "companies", "contacts"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-yielder-navy">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Sync status, API configuratie en systeemoverzicht
        </p>
      </div>

      {/* API Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CW API Status */}
        <Card className="rounded-2xl p-5 shadow-card border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">ConnectWise API</h2>
            <div
              className={`size-3 rounded-full ${
                cwConfigured ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {cwConfigured ? "Geconfigureerd" : "Niet geconfigureerd"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {cwConfigured
              ? "API keys zijn ingesteld"
              : "Demo modus — geen API keys"}
          </p>
        </Card>

        {/* Distributeur API Status */}
        <Card className="rounded-2xl p-5 shadow-card border">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Distributeur APIs</h2>
          <div className="space-y-2">
            {DISTRIBUTORS.map(({ name, envVar }) => {
              const configured = !!process.env[envVar];
              return (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`size-2.5 rounded-full ${configured ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className="text-xs text-muted-foreground">
                      {configured ? "Geconfigureerd" : "Demo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recommendation Engine Stats */}
        <Card className="rounded-2xl p-5 shadow-card border">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recommendation Engine</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Actieve producten</span>
              <span className="text-lg font-bold text-yielder-navy">
                {recStats.totalActive}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Feedback events</span>
              <span className="text-lg font-bold text-yielder-navy">
                {recStats.totalFeedback}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sync Status */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MaterialIcon name="sync" className="text-yielder-navy" />
          <h2 className="text-lg font-semibold text-yielder-navy">Sync Status</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {syncEntities.map((entity) => {
            const log = latestSync.get(entity);

            return (
              <Card key={entity} className="rounded-2xl p-4 shadow-card border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium capitalize text-foreground">
                    {entity}
                  </h3>
                  {log ? (
                    <Badge
                      className={
                        log.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : log.status === "failed"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }
                    >
                      {log.status}
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 border-gray-200">
                      Nooit
                    </Badge>
                  )}
                </div>
                {log ? (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>
                      {log.records_synced} gesynchroniseerd
                      {log.records_failed > 0 && (
                        <span className="text-red-500">
                          , {log.records_failed} mislukt
                        </span>
                      )}
                    </p>
                    <p>{formatDate(log.started_at)}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nog niet gesynchroniseerd
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Audit Log */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MaterialIcon name="history" className="text-yielder-navy" />
          <h2 className="text-lg font-semibold text-yielder-navy">
            Audit Log (laatste 50)
          </h2>
        </div>
        <Card className="rounded-2xl shadow-card border overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MaterialIcon
                name="receipt_long"
                size={32}
                className="mx-auto mb-2 opacity-40"
              />
              <p>Geen audit events gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Tijdstip
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Actie
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/10">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {log.action}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {log.entity_type}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs max-w-xs truncate">
                        {log.details
                          ? JSON.stringify(log.details).slice(0, 100)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
