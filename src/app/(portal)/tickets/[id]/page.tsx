import { notFound } from "next/navigation";
import Link from "next/link";
import { getTicketById } from "@/lib/repositories";
import { MaterialIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import type { TicketStatus, TicketPriority } from "@/types/database";

const statusConfig: Record<TicketStatus, { label: string; className: string }> =
  {
    open: {
      label: "Open",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    in_progress: {
      label: "In behandeling",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    closed: {
      label: "Gesloten",
      className:
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
  };

const priorityConfig: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  high: {
    label: "Hoog",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  normal: {
    label: "Normaal",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  low: {
    label: "Laag",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];

  return (
    <div>
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <MaterialIcon name="arrow_back" size={18} />
        Terug naar tickets
      </Link>

      <div className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-8">
        <div className="flex flex-wrap items-start gap-3 mb-6">
          <h1 className="text-xl font-semibold text-foreground flex-1 min-w-0">
            {ticket.summary}
          </h1>
          <Badge className={status.className}>{status.label}</Badge>
          <Badge className={priority.className}>{priority.label}</Badge>
        </div>

        {ticket.description && (
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Beschrijving
            </h2>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ticket.cw_ticket_id && (
            <DetailField
              icon="tag"
              label="Ticket ID"
              value={`#${ticket.cw_ticket_id}`}
            />
          )}
          {ticket.contact_name && (
            <DetailField
              icon="person"
              label="Contactpersoon"
              value={ticket.contact_name}
            />
          )}
          {ticket.source && (
            <DetailField icon="input" label="Bron" value={ticket.source} />
          )}
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
