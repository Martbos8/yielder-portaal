# Mijn Yielder — Klantportaal

## Stack
- **Framework:** Next.js 14 (App Router, Pages in `src/app/`)
- **Auth:** Supabase Auth (email magic link)
- **Database:** Supabase PostgreSQL met RLS — zie `database/SCHEMA.md`
- **Styling:** Tailwind CSS + shadcn/ui componenten in `components/ui/`
- **Testing:** Vitest + Testing Library
- **Taal:** TypeScript strict

## Structuur
```
src/
  app/
    (portal)/         # Authenticated routes
      dashboard/      # KPI's + widgets
      tickets/        # Ticket overzicht + [id] detail
      hardware/       # Hardware inventaris
      contracten/     # Agreements overzicht
      facturen/       # Coming soon
      layout.tsx      # Portal shell (sidebar + header)
      loading.tsx     # Loading states
      error.tsx       # Error boundary
    auth/callback/    # Supabase auth callback
    login/            # Login pagina
  components/
    header.tsx        # Top bar met bedrijfsnaam + notificaties + avatar
    sidebar.tsx       # Navigatie sidebar
    portal-shell.tsx  # Client wrapper voor sidebar state
    icon.tsx          # Material Icons wrapper
    ui/               # shadcn/ui primitives
  lib/
    supabase/         # client.ts (browser), server.ts (server), middleware.ts
    queries.ts        # Data-fetching functies
    utils.ts          # cn() helper
  types/
    database.ts       # TypeScript types voor alle tabellen
```

## Database kerntabellen
- `profiles` — user profiel (1:1 met auth.users)
- `companies` — klantbedrijven
- `user_company_mapping` — user ↔ company koppeling (basis voor RLS)
- `tickets` — servicetickets (cw_ticket_id, summary, status, priority, is_closed)
- `hardware_assets` — hardware (cw_config_id, name, type, manufacturer, warranty_expiry)
- `agreements` — contracten (cw_agreement_id, name, status, bill_amount, start/end_date)
- `contacts` — contactpersonen per bedrijf
- `audit_log` — audit trail

## Data fetching patronen
```typescript
// Server Component — data ophalen
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("tickets").select("*");
  return <TicketTable tickets={data ?? []} />;
}
```
RLS filtert automatisch op de ingelogde user's companies. Geen handmatige WHERE nodig.

## Nieuwe shadcn components toevoegen
```bash
npx shadcn@latest add <component-naam> --yes
```

## Quality checks — MOET slagen voor elke commit
```bash
npm run build    # TypeScript + Next.js build
npm run lint     # ESLint
npm run test     # Vitest
```

## Yielder huisstijl
- **Navy:** #1f3b61 (primary, koppen, sidebar accenten)
- **Oranje:** #f5a623 (CTA's, accenten)
- **Warm whites:** bg #faf8f5, cards #ffffff, sidebar #fdfcfa
- Bestaande Tailwind kleuren: `yielder-navy`, `yielder-orange`, `yielder-gold`
- Schaduwen: `shadow-card`, `shadow-card-hover`
- Hoeken: `rounded-2xl` voor cards

## Conventies
- Code in het Engels, UI-teksten in het Nederlands
- Functionele React components
- `@/` alias voor `src/`
- Tailwind utility classes, geen custom CSS
- Server Components standaard, Client Components alleen voor interactie
- Datums formatteren als "12 mrt 2026" (nl-NL locale)
- Bedragen formatteren als "EUR 1.234,56" (nl-NL locale)

## Don'ts
- GEEN `any` types
- GEEN inline styles (gebruik Tailwind)
- GEEN console.log in commits
- GEEN hardcoded Supabase URLs/keys
- GEEN nieuwe dependencies zonder goede reden
- GEEN hardcoded user/company namen — altijd uit database
