import { Suspense } from "react";
import { getTickets, getTicketStats } from "@/lib/repositories";
import { TicketFilters } from "./ticket-filters";

async function TicketsContent() {
  const [tickets, stats] = await Promise.all([
    getTickets(),
    getTicketStats().catch(() => null),
  ]);
  return <TicketFilters tickets={tickets} stats={stats} />;
}

export default function TicketsPage() {
  return (
    <div>
      <h1 className="section-title text-2xl mb-6">Tickets</h1>
      <Suspense>
        <TicketsContent />
      </Suspense>
    </div>
  );
}
