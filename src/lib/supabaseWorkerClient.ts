// src/lib/supabaseWorkerClient.ts
// Server-side Supabase client for Cloudflare Workers
// Uses env bindings instead of import.meta.env

import { createClient } from "@supabase/supabase-js";

export function createWorkerSupabaseClient(env: any) {
  const supabaseUrl = env.SUPABASE_URL || "https://mhvcdstgkyplhzjptgfr.supabase.co";
  const supabaseServiceKey = env.SUPABASE_SERVICE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("[supabaseWorker] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env");
    return createNoOpSupabase();
  }

  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (e) {
    console.error("[supabaseWorker] Failed to create client:", e);
    return createNoOpSupabase();
  }
}

function createNoOpSupabase() {
  const noOp = {
    from: (_table: string) => ({
      select: async () => ({ data: [], error: null }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
    }),
    auth: {
      signInWithOAuth: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        setTimeout(() => callback("INITIAL_SESSION", null), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
  };
  return noOp as any;
}

// For backward compatibility with existing code that expects a default export
export const supabase = createNoOpSupabase();
export default supabase;