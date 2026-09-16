/**
 * OAuth connector helper. The Worker (lifeos1.ceogps.workers.dev / worker.js)
 * owns token exchange + storage via Supabase (`platform_tokens`) with a KV
 * mirror for fast status checks. This file only triggers the popup flow,
 * listens for the callback's postMessage handshake, and checks status.
 *
 * Real routes (see worker.js): GET /api/oauth/start, GET /api/oauth/status,
 * GET /api/oauth/status/all, POST /api/oauth/disconnect.
 */
const API_BASE = "https://lifeos1.ceogps.workers.dev";
const START_PATH = (
  provider: string,
  opts: { userId?: string; hint?: string; scope?: string; accountEmail?: string } = {},
) => {
  const u = new URL(`${API_BASE}/api/oauth/start`);
  u.searchParams.set("provider", provider);
  if (opts.userId) u.searchParams.set("user_id", opts.userId);
  if (opts.hint) u.searchParams.set("hint", opts.hint);
  if (opts.scope) u.searchParams.set("scope", opts.scope);
  if (opts.accountEmail) u.searchParams.set("account_email", opts.accountEmail);
  return u.toString();
};
const STATUS_PATH = (provider?: string, userId?: string) => {
  const u = new URL(`${API_BASE}/api/oauth/status`);
  if (provider) u.searchParams.set("provider", provider);
  if (userId) u.searchParams.set("user_id", userId);
  return u.toString();
};
const DISCONNECT_PATH = (provider: string, userId: string, accountEmail?: string) => {
  const u = new URL(`${API_BASE}/api/oauth/disconnect`);
  u.searchParams.set("provider", provider);
  u.searchParams.set("user_id", userId);
  if (accountEmail) u.searchParams.set("account_email", accountEmail);
  return u.toString();
};

export type OAuthProvider =
  | "google"
  | "microsoft"
  | "github"
  | "slack"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "twitter"
  | "zoom"
  | "clickup"
  | "airtable"
  | "tiktok"
  | "spotify"
  | "yahoo"
  | "aol"
  | "calendly";

export type OAuthIdentity = {
  email?: string | null;
  name?: string | null;
  id?: string | null;
  handle?: string | null;
};

/**
 * Opens the Worker's OAuth start route in a popup and resolves with the
 * result of the callback's postMessage handshake (or `{ok:false}` if the
 * popup was blocked, closed early, or timed out without a message).
 */
export function connectProvider(
  provider: OAuthProvider,
  opts: { userId?: string; hint?: string; scope?: string; accountEmail?: string } = {},
): Promise<{ ok: boolean; identity?: OAuthIdentity; error?: string }> {
  return new Promise((resolve) => {
    const popup = window.open(
      START_PATH(provider, opts),
      `oauth_${provider}`,
      "width=520,height=680,noopener=no",
    );
    if (!popup) {
      resolve({ ok: false, error: "popup_blocked" });
      return;
    }

    let settled = false;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(closeWatcher);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "oauth_success" && data.provider === provider) {
        settled = true;
        cleanup();
        resolve({ ok: true, identity: data.identity });
      }
    };
    window.addEventListener("message", onMessage);

    // Fallback: if the popup closes without ever sending a postMessage
    // (e.g. user cancelled at the provider's consent screen), resolve
    // false so the caller can stop showing a "connecting..." spinner.
    const closeWatcher = setInterval(() => {
      if (popup.closed) {
        cleanup();
        if (!settled) resolve({ ok: false, error: "popup_closed" });
      }
    }, 500);
  });
}

export async function getConnectionStatus(
  provider: OAuthProvider,
  userId?: string,
): Promise<{ connected: boolean; identity?: OAuthIdentity; scope?: string }> {
  try {
    const res = await fetch(STATUS_PATH(provider, userId));
    if (!res.ok) return { connected: false };
    return await res.json();
  } catch {
    return { connected: false };
  }
}

/** Fetches connection status for every supported provider in one call. */
export async function getAllConnectionStatuses(
  userId?: string,
): Promise<{
  connected: string[];
  statuses: Record<string, { connected: boolean; identity?: OAuthIdentity; scope?: string }>;
}> {
  try {
    const res = await fetch(STATUS_PATH(undefined, userId));
    if (!res.ok) return { connected: [], statuses: {} };
    return await res.json();
  } catch {
    return { connected: [], statuses: {} };
  }
}

export async function disconnectProvider(
  provider: OAuthProvider,
  userId: string,
  accountEmail?: string,
): Promise<boolean> {
  try {
    const res = await fetch(DISCONNECT_PATH(provider, userId, accountEmail), {
      method: "POST",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.success;
  } catch {
    return false;
  }
}
