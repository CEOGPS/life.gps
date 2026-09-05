// ─── Storage Helpers ──────────────────────────────────────────────────────

const PREFIX = "erebus_";

export function storageGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Silently fail
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Silently fail
  }
}

export function storageClear(prefix?: string): void {
  const target = prefix ? PREFIX + prefix : PREFIX;
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(target)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Silently fail
  }
}