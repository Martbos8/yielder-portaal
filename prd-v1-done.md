# PRD — Mijn Yielder Portaal → Productie

## Project
Klantportaal voor Yielder IT. Klanten zien hun tickets, hardware, contracten en facturen.
Next.js 14 + Supabase + Tailwind + shadcn/ui.

Lees ALTIJD eerst CLAUDE.md en database/SCHEMA.md voor context.

## Huidige staat
- Auth (magic link) werkt
- Layout, sidebar, header werken maar tonen hardcoded "Jan Vermeer" / "TechVentures B.V."
- Alle 5 portaal-pagina's zijn placeholders zonder data
- Supabase client is opgezet in lib/supabase/
- Database schema staat klaar met RLS

## Architectuur regels
- Server Components voor data fetching, Client Components alleen waar interactie nodig is
- Data ophalen via createClient() uit lib/supabase/server.ts
- Alle queries gefilterd door RLS (geen handmatige company filtering nodig)
- Gebruik bestaande shadcn/ui components uit components/ui/
- Nieuwe shadcn components toevoegen via: npx shadcn@latest add <naam> --yes
- Types in src/types/database.ts
- Yielder huisstijl: navy #1f3b61, oranje #f5a623, warm whites

---

## Taken

### 1. Database types + data helpers
- **Status:** DONE
- **Prioriteit:** 1
- **Beschrijving:** Maak TypeScript types voor alle database tabellen en herbruikbare data-fetching functies.
- **Acceptatiecriteria:**
  - [ ] src/types/database.ts met types: Company, Profile, Ticket, HardwareAsset, Agreement, Contact (gebaseerd op database/SCHEMA.md)
  - [ ] src/lib/queries.ts met async functies: getUserProfile(), getUserCompany(), getTickets(), getHardwareAssets(), getAgreements(), getDashboardStats()
  - [ ] Elke functie gebruikt createClient() uit lib/supabase/server.ts
  - [ ] Elke functie heeft juiste return types
  - [ ] Test: types importeerbaar, query functies exporteerbaar
- **Checks:** npm run build && npm run lint && npm run test

### 2. User context in layout — dynamische naam + bedrijf
- **Status:** DONE
- **Prioriteit:** 2
- **Beschrijving:** Header en sidebar moeten de echte gebruikersnaam en bedrijfsnaam tonen i.p.v. hardcoded "Jan Vermeer" / "TechVentures B.V.". Haal user + company op in het portal layout en geef door aan Header en Sidebar.
- **Acceptatiecriteria:**
  - [ ] src/app/(portal)/layout.tsx wordt Server Component die user + company ophaalt
  - [ ] Maak een apart Client Component (bv. src/components/portal-shell.tsx) voor de interactieve sidebar state
  - [ ] Header toont echte bedrijfsnaam en user initialen
  - [ ] Sidebar footer toont echte user naam + bedrijfsnaam + initialen
  - [ ] Fallback als er geen profiel is: "Gebruiker" / initialen "?"
  - [ ] Build + lint slagen
- **Checks:** npm run build && npm run lint && npm run test

### 3. Dashboard — live KPI cards
- **Status:** DONE
- **Prioriteit:** 3
- **Beschrijving:** Dashboard KPI cards tonen live data uit Supabase: aantal open tickets, hardware assets, actieve contracten, totaal maandbedrag contracten.
- **Acceptatiecriteria:**
  - [ ] Dashboard is een Server Component
  - [ ] 4 KPI cards met echte getallen uit getDashboardStats()
  - [ ] KPI's: "Open tickets" (count waar is_closed=false), "Hardware" (count), "Contracten" (count waar status=active), "Maandbedrag" (sum bill_amount, geformat als EUR)
  - [ ] Loading state met Skeleton component (shadcn: npx shadcn@latest add skeleton --yes)
  - [ ] Als er geen data is: toon 0 (niet "—")
  - [ ] Test: dashboard component rendert KPI labels
- **Checks:** npm run build && npm run lint && npm run test

### 4. Dashboard — recente tickets widget
- **Status:** DONE
- **Prioriteit:** 4
- **Beschrijving:** Onderste helft dashboard: lijst van 5 meest recente open tickets met status badge.
- **Acceptatiecriteria:**
  - [ ] "Recente tickets" sectie toont max 5 tickets gesorteerd op cw_created_at DESC
  - [ ] Per ticket: samenvatting, status badge (open=groen, in_progress=oranje, closed=grijs), datum
  - [ ] Badge component uit components/ui/badge.tsx gebruiken
  - [ ] Link naar /tickets bij "Bekijk alle tickets"
  - [ ] Empty state: "Geen open tickets" met checkmark icon
  - [ ] Test: recente tickets sectie rendert
- **Checks:** npm run build && npm run lint && npm run test

### 5. Dashboard — aandachtspunten widget
- **Status:** DONE
- **Prioriteit:** 5
- **Beschrijving:** Rechter kolom dashboard: aandachtspunten — contracten die bijna verlopen + hardware met verlopen warranty.
- **Acceptatiecriteria:**
  - [ ] "Aandachtspunten" sectie met twee subsecties
  - [ ] Contracten die binnen 30 dagen verlopen (end_date < now + 30 dagen)
  - [ ] Hardware met verlopen warranty (warranty_expiry < now)
  - [ ] Per item: naam + badge (oranje voor bijna verlopen, rood voor verlopen)
  - [ ] Empty state: "Geen aandachtspunten" met groen vinkje
  - [ ] Test: aandachtspunten sectie rendert
- **Checks:** npm run build && npm run lint && npm run test

### 6. Tickets pagina — volledige tabel
- **Status:** DONE
- **Prioriteit:** 6
- **Beschrijving:** Tickets pagina met een tabel van alle tickets. Voeg shadcn Table component toe.
- **Acceptatiecriteria:**
  - [ ] Voeg shadcn toe: npx shadcn@latest add table --yes
  - [ ] Server Component die getTickets() aanroept
  - [ ] Tabel kolommen: #ID, Samenvatting, Status, Prioriteit, Contactpersoon, Aangemaakt
  - [ ] Status badges: open=groen, in_progress=oranje, closed=grijs
  - [ ] Prioriteit badges: urgent=rood, high=oranje, normal=blauw, low=grijs
  - [ ] Datum geformat als "12 mrt 2026" (Nederlandse locale)
  - [ ] Gesorteerd op cw_created_at DESC (nieuwste eerst)
  - [ ] Empty state: "Geen tickets gevonden"
  - [ ] Test: tickets tabel rendert kolomkoppen
- **Checks:** npm run build && npm run lint && npm run test

### 7. Tickets — filter en zoeken
- **Status:** DONE
- **Prioriteit:** 7
- **Beschrijving:** Voeg filter- en zoekfunctionaliteit toe aan de tickets pagina.
- **Acceptatiecriteria:**
  - [ ] Zoekbalk bovenaan (filtert op samenvatting, client-side)
  - [ ] Filter dropdown voor status: Alle, Open, In behandeling, Gesloten
  - [ ] Filter dropdown voor prioriteit: Alle, Urgent, Hoog, Normaal, Laag
  - [ ] Filters werken als Client Component wrapper rond de Server-gefetchte data
  - [ ] URL search params voor filters (zodat je kunt linken naar gefilterde view)
  - [ ] Telling: "12 tickets" bovenaan
  - [ ] Test: filter component rendert opties
- **Checks:** npm run build && npm run lint && npm run test

### 8. Hardware pagina — inventaris overzicht
- **Status:** DONE
- **Prioriteit:** 8
- **Beschrijving:** Hardware pagina met cards per asset, gegroepeerd per type.
- **Acceptatiecriteria:**
  - [ ] Server Component die getHardwareAssets() aanroept
  - [ ] Groepering per type (Desktop, Laptop, Server, Netwerk, Overig)
  - [ ] Per groep een sectie-header met telling
  - [ ] Per asset een Card met: naam, fabrikant + model, serienummer, assigned_to, warranty badge
  - [ ] Warranty badge logica: groen (>6 maanden), oranje (1-6 maanden), rood (verlopen), grijs (onbekend)
  - [ ] Warranty tekst: "Geldig t/m 12 sep 2026" of "Verlopen op 3 jan 2025"
  - [ ] Empty state per groep als er geen assets zijn
  - [ ] Test: warranty badge logica (unit test voor de berekening)
- **Checks:** npm run build && npm run lint && npm run test

### 9. Contracten pagina — agreements overzicht
- **Status:** DONE
- **Prioriteit:** 9
- **Beschrijving:** Contracten pagina met overzicht van alle agreements.
- **Acceptatiecriteria:**
  - [ ] Server Component die getAgreements() aanroept
  - [ ] Bovenaan: totaal maandbedrag (som alle actieve agreements) in grote tekst
  - [ ] Per contract een Card: naam, type, status badge, bedrag/maand, start-einddatum
  - [ ] Status badge: actief=groen, verlopen=rood, opgezegd=grijs
  - [ ] Bedrag geformat als "EUR 1.234,56" (Nederlandse locale)
  - [ ] Gesorteerd: actieve eerst, dan op naam
  - [ ] Empty state: "Geen contracten gevonden"
  - [ ] Test: contracten pagina rendert totaalbedrag label
- **Checks:** npm run build && npm run lint && npm run test

### 10. Facturen pagina — placeholder met uitleg
- **Status:** DONE
- **Prioriteit:** 10
- **Beschrijving:** Facturen pagina — er is nog geen factuur-tabel in de database. Maak een nette "coming soon" pagina die past bij de rest.
- **Acceptatiecriteria:**
  - [ ] Nette pagina met icon, titel "Facturen", uitleg "Factuuroverzicht wordt binnenkort beschikbaar"
  - [ ] Illustratie: groot receipt_long icon in een cirkel met lichte achtergrond
  - [ ] "We werken aan de koppeling met ons facturatiesysteem" als subtekst
  - [ ] Consistent met de stijl van andere pagina's
  - [ ] Test: facturen pagina rendert "binnenkort beschikbaar" tekst
- **Checks:** npm run build && npm run lint && npm run test

### 11. Loading states voor alle pagina's
- **Status:** DONE
- **Prioriteit:** 11
- **Beschrijving:** Voeg loading.tsx toe aan elke route voor instant feedback bij navigatie.
- **Acceptatiecriteria:**
  - [ ] src/app/(portal)/dashboard/loading.tsx — skeleton voor KPI cards + widgets
  - [ ] src/app/(portal)/tickets/loading.tsx — skeleton voor tabel
  - [ ] src/app/(portal)/hardware/loading.tsx — skeleton voor cards
  - [ ] src/app/(portal)/contracten/loading.tsx — skeleton voor cards
  - [ ] src/app/(portal)/facturen/loading.tsx — simpele skeleton
  - [ ] Alle loading states gebruiken Skeleton component uit shadcn
  - [ ] Build slaagt
- **Checks:** npm run build && npm run lint && npm run test

### 12. Error handling
- **Status:** DONE
- **Prioriteit:** 12
- **Beschrijving:** Voeg error.tsx toe voor graceful error handling en een not-found pagina.
- **Acceptatiecriteria:**
  - [ ] src/app/(portal)/error.tsx — Client Component met "Er ging iets mis" + retry knop
  - [ ] src/app/not-found.tsx — 404 pagina met link terug naar dashboard
  - [ ] Error pagina heeft een "Probeer opnieuw" knop die reset() aanroept
  - [ ] Beide pagina's in Yielder stijl
  - [ ] Test: error component rendert retry knop
- **Checks:** npm run build && npm run lint && npm run test

### 13. Uitlog functionaliteit
- **Status:** DONE
- **Prioriteit:** 13
- **Beschrijving:** Voeg uitloggen toe aan de sidebar en header.
- **Acceptatiecriteria:**
  - [ ] Uitlog knop in sidebar footer (onder gebruikersnaam)
  - [ ] Uitlog knop in een dropdown bij de avatar in de header (voeg shadcn dropdown-menu toe)
  - [ ] Knop roept supabase.auth.signOut() aan
  - [ ] Na uitloggen: redirect naar /login
  - [ ] Bevestigingsicoon: logout icon
  - [ ] Test: uitlog knop is aanwezig in sidebar
- **Checks:** npm run build && npm run lint && npm run test

### 14. Ticket detail pagina
- **Status:** DONE
- **Prioriteit:** 14
- **Beschrijving:** Klikken op een ticket in de tabel opent een detail pagina.
- **Acceptatiecriteria:**
  - [ ] src/app/(portal)/tickets/[id]/page.tsx — dynamic route
  - [ ] Toont: ticket ID, samenvatting, volledige beschrijving (als beschikbaar), status, prioriteit, contactpersoon, bron, aangemaakt op
  - [ ] Terug-link naar /tickets
  - [ ] Status + prioriteit badges consistent met tabel
  - [ ] 404 als ticket niet gevonden
  - [ ] loading.tsx voor de detail pagina
  - [ ] Test: detail pagina rendert terug-link
- **Checks:** npm run build && npm run lint && npm run test

### 15. Notificatie badge — live telling
- **Status:** DONE
- **Prioriteit:** 15
- **Beschrijving:** De notificatie-bell in de header toont het aantal open tickets als badge.
- **Acceptatiecriteria:**
  - [ ] Badge toont getal (aantal open tickets)
  - [ ] Badge verborgen als er 0 open tickets zijn
  - [ ] Data komt uit dezelfde query als dashboard (of aparte lichte query)
  - [ ] Build slaagt
- **Checks:** npm run build && npm run lint && npm run test

## Status legenda
- TODO = nog niet begonnen
- DONE = voltooid en gecommit
