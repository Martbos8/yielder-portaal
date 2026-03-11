import { notFound } from "next/navigation";
import Link from "next/link";
import { getTicketById, getSimilarTickets, getTicketStats } from "@/lib/repositories";
import { MaterialIcon } from "@/components/icon";
import { formatDate } from "@/lib/utils";
import {
  StatusBadge,
  ticketStatusConfig,
  ticketPriorityConfig,
} from "@/components/data-display";

/** Priority icon mapping. */
const priorityIconMap: Record<string, { icon: string; color: string }> = {
  urgent: { icon: "priority_high", color: "text-red-600" },
  high: { icon: "arrow_upward", color: "text-orange-600" },
  normal: { icon: "remove", color: "text-blue-600" },
  low: { icon: "arrow_downward", color: "text-gray-500" },
};

/** Format hours into a readable Dutch string. */
function formatResponseTime(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${Math.round(hours)} uur`;
  const days = hours / 24;
  return `${days.toFixed(1)} dagen`;
}

/** Relative time in Dutch. */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Zojuist";
  if (diffMin < 60) return `${diffMin} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? "dag" : "dagen"} geleden`;
  return formatDate(dateStr);
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicketById(id);

  if (!ticket) {
    notFound();
  }

  // Fetch similar tickets and stats in parallel
  const [similarTickets, stats] = await Promise.all([
    getSimilarTickets(ticket.id, ticket.company_id, ticket.source).catch(() => []),
    getTicketStats().catch(() => null),
  ]);

  const priorityStyle = priorityIconMap[ticket.priority] ?? priorityIconMap["normal"]!;

  // Build timeline events
  const timelineEvents: Array<{ date: string; label: string; icon: string; color: string }> = [];

  if (ticket.cw_created_at) {
    timelineEvents.push({
      date: ticket.cw_created_at,
      label: "Ticket aangemaakt",
      icon: "add_circle",
      color: "text-emerald-600",
    });
  }

  if (ticket.cw_updated_at && ticket.cw_updated_at !== ticket.cw_created_at) {
    timelineEvents.push({
      date: ticket.cw_updated_at,
      label: ticket.is_closed ? "Ticket gesloten" : "Laatst bijgewerkt",
      icon: ticket.is_closed ? "check_circle" : "edit",
      color: ticket.is_closed ? "text-gray-500" : "text-blue-600",
    });
  }

  if (ticket.status === "in_progress" && !ticket.is_closed) {
    timelineEvents.push({
      date: ticket.updated_at,
      label: "In behandeling genomen",
      icon: "engineering",
      color: "text-orange-600",
    });
  }

  // Sort timeline chronologically
  timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div>
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <MaterialIcon name="arrow_back" size={18} />
        Terug naar tickets
      </Link>

      {/* Header */}
      <div className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-8 mb-6">
        <div className="flex flex-wrap items-start gap-3 mb-4">
          <div className={`mt-1 ${priorityStyle.color}`}>
            <MaterialIcon name={priorityStyle.icon} size={24} />
          </div>
          <h1 className="text-xl font-semibold text-foreground flex-1 min-w-0">
            {ticket.summary}
          </h1>
          <StatusBadge status={ticket.status} config={ticketStatusConfig} />
          <StatusBadge
            status={ticket.priority}
            config={ticketPriorityConfig}
            className={ticket.priority === "urgent" ? "animate-pulse" : ""}
          />
        </div>

        {ticket.cw_ticket_id && (
          <p className="text-xs text-muted-foreground font-mono mb-2">
            Ticket #{ticket.cw_ticket_id}
          </p>
        )}

        {/* Response time indicator */}
        {stats && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MaterialIcon name="schedule" size={14} />
              Gem. responstijd: {formatResponseTime(stats.avgResponseHours)}
            </span>
            {stats.avgResolutionDays !== null && (
              <span className="flex items-center gap-1">
                <MaterialIcon name="check_circle" size={14} />
                Gem. oplostijd: {formatResponseTime(stats.avgResolutionDays * 24)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description (collapsible) */}
          {ticket.description && (
            <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
              <details open>
                <summary className="flex items-center gap-2 px-6 py-4 cursor-pointer select-none hover:bg-muted/50 transition-colors group">
                  <MaterialIcon
                    name="expand_more"
                    size={20}
                    className="text-muted-foreground transition-transform group-open:rotate-0 -rotate-90"
                  />
                  <h2 className="text-sm font-medium text-foreground">Beschrijving</h2>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {ticket.description}
                  </p>
                </div>
              </details>
            </div>
          )}

          {/* Timeline */}
          {timelineEvents.length > 0 && (
            <div className="bg-card rounded-2xl shadow-card border border-border p-6">
              <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <MaterialIcon name="timeline" size={18} className="text-muted-foreground" />
                Tijdlijn
              </h2>
              <div className="relative">
                {timelineEvents.length > 1 && (
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                )}
                <div className="space-y-4">
                  {timelineEvents.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 relative">
                      <div className={`z-10 bg-card ${event.color}`}>
                        <MaterialIcon name={event.icon} size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{event.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(event.date)} · {relativeTime(event.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Similar tickets */}
          {similarTickets.length > 0 && (
            <div className="bg-card rounded-2xl shadow-card border border-border p-6">
              <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <MaterialIcon name="content_copy" size={18} className="text-muted-foreground" />
                Vergelijkbare tickets
              </h2>
              <div className="space-y-2">
                {similarTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <StatusBadge status={t.priority} config={ticketPriorityConfig} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-yielder-navy truncate transition-colors">
                        {t.summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.cw_created_at)} · {t.contact_name ?? "Onbekend"}
                      </p>
                    </div>
                    <StatusBadge status={t.status} config={ticketStatusConfig} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl shadow-card border border-border p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Details</h2>
            <div className="space-y-4">
              <DetailField
                icon="person"
                label="Contactpersoon"
                value={ticket.contact_name ?? "Onbekend"}
              />
              <DetailField
                icon="input"
                label="Bron"
                value={ticket.source ?? "Onbekend"}
              />
              <DetailField
                icon="flag"
                label="Prioriteit"
                value={ticketPriorityConfig[ticket.priority]?.label ?? ticket.priority}
              />
              <DetailField
                icon="info"
                label="Status"
                value={ticketStatusConfig[ticket.status]?.label ?? ticket.status}
              />
              <DetailField
                icon="calendar_today"
                label="Aangemaakt op"
                value={formatDate(ticket.cw_created_at ?? ticket.created_at)}
              />
              {ticket.cw_updated_at && (
                <DetailField
                  icon="update"
                  label="Laatst bijgewerkt"
                  value={formatDate(ticket.cw_updated_at)}
                />
              )}
            </div>
          </div>

          {/* Stats card */}
          {stats && (
            <div className="bg-card rounded-2xl shadow-card border border-border p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">Statistieken</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Open tickets</span>
                  <span className="font-medium text-foreground">{stats.totalOpen}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gesloten tickets</span>
                  <span className="font-medium text-foreground">{stats.totalClosed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gem. responstijd</span>
                  <span className="font-medium text-foreground">
                    {formatResponseTime(stats.avgResponseHours)}
                  </span>
                </div>
                {stats.avgResolutionDays !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gem. oplostijd</span>
                    <span className="font-medium text-foreground">
                      {formatResponseTime(stats.avgResolutionDays * 24)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <MaterialIcon
        name={icon}
        size={16}
        className="text-muted-foreground mt-0.5"
      />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
