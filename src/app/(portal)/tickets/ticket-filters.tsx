"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MaterialIcon } from "@/components/icon";
import {
  DataTable,
  StatusBadge,
  ticketStatusConfig,
  ticketPriorityConfig,
} from "@/components/data-display";
import type { ColumnDef } from "@/components/data-display";
import type { Ticket } from "@/types/database";
import type { TicketResponseStats } from "@/lib/repositories";

const statusFilterOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In behandeling" },
  { value: "closed", label: "Gesloten" },
];

const priorityFilterOptions = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "Hoog" },
  { value: "normal", label: "Normaal" },
  { value: "low", label: "Laag" },
];

/** Priority indicator dot with color + optional pulse for urgent. */
function PriorityIndicator({ priority }: { priority: string }) {
  const colorMap: Record<string, string> = {
    urgent: "bg-red-500 animate-pulse",
    high: "bg-orange-400",
    normal: "bg-blue-400",
    low: "bg-gray-400",
  };
  const color = colorMap[priority] ?? "bg-gray-400";
  return <span className={`inline-block size-2 rounded-full ${color} shrink-0`} />;
}

/** Format hours into readable Dutch string. */
function formatResponseTime(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${Math.round(hours)} uur`;
  const days = hours / 24;
  return `${days.toFixed(1)} dagen`;
}

const columns: ColumnDef<Ticket>[] = [
  {
    key: "id",
    header: "#ID",
    headerClassName: "w-[80px]",
    cellClassName: "font-mono text-xs text-muted-foreground",
    hideBelow: "sm",
    sortable: true,
    sortValue: (row) => row.cw_ticket_id ?? 0,
    cell: (row) => row.cw_ticket_id ?? "—",
  },
  {
    key: "summary",
    header: "Samenvatting",
    sortable: true,
    sortValue: (row) => row.summary,
    cell: (row) => (
      <Link
        href={`/tickets/${row.id}`}
        className="font-medium hover:text-yielder-navy hover:underline transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {row.summary}
      </Link>
    ),
  },
  {
    key: "status",
    header: "Status",
    headerClassName: "w-[140px]",
    sortable: true,
    sortValue: (row) => row.status,
    filterType: "select",
    filterOptions: statusFilterOptions,
    filterPlaceholder: "Alle statussen",
    filterValue: (row) => row.status,
    cell: (row) => (
      <StatusBadge status={row.status} config={ticketStatusConfig} />
    ),
  },
  {
    key: "priority",
    header: "Prioriteit",
    headerClassName: "w-[140px]",
    sortable: true,
    sortValue: (row) => {
      const order: Record<string, number> = {
        urgent: 0,
        high: 1,
        normal: 2,
        low: 3,
      };
      return order[row.priority] ?? 4;
    },
    filterType: "select",
    filterOptions: priorityFilterOptions,
    filterPlaceholder: "Alle prioriteiten",
    filterValue: (row) => row.priority,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <PriorityIndicator priority={row.priority} />
        <StatusBadge status={row.priority} config={ticketPriorityConfig} />
      </div>
    ),
  },
  {
    key: "contact",
    header: "Contactpersoon",
    headerClassName: "w-[160px]",
    cellClassName: "text-sm text-muted-foreground",
    hideBelow: "md",
    sortable: true,
    sortValue: (row) => row.contact_name ?? "",
    cell: (row) => row.contact_name ?? "—",
  },
  {
    key: "created",
    header: "Aangemaakt",
    headerClassName: "w-[130px]",
    cellClassName: "text-sm text-muted-foreground",
    hideBelow: "sm",
    sortable: true,
    sortValue: (row) => row.cw_created_at ?? "",
    cell: (row) => formatDate(row.cw_created_at),
  },
];

interface TicketFiltersProps {
  tickets: Ticket[];
  stats: TicketResponseStats | null;
}

export function TicketFilters({ tickets, stats }: TicketFiltersProps) {
  const openCount = tickets.filter((t) => !t.is_closed).length;
  const urgentCount = tickets.filter((t) => t.priority === "urgent" && !t.is_closed).length;

  const toolbar = (
    <div className="flex flex-wrap gap-3 mb-2">
      <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm">
        <MaterialIcon name="confirmation_number" size={16} className="text-muted-foreground" />
        <span className="text-muted-foreground">Totaal:</span>
        <span className="font-medium">{tickets.length}</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm">
        <MaterialIcon name="radio_button_checked" size={16} className="text-emerald-600" />
        <span className="text-muted-foreground">Open:</span>
        <span className="font-medium">{openCount}</span>
      </div>
      {urgentCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm dark:bg-red-900/20 dark:border-red-800">
          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-700 dark:text-red-400">Urgent:</span>
          <span className="font-medium text-red-700 dark:text-red-400">{urgentCount}</span>
        </div>
      )}
      {stats && stats.avgResponseHours !== null && (
        <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm">
          <MaterialIcon name="schedule" size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground">Gem. responstijd:</span>
          <span className="font-medium">{formatResponseTime(stats.avgResponseHours)}</span>
        </div>
      )}
    </div>
  );

  return (
    <DataTable<Ticket>
      columns={columns}
      data={tickets}
      rowKey={(row) => row.id}
      searchable
      searchPlaceholder="Zoek op samenvatting…"
      searchFields={(row) => [row.summary, row.contact_name ?? ""]}
      emptyIcon="confirmation_number"
      emptyMessage="Geen tickets gevonden"
      defaultPageSize={25}
      toolbar={toolbar}
    />
  );
}
