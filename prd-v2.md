# PRD v2 — Backend: Recommendation Engine + Intelligente IT-Adviseur

## Visie
Het portaal wordt een intelligente IT-adviseur voor 8000+ klanten.
Het analyseert wat een klant heeft, detecteert gaten en risico's,
vergelijkt met vergelijkbare klanten, haalt live prijzen op bij distributeurs,
en toont aanbevelingen door het hele portaal heen.

De klant ziet: "Dit raden wij aan" + knop "Neem contact op met het team".

## Architectuur

```
ConnectWise Manage API ──→ Supabase (klantdata, producten, agreements)
                                ↓
Distributeur APIs ──────→ Supabase (live prijzen, productcatalogus)
  (Copaco, Ingram Micro,       ↓
   TD Synnex, Esprinet)   Recommendation Engine
                                ↓
                          ┌─────────────────────────┐
                          │  3 lagen:                │
                          │  1. Gap Analyse          │
                          │  2. Patroon Matching     │
                          │  3. Marktprijs Lookup    │
                          └─────────────────────────┘
                                ↓
                          Portaal (overal geïntegreerd)
                          + speciale Upgrade pagina
```

## Belangrijke constraints
- GEEN ConnectWise API key beschikbaar (komt later)
- GEEN distributeur API keys beschikbaar (komt later)
- Bouw alles met demo/mock modus zodat het WERKT zonder keys
- Algoritme moet LEREN over tijd (zelfverbeterend)
- Kritiekheid bepaalt urgentie: geen backup = ROOD, geen MDM = ORANJE

## Yielder productportfolio (voor het algoritme)

### Categorieën
1. **Cybersecurity** — firewalls, endpoint protection, managed security, backup
2. **Connectivity** — internet, SD-WAN, netwerken
3. **Devices** — laptops, desktops, servers, monitoren
4. **Cloud** — Microsoft 365, Azure, cloud backup, hosted servers
5. **Voice & Video** — UCaaS, CCaaS, hosted telefonie
6. **Enterprise Apps** — ERP, CRM, branchespecifiek
7. **Mobile** — MDM, mobile devices, mobiele abonnementen
8. **Data** — opslag, backup, disaster recovery
9. **Pro AV** — audiovisueel, vergaderruimtes
10. **AI** — AI-tools, copilots, automatisering
11. **Managed Services** — beheer, monitoring, helpdesk, patch management

### Vendors
Fortinet, Cisco, HPE, Samsung, Apple, WatchGuard, Microsoft, VMware,
Odido, Vodafone, KPN, en distributeurs: Copaco, Ingram Micro, TD Synnex, Esprinet

---

## Taken

### 1. Product catalogus model
- **Status:** TODO
- **Prioriteit:** 1
- **Beschrijving:** Database structuur voor een productcatalogus die Yielder's portfolio representeert. Dit is de basis voor alle aanbevelingen.
- **Acceptatiecriteria:**
  - [ ] Database migration: database/011_product_catalog.sql
  - [ ] Tabel: product_categories (id, name, slug, icon, description, sort_order)
  - [ ] Tabel: products (id, category_id, name, vendor, sku, description, type: hardware|software|service, lifecycle_years, is_active)
  - [ ] Tabel: product_dependencies (product_id, depends_on_product_id, dependency_type: requires|recommended|enhances)
  - [ ] Tabel: client_products (id, company_id, product_id, quantity, purchase_date, expiry_date, status: active|expiring|expired)
  - [ ] Seed data: 11 categorieën + minstens 30 producten verspreid over categorieën
  - [ ] Seed data: dependency regels (firewall → managed security, laptops → MDM, cloud → backup, M365 → MFA, etc.)
  - [ ] src/types/database.ts updaten met nieuwe types
  - [ ] Test: build slaagt
- **Checks:** npm run build && npm run lint && npm run test

### 2. Gap analyse engine
- **Status:** TODO
- **Prioriteit:** 2
- **Beschrijving:** Algoritme dat analyseert wat een klant MIST op basis van wat ze WEL hebben. Gebruikt de product_dependencies tabel.
- **Acceptatiecriteria:**
  - [ ] src/lib/engine/gap-analysis.ts
  - [ ] Functie: analyzeGaps(companyId) → GapResult[]
  - [ ] GapResult type: { missingProduct, reason, severity: critical|warning|info, relatedTo }
  - [ ] Severity logica:
    - CRITICAL (rood): geen backup, geen firewall, geen antivirus, geen MFA
    - WARNING (oranje): geen MDM bij >5 mobile devices, geen managed service bij firewall, warranty verlopen, licenties bijna vol
    - INFO (blauw): upgrade beschikbaar, nieuwer model op de markt
  - [ ] Gebruikt product_dependencies om gaten te detecteren
  - [ ] Query: haal client_products op, vergelijk met dependencies, vind ontbrekende
  - [ ] Test: gap analysis met mock data detecteert ontbrekende backup bij cloud-klant
- **Checks:** npm run build && npm run lint && npm run test

### 3. Patroon matching engine — "klanten zoals jij"
- **Status:** TODO
- **Prioriteit:** 3
- **Beschrijving:** Algoritme dat vergelijkt met vergelijkbare klanten. Als 80% van bedrijven van dezelfde grootte en branche product X hebben, en jij niet, dan is dat een aanbeveling.
- **Acceptatiecriteria:**
  - [ ] src/lib/engine/pattern-matching.ts
  - [ ] Functie: findPatterns(companyId) → PatternResult[]
  - [ ] PatternResult type: { product, adoptionRate, segmentDescription, confidence }
  - [ ] Segmentatie op: bedrijfsgrootte (klein <20, midden 20-100, groot >100), branche/type, regio
  - [ ] Berekening: per segment, tel hoeveel bedrijven product X hebben → adoptionRate
  - [ ] Filter: toon alleen als adoptionRate > 60% EN de klant het product NIET heeft
  - [ ] Sorteer op adoptionRate DESC (hoogste eerst)
  - [ ] Beschrijving: "85% van vergelijkbare IT-bedrijven gebruikt cloud backup"
  - [ ] Test: patroon matching vindt populair product dat klant mist
- **Checks:** npm run build && npm run lint && npm run test

### 4. Recommendation scorer — combineer gap + patroon
- **Status:** TODO
- **Prioriteit:** 4
- **Beschrijving:** Combineert gap analyse en patroon matching tot één gerankte lijst van aanbevelingen per klant.
- **Acceptatiecriteria:**
  - [ ] src/lib/engine/recommendation.ts
  - [ ] Functie: getRecommendations(companyId) → Recommendation[]
  - [ ] Recommendation type: { product, score, reason, severity, adoptionRate, category, ctaText }
  - [ ] Score berekening: gap_severity_weight (critical=100, warning=60, info=20) + adoption_rate_bonus (0-40) + recency_boost (nieuw product op markt = +10)
  - [ ] Deduplicate: als gap EN patroon hetzelfde product suggereren, merge en verhoog score
  - [ ] Max 10 aanbevelingen per klant, gesorteerd op score DESC
  - [ ] ctaText generatie: "Neem contact op met het team" (standaard), "Direct actie vereist" (critical)
  - [ ] Test: scorer rankt critical gap hoger dan info suggestie
- **Checks:** npm run build && npm run lint && npm run test

### 5. Leeralgoritme — feedback loop
- **Status:** DONE
- **Prioriteit:** 5
- **Beschrijving:** Het algoritme moet leren. Als een aanbeveling leidt tot een aankoop, wordt die aanbeveling sterker voor vergelijkbare klanten. Als een aanbeveling wordt genegeerd, wordt die zwakker.
- **Acceptatiecriteria:**
  - [ ] Tabel: recommendation_feedback (id, company_id, product_id, recommendation_score, action: shown|clicked|contacted|purchased|dismissed, created_at)
  - [ ] Database migration: database/012_recommendation_feedback.sql
  - [ ] src/lib/engine/learning.ts
  - [ ] Functie: recordFeedback(companyId, productId, action) — schrijft naar tabel
  - [ ] Functie: getConversionRate(productId, segment) — berekent hoe vaak shown→purchased
  - [ ] Score adjustment: recommendation score × conversion_multiplier (0.5 tot 2.0)
  - [ ] conversion_multiplier = (purchases / shown) genormaliseerd, met minimum 50 datapunten
  - [ ] Zolang <50 datapunten: gebruik default score (geen adjustment)
  - [ ] Audit log bij elke feedback event
  - [ ] Test: feedback wordt opgeslagen, conversion rate berekening klopt
- **Checks:** npm run build && npm run lint && npm run test

### 6. ConnectWise sync module (demo modus)
- **Status:** DONE
- **Prioriteit:** 6
- **Beschrijving:** Sync klantdata uit ConnectWise. Draait in demo modus zonder API key.
- **Acceptatiecriteria:**
  - [ ] src/lib/connectwise/client.ts — API client met auth headers (Basic auth: companyId+publicKey:privateKey)
  - [ ] src/lib/connectwise/types.ts — CW response types (CWCompany, CWTicket, CWAgreement, CWConfiguration, CWProduct)
  - [ ] src/lib/connectwise/sync.ts — sync functies per entity
  - [ ] Sync logica: fetch → transform naar onze types → upsert in Supabase (ON CONFLICT cw_*_id)
  - [ ] Pagination: CW max 1000 per page, implementeer auto-pagination
  - [ ] Rate limiting: max 10 requests/seconde
  - [ ] ENV vars: CW_BASE_URL, CW_COMPANY_ID, CW_PUBLIC_KEY, CW_PRIVATE_KEY, CW_CLIENT_ID
  - [ ] Als env vars leeg: log "CW sync: demo modus — geen API key" en return
  - [ ] Sync endpoint: src/app/api/sync/connectwise/route.ts (POST, beveiligd met secret)
  - [ ] Test: client class instantieert, sync returnt early zonder keys
- **Checks:** npm run build && npm run lint && npm run test

### 7. Distributeur prijzen module (demo modus)
- **Status:** DONE
- **Prioriteit:** 7
- **Beschrijving:** Haal live productprijzen op bij distributeurs. Demo modus met mock prijzen.
- **Acceptatiecriteria:**
  - [ ] src/lib/distributors/types.ts — DistributorPrice type (sku, distributor, price, currency, availability, updated_at)
  - [ ] src/lib/distributors/client.ts — basis client class met getPrice(sku), searchProducts(query)
  - [ ] src/lib/distributors/copaco.ts — Copaco client (extends basis, demo modus)
  - [ ] src/lib/distributors/ingram.ts — Ingram Micro client (extends basis, demo modus)
  - [ ] src/lib/distributors/td-synnex.ts — TD Synnex client (extends basis, demo modus)
  - [ ] src/lib/distributors/mock-prices.ts — realistische mock prijzen voor 30+ producten
  - [ ] Tabel: distributor_prices (id, product_id, distributor, sku, price, currency, availability, fetched_at)
  - [ ] Database migration: database/013_distributor_prices.sql
  - [ ] Functie: getBestPrice(productId) — laagste prijs over alle distributeurs
  - [ ] Cache: prijzen 24 uur geldig, daarna refresh
  - [ ] Als geen API keys: gebruik mock-prices.ts
  - [ ] Test: getBestPrice returnt laagste prijs uit mock data
- **Checks:** npm run build && npm run lint && npm run test

### 8. Upgrade pagina — de hoofdpagina voor aanbevelingen
- **Status:** DONE
- **Prioriteit:** 8
- **Beschrijving:** Speciale pagina waar alle aanbevelingen samenkomen. Dit is de belangrijkste pagina van het hele portaal.
- **Acceptatiecriteria:**
  - [ ] src/app/(portal)/upgrade/page.tsx — Server Component
  - [ ] Bovenaan: "Uw IT-score" — percentage van hoe compleet de IT-omgeving is (gebaseerd op gaps)
  - [ ] Score visualisatie: circulaire progress indicator (bv. 72%) met kleur (rood <50, oranje 50-80, groen >80)
  - [ ] Sectie "Direct actie vereist" — critical gaps met rode accent
  - [ ] Sectie "Aanbevelingen" — overige suggesties gesorteerd op score
  - [ ] Per aanbeveling: Card met productnaam, categorie icon, reden, severity badge, adoptionRate ("85% van vergelijkbare bedrijven"), prijs indicatie (als beschikbaar)
  - [ ] CTA knop per aanbeveling: "Neem contact op met het team" → opent contact formulier/modal
  - [ ] "Klanten zoals u" sidebar: korte stats over het segment
  - [ ] Voeg "Upgrade" toe aan sidebar navigatie (met badge als er critical items zijn)
  - [ ] Track: recordFeedback bij elke getoonde en geklikte aanbeveling
  - [ ] Test: upgrade pagina rendert IT-score en aanbevelingen sectie
- **Checks:** npm run build && npm run lint && npm run test

### 9. Aanbevelingen integratie in dashboard
- **Status:** DONE
- **Prioriteit:** 9
- **Beschrijving:** Dashboard toont een compact aanbevelingen-widget met de top 3 suggesties.
- **Acceptatiecriteria:**
  - [ ] Widget "Aanbevelingen voor u" op het dashboard (naast of onder bestaande widgets)
  - [ ] Toont max 3 aanbevelingen: icon, productnaam, korte reden, severity badge
  - [ ] Critical items altijd bovenaan met rode indicator
  - [ ] Link "Bekijk alle aanbevelingen →" naar /upgrade
  - [ ] Als er geen aanbevelingen zijn: groene "Alles up-to-date" state
  - [ ] Track: recordFeedback(shown) voor getoonde items
  - [ ] Test: widget rendert aanbevelingen titel
- **Checks:** npm run build && npm run lint && npm run test

### 10. Aanbevelingen in hardware pagina
- **Status:** DONE
- **Prioriteit:** 10
- **Beschrijving:** Hardware pagina toont per asset een upgrade-suggestie als relevant.
- **Acceptatiecriteria:**
  - [ ] Per hardware card: als warranty verlopen OF device ouder dan lifecycle_years → toon upgrade badge
  - [ ] Badge tekst: "Upgrade beschikbaar" of "Warranty verlopen — actie vereist"
  - [ ] Klik op badge → detail met aanbevolen vervangend product + indicatieprijs
  - [ ] Bovenaan hardware pagina: banner als >3 devices upgrade nodig hebben
  - [ ] Track: recordFeedback bij klik op upgrade badge
  - [ ] Test: upgrade badge logica correct bij verlopen warranty
- **Checks:** npm run build && npm run lint && npm run test

### 11. Aanbevelingen in contracten pagina
- **Status:** DONE
- **Prioriteit:** 11
- **Beschrijving:** Contracten pagina toont suggesties bij bijna verlopen of ontbrekende managed services.
- **Acceptatiecriteria:**
  - [ ] Per contract: als bijna verlopen (< 60 dagen) → toon verlengings-badge
  - [ ] Als een product WEL een agreement heeft maar GEEN managed service → toon "Managed service aanbevolen" suggestie
  - [ ] Nieuwe sectie: "Ontbrekende dekking" — producten zonder servicecontract
  - [ ] Per suggestie: CTA "Neem contact op"
  - [ ] Track: recordFeedback bij klik
  - [ ] Test: verlengingsbadge toont bij contract dat bijna verloopt
- **Checks:** npm run build && npm run lint && npm run test

### 12. Contact formulier — "Neem contact op met het team"
- **Status:** DONE
- **Prioriteit:** 12
- **Beschrijving:** Modal/formulier dat opent bij elke "Neem contact op" CTA. Stuurt een bericht naar het Yielder team.
- **Acceptatiecriteria:**
  - [ ] src/components/contact-modal.tsx — herbruikbare modal
  - [ ] Voegt shadcn toe: npx shadcn@latest add dialog textarea --yes
  - [ ] Velden: onderwerp (voorgevuld met productaanbeveling), bericht (textarea), urgentie (normaal/hoog)
  - [ ] Automatisch meesturen: klant naam, bedrijf, email, het product waarover het gaat
  - [ ] Tabel: contact_requests (id, company_id, user_id, subject, message, product_id, urgency, status: new|read|replied, created_at)
  - [ ] Database migration: database/014_contact_requests.sql
  - [ ] Na versturen: toast "Uw verzoek is verstuurd, het team neemt contact op"
  - [ ] Audit log bij elk contact request
  - [ ] Test: contact modal rendert submit knop
- **Checks:** npm run build && npm run lint && npm run test

### 13. Realtime Supabase subscriptions
- **Status:** DONE
- **Prioriteit:** 13
- **Beschrijving:** Alle data in het portaal moet realtime updaten zonder pagina refresh.
- **Acceptatiecriteria:**
  - [ ] src/hooks/use-realtime.ts — generieke hook voor Supabase Realtime
  - [ ] Subscriptions op: tickets (INSERT/UPDATE/DELETE), agreements, hardware_assets, recommendations
  - [ ] Dashboard KPI's updaten live
  - [ ] Tickets tabel updatet live (nieuwe ticket verschijnt met groene flash)
  - [ ] Notificatie badge in header updatet live
  - [ ] Cleanup: alle subscriptions unsubscriben bij unmount
  - [ ] Test: hook is exporteerbaar
- **Checks:** npm run build && npm run lint && npm run test

### 14. Security hardening
- **Status:** DONE
- **Prioriteit:** 14
- **Beschrijving:** Superveilige setup: audit logging, rate limiting, security headers, input sanitization.
- **Acceptatiecriteria:**
  - [ ] src/lib/audit.ts — logAudit(userId, action, entityType, entityId, details)
  - [ ] Audit bij: login, logout, page views, recommendation clicks, contact requests
  - [ ] src/lib/rate-limit.ts — rate limiter (in-memory + Supabase voor persistence)
  - [ ] Rate limits: 5 magic links/15 min, 20 contact requests/uur, 100 API calls/min
  - [ ] Security headers in next.config.mjs: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin, CSP default-src 'self'
  - [ ] Input sanitization op alle formulieren (contact, ticket aanmaken)
  - [ ] Geen PII in client-side logs
  - [ ] Test: rate limiter blokkeert na limiet
- **Checks:** npm run build && npm run lint && npm run test

### 15. Admin sync dashboard (intern)
- **Status:** DONE
- **Prioriteit:** 15
- **Beschrijving:** Admin-only pagina waar jij (Mart) de sync status kunt zien en handmatig triggers.
- **Acceptatiecriteria:**
  - [ ] src/app/(portal)/admin/page.tsx — alleen zichtbaar voor is_yielder=true profiles
  - [ ] Overzicht: laatste sync per entity (tickets, agreements, hardware), status (success/error), tijdstip
  - [ ] Knoppen: "Sync tickets nu", "Sync agreements nu", "Sync hardware nu"
  - [ ] CW API status: groen als key geconfigureerd, rood als niet
  - [ ] Distributeur API status: per distributeur groen/rood
  - [ ] Recommendation engine stats: hoeveel aanbevelingen actief, conversion rates
  - [ ] Audit log viewer: laatste 50 events
  - [ ] Beveiligd: RLS + is_yielder check, redirect als niet-admin
  - [ ] Test: admin pagina check is_yielder
- **Checks:** npm run build && npm run lint && npm run test

## Status legenda
- TODO = nog niet begonnen
- DONE = voltooid en gecommit
