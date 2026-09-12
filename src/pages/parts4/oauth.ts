/**
 * OAuth connector helper. The Worker (lifeos1-api.ceogps.workers.dev) owns
 * token exchange + storage — this file only triggers the flow and checks status.
 *
 * ADJUST THESE 3 PATHS if your Worker uses different routes:
 */
const API_BASE = "https://lifeos1-api.ceogps.workers.dev";
const START_PATH = (provider: string) => `${API_BASE}/oauth/${provider}/start`;
const STATUS_PATH = (provider: string) => `${API_BASE}/oauth/${provider}/status`;
const DISCONNECT_PATH = (provider: string) => `${API_BASE}/oauth/${provider}/disconnect`;

export type OAuthProvider = "spotify" | "google" | "facebook" | "linkedin" | "twitter";

/** Opens a popup to the Worker's OAuth start route, resolves true when the popup closes. */
export function connectProvider(provider: OAuthProvider): Promise<boolean> {
  return new Promise((resolve) => {
    const popup = window.open(
      START_PATH(provider),
      `oauth_${provider}`,
      "width=520,height=640,noopener=no"
    );
    if (!popup) {
      resolve(false);
      return;
    }
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        resolve(true); // caller should re-check status after this resolves
      }
    }, 500);
  });
}

export async function getConnectionStatus(
  provider: OAuthProvider
): Promise<{ connected: boolean; expiresAt?: string }> {
  try {
    const res = await fetch(STATUS_PATH(provider));
    if (!res.ok) return { connected: false };
    return await res.json();
  } catch {
    return { connected: false };
  }
}

export async function disconnectProvider(provider: OAuthProvider): Promise<boolean> {
  try {
    const res = await fetch(DISCONNECT_PATH(provider), { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}
