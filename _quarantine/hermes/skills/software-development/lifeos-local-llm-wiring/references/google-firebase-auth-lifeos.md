# Firebase + Google login (LifeOS1) — separate from worker Integrations

**Two OAuth lanes** — do not conflate:

| Lane | Purpose | Account policy |
|------|---------|----------------|
| **Firebase** `signInWithGoogle` / Login screen buttons | Who is logged into LifeOS | CEO GPS / Business / Marketing / picker — any configured Google |
| **Worker** `/api/oauth/start?provider=google` | Gmail, Calendar, YouTube API tokens | **`chrisgr33ninc@gmail.com` only** (`src/lib/lifeosGoogleAccount.js`) |

**`chris@ceogps.com`** = cPanel mail for sending/branding — **not** the Integrations Google mailbox.

## Firebase console

https://console.firebase.google.com/ → LifeOS web app project (often same GCP project `careful-span-485509-a0`).

1. **Authentication → Sign-in method → Google** → Enabled.
2. Link Web client ID/secret from GCP or use Firebase auto client.
3. **Authentication → Settings → Authorized domains:** `localhost`, `lifeos1.pages.dev`, `ceogps.com`, `lifeos1.ceogps.workers.dev` (add `oauth.ceogps.com` if needed).
4. **Project settings → Web app** → copy `VITE_FIREBASE_*` into `.env` (see repo `.env.example`). Restart `bun run dev`.

Firebase redirect uses `https://<project>.firebaseapp.com/__/auth/handler` — **different** from worker `https://oauth.ceogps.com/api/oauth/callback`.

## Login screen (repo)

- `LoginScreen.jsx` — three one-click accounts with `login_hint` each; generic picker calls `signInWithGoogle()` **without** hint (full account chooser).
- Do **not** force Integrations mailbox on Firebase login.

## Integrations UI

- `IntegrationsPanel.jsx` — always `hint=chrisgr33ninc@gmail.com` on Google Connect; status via `/api/oauth/status?user_id=<firebase uid>`.
- Banner: **LifeOS session** email vs **Google APIs** email.

## Worker (after deploy)

- Google callback **rejects** tokens if `identity.email` ≠ `chrisgr33ninc@gmail.com` (wrong-account HTML).
- `handleOAuthStatus` scopes by `user_id` when provided.

## Google Cloud (worker client)

See `references/google-oauth-console-lifeos.md`.

## Repo doc mirror

`Docs/GOOGLE_FIREBASE_SETUP_CHECKLIST.md` — full click-by-click checklist for Chris.

## Agent cannot complete alone

GCP/Firebase Console edits need user password/2FA in browser. Prepare checklist + `node scripts/oauth-live-debug.mjs`; user signs in, then agent can verify redirect URIs in browser if asked.