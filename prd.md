# PRD — Deployment & Infrastructure Engineer

Je bent een Highlevel Senior Software Engineer gespecialiseerd in deployment en infrastructure. Dit is het Yielder klantportaal (Next.js 14 + Supabase + Tailwind). Jouw focus: deployment, CI/CD, productie-optimalisaties.

## Supabase
- URL: https://aumbbaozmqqgyjhcwzff.supabase.co
- Anon key staat in .env.local

## GitHub
- Repo: https://github.com/Martbos8/yielder-portaal (remote origin is al geconfigureerd)

## Regels
- Code in het Engels, UI-teksten in het Nederlands
- GEEN nieuwe dependencies zonder goede reden
- GEEN hardcoded secrets — alles via environment variables
- Run `npm run check` (build + lint + test) voor elke commit
- Lees CLAUDE.md voor alle project conventies
- Commit messages in het Engels, kort en beschrijvend

---

## Taken

### Taak 1: Build verificatie [done]
- Run `npm run build && npm run test`
- ALLES moet slagen. Fix eventuele errors EERST
- Dit is blocker voor alle andere taken

### Taak 2: Health check API endpoint [done]
- Maak `src/app/api/health/route.ts`
- GET /api/health → `{ status: "ok", version: "0.1.0", timestamp: ISO string }`
- Probeer ook een simpele Supabase ping (select 1) om database status te checken
- Return `{ status: "ok", version, timestamp, database: "connected" | "disconnected" }`
- Geen auth nodig op dit endpoint
- Schrijf een test in src/test/health-endpoint.test.ts

### Taak 3: GitHub Actions CI/CD workflow [done]
- Maak `.github/workflows/ci.yml`
- Trigger: push naar main, pull requests naar main
- Jobs:
  - checkout code
  - setup Node.js 18
  - npm ci (met cache op node_modules)
  - npm run build
  - npm run lint
  - npm run test
- Naam: "CI — Build, Lint & Test"

### Taak 4: Next.js productie-configuratie [done]
- Controleer `next.config.mjs`:
  - Security headers aanwezig? (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin, CSP)
  - CSP moet toestaan: Supabase (*.supabase.co), Recharts (inline styles voor SVG)
  - Redirect: / → /dashboard
- Voeg toe als iets ontbreekt
- Zorg dat de build nog steeds slaagt

### Taak 5: Vercel configuratie [done]
- Maak `vercel.json` met:
  - Framework: nextjs
  - Build command: npm run build
  - Headers: security headers (als backup voor next.config)
  - Redirects: / → /dashboard (301)
  - Cron: `/api/sync/connectwise` elke nacht om 3:00 UTC (cron: "0 3 * * *")
- De cron moet een SYNC_SECRET header meesturen — documenteer dat deze env var in Vercel gezet moet worden

### Taak 6: Sync endpoint beveiligen voor cron [done]
- Lees `src/app/api/sync/connectwise/route.ts`
- Verifieer dat het SYNC_SECRET header check heeft
- Als de cron vanuit Vercel komt, moet het ook werken met Vercel CRON_SECRET header
- Voeg fallback toe: check `authorization: Bearer ${CRON_SECRET}` OF `x-sync-secret: ${SYNC_SECRET}`
- Log sync attempts in audit_log

### Taak 7: Environment variables documentatie [done]
- Maak `.env.example` met alle benodigde env vars (ZONDER waarden):
  - NEXT_PUBLIC_SUPABASE_URL=
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=
  - SYNC_SECRET=
  - CW_BASE_URL= (optioneel, demo mode als leeg)
  - CW_COMPANY_ID= (optioneel)
  - CW_PUBLIC_KEY= (optioneel)
  - CW_PRIVATE_KEY= (optioneel)
  - CW_CLIENT_ID= (optioneel)
  - COPACO_API_KEY= (optioneel, mock prices als leeg)
  - INGRAM_API_KEY= (optioneel)
  - TD_SYNNEX_API_KEY= (optioneel)
- Voeg .env.example toe aan git (NIET .env.local)
- Verifieer dat .env.local in .gitignore staat

### Taak 8: Push naar GitHub [done]
- `git push origin deploy/infrastructure`
- Verifieer dat alle commits correct gepusht zijn

### Taak 9: Admin pagina sync status verbeteren [done]
- Lees `src/app/(portal)/admin/page.tsx`
- Zorg dat sync status correct de laatste sync_logs toont
- Toon per entity type: laatste sync datum, status, records synced
- Toon API configuratie status: welke env vars zijn geconfigureerd (zonder waarden!)
- ConnectWise: "Geconfigureerd" of "Demo modus (geen API keys)"
- Distributeurs: per distributeur status tonen

### Taak 10: Final build + push [done]
- `npm run check` moet 100% slagen
- Commit alle wijzigingen
- Push naar GitHub
