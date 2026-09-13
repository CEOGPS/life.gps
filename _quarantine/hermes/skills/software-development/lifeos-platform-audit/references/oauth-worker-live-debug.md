# LifeOS1 OAuth worker — live debug (session 2026-07-14)

## Canonical worker (when custom DNS is down)

- **Working:** `https://lifeos1.ceogps.workers.dev`
- **Often broken from dev:** `oauth.ceogps.com`, `api.lifeos1.ceogps.com` (DNS not resolving)
- **Frontend:** `src/lib/workerConfig.js` — default `VITE_WORKER_URL` → workers.dev; optional `VITE_OAUTH_WORKER_URL` for Meta/TikTok owned callback host.

## Probe (repo)

```bash
node scripts/oauth-live-debug.mjs
node scripts/oauth-live-debug.mjs https://lifeos1.ceogps.workers.dev
```

Expect: `/api/oauth/start?provider=google` → **302**; `/api/oauth/status` → `{ "connected": [] }` **array**, not Supabase error object.

## Production failure signature

```json
{"connected":{"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}}
```

**Cause:** `SUPABASE_SERVICE_KEY` missing/wrong on Cloudflare Worker; `handleOAuthStatus` used to pass error JSON as `connected`.

**Fix (workers/index.js):** Only push rows when `Array.isArray(data)`; else KV fallback from `oauth_${provider}` / `oauth_index_${provider}`. **Redeploy worker** — Pages deploy alone does not update OAuth.

## Wrangler secrets

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SUPABASE_SERVICE_KEY` (service role, same project as dashboard Supabase)

## Google redirect URI

Must match `getProviderConfig` in `workers/index.js`:

- `https://lifeos1.ceogps.workers.dev/api/oauth/callback`
- When DNS live: `https://oauth.ceogps.com/api/oauth/callback` (FB/IG/TikTok use `ownedRedirect`)

## Integrations panel (rebuilt)

**File:** `src/components/lifeos/panels/IntegrationsPanel.jsx` — minimal OAuth + keys + manual Nylas grant.

- Popup GET `/api/oauth/start`; worker PKCE in KV (no client sessionStorage PKCE).
- **`resolveWorkerUrl()`** + Vite `/api` proxy in dev.
- **No** `/api/nylas/threads` on mount (avoids worker 500).
- **White screen:** invalid JS in panel module (historical syntax corruption) — run **`bun run build`**.
- Chris workflow: if panel never worked after many patches → **replace file**, don’t endless-fix.

Detail: **`lifeos-local-llm-wiring`** → `references/integrations-panel-rebuild.md`.

## Docs in repo

`Docs/OAUTH_LIVE_DEBUG.md` — operator runbook.