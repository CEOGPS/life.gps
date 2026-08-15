# Google Cloud — OAuth client **LifeOS1** (CEO GPS)

Project context from repo docs: `careful-span-485509-a0`. Client name in console: **LifeOS1**.

## What the worker sends to Google

From `workers/index.js` → `getProviderConfig` → `google.redirect_uri` = **`ownedRedirect`**:

```text
https://oauth.ceogps.com/api/oauth/callback
```

Token exchange uses the **same** `redirect_uri` string (no `?provider=google` in current code).

## Authorized redirect URIs

Add **both** (exact strings):

```text
https://oauth.ceogps.com/api/oauth/callback
https://lifeos1.ceogps.workers.dev/api/oauth/callback
```

A line **without** the path-only host is insufficient if Google requires exact match. Lines with `?provider=google` are **not** required unless the worker is changed to append that query on `redirect_uri`.

## Authorized JavaScript origins

Chris had (keep):

- `https://lifeos1.pages.dev`
- `https://oauth.ceogps.com`
- `https://ceogps.com`

**Add for local dev:**

- `http://localhost:5173`
- `https://lifeos1.ceogps.workers.dev`

## Consent screen & APIs

- **Testing:** add Chris Google account under Test users, or publish app.
- Enable: **Gmail API**, **Google Calendar API**, **YouTube Data API v3** (tiles used in Integrations Hub).

## Wrangler secrets (not Google Console)

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

Must match this OAuth client.

## User test path

1. `bun run dev` → `http://localhost:5173` → **Integrations** (sidebar) or **Settings → Integrations**.
2. **Gmail** → **Connect** (popups allowed).
3. Failure `redirect_uri_mismatch` → compare Google redirect list to strings above; wait ~5 min after save.

## Related

- `references/oauth-worker-deploy.md`
- Repo `Docs/GOOGLE_OAUTH_GUIDE.md`