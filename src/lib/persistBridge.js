/**
 * persistBridge — cross-device persistence for LifeOS1.
 * Mirrors all "lifeos*" localStorage keys to the Worker KV store (one snapshot
 * blob) via the already-deployed /api/kv endpoints, so panel data survives new
 * logins, other browsers, devices, and cache clears.
 */

const WORKER =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://lifeos1.ceogps.workers.dev"
    : "http://localhost:8787";

const BLOB_KEY = "appstate_global";
const SYNC_RE = /^lifeos/i;

function snapshot() {
  const snap = {};
  try {
    const ls = window.localStorage;
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && SYNC_RE.test(k)) snap[k] = ls.getItem(k);
    }
  } catch {}
  return snap;
}

export async function hydrateFromCloud() {
  try {
    const r = await fetch(`${WORKER}/api/kv/${BLOB_KEY}`);
    if (!r.ok) return;
    const data = await r.json();
    if (data && typeof data === "object") {
      for (const [k, v] of Object.entries(data)) {
        try {
          window.localStorage.setItem(
            k,
            typeof v === "string" ? v : JSON.stringify(v),
          );
        } catch {}
      }
    }
  } catch (e) {
    console.warn("[persistBridge] hydrate failed:", e && e.message);
  }
}

let timer = null;
function schedule() {
  if (!timer) timer = setTimeout(flush, 600);
}
async function flush() {
  timer = null;
  const snap = snapshot();
  if (!Object.keys(snap).length) return;
  try {
    await fetch(`${WORKER}/api/kv/${BLOB_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snap),
    });
  } catch {}
}

let installed = false;
export function installPersistBridge() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const ls = window.localStorage;
  const origSet = ls.setItem.bind(ls);
  const origRemove = ls.removeItem.bind(ls);
  ls.setItem = function (k, v) {
    origSet(k, v);
    if (k && SYNC_RE.test(k)) schedule();
  };
  ls.removeItem = function (k) {
    origRemove(k);
    if (k && SYNC_RE.test(k)) schedule();
  };
  window.addEventListener("beforeunload", () => {
    const snap = snapshot();
    if (Object.keys(snap).length && navigator.sendBeacon) {
      navigator.sendBeacon(
        `${WORKER}/api/kv/${BLOB_KEY}`,
        JSON.stringify(snap),
      );
    }
  });
}
