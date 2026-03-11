"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  DataTable,
  StatusBadge,
  ticketStatusConfig,
  ticketPriorityConfig,
} from "@/components/data-display";
import type { ColumnDef } from "@/components/data-display";
import type { Ticket } from "@/types/database";

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
    headerClassName: "w-[120px]",
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
      <StatusBadge status={row.priority} config={ticketPriorityConfig} />
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

export function TicketFilters({ tickets }: { tickets: Ticket[] }) {
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
    />
  );
}
