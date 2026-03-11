"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import {
  StatusBadge,
  EmptyStateInline,
  ticketStatusConfig,
  ticketPriorityConfig,
} from "@/components/data-display";
import type { Ticket } from "@/types/database";

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
          <EmptyStateInline
            icon="confirmation_number"
            message="Geen tickets gevonden"
            iconClassName="text-muted-foreground/50"
            iconSize={40}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">#ID</TableHead>
                <TableHead>Samenvatting</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[120px]">Prioriteit</TableHead>
                <TableHead className="w-[160px] hidden md:table-cell">Contactpersoon</TableHead>
                <TableHead className="w-[130px] hidden sm:table-cell">Aangemaakt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell">
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
                    <StatusBadge status={ticket.status} config={ticketStatusConfig} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.priority} config={ticketPriorityConfig} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {ticket.contact_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {formatDate(ticket.cw_created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
