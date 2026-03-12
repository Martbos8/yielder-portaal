# PRD — Senior Fullstack Software Engineer (Enterprise Grade)

Je bent een Principal Fullstack Software Engineer met 15+ jaar ervaring bij Microsoft, Google of Stripe-niveau bedrijven. Je bouwt software op het allerhoogste niveau: schaalbaar, veilig, performant, onderhoudbaar, en elegant.

Dit is het Yielder klantportaal — een Next.js 14 + Supabase + Tailwind applicatie voor 8000+ IT klanten. Het moet op enterprise-niveau komen: de kwaliteit van een Azure Portal, Vercel Dashboard, of Stripe Dashboard.

## Werkwijze

**BELANGRIJK: Elke iteratie pak je PRECIES ÉÉN taak. Werk die volledig af, test, commit. Ga dan pas naar de volgende.**

Per iteratie:
1. Lees `prd.md` en `progress.txt`
2. Kies de hoogste-prioriteit ONVOLTOOIDE taak
3. Lees ALLE relevante broncode EERST — begrijp de huidige implementatie volledig
4. Implementeer de verbetering op het hoogste niveau
5. Run `npm run build && npm run test` — fix ALLES
6. Commit met duidelijke message
7. Markeer de taak als [done] in dit bestand
8. Schrijf geleerde lessen in progress.txt

## Supabase
- URL: https://aumbbaozmqqgyjhcwzff.supabase.co
- Anon key in .env.local

## Regels
- Code in het Engels, UI-teksten in het Nederlands
- TypeScript strict — GEEN any, GEEN as-casts tenzij bewezen noodzakelijk
- Lees CLAUDE.md voor ALLE conventies — volg ze strikt
- GEEN nieuwe dependencies tenzij het een duidelijk probleem oplost
- GEEN console.log in commits
- Elke wijziging MOET build + test doorstaan

---

## FASE 1: Code Quality & Architecture (Taak 1-8)

### Taak 1: TypeScript strictheid naar maximaal [done]
- Lees `tsconfig.json` en zet ALLE strict opties aan:
  - noUncheckedIndexedAccess: true
  - exactOptionalPropertyTypes: true
  - noImplicitReturns: true
  - noFallthroughCasesInSwitch: true
  - noPropertyAccessFromIndexSignature: true
- Fix ALLE TypeScript errors die hieruit voortkomen
- Dit maakt de codebase robuuster tegen runtime errors
- Run build + test na elke fix

### Taak 2: Database types genereren en synchroniseren [done]
- Lees `src/types/database.ts` — dit zijn handmatige types
- Maak een `src/types/supabase.ts` met gegenereerde types die EXACT matchen met het database schema
- Verifieer dat alle queries in `src/lib/queries.ts` correct getypt zijn
- Voeg generics toe aan Supabase client calls: `supabase.from('tickets').select('*').returns<Ticket[]>()`
- Zorg dat ELKE query return type compile-time geverifieerd is

### Taak 3: Error handling systematisch maken [done]
- Maak `src/lib/errors.ts`:
  - Custom error classes: `AppError`, `AuthError`, `NotFoundError`, `ValidationError`, `RateLimitError`
  - Elk met: message, code, statusCode, isOperational flag
  - Helper: `isAppError(error): error is AppError`
- Refactor ALLE try/catch blokken in de codebase om deze error classes te gebruiken
- Zorg dat error boundaries correct reageren op elk type
- Log alleen unexpected errors (niet operational errors)

### Taak 4: Query layer refactoren naar repository pattern [done]
- Lees `src/lib/queries.ts` — dit is nu één groot bestand
- Splits op in repositories:
  - `src/lib/repositories/ticket.repository.ts`
  - `src/lib/repositories/hardware.repository.ts`
  - `src/lib/repositories/agreement.repository.ts`
  - `src/lib/repositories/company.repository.ts`
  - `src/lib/repositories/notification.repository.ts`
  - `src/lib/repositories/license.repository.ts`
  - `src/lib/repositories/product.repository.ts`
  - `src/lib/repositories/index.ts` (re-exports)
- Elke repository:
  - Specifieke .select() kolommen (niet SELECT *)
  - Correcte .order() en .limit()
  - Typed return values
  - Error handling met custom errors
  - JSDoc op publieke functies
- Update alle imports in pages die queries.ts gebruiken
- ALLE bestaande tests moeten blijven slagen

### Taak 5: Server Actions voor mutaties [done]
- Lees alle pagina's die data muteren (contact form, notification read, etc.)
- Maak `src/lib/actions/` directory:
  - `contact.actions.ts` — createContactRequest met Zod validatie
  - `notification.actions.ts` — markAsRead, markAllAsRead
  - `feedback.actions.ts` — recordRecommendationFeedback
- Gebruik Zod schemas voor input validatie:
  - `ContactRequestSchema = z.object({ subject: z.string().min(1).max(200), ... })`
- Elke action: auth check, validatie, sanitize, rate limit, audit log, return typed result
- Update frontend components om deze actions te gebruiken

### Taak 6: Middleware chain verbeteren [done]
- Lees `src/middleware.ts`
- Verbeter:
  - Rate limiting op route-niveau (niet alleen per endpoint)
  - Security headers injecteren
  - Request ID genereren (voor tracing)
  - Geolocation/IP logging voor audit
  - CORS configuratie
  - Redirect chains optimaliseren (geen dubbele redirects)

### Taak 7: Caching strategie implementeren [done]
- Implementeer multi-level caching:
  - **In-memory cache** (`src/lib/cache.ts`): generic Map-based cache met TTL
    - `cache.get<T>(key): T | null`
    - `cache.set<T>(key, value, ttlMs): void`
    - `cache.invalidate(pattern): void`
  - **Next.js fetch cache**: gebruik `next: { revalidate: 300 }` op stabiele data
  - **Supabase query cache**: wrap repositories met cache layer
- Cache toepassen op:
  - Product catalogus: 1 uur TTL
  - Recommendations: 5 min TTL per company
  - Distributor prijzen: 24 uur TTL
  - Company info: 30 min TTL
  - Dashboard stats: 2 min TTL

### Taak 8: Logging & observability [done]
- Maak `src/lib/logger.ts`:
  - Structured logging (JSON format)
  - Log levels: debug, info, warn, error
  - Context: requestId, userId, companyId, route
  - Automatische PII redactie
  - In development: pretty print
  - In production: JSON voor log aggregatie
- Voeg logging toe aan:
  - Alle API routes (request/response)
  - Alle repository queries (slow query warning >500ms)
  - Auth events
  - Sync operations
  - Recommendation engine

## FASE 2: Frontend Excellence (Taak 9-18)

### Taak 9: Component architecture verbeteren [done]
- Audit alle components in `src/components/`
- Refactor naar consistent patroon:
  - Props interfaces met JSDoc
  - Default props waar logisch
  - Compound components waar zinvol (bijv. Card.Header, Card.Body, Card.Footer)
  - Forwardref op interactieve componenten
- Maak `src/components/data-display/` voor:
  - `stat-card.tsx` — herbruikbare KPI card
  - `status-badge.tsx` — universele status badge (ticket, contract, hardware, license)
  - `data-table.tsx` — generieke tabel met sortering, filtering, paginatie
  - `empty-state.tsx` — herbruikbare empty state met icoon + tekst + actie
  - `metric-ring.tsx` — herbruikbare score ring (Recharts)

### Taak 10: Data table component (enterprise-grade) [done]
- Maak `src/components/data-display/data-table.tsx`:
  - Generic: `DataTable<T>` met column definitie
  - Client-side sortering op elke kolom
  - Filtering per kolom (tekst, select, date range)
  - Paginatie (10/25/50 per pagina)
  - Lege staat
  - Loading staat
  - Responsive: horizontaal scrollen op mobile, of kolommen verbergen
  - Keyboard navigatie (a11y)
- Pas toe op: tickets lijst, hardware lijst, audit log, licenties
- Dit vervangt handmatige tabel implementaties

### Taak 11: Dashboard verbeteren naar executive-niveau [done]
- Lees `src/app/(portal)/dashboard/page.tsx`
- Verbeter naar Stripe/Vercel dashboard niveau:
  - KPI cards met trend indicator (↑ 12% vs vorige maand) — berekend uit data
  - Sparkline mini-grafieken in KPI cards
  - Aandachtspunten gesorteerd op urgentie met color-coded severity
  - "Quick actions" sectie: Nieuw ticket, Contact opnemen, Documenten
  - Recente activiteit feed (laatste 10 events uit audit_log of tickets)
  - Responsive grid: 4 kolommen desktop → 2 tablet → 1 mobile

### Taak 12: Upgrade pagina verbeteren [done]
- Lees `src/app/(portal)/upgrade/page.tsx`
- Verbeter:
  - IT Score ring: grotere ring, animatie bij laden, breakdown per categorie
  - Score breakdown: security 85%, compliance 72%, performance 91%, etc.
  - Kritieke items als collapsible cards met detail uitleg
  - Aanbevelingen: vergelijkingstabel (features, prijs, ROI)
  - Per aanbeveling: "Waarom dit belangrijk is" uitleg tekst
  - CTA: "Plan een gesprek" button die contact modal opent met pre-filled product

### Taak 13: Hardware pagina verbeteren [done]
- Lees `src/app/(portal)/hardware/page.tsx`
- Verbeter:
  - Visuele lifecycle indicator per device (progress bar van aankoop tot end-of-life)
  - Groepering toggle: per type / per locatie / per status
  - Zoekbalk voor hardware (naam, serienummer, toegewezen aan)
  - Bulk selectie + export naar CSV (client-side)
  - Hardware health score per device
  - "Vervangingsadvies" badge met link naar upgrade pagina

### Taak 14: Tickets pagina naar helpdesk-niveau [done]
- Lees tickets pagina's
- Verbeter:
  - Timeline view op detail pagina (wanneer aangemaakt, status wijzigingen)
  - Priority color coding consistent met severity (urgent=rood pulse, high=oranje, etc.)
  - Ticket detail: collapsible description, metadata sidebar
  - "Vergelijkbare tickets" sectie (zelfde categorie, recent)
  - Response time indicator: "Gemiddelde responstijd: 2 uur"

### Taak 15: Contracten pagina verbeteren [done]
- Lees contracten pagina
- Verbeter:
  - Contract timeline visualisatie (start → nu → einde)
  - Kosten breakdown: maandelijks/jaarlijks/totaal
  - Renewal reminder met dagen tot expiry
  - "Besparingspotentieel" als er betere deals zijn (link naar upgrade)
  - Contracten vergelijken (side-by-side)

### Taak 16: Animaties en micro-interacties [done]
- Voeg toe (ZONDER externe dependencies, gebruik Tailwind + CSS):
  - Page transition: fade-in + subtle slide-up (al in globals.css, verifieer werking)
  - Card hover: subtle lift + shadow transition (200ms ease)
  - Button press: scale(0.98) feedback
  - Loading skeletons: shimmer animatie
  - Score ring: animated fill bij eerste render (CSS transition)
  - Notification badge: subtle pulse animatie
  - Toast notifications: slide-in van rechts + auto-dismiss
  - Sidebar active item: smooth background transition

### Taak 17: Accessibility (WCAG 2.1 AA) [done]
- Audit alle pagina's:
  - Alle interactieve elementen: focus-visible ring
  - ARIA labels op icon-only buttons
  - Correct heading hierarchy (h1 → h2 → h3, geen skips)
  - Color contrast: minimaal 4.5:1 voor tekst
  - Keyboard navigatie: Tab door alle interactieve elementen
  - Screen reader: `aria-label` op grafieken, `sr-only` tekst waar nodig
  - Skip-to-content link
  - Reduced motion: `prefers-reduced-motion` media query respecteren

### Taak 18: Performance optimalisatie [done]
- Audit en optimaliseer:
  - Lazy load componenten die below-the-fold zijn (React.lazy + Suspense)
  - Recharts: dynamic import (geen SSR nodig)
  - Images: next/image met blur placeholder waar van toepassing
  - Bundle size: check met `npx next build` output, identificeer grote chunks
  - Memoize dure berekeningen (useMemo op health scores, recommendations)
  - Debounce zoekbalken (300ms)
  - Virtualiseer lange lijsten als >50 items (zonder dependency, use IntersectionObserver)

## FASE 3: Backend Hardening (Taak 19-26)

### Taak 19: API route middleware pattern [done]
- Maak `src/lib/api/middleware.ts`:
  - `withAuth(handler)` — auth check wrapper
  - `withRateLimit(handler, profile)` — rate limit wrapper
  - `withValidation(handler, schema)` — Zod validatie wrapper
  - `withAudit(handler, action)` — audit logging wrapper
  - `withErrorHandling(handler)` — catch-all error handler
  - `createApiHandler(config)` — compose alle middleware
- Voorbeeld gebruik:
  ```typescript
  export const POST = createApiHandler({
    auth: true,
    rateLimit: 'contactRequest',
    validation: ContactRequestSchema,
    audit: 'contact_request_created',
    handler: async (req, { user, body }) => { ... }
  })
  ```
- Refactor ALLE bestaande API routes om dit pattern te gebruiken

### Taak 20: Input validatie met Zod schemas [done]
- Maak `src/lib/schemas/` directory:
  - `contact.schema.ts` — ContactRequestSchema
  - `ticket.schema.ts` — TicketFilterSchema
  - `sync.schema.ts` — SyncRequestSchema
  - `feedback.schema.ts` — FeedbackSchema
  - `common.schema.ts` — UUIDSchema, PaginationSchema, DateRangeSchema
- Gebruik deze schemas in:
  - API routes (via middleware)
  - Server actions
  - Client-side form validatie
- Eén schema, drie toepassingen: server validatie, client validatie, TypeScript types

### Taak 21: Database query optimalisatie [not started]
- Lees alle repositories/queries
- Optimaliseer:
  - Compound indexes voorstellen voor veel-gebruikte filters (database/030_indexes.sql)
  - N+1 queries elimineren (gebruik .select met joins waar mogelijk)
  - Paginatie: cursor-based i.p.v. offset-based voor grote datasets
  - Count queries: gebruik .count() met head:true voor efficiency
  - Materialized views overwegen voor dashboard stats

### Taak 22: ConnectWise sync robuuster maken [not started]
- Lees `src/lib/connectwise/sync.ts`
- Verbeter:
  - Idempotent sync: track sync_id per run, skip duplicaten
  - Delta sync: alleen gewijzigde records na last_sync timestamp
  - Conflict resolution: CW data wint bij conflict (source of truth)
  - Sync queue: als één entity faalt, queue voor retry
  - Metrics: sync duration, records per seconde, error rate
  - Webhook support voorbereiden (stub voor CW callback endpoint)

### Taak 23: Recommendation engine v2 [not started]
- Lees `src/lib/engine/` volledig
- Verbeter:
  - Weighted scoring: gap severity × recency × company size factor
  - Seasonal patterns: bepaalde producten relevanter in Q4 (budget season)
  - Cross-sell rules: "Klanten die X kochten, kochten ook Y"
  - Confidence intervals: alleen recommendations met >70% confidence tonen
  - A/B test framework: track welke recommendation variant beter converteert
  - Personalisatie: prioriteer categorieën waar klant eerder op klikte

### Taak 24: Background jobs voorbereiden [not started]
- Maak `src/lib/jobs/` directory:
  - `sync-scheduler.ts` — scheduled ConnectWise sync
  - `price-refresher.ts` — ververs distributor prijzen
  - `notification-generator.ts` — genereer notificaties (contract expiry, warranty, etc.)
  - `health-calculator.ts` — herbereken health scores
- Elke job:
  - Idempotent (safe om dubbel te runnen)
  - Logging met start/end/duration
  - Error handling met retry
- Maak `src/app/api/cron/route.ts`:
  - POST handler voor Vercel Cron
  - Auth via CRON_SECRET
  - Dispatcht naar juiste job op basis van parameter

### Taak 25: Rate limiting verbeteren [not started]
- Lees `src/lib/rate-limit.ts`
- Verbeter:
  - Sliding window algorithm (niet fixed window)
  - Per-user EN per-IP limiting
  - Graduated response: warning headers bij 80% limit, block bij 100%
  - Whitelist voor internal services
  - Response headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  - Retry-After header bij 429

### Taak 26: Comprehensive test suite [not started]
- Audit bestaande tests en vul aan:
  - Unit tests voor ELKE repository functie
  - Unit tests voor ELKE server action
  - Unit tests voor cache module
  - Unit tests voor error classes
  - Unit tests voor Zod schemas (valid + invalid input)
  - Integration tests voor API routes (mock Supabase)
  - Edge case tests: null data, empty arrays, max lengths, unicode, XSS payloads
- Doel: >90% coverage op alle lib/ bestanden
- Run: `npm run test` moet alles groen zijn

## FASE 4: Polish & Production (Taak 27-30)

### Taak 27: Consistent design system documentatie in code [not started]
- Maak `src/lib/constants/` directory:
  - `colors.ts` — alle Yielder kleuren als TypeScript constants
  - `breakpoints.ts` — responsive breakpoints
  - `status.ts` — status labels, kleuren, iconen per entity type
  - `navigation.ts` — sidebar items configuratie (uit sidebar.tsx extracten)
- Maak `src/components/ui/theme.ts`:
  - Badge variants per status type (ticket, contract, hardware, license)
  - Consistent color mapping: success=groen, warning=oranje, error=rood, info=blauw

### Taak 28: SEO en metadata [not started]
- Voeg per pagina correcte metadata toe:
  - `generateMetadata()` functie per route
  - Titel: "Pagina | Mijn Yielder"
  - Description per pagina
  - Open Graph tags
  - Favicon check
  - robots.txt
  - sitemap.xml (voor publieke pagina's: login)

### Taak 29: Final integration test [not started]
- Maak `src/test/integration/` directory:
  - Test complete user flow: login → dashboard → tickets → detail → terug
  - Test recommendation flow: upgrade pagina → klik aanbeveling → contact modal
  - Test admin flow: admin pagina → sync status → audit log
  - Test error recovery: network error → retry → success
  - Test empty states: nieuw bedrijf zonder data
- Alle tests moeten slagen

### Taak 30: Code review en cleanup [not started]
- Doe een finale code review van de HELE codebase:
  - Verwijder ongebruikte imports
  - Verwijder ongebruikte variabelen
  - Verwijder commented-out code
  - Consistent formatting
  - Geen TODO's zonder ticket
  - Geen hardcoded waarden (extract naar constants)
  - Type safety: geen type assertions zonder reden
- Run `npm run build && npm run lint && npm run test`
- Alles MOET 100% groen zijn
- Final commit: "chore: enterprise-grade code cleanup"

---

## Na alle taken
Als ALLE 30 taken [done] zijn, maak een bestand `RALPH_DONE` aan.
