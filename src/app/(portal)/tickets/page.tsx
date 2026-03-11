import { Suspense } from "react";
import { getTickets } from "@/lib/repositories";
import { TicketFilters } from "./ticket-filters";

async function TicketsContent() {
  const tickets = await getTickets();
  return <TicketFilters tickets={tickets} />;
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
