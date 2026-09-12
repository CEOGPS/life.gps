import { supabase } from "./supabaseClient.ts";

/**
 * Unified persistence layer — single-user LifeOS1 instance.
 * Backed by a `user_settings` table: (key text primary key, value jsonb, updated_at timestamptz)
 * RLS disabled (single-user, service handles auth at the edge).
 */

const TABLE = "user_settings";

export async function getItem<T = unknown>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error(`[storage] getItem(${key}) failed:`, error.message);
    return null;
  }
  return (data?.value as T) ?? null;
}

export async function setItem<T = unknown>(key: string, value: T): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    console.error(`[storage] setItem(${key}) failed:`, error.message);
    return false;
  }
  return true;
}

export async function removeItem(key: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE).delete().eq("key", key);
  if (error) {
    console.error(`[storage] removeItem(${key}) failed:`, error.message);
    return false;
  }
  return true;
}

export async function listKeys(prefix?: string): Promise<string[]> {
  let query = supabase.from(TABLE).select("key");
  if (prefix) query = query.like("key", `${prefix}%`);
  const { data, error } = await query;
  if (error) {
    console.error(`[storage] listKeys(${prefix}) failed:`, error.message);
    return [];
  }
  return (data ?? []).map((r: { key: string }) => r.key);
}
