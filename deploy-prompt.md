Je bent in /Users/bos/Documents/Yielder-Portaal/portaal-app/.

## Wat er is gebouwd

Het Yielder klantportaal (Mijn Yielder) is volledig feature-complete:
- 30 commits, 395 tests (allemaal groen), build + lint slagen
- Next.js 14 + Supabase + Tailwind + shadcn/ui
- 16 portaal pagina's (dashboard, tickets, hardware, contracten, facturen, software, supportcontracten, IT-gezondheid, prestaties, documenten, contact, shop, upgrade, admin)
- 3-laags recommendation engine (gap analysis → pattern matching → scoring)
- Learning algorithm met feedback loop
- ConnectWise sync, distributeur pricing, ScalePad client (allemaal demo mode)
- Security: rate limiting, audit logging, sanitization, CSP headers
- Realtime Supabase subscriptions
- Volledig responsive

## Jouw taak

### Stap 1: Verifieer dat alles werkt
```bash
npm run build && npm run test
```
Als iets faalt: fix het eerst.

### Stap 2: GitHub repository aanmaken en pushen
```bash
# Check of gh CLI authenticated is
gh auth status

# Maak private repo en push alles
gh repo create yielder-portaal --private --source=. --push
```

Als de repo al bestaat, push dan naar bestaande:
```bash
git remote add origin https://github.com/$(gh api user --jq .login)/yielder-portaal.git
git push -u origin main
```

### Stap 3: Vercel deployen
```bash
# Installeer Vercel CLI als nodig
npm i -g vercel

# Link project en deploy
vercel link --yes
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod
```

De Supabase keys staan in .env.local — lees die uit en stel ze in als Vercel env vars.

### Stap 4: Bevestig
- Toon de GitHub repo URL
- Toon de Vercel deployment URL
- Controleer of de site bereikbaar is

Meld alles terug als je klaar bent.
