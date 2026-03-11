# PRD — Backend & Integration Hardening Engineer

Je bent een Highlevel Senior Software Engineer gespecialiseerd in backend, APIs en security. Dit is het Yielder klantportaal (Next.js 14 + Supabase). Jouw focus: backend bullet-proof, integraties productie-klaar, security waterdicht.

## Supabase
- URL: https://aumbbaozmqqgyjhcwzff.supabase.co
- Anon key staat in .env.local

## Regels
- Code in het Engels, UI-teksten in het Nederlands
- TypeScript strict — GEEN any types
- Server-side validatie op ALLE inputs
- Audit log ALLE mutaties (gebruik lib/audit.ts)
- GEEN console.log in commits
- GEEN nieuwe dependencies zonder goede reden
- Lees CLAUDE.md voor alle conventies
- Run `npm run check` (build + lint + test) voor elke commit

---

## Taken

### Taak 1: Build verificatie [done]
- Run `npm run build && npm run test`
- Fix eventuele errors EERST — dit is blocker

### Taak 2: Contact form API route [done]
- Maak `src/app/api/contact/route.ts`
- POST handler met:
  - Auth check via createClient server + getUser
  - company_id via getUserCompanyId()
  - Validatie: subject (verplicht, max 200), message (verplicht, min 10, max 2000), urgency ("normaal"|"hoog"), product_id (optioneel UUID)
  - Sanitize input (lib/sanitize.ts)
  - Rate limit: contactRequest profile (20/uur)
  - Insert in contact_requests tabel
  - Audit log
  - Return { success: true, id } of { error, status: 4xx }
- Schrijf test: src/test/contact-api.test.ts

### Taak 3: Sync status endpoint [done]
- Maak `src/app/api/sync/status/route.ts`
- GET, auth check
- Laatste sync_log per entity_type
- Return { logs: SyncLog[], lastSync: ISO | null }

### Taak 4: Queries optimaliseren [done]
- Lees `src/lib/queries.ts`
- Voeg specifieke .select() kolommen toe (niet *)
- Voeg .order() toe waar logisch
- Voeg .limit() toe waar nodig
- GEEN breaking changes aan return types

### Taak 5: ConnectWise sync hardening [done]
- Lees `src/lib/connectwise/client.ts` + `sync.ts`
- HTTP 429: exponential backoff (1s, 2s, 4s, max 3 retries)
- HTTP 500: log error, continue naar volgende entity
- Timeout: 30s per call (AbortController)
- Sync logging: insert running → update completed/failed
- Partial sync: ticket failure stopt niet hardware sync

### Taak 6: Distributeur pricing cache [DONE]
- Lees `src/lib/distributors/`
- Implementeer: getBestPrice checkt EERST distributor_prices tabel
- Cache < 24h → return cached
- Cache verlopen → probeer API, fallback mock
- NOOIT error naar frontend, altijd een prijs

### Taak 7: Recommendation engine hardening [DONE]
- Lees `src/lib/engine/`
- try/catch op elke async functie → return [] bij error
- In-memory cache: 5 min TTL per companyId
- Maak GET /api/recommendations/[companyId]/route.ts (auth + RLS check)

### Taak 8: Security audit [DONE]
- ALLE API routes: auth check aanwezig?
- Grep naar hardcoded secrets in client code
- CSP headers correct voor Supabase + Recharts?
- Rate limiting op alle endpoints
- Input sanitization op user input

### Taak 9: Realtime subscriptions [DONE]
- Lees portal-shell.tsx
- Subscriptions opruimen bij unmount
- Error handling bij subscription failure
- Geen memory leaks

### Taak 10: Edge cases [DONE]
- User zonder bedrijf → redirect login
- Bedrijf zonder data → lege responses, geen errors
- Supabase down → error boundary
- Ongeldig ticket ID → null/404
- Expired session → redirect login

### Taak 11: Final build + push [DONE]
- `npm run check` 100% groen
- ALLE 395+ tests moeten slagen
- Commit + push naar `backend/hardening`
