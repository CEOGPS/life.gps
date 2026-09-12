# LifeOS1 — Carry-Forward Brief (updated 2026-08-11, LIVE-VERIFIED)

Read `Docs/LifeOS_Dashboard_Audit.md` first. This brief is the handoff from the
chat that finished the Profile/Settings topbar work AND ran a full live audit.

## Source of truth
- CWD: `D:/dev/lifeos1.agentzero` (React/Vite frontend, Supabase, Cloudflare
  Worker, Hermes runtime). **The local folder is authoritative — NOT git**
  (git repo is corrupt: `git status` → `bad revision`; bypass deploys with
  `npx wrangler pages deploy dist`).
- Live deployed app: `https://lifeos1.pages.dev/` (reachable; this audit
  compared source + local `:5199` dev server + live DOM). `ceogps.com` is the
  separate Brilliant-Directories marketing site, not the dashboard.

## SHIPPED THIS SESSION (2026-08-11, build+lint green, browser-verified)
- **Phone auto-format** `(###) ###-####`: new shared `src/lib/phone.ts`
  (`formatPhone`, `formatPhoneForInput`, `formatPhoneList`) wired into Family
  (edit + card display) and Topbar Profile phone textarea. Contacts+CRM already
  had their own copies.
- **Integrations panel rebuilt** (`src/pages/integrations/page.tsx` component
  tail): multi-account credentials (persisted at `integrations_data` via
  `usePersistentState`), masked API-key storage, **email-first OAuth**
  (`CONNECT` disabled until account email entered → hits worker
  `/api/oauth/start?provider=&account_email=`), pending→connected status check
  (`/api/oauth/status`), and live pulls for Gmail/Outlook/Proton/Nylas/Stripe/
  Cloudflare/YouTube (`SYNC_ROUTES` → worker real endpoints). Kept all theme/
  layout, search, and category filters unchanged.
- **Supabase migration** written: `supabase/migrations/0001_create_user_settings.sql`
  (matches `src/lib/storage.ts`; permissive RLS for the Firebase-authed anon
  client). NOT yet applied — run in SQL editor for project `mhvcdstgkyplhzjptgfr`.

## Cloudflare worker audit (2026-08-11)
- Authenticated (read access verified) to CEO GPS account. Workers mapped:
  `lifeos1` (`lifeos1.ceogps.workers.dev`, the repo `worker/index.js` target),
  `lifeos1-api` (`lifeos1-api.ceogps.workers.dev` — correctly provisioned: KV,
  R2, AI, VITE_SUPABASE_*), `lifeos-gateway` (minimal), plus maildevil/webdevil.
- `lifeos1` worker is MISSING bindings (KV `LIFEOS_KV`, R2 `LIFEOS_UPLOADS`,
  `ASSETS`, `AI`) and several keys; ~8 required key VALUES are not in the repo.
  User is updating `.env` to supply them — reconcile code↔config names
  (e.g. `X_BEARER_TOKEN` vs `TWITTER_BEARER_TOKEN`) when that lands.
- `CLOUDFLARE_WORKER_URL`/`VITE_WORKER_URL` → the app calls the backend at
  `https://api.lifeos1.ceogps.com`.

## LIVE-VERIFIED as DONE (both local build and deployed site reflect these)
1. **Navigation restructure** — AI Academy removed; Events folded into Calendar
   (`/events`→CalendarPanel); Opportunity→Community; LifeRPG/Karma/Conflict→
   Simulators; Legal (`/legal`,`/privacy`) is SEPARATE from Secure Vault
   (`/vault`); Insight Engine present in sidebar. Confirmed on live DOM.
2. **Logo + banner** uploadable (topbar logo div is a click-to-upload; live).
3. **Live crypto/stock** — `MarketTicker.tsx` (real CoinGecko + Yahoo, 60s
   refresh) is mounted at Finance `page.tsx:117`; "LIVE MARKETS" confirmed
   rendering live (BTC/ETH/SOL/ADA prices). Stocks feed may occasionally fail;
   crypto is live.
4. **Phone auto-format `(###) ###-####`** — implemented in `ContactsPanel.jsx`
   (`formatPhone`/`formatPhoneForInput`) AND `CRMPanel.jsx`.
5. **CreatorOS1** — re-scoped to 4 studios (Image/Video/Writing/Voiceover);
   NO AI Matchmaker, NO AI Insights in Creator.
6. **Profile** multi-value fields (newline-stored textareas) + avatar upload +
   SAVE + Settings→`/integrations` + logo — `Topbar.tsx` (build green).
7. **Persistence code** — `src/lib/storage.ts` is local-first (instant
   localStorage write, background Supabase sync); `lifeos_supabase_` prefix.

## The recurring "changes don't show / still not done" verdict
The deployed site ALREADY reflects all of the above. If the user still reports
"AI Academy there / Events not moved / Legal-Vault merged / Simulators empty /
crypto missing / matchmaker in Creator", they are on a **cached/old tab or a
stale recollection** — do NOT rebuild. Have them hard-refresh `Ctrl+Shift+R` or
open `https://lifeos1.pages.dev` in incognito. Verify source-vs-live with the
DOM (browser_console on the live URL), not by assumption.

## Genuine remaining gaps (real build work — do not deploy fresh until addressed)
1. **Phone auto-format extension** — only Contacts+CRM have it. Add the
   `formatPhone`/`formatPhoneForInput` treatment to Profile, Family, Integrations,
   and any other phone inputs.
2. **Restore full field sets** — audit: Contacts "missing many fields that used
   to be there", Family fields missing, Health "restore old features". Pull the
   REAL prior field sets from `archive/` + sibling panels (do not invent).
3. **Insight Engine** — currently a `PlaceholderPanel` (route `/insights`); build.
4. **Life Audit (Pulse)** — currently a `PlaceholderPanel` (route `/pulse`); build.
5. **Integrations** — real OAuth + multiple API keys (multiple email accounts) +
   live data pulls. Flow: add email BEFORE OAuth (or choose in flow). Reference
   Hermes connect logic.
6. **Media ingest** — Media panel can't add media yet.
7. **Terminals** — better terminal selection; VS Code integration likely easiest.
8. **Finance AI-insight** — the "AI Market Insight" card in MarketTicker is
   placeholder TEXT ("Wire the AI backend here"); no real generator yet.
9. **ErebusDock redesign** — an avatar window already exists (eyes follow cursor,
   mouth animates on "speaking") but user wants the visual overhaul (the ONE
   allowed appearance change).

## PERSISTENCE / DATA-LOSS root cause (the "all my info + banner are gone")
- Code is local-first, so NEW data persists on whatever origin you use.
- BUT remote sync CANNOT succeed: `user_settings` Supabase table is NOT
  provisioned (no migration found anywhere) AND `VITE_SUPABASE_URL` is NOT in
  `.env` (only VITE_REPLICATE/ELEVENLABS/STABILITY are set). So data lives only
  in localStorage on the single origin where it was entered.
- Switching shells/origins → new empty origin → banner + entered data gone.
- **Fix**: create migration for `user_settings (key text pk, value jsonb,
  updated_at timestamptz)`; set `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
  (Cloudflare Pages env); consider a one-time import of old `lifeos_supabase_*`
  localStorage keys from the previous origin.

### Supabase provisioning — DONE (2026-08-11)
- Written: `supabase/migrations/0001_create_user_settings.sql` (matches
  `src/lib/storage.ts` exactly: `key text pk`, `value jsonb`, `updated_at
  timestamptz`, plus updated_at trigger, anon/authenticated/service_role
  grants, and RLS permissive policy — the app auths with FIREBASE, not Supabase,
  so anon-key RLS must be permissive or every sync silently fails).
- Target project = `mhvcdstgkyplhzjptgfr.supabase.co` (confirmed: `VITE_SUPABASE_URL`,
  `SUPABASE_URL`, and the hardcoded client fallback ALL point to this ref).
  The other `cbyhwlwkreuclsrzxlcx` ref is legacy; ignore.
- **APPLY STEP (manual, user)**: paste `0001_create_user_settings.sql` into the
  Supabase SQL editor for project `mhvcdstgkyplhzjptgfr` and Run. Agent cannot
  auto-apply: no pg/psql/CLI installed, and the only connection string on hand
  points to a DIFFERENT project (`db.syktlhkdroxwdahzflri.supabase.co`) — do NOT
  run DDL through it (wrong DB).
- **Config smell**: the `SUPABASE_DATABASE_URL_API` / `DATABASE_URL` connection
  string targets project `syktlhkdroxwdahzflri`, which MISMATCHES the app's
  client project `mhvcdstgkyplhzjptgfr`. Backend workers using that conn string
  hit a different DB than the frontend. Reconcile.
- RLS is intentionally open (single-user personal instance). Tighten per-user
  later if multi-tenant.

## Rules (never violate)
- NO theme/appearance changes — layout/text only. ONLY exception: ErebusDock redesign.
- Don't deploy until the whole genuine-gap list above is wired.
- Verify source-vs-live before claiming done (this doc + DOM check, not assumption).
- Full, un-abbreviated code. No placeholders.
