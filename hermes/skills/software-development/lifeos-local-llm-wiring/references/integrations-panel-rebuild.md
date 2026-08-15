# IntegrationsPanel — rebuild from scratch (2026-07)

Use when **Integrations white-screens**, **Failed to fetch**, **Nylas worker 500 on load**, or Chris says **stop patching — nuke and rebuild**.

## White screen root cause (historical)

`IntegrationsPanel.jsx` had **invalid JS** at module load:

```js
apiKey: *** || "",  // syntax error — entire panel fails to import
```

Any parse error in a default-imported panel → **blank route** with no React error boundary.

**Rule:** After visual/integration edits, run `bun run build` before claiming the panel ships.

## Rebuild strategy (Chris preference)

When a panel is **>1k lines**, mixes OAuth verify + Nylas threads + react-query + localStorage account matrix, and **never worked reliably**:

1. **Replace file** with a **single ~300-line** panel — do not incremental-fix for days.
2. **One worker base:** `resolveWorkerUrl()` + `workerApi()` from `src/lib/workerConfig.js`.
3. **No Nylas inbox fetch on mount** — only `POST /api/nylas/store-grant` when user submits email + grant ID (avoids 500 from bad grants).
4. **No client PKCE** — worker owns `oauth_state:*` in KV; popup is GET `/api/oauth/start?provider=&user_id=&scope=`.
5. **Status:** `GET /api/oauth/status` + `/api/oauth/status/all` + `/api/keys/status-all` on load and after `oauth_success` postMessage.

## Current panel location

- `src/components/lifeos/panels/IntegrationsPanel.jsx`
- Routed: `LifeOSShell.jsx` `case "integrations"`
- Embedded: `SettingsPanel.jsx` tab `integrations`

## Dev vs prod URLs

| Mode | Worker calls |
|------|----------------|
| `bun run dev` | Relative `/api/...` → Vite proxy in `vite.config.js` → `VITE_WORKER_URL` or `https://lifeos1.ceogps.workers.dev` |
| Production build | Full URL from `getWorkerUrl()` / `getOAuthWorkerUrl()` |

**Dead hostname — never default in src:**

- `https://api.lifeos1.ceogps.com` (DNS NXDOMAIN in session)

**`.env` (Chris):**

```env
VITE_WORKER_URL=https://lifeos1.ceogps.workers.dev
# VITE_OAUTH_WORKER_URL=https://oauth.ceogps.com   # only if DNS works everywhere
```

## `bun run build` ≠ serve

Chris symptom **“can’t reach this page”** after build: **`build` only writes `dist/`**. Use **`bun run dev`** (5173) or **`bun run preview`** (4173).

## Worker endpoints the panel uses

| Action | Endpoint |
|--------|----------|
| OAuth connect | Popup → `/api/oauth/start` |
| OAuth disconnect | `POST /api/oauth/disconnect?provider=&user_id=` |
| Keys | `POST /api/keys/store` `{ service, key }` |
| Nylas | `POST /api/nylas/store-grant` `{ email, grant_id }` |
| Model pref | `setPreferredModel` → worker `/api/llm/preference` (ceogpsclient) |

## Verify

```bash
cd C:/dev/LifeOS1
bun run build
bun run dev
# Integrations route → header shows worker online/offline
```

Probe worker without UI:

```bash
node scripts/oauth-live-debug.mjs https://lifeos1.ceogps.workers.dev
```

See also: `references/oauth-worker-deploy.md` in **lifeos-local-llm-wiring**.