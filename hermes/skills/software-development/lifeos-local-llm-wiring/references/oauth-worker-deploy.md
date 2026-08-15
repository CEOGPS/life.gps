# LifeOS1 — Cloudflare Worker OAuth & deploy

Session-derived runbook for **Integrations / Gmail / social OAuth** on `lifeos1` worker.

## Source of truth

| File | Role |
|------|------|
| `workers/index.js` | **Only** worker entry to edit |
| `wrangler.json` | `"main": "workers/index.js"` (not `worker/index.js`) |
| `src/lib/workerConfig.js` | `getWorkerUrl()`, `getOAuthWorkerUrl()`, `workerApi()` |
| `src/components/lifeos/panels/IntegrationsPanel.jsx` | Minimal panel — see `references/integrations-panel-rebuild.md` |
| `Docs/OAUTH_LIVE_DEBUG.md` | Secrets checklist, user connect flow |
| `scripts/oauth-live-debug.mjs` | Probe status/start/CORS |

**Do not** maintain a separate paste in Cloudflare Dashboard — `wrangler deploy` overwrites it.

## Deploy

```bash
cd C:/dev/LifeOS1
bun run deploy:worker    # npx wrangler deploy
bun run build && bun run deploy   # Pages frontend
```

After deploy, probe:

```bash
node scripts/oauth-live-debug.mjs https://lifeos1.ceogps.workers.dev
node scripts/oauth-live-debug.mjs https://oauth.ceogps.com
```

**Good:** `/api/oauth/status` → `{"connected":[]}` or array of `{platform,email,name}`.

**Bad:** `"connected":{"message":"Invalid API key"}` — old worker or broken `handleOAuthStatus`.

## Frontend `.env`

```env
VITE_WORKER_URL=https://lifeos1.ceogps.workers.dev
# VITE_OAUTH_WORKER_URL=https://oauth.ceogps.com   # optional; comment out if Failed to fetch
```

Same worker; `oauth.ceogps.com` is `wrangler.json` custom domain route. Do **not** default to `api.lifeos1.ceogps.com` (may not resolve).

## Local dev (Vite)

- DEV: `getWorkerUrl()` → `""`; fetches use `/api/...` on localhost (Vite proxy).
- Order in `vite.config.js`: **`/api/hermes` before `/api`**.
- Test with **`bun run dev`**; **`bun run build`** does not serve pages.

## Wrangler secrets (not in git)

```bash
wrangler secret put SUPABASE_SERVICE_KEY   # service_role — platform_tokens
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
# + META_*, TWITTER_*, etc. per provider
```

Invalid/missing `SUPABASE_SERVICE_KEY`: status should still return **`connected: []`** (KV fallback), not error JSON inside `connected`.

## Worker code invariants (regressions to avoid)

1. **`supabase()`** — return `null` on HTTP error or PostgREST `{message,hint,code}`; never pass that object into `connected`.
2. **`handleOAuthStatus`** — `connected` is always an **array**; KV fallback from `oauth_*` keys when Supabase empty.
3. **OAuth callback** — KV must store **`access_token`**, `refresh_token`, `expires_at` (not only `{connected, identity}`).
4. **`POST /api/oauth/start`** — Integrations panel uses POST + JSON body; GET must also work.
5. **No top-level `env`** — module-scope code like `const X = env.FOO` fails Cloudflare validation (`ReferenceError: env is not defined`). Keep all `env` use inside `fetch` handler.

## Google OAuth Console

Redirect URI must include:

`https://lifeos1.ceogps.workers.dev/api/oauth/callback`

If using `oauth.ceogps.com` for start popups, add that host’s callback too if redirect_uri is switched.

## User connect flow

1. Integrations → provider → Connect (popups allowed).
2. Popup → provider login → callback HTML → `postMessage` → parent reloads status.
3. If popup blocked: allow popups for dashboard origin.

## Duplicate case warning

`workers/index.js` may log esbuild `duplicate-case` for `mailchimp` — non-fatal; clean when touching that switch.