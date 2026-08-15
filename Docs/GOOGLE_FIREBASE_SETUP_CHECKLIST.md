# Google Cloud + Firebase — LifeOS1 setup checklist

**Audit (2026-03-14, console as chrisgr33ninc@gmail.com):** see § Audit at bottom.

Use Google account that **owns** the relevant project (usually **chrisgr33ninc@gmail.com**).

## A. OAuth client — **CEO GPS Site** (`careful-span-485509-a0`)

**Integrations only** (Gmail/Calendar/YouTube via worker). Client **CEO GPS** / `162008698282-pj6v1vl0cc71kak7kvt2lkihcea1qkch.apps.googleusercontent.com`.

Open: https://console.cloud.google.com/apis/credentials/oauthclient/162008698282-pj6v1vl0cc71kak7kvt2lkihcea1qkch.apps.googleusercontent.com?project=careful-span-485509-a0

### Authorized JavaScript origins (have / add)

| URI | Status |
|-----|--------|
| `https://ceogps.com` | ✓ |
| `https://www.ceogps.com` | ✓ |
| `https://marketing.ceogps.com` | ✓ |
| `https://lifeos1.pages.dev` | ✓ |
| `https://lifeos1.ceogps.workers.dev` | ✓ |
| `http://localhost:5173` | **ADD** |
| `https://oauth.ceogps.com` | **ADD** |

### Authorized redirect URIs (critical)

Worker sends: `https://oauth.ceogps.com/api/oauth/callback`

| URI | Status |
|-----|--------|
| `https://oauth.ceogps.com/api/oauth/callback` | **ADD if missing** |
| `https://lifeos1.ceogps.workers.dev/api/oauth/callback` | **ADD** (fallback) |
| `https://ceogps.com` (root) | Present — keep for site; **not** sufficient for LifeOS worker |

Click **Save**. Propagation ~5–10 min.

### OAuth consent screen

- **Publishing:** In production ✓ (no test-user cap for public)
- Enable APIs: Gmail, Calendar, YouTube Data API v3

---

## B. Firebase — **LifeOS Dashboard** (`lifeos-dashboard-85759`)

**Login only** (Sign in with Google buttons). **Not** the same OAuth client as §A unless you manually wire Web client ID in Firebase Google provider.

### 1. Enable Google sign-in (currently **OFF**)

https://console.firebase.google.com/project/lifeos-dashboard-85759/authentication/providers

- **Add provider → Google → Enable → Save**
- If UI says you lack permission: Firebase **Project settings → Users and permissions** → your account needs **Owner** or **Editor** with Authentication Admin.

### 2. Authorized domains

https://console.firebase.google.com/project/lifeos-dashboard-85759/authentication/settings → **Authorized domains**

Present: `localhost`, `lifeos-dashboard-85759.firebaseapp.com`, `lifeos-dashboard-85759.web.app`, (likely `ceogps.com` in full list)

**Add if missing:**

- `lifeos1.pages.dev`
- `ceogps.com` (if you host LifeOS there)

### 3. Web app config → `.env`

Project settings → **LifeOS1** web app → copy into `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=lifeos-dashboard-85759.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lifeos-dashboard-85759
VITE_FIREBASE_APP_ID=1:669396991569:web:0d097d5173fbe83cbc8270
```

Restart `bun run dev`.

### 4. After enabling Google in Firebase

Google Cloud may create/use a **second** OAuth client under project `lifeos-dashboard-85759`. That is normal for Firebase login. **Integrations** still use the **CEO GPS** client in §A.

---

## C. Two lanes (do not merge)

| | Integrations (Gmail/Cal/YouTube) | Firebase login |
|--|----------------------------------|----------------|
| GCP project | `careful-span-485509-a0` | `lifeos-dashboard-85759` |
| Redirect | `oauth.ceogps.com/api/oauth/callback` | `…firebaseapp.com/__/auth/handler` |
| Google account for APIs | **chrisgr33ninc@gmail.com** | Any of your login emails |

---

## D. Verify

```bash
node scripts/oauth-live-debug.mjs https://lifeos1.ceogps.workers.dev
```

Then: LifeOS → Integrations → Gmail → Connect (pick **chrisgr33ninc@gmail.com**).

Login: CEO GPS / Business / Marketing buttons after Firebase Google is **Enabled**.

---

## Audit snapshot (2026-03-14)

| Check | Result |
|-------|--------|
| GCP OAuth client **CEO GPS** origins | 5 site URLs; missing `localhost:5173`, `oauth.ceogps.com` |
| GCP redirect URIs | Saw site roots (`https://ceogps.com`); **confirm** `oauth.ceogps.com/api/oauth/callback` is listed |
| Consent screen | **In production** |
| Firebase Google provider | **Disabled** (only Email/Password + Facebook) |
| Firebase authorized domains | `localhost` + Firebase defaults; add `lifeos1.pages.dev` |
| Firebase web app | **LifeOS1** `1:669396991569:web:0d097d5173fbe83cbc8270` |
