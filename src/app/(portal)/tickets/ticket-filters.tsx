"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
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
import type { Ticket, TicketStatus, TicketPriority } from "@/types/database";

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
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

const statusOptions: { value: string; label: string }[] = [
  { value: "", label: "Alle statussen" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In behandeling" },
  { value: "closed", label: "Gesloten" },
];

const priorityOptions: { value: string; label: string }[] = [
  { value: "", label: "Alle prioriteiten" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "Hoog" },
  { value: "normal", label: "Normaal" },
  { value: "low", label: "Laag" },
];

export function TicketFilters({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("zoek") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const priorityFilter = searchParams.get("prioriteit") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const filtered = useMemo(() => {
    return tickets.filter((ticket) => {
      if (
        search &&
        !ticket.summary.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter && ticket.status !== statusFilter) {
        return false;
      }
      if (priorityFilter && ticket.priority !== priorityFilter) {
        return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <MaterialIcon
            name="search"
            size={18}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Zoek op samenvatting…"
            value={search}
            onChange={(e) => updateParams("zoek", e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => updateParams("status", e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => updateParams("prioriteit", e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {priorityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {filtered.length} {filtered.length === 1 ? "ticket" : "tickets"}
      </p>

      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {filtered.length === 0 ? (
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
              {filtered.map((ticket) => {
                const status = statusConfig[ticket.status];
                const priority = priorityConfig[ticket.priority];
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {ticket.cw_ticket_id ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="hover:text-yielder-navy hover:underline transition-colors"
                      >
                        {ticket.summary}
                      </Link>
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
