# Google OAuth — LifeOS1 Quick Reference
Your app is already configured. This is your cheat sheet.

## Your Credentials (already in worker)
- **Client ID:** `162008698282-pj6v1vl0cc71kak7kvt2lkihcea1qkch.apps.googleusercontent.com`
- **Client Secret:** `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`
- **Project:** `careful-span-485509-a0`
## Google account (all LifeOS Google features)

**`chrisgr33ninc@gmail.com`** — defined in `src/lib/lifeosGoogleAccount.js` as `LIFEOS_GOOGLE_ACCOUNT`.

- Integrations: Gmail, Calendar, YouTube Connect (`hint` on OAuth start)
- Firebase login: separate OAuth client — see `Docs/GOOGLE_FIREBASE_SETUP_CHECKLIST.md`

**Not Google:** `chris@ceogps.com` is cPanel mail only.

## Redirect URI (must match Google Console exactly)

Worker sends (no `?provider=google` on redirect_uri today):

```
https://oauth.ceogps.com/api/oauth/callback
```

Fallback:

```
https://lifeos1.ceogps.workers.dev/api/oauth/callback
```

- Test user (if app status is **Testing**): `chrisgr33ninc@gmail.com`

1. User clicks **Gmail** or **Google Cal.** in Integrations panel
2. Opens popup → worker `/api/oauth/start?provider=google&hint=chrisgr33ninc@gmail.com`
3. CF Worker redirects to Google consent screen (using your client ID above)
4. User approves → Google sends code to `/api/oauth/callback`
5. Worker exchanges code for tokens → saves to Supabase `user_settings`
6. Popup sends `postMessage` → Integrations panel lights up green ✅

## If Google says "redirect_uri_mismatch"
Go to: https://console.cloud.google.com/auth/clients/162008698282-pj6v1vl0cc71kak7kvt2lkihcea1qkch.apps.googleusercontent.com?project=careful-span-485509-a0

Under **Authorized redirect URIs**, make sure this exact URI is listed:
```
https://oauth.ceogps.com/api/oauth/callback
```

## Scopes already configured
| Scope string | What it unlocks |
|---|---|
| `gmail` | Read/send Gmail |
| `calendar` | Google Calendar |
| `youtube` | YouTube channel |

## Adding a new Google API (e.g. Google Drive)
1. Go to Google Cloud Console → APIs & Services → Enable APIs
2. Enable the API (e.g. Google Drive API)
3. In the worker, add a new scope to the `google` config:
   ```js
   scope === "drive" ? "https://www.googleapis.com/auth/drive email profile openid" : ...
   ```
4. In IntegrationsPanel, add: `"Google Drive": \`${WORKER_URL}/api/oauth/start?provider=google&scope=drive\``

That's it. The redirect, token exchange, and Supabase save happen automatically.
