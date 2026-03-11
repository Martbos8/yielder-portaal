import { getTickets } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { MaterialIcon } from "@/components/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TicketStatus, TicketPriority } from "@/types/database";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

export default async function TicketsPage() {
  const tickets = await getTickets();

  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Tickets</h1>

      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MaterialIcon
              name="confirmation_number"
              className="text-muted-foreground/50 mb-3"
              size={40}
            />
            <p className="text-sm">Geen tickets gevonden</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">#ID</TableHead>
                <TableHead>Samenvatting</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[120px]">Prioriteit</TableHead>
                <TableHead className="w-[160px]">Contactpersoon</TableHead>
                <TableHead className="w-[130px]">Aangemaakt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status];
                const priority = priorityConfig[ticket.priority];
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {ticket.cw_ticket_id ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {ticket.summary}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priority.className}>
                        {priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ticket.contact_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(ticket.cw_created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
