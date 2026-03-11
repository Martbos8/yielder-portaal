# PRD — Demo Data & Database Engineer

Je bent een Highlevel Senior Software Engineer gespecialiseerd in databases. Dit is het Yielder klantportaal (Next.js 14 + Supabase). Jouw focus: rijke, realistische demo data zodat het portaal indrukwekkend overkomt.

## Supabase
- URL: https://aumbbaozmqqgyjhcwzff.supabase.co
- Anon key staat in .env.local
- Database schema: lees `database/000_complete_setup.sql` + `database/011-015_*.sql`

## Bestaande bedrijven
- **Bakkerij Groot & Zonen**: id=`a1b2c3d4-e5f6-7890-abcd-ef1234567890`, 25 emp, Voedingsindustrie — HEEFT al volledige data
- **Technisch Bureau Veldhuis**: id=`b2c3d4e5-f6a7-8901-bcde-f12345678901`, 40 emp, Techniek — LEEG
- **Autogroep Rensen**: id=`c3d4e5f6-a7b8-9012-cdef-123456789012`, 80 emp, Automotive — LEEG

## Regels
- Alle demo data REALISTISCH — Nederlandse namen, echte producten, realistische EUR prijzen
- UUIDs: d0000002-... voor Veldhuis, d0000003-... voor Rensen (consistent patroon)
- ON CONFLICT (id) DO NOTHING op alle inserts (idempotent)
- Datums relatief aan maart 2026
- Code in het Engels, SQL comments in het Nederlands
- Lees CLAUDE.md voor alle conventies
- Run `npm run check` voor elke commit

---

## Taken

### Taak 1: Schema verificatie [done]
- Lees ALLE database/*.sql bestanden grondig
- Begrijp alle tabellen, kolommen, types, constraints
- Begrijp de bestaande seed data voor Bakkerij Groot
- Check welke product_categories en products al bestaan
- Noteer in progress.txt welke tabellen data nodig hebben per bedrijf

### Taak 2: Demo data Technisch Bureau Veldhuis [done]
Maak `database/020_demo_veldhuis.sql` met:
- **10 tickets** (mix open/in_progress/closed, alle prioriteiten):
  - CAD workstation traag, SolidWorks licentie probleem, VPN voor thuiswerkers, plotter print scheef, server backup mislukt, nieuwe medewerker onboarding, WiFi op bouwplaats, mail quota vol, Teams vergadering geluid, monitor kalibratie
- **20 hardware items** (8 laptops incl 2 CAD workstations, 6 desktops, 2 servers, 4 netwerk):
  - Mix HP ZBook (CAD), HP EliteBook, Dell PowerEdge servers, Fortinet firewall, Ubiquiti APs
  - Warranty: sommige verlopen, sommige bijna, meeste geldig
- **6 contracten** (mix active/expired):
  - Yielder Beheer Standaard, M365, AutoCAD licenties, Managed Backup, Telefonie, Server Onderhoud (verlopen)
- **5 contacten**: directeur, projectleider, administratie, senior engineer, junior engineer
- **6 licenties**: AutoCAD (10 seats), SolidWorks (5), M365 Business Standard (40), Adobe CC (5), Veeam Backup, FortiClient
- **6 notificaties** (mix types, sommige gelezen)
- **4 documenten** (handleiding, contract, whitepaper, rapport)
- **Client products**: WEL M365 + servers + firewall + laptops, GEEN endpoint protection, GEEN cloud backup, GEEN MFA → triggert kritieke aanbevelingen

### Taak 3: Demo data Autogroep Rensen [done]
Maak `database/021_demo_rensen.sql` met:
- **12 tickets** (automotive-specifiek):
  - DMS systeem crasht, kassa print geen bonnen, werkplaats tablet WiFi, camera systeem offline, werkorder app traag, nieuwe vestiging IT setup, printer showroom, email phishing poging, backup fout, Windows update werkplaats PCs, telefooncentrale storing, website down
- **30 hardware items** (veel werkplaats):
  - 10 desktops (werkplaats terminals, kassas, showroom), 8 laptops (verkoop, management), 3 servers, 5 netwerk (meerdere APs grote hal), 4 tablets/overig
  - Warranty: meer verlopen items (kostendruk automotive)
- **8 contracten** (grotere bedragen):
  - Yielder Beheer Premium, M365, DMS licentie, Managed Firewall, Camera bewaking, Telefonie, Internet zakelijk, Printer lease (verlopen)
- **6 contacten**: directeur, werkplaatschef, verkoopleider, administratie, IT-contact, receptie
- **8 licenties**: DMS (80 seats), M365 (80), Adobe CC (3), kassa software, werkplaatsplanning, camera software, Teams Rooms, website CMS
- **8 notificaties**
- **5 documenten**
- **Client products**: WEL M365 + firewall + server + DMS + camera, GEEN MDM (voor tablets!), GEEN security awareness, GEEN managed backup → andere aanbevelingen dan Veldhuis

### Taak 4: Distributor prijzen voor alle producten [done]
Maak `database/022_distributor_prices.sql`:
- Lees EERST welke products in de products tabel zitten (uit 000_complete_setup.sql)
- Voor ELK product: 2-3 distributeur prijzen (copaco, ingram, td-synnex)
- Prijzen realistisch EUR: FortiGate ~650-720, HP EliteBook ~1100-1250, servers ~3500-4500, software per seat
- Varieer 5-15% tussen distributeurs
- availability: mix in_stock (60%), limited (30%), out_of_stock (10%)
- fetched_at: NOW()

### Taak 5: Recommendation feedback data [done]
Maak `database/023_recommendation_feedback.sql`:
- Per bedrijf 15-25 feedback records
- Acties: shown (veel), clicked (sommige), contacted (weinig), purchased (heel weinig), dismissed (sommige)
- Verspreid over laatste 3 maanden
- Koppel aan bestaande product IDs uit products tabel

### Taak 6: Voer alle SQL uit [done]
- Combineer alle SQL in een master script of voer ze apart uit
- Methode: voeg onderaan elk SQL bestand een comment toe met verificatie query
- Als je geen directe DB toegang hebt: maak een `database/run-all-seeds.sql` die alles combineert
- Controleer dat alles idempotent is

### Taak 7: Verificatie [done]
- Schrijf verificatie queries onderaan progress.txt:
  - Tel records per bedrijf per tabel
  - Check dat recommendation engine data heeft
  - Check dat distributor_prices gevuld zijn

### Taak 8: Commit en push [done]
- Commit alle SQL bestanden
- Push naar `data/demo-seed` branch
- `npm run check` moet slagen
