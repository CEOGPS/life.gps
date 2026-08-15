import { supabase } from "./supabaseClient.ts";

/**
 * Unified persistence layer — single-user LifeOS1 instance.
 *
 * LOCAL-FIRST: every value is written to localStorage immediately and synced to
 * Supabase in the background. This guarantees data never disappears between
 * sessions even if the remote table/schema is missing or offline.
 *
 * Trying to reach Supabase: a `user_settings` table with
 * (key text primary key, value jsonb, updated_at timestamptz).
 * If that table/column isn't present, local persistence keeps working and the
 * remote sync is skipped (a warning is logged once).
 */

const TABLE = "user_settings";
const LS_PREFIX = "lifeos_supabase_";

function lsRead(key: string): unknown | null {
  try {
    const v = localStorage.getItem(LS_PREFIX + key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
function lsWrite(key: string, val: unknown): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch {
    /* storage full / unavailable — best-effort */
  }
}
function lsDel(key: string): void {
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    /* ignore */
  }
}

export async function getItem<T = unknown>(key: string): Promise<T | null> {
  // Local copy is the source of truth (instant + always present).
  const local = lsRead(key);
  if (local !== null) return local as T;
  // First visit for this key: try the remote, mirror to local on success.
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      console.warn(`[storage] getItem(${key}) remote failed:`, error.message);
      return null;
    }
    if (data?.value !== undefined && data?.value !== null) {
      lsWrite(key, data.value);
      return data.value as T;
    }
    return null;
  } catch (e) {
    console.warn(`[storage] getItem(${key}) remote error:`, e);
    return null;
  }
}

export async function setItem<T = unknown>(
  key: string,
  value: T,
): Promise<boolean> {
  // Local write first — never lose data.
  lsWrite(key, value);
  // Background sync to Supabase.
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) {
      console.warn(`[storage] setItem(${key}) remote sync failed:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[storage] setItem(${key}) remote error:`, e);
    return false;
  }
}

export async function removeItem(key: string): Promise<boolean> {
  lsDel(key);
  try {
    const { error } = await supabase.from(TABLE).delete().eq("key", key);
    if (error) {
      console.warn(`[storage] removeItem(${key}) remote failed:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[storage] removeItem(${key}) remote error:`, e);
    return false;
  }
}

export async function listKeys(prefix?: string): Promise<string[]> {
  const all: string[] = [];
  // Local keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX)) {
        const bare = k.slice(LS_PREFIX.length);
        if (!prefix || bare.startsWith(prefix)) all.push(bare);
      }
    }
  } catch {
    /* ignore */
  }
  // Remote keys (best-effort merge)
  try {
    let query = supabase.from(TABLE).select("key");
    if (prefix) query = query.like("key", `${prefix}%`);
    const { data } = await query;
    const remote = (data ?? []).map((r: { key: string }) => r.key);
    for (const r of remote) if (!all.includes(r)) all.push(r);
  } catch {
    /* offline — local only */
  }
  return all;
}
