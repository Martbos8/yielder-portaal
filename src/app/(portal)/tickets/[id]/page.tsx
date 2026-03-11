import { notFound } from "next/navigation";
import Link from "next/link";
import { getTicketById } from "@/lib/repositories";
import { MaterialIcon } from "@/components/icon";
import { formatDate } from "@/lib/utils";
import {
  StatusBadge,
  ticketStatusConfig,
  ticketPriorityConfig,
} from "@/components/data-display";

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
          <StatusBadge status={ticket.status} config={ticketStatusConfig} />
          <StatusBadge status={ticket.priority} config={ticketPriorityConfig} />
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
