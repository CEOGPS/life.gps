# Worker URL — dead host guard (api.lifeos1.ceogps.com)

## Symptom

Browser: **This site can't be reached** / **ERR_NAME_NOT_RESOLVED** for `api.lifeos1.ceogps.com`.

Chris is **not** opening LifeOS — that hostname has **no DNS**. LifeOS runs at **`http://localhost:5173`** (`bun run dev`) or Cloudflare Pages; API calls go to **`https://lifeos1.ceogps.workers.dev`** (or Vite-proxied `/api` in dev).

## Root cause

Legacy `.env`:

```env
VITE_WORKER_URL=https://api.lifeos1.ceogps.com
```

Vite used that for **proxy target** and **injected `import.meta.env`**, so dev and production builds pointed at a non-existent host.

## Repo fix (2026-07)

| File | Behavior |
|------|----------|
| `src/lib/workerUrlSanitize.js` | `DEAD_HOST_RE` → rewrite to `WORKER_FALLBACK` (`lifeos1.ceogps.workers.dev`) |
| `vite.config.js` | `workerUrlForApp = effectiveWorkerUrl(env.VITE_WORKER_URL)` for `define` + `/api` proxy |
| `src/lib/workerConfig.js` | `getWorkerUrl()` uses `effectiveWorkerUrl` in production |

Sanitize does **not** replace user's `.env` on disk — Chris should still edit `.env` for clarity.

## Correct `.env`

```env
VITE_WORKER_URL=https://lifeos1.ceogps.workers.dev
```

Optional (only if DNS works):

```env
# VITE_OAUTH_WORKER_URL=https://oauth.ceogps.com
```

## Verify

```bash
cd C:/dev/LifeOS1
bun run dev
# Browser: localhost:5173 → Integrations → worker banner "Online"
curl -s https://lifeos1.ceogps.workers.dev/api/oauth/status
```