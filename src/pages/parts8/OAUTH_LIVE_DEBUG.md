# OAuth live debug (LifeOS1)

## What we found (2026-07-14)

| Host | Result |
|------|--------|
| `https://lifeos1.ceogps.workers.dev` | **Works** — `/api/oauth/start` → 302 to Google |
| `https://oauth.ceogps.com` | DNS **does not resolve** (from dev machine) |
| `https://api.lifeos1.ceogps.com` | DNS **does not resolve** |

**Frontend default** (after fix): `VITE_WORKER_URL=https://lifeos1.ceogps.workers.dev`

## Live probe

```bash
node scripts/oauth-live-debug.mjs
# or
node scripts/oauth-live-debug.mjs https://lifeos1.ceogps.workers.dev
```

## Google Cloud Console (required)

Authorized redirect URIs (must match worker `getProviderConfig`):

- `https://lifeos1.ceogps.workers.dev/api/oauth/callback`
- When `oauth.ceogps.com` DNS is live: `https://oauth.ceogps.com/api/oauth/callback` (Meta/IG/TikTok)

## Cloudflare Worker secrets (Wrangler)

```bash
cd workers   # or wherever wrangler.toml lives
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put SUPABASE_SERVICE_KEY   # fixes /api/oauth/status garbage JSON
```

## Deploy (critical)

`wrangler.json` **main** is `workers/index.js` (was `worker/index.js` — that path was missing in repo, so Cloudflare was running a stale bundle).

```bash
cd C:\dev\LifeOS1
bun run deploy:worker
bun run build && bun run deploy
```

Frontend `.env`:

```env
VITE_WORKER_URL=https://lifeos1.ceogps.workers.dev
VITE_OAUTH_WORKER_URL=https://oauth.ceogps.com
```

Same worker serves both; `oauth.ceogps.com` is in `wrangler.json` custom routes.

## Connect flow (user)

1. LifeOS → **Integrations** → **Gmail** (or YouTube) → **Connect**
2. Popup opens worker `/api/oauth/start?provider=google&user_id=…`
3. Approve Google → callback on **workers.dev** → `postMessage(oauth_success)` → popup closes
4. Allow **popups** for your LifeOS origin

## UI debug strip

Integrations panel shows green/red **OAuth worker** line with HTTP status and whether `connected` is a proper array.

## If token exchange fails

Read the error HTML in the popup. Common causes:

- Redirect URI mismatch in Google console
- Wrong `GOOGLE_CLIENT_SECRET`
- `SUPABASE_SERVICE_KEY` missing (tokens may not persist to DB; KV flag may still show connected)