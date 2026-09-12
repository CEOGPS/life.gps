// Generic key/value persistence backed by the `user_data` table.
// Ported from the prior LifeOS1 build's dbFetch()/getUserData()/setUserData()
// pattern, adapted to use our authenticated Supabase client (RLS-scoped)
// instead of raw REST + anon key.
import { supabase } from "@/lib/supabase.ts";

export async function getUserData<T = unknown>(dataKey: string): Promise<T | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("user_data")
    .select("data_value")
    .eq("user_id", userId)
    .eq("data_key", dataKey)
    .maybeSingle();

  if (error) {
    console.error(`[persist] getUserData(${dataKey}) failed:`, error.message);
    return null;
  }
  return (data?.data_value as T) ?? null;
}

export async function setUserData<T = unknown>(dataKey: string, value: T): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return false;

  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: userId,
      data_key: dataKey,
      data_value: value as unknown,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,data_key" },
  );

  if (error) {
    console.error(`[persist] setUserData(${dataKey}) failed:`, error.message);
    return false;
  }
  return true;
}
