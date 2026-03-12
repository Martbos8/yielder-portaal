# Migration Plan: Replace Next.js Frontend with Static HTML Dashboard

## Goal

Serve `mijn-yielder-dashboard.html` as the main frontend while keeping the Next.js backend (API routes, cron, auth callback, middleware) fully operational.

---

## Current State

### Next.js Frontend Pages (to be removed/replaced)
- `src/app/page.tsx` — root redirect to /dashboard
- `src/app/login/` — login page + layout
- `src/app/(portal)/` — all authenticated pages: dashboard, tickets, hardware, contracten, facturen, software, contact, admin, documenten, it-gezondheid, prestaties, shop, supportcontracten, upgrade
- `src/app/not-found.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`
- `src/app/layout.tsx`, `src/app/globals.css`
- `src/components/` — sidebar, header, portal-shell, all UI components

### Backend Routes (MUST KEEP)
- `src/app/api/cron/route.ts` — Vercel Cron job dispatcher (secret auth)
- `src/app/api/sync/connectwise/route.ts` — ConnectWise sync trigger (secret auth)
- `src/app/api/webhooks/connectwise/route.ts` — CW webhook receiver (secret auth)
- `src/app/auth/callback/route.ts` — Supabase auth code exchange

### Middleware (`src/middleware.ts`)
- Applies security headers, CORS, rate limiting to all routes
- `src/lib/supabase/middleware.ts` — redirects unauthenticated users to /login, redirects authenticated users from /login to /dashboard
- Matcher excludes static files: `_next/static`, `_next/image`, `favicon.ico`, images

### Public Assets
- `public/yielder-logo.png`
- `public/yielder-monogram.png`

### Next.js Config (`next.config.mjs`)
- Custom security headers (X-Frame-Options, CSP, etc.)
- CSP allows: `fonts.googleapis.com`, `fonts.gstatic.com`, `*.supabase.co`, inline scripts/styles

---

## HTML Dashboard Analysis

### External Dependencies (loaded via CDN, no action needed)
- Tailwind CSS via `cdn.tailwindcss.com` (with forms + container-queries plugins)
- Chart.js v4 via `cdn.jsdelivr.net`
- Supabase JS v2 via `cdn.jsdelivr.net`
- Google Fonts: Material Symbols Outlined, Inter

### Supabase Connection
- Same project: `aumbbaozmqqgyjhcwzff.supabase.co`
- Same anon key (hardcoded in HTML)
- HTML handles its own auth (magic link login, session management, redirects)

### Local Asset Files Referenced (relative paths from HTML location)

**Root-level images (copy from `/Users/bos/Documents/Yielder-Portaal/`):**
- `yielder-monogram.png` (already in public/)
- `headshot-juan.png`
- `headshot-kwint.jpeg`
- `headshot-derk.png`
- `headshot-kevin.png`
- `headshot-mart.png`
- `headshot-robert.jpeg`
- `headshot-rene.png`
- `hogere resolutie.jpg` (referenced as `hogere%20resolutie.jpg`)
- `Over_ons_04.jpg`
- `AI foto Yielder.jpg` (NOT FOUND in source directory — broken reference or missing file)

**`partner-logos/` directory (11 files):**
- `Microsoft_logo_2012.svg.png`, `kpn.svg`, `cisco.png`, `fortinet.png`, `samsung.png`, `hpe.png`, `apple.png`, `vmware.png`, `watchguard.png`, `vodafone.png`, `odido.png`

**`vendor-icons/` directory (4 files referenced):**
- `hp.png`, `sophos.png`, `zoom.png`, `microsoft.png`

**`vendor-logos/` directory (12 files referenced):**
- `anthropic-logo.png`, `openai-logo.png`, `google-gemini-logo.png`, `copilot-icon.svg`, `claude-symbol.svg`, `chatgpt-icon.svg`, `google-gemini.svg`, `anthropic.svg`, `openai.svg`, `google.svg`, `microsoft.svg`

**External images (loaded via URL, no action needed):**
- icecat.biz product images
- logitech.com product images
- jabra.com product images
- microsoft.com Copilot icon
- apple CDN iPad image
- wikipedia/worldvectorlogo brand logos

---

## Step-by-Step Migration Plan

### Step 1: Copy the HTML file into `public/`

```bash
cp /Users/bos/Documents/Yielder-Portaal/mijn-yielder-dashboard.html \
   /Users/bos/Documents/Yielder-Portaal/ralph-fullstack/public/index.html
```

Next.js serves `public/index.html` for requests that don't match any app route, but there is a catch: the App Router's `page.tsx` at `/` takes priority over `public/index.html`. This conflict is addressed in Step 4.

### Step 2: Copy all local asset files into `public/`

```bash
# Root-level images
cp /Users/bos/Documents/Yielder-Portaal/yielder-monogram.png \
   /Users/bos/Documents/Yielder-Portaal/headshot-juan.png \
   /Users/bos/Documents/Yielder-Portaal/headshot-kwint.jpeg \
   /Users/bos/Documents/Yielder-Portaal/headshot-derk.png \
   /Users/bos/Documents/Yielder-Portaal/headshot-kevin.png \
   /Users/bos/Documents/Yielder-Portaal/headshot-mart.png \
   /Users/bos/Documents/Yielder-Portaal/headshot-robert.jpeg \
   /Users/bos/Documents/Yielder-Portaal/headshot-rene.png \
   "/Users/bos/Documents/Yielder-Portaal/hogere resolutie.jpg" \
   /Users/bos/Documents/Yielder-Portaal/Over_ons_04.jpg \
   /Users/bos/Documents/Yielder-Portaal/ralph-fullstack/public/

# Directory assets
cp -r /Users/bos/Documents/Yielder-Portaal/partner-logos \
      /Users/bos/Documents/Yielder-Portaal/ralph-fullstack/public/
cp -r /Users/bos/Documents/Yielder-Portaal/vendor-icons \
      /Users/bos/Documents/Yielder-Portaal/ralph-fullstack/public/
cp -r /Users/bos/Documents/Yielder-Portaal/vendor-logos \
      /Users/bos/Documents/Yielder-Portaal/ralph-fullstack/public/
```

**Note:** `AI foto Yielder.jpg` does not exist at the source path. Either locate it or accept the broken image reference (it already does not work in the original HTML).

### Step 3: Remove Next.js frontend pages

Delete the following (frontend-only, not needed for backend):

```
src/app/page.tsx                    # Root redirect (conflicts with index.html)
src/app/login/                      # Login page (HTML has its own)
src/app/(portal)/                   # ALL portal pages
src/app/not-found.tsx               # Custom 404
src/app/globals.css                 # Tailwind/global styles
src/app/robots.ts                   # Robots.txt generator
src/app/sitemap.ts                  # Sitemap generator
src/app/favicon.ico                 # Move to public/ if not already there
```

**KEEP these:**
```
src/app/layout.tsx                  # Required by Next.js (simplify to bare minimum)
src/app/api/cron/route.ts
src/app/api/sync/connectwise/route.ts
src/app/api/webhooks/connectwise/route.ts
src/app/auth/callback/route.ts
```

### Step 4: Simplify `src/app/layout.tsx`

Replace the current root layout with a bare-minimum version. Next.js requires `layout.tsx` to exist. Make it as minimal as possible:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
```

Remove all imports of globals.css, fonts, providers, etc.

### Step 5: Create a catch-all route to serve `index.html`

Since removing `page.tsx` means `/` has no Next.js page, and `public/index.html` should be served, there are two approaches:

**Option A (Recommended): Rewrite in `next.config.mjs`**

Add a rewrite rule so all non-API, non-auth, non-_next requests serve `index.html`:

```js
const nextConfig = {
  async rewrites() {
    return [
      {
        // Catch all frontend routes — serve the static HTML
        source: '/:path((?!api|auth|_next).*)',
        destination: '/index.html',
      },
    ];
  },
  async headers() {
    // ... keep existing security headers, but update CSP (see Step 6)
  },
};
```

**Option B: Create a catch-all page that reads and serves the HTML**

Create `src/app/[[...slug]]/page.tsx` that serves the HTML. This is more complex and less clean than Option A.

**Recommendation:** Use Option A. The rewrite approach means Next.js serves the static file from `public/` without needing any React components.

### Step 6: Update Content Security Policy in `next.config.mjs`

The current CSP is too restrictive for the HTML dashboard. Update it to allow:

- `script-src`: add `https://cdn.tailwindcss.com https://cdn.jsdelivr.net` (Tailwind CDN, Chart.js, Supabase JS)
- `style-src`: keep `https://fonts.googleapis.com`, add `https://cdn.tailwindcss.com`
- `font-src`: keep `https://fonts.gstatic.com`
- `img-src`: add `https://images.icecat.biz https://resource.logitech.com https://www.jabra.com https://adoption.microsoft.com https://cdsassets.apple.com https://upload.wikimedia.org https://cdn.worldvectorlogo.com` (product images + brand logos)
- `connect-src`: keep `https://*.supabase.co wss://*.supabase.co`

Alternatively, since the HTML is a self-contained trusted file, consider relaxing CSP significantly or removing it for the root path while keeping strict CSP for API routes only.

### Step 7: Update Middleware

The current middleware at `src/middleware.ts` does two things that conflict with the static HTML approach:

1. **Auth redirects** (`src/lib/supabase/middleware.ts`): Redirects unauthenticated users to `/login` and authenticated users from `/` to `/dashboard`. The HTML handles its own auth, so these redirects will fight with the HTML's built-in auth flow.

2. **Security headers / rate limiting**: These are fine to keep for API routes.

**Changes needed in `src/lib/supabase/middleware.ts`:**
- Remove or skip the auth redirect logic for non-API routes. The HTML file manages its own auth state via the Supabase JS client.
- Keep auth session refresh for API routes (cookie refresh matters for `auth/callback`).

**Simplest approach:** Update the middleware matcher to only run on API and auth routes:

```ts
export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*',
  ],
};
```

This way, the static HTML is served without any middleware interference, while API routes still get security headers, CORS, rate limiting, and auth.

### Step 8: Handle the `auth/callback` redirect

The current `src/app/auth/callback/route.ts` redirects to `/dashboard` after successful auth. Since the HTML dashboard does not have a `/dashboard` URL path (it uses client-side page switching), update the redirect target to `/` (which will serve `index.html`):

```ts
const next = searchParams.get("next") ?? "/";
```

However, check whether the HTML dashboard even uses the server-side auth callback flow. If the HTML uses `supabase.auth.signInWithOtp()` and handles the token client-side, the callback route may not be needed. But keep it for safety — magic link flows can use either approach.

### Step 9: Clean up unused source files (optional but recommended)

After removing frontend pages, many source files become dead code:

- `src/components/` — sidebar, header, portal-shell, icon, all UI components
- `src/lib/queries.ts` — server-side data fetching
- `src/types/database.ts` — may still be used by API routes, check first
- `src/lib/supabase/client.ts` — browser Supabase client (not used by API routes)
- `src/lib/supabase/server.ts` — KEEP (used by auth/callback and API middleware)

Do NOT remove:
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/api/middleware.ts`
- `src/lib/errors.ts`, `src/lib/logger.ts`, `src/lib/rate-limit.ts`
- `src/lib/middleware.ts` (security headers, CORS, rate limiting helpers)
- `src/lib/jobs/` — all job runners
- `src/lib/connectwise/` — sync logic
- `src/lib/repositories/` — data access used by API routes

### Step 10: Update `.gitignore` if needed

The new image assets (headshots, partner logos, vendor icons/logos) are binary files going into `public/`. Make sure they are tracked by git (they should be by default since `public/` is not in `.gitignore`).

Consider whether you want to commit ~30+ image files to git or use an alternative (Supabase Storage, CDN). For simplicity, committing to `public/` is fine.

### Step 11: Update `package.json` scripts and dependencies

- Run `npm run build` to verify the stripped-down app still builds
- Run `npm run lint` — fix any lint errors from removed imports
- Run `npm run test` — some tests may reference removed components; update or remove those tests

**Dependencies that may become removable:**
- `@supabase/ssr` — still needed for server-side auth in middleware and auth/callback
- shadcn/ui dependencies (`@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`) — no longer needed if all UI components are removed
- `tailwindcss`, `postcss`, `autoprefixer` — no longer needed for Next.js CSS processing (HTML uses CDN Tailwind)

Removing unused deps is optional but keeps the project clean.

---

## Deployment Considerations (Vercel)

1. **Static file serving:** Vercel serves files from `public/` at the root path. `public/index.html` will be served at `/`. The rewrite in `next.config.mjs` ensures all frontend paths also resolve to `index.html`.

2. **API routes stay serverless:** `/api/cron`, `/api/sync/connectwise`, `/api/webhooks/connectwise` continue to work as Vercel Serverless Functions.

3. **Auth callback stays serverless:** `/auth/callback` continues to work.

4. **Vercel Cron:** The `vercel.json` cron configuration (if any) does not need changes since the `/api/cron` endpoint is unchanged.

5. **Environment variables:** No changes needed. The HTML uses the same Supabase project with hardcoded credentials (anon key is public, this is fine).

6. **Build output:** The build will be much smaller since there are no React pages to SSR/SSG. Only the API routes and middleware are compiled.

7. **Edge middleware:** If the middleware matcher is narrowed to API/auth routes only, it will not run on static file requests, which improves latency for the main HTML page.

8. **File size:** The HTML file is ~538KB (7838 lines). This is served as a static file, so Vercel's CDN will cache and compress it. No performance concerns.

---

## Summary of Changes

| What | Action |
|------|--------|
| `public/index.html` | ADD (copy from mijn-yielder-dashboard.html) |
| `public/` assets | ADD (~30 images + 3 asset directories) |
| `src/app/page.tsx` | DELETE |
| `src/app/login/` | DELETE |
| `src/app/(portal)/` | DELETE |
| `src/app/not-found.tsx` | DELETE |
| `src/app/globals.css` | DELETE |
| `src/app/robots.ts` | DELETE (or keep if SEO matters) |
| `src/app/sitemap.ts` | DELETE (or keep if SEO matters) |
| `src/app/layout.tsx` | SIMPLIFY to bare minimum |
| `src/app/api/**` | KEEP (no changes) |
| `src/app/auth/callback/` | KEEP (change default redirect from /dashboard to /) |
| `src/middleware.ts` | UPDATE matcher to API/auth routes only |
| `next.config.mjs` | ADD rewrite rule, UPDATE CSP headers |
| `src/components/` | DELETE (dead code) |
| Tests referencing UI | UPDATE or DELETE |

---

## Risk Checklist

- [ ] Verify `public/index.html` is served at `/` after removing `src/app/page.tsx`
- [ ] Verify API routes still respond correctly (test `/api/cron` with secret header)
- [ ] Verify auth callback flow works end-to-end (magic link -> callback -> redirect to `/`)
- [ ] Verify all local images load correctly from `public/`
- [ ] Verify CDN resources (Tailwind, Chart.js, Supabase JS, fonts) load with updated CSP
- [ ] Verify middleware does NOT interfere with static HTML serving
- [ ] Verify `npm run build` passes
- [ ] Test on Vercel preview deployment before merging
