import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Configuration for LifeOS1
 *
 * This client is used for data persistence (not auth - that's handled by Firebase).
 * Public-by-design values (URL + anon key) are safe to ship in a frontend build.
 * Fallbacks guarantee the app boots even if VITE_ env vars are missing at build time.
 */

// Fallback values - only used when environment variables are not set
const FALLBACK_SUPABASE_URL = "https://mhvcdstgkyplhzjptgfr.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_tj21EW0eGMS0C2rvhkGwHA_yIr7oZl6"; // use the one from your Supabase dashboard / the guide you pasted

// Prefer environment variables, fall back to hardcoded values
// Use VITE_ prefix for Vite. The publishable key is the safe client-side key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;

// Warn if using fallbacks (helps with debugging)
if (
  !import.meta.env.VITE_SUPABASE_URL ||
  !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) {
  console.warn(
    "[supabase] Using built-in fallback credentials. " +
      "For production, set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment.\n" +
      "Cloudflare Pages: Add these as Environment Variables in the dashboard.",
  );
}

// Validate that we have something
if (!supabaseUrl || !supabasePublishableKey) {
  console.error(
    "[supabase] Missing required configuration even with fallbacks. App will use a no-op Supabase client. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment (Cloudflare Pages dashboard).",
  );
}

/**
 * Supabase client instance
 *
 * Note: Auth is disabled because we use Firebase for authentication.
 * This client is only for data persistence (user_data table).
 * Wrapped to prevent top-level crash (black screen) if config is bad at build/runtime.
 * Adapted from Supabase Next.js guide for Vite/Cloudflare (no SSR middleware needed here; use in worker for server ops).
 */
function createSafeSupabase() {
  try {
    if (!supabaseUrl || !supabasePublishableKey) {
      return createNoOpSupabase();
    }
    return createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "lifeos1-supabase-auth",
      },
    });
  } catch (e) {
    console.error("[supabase] Failed to create client (will use no-op):", e);
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
    },
  };
  return noOp as any;
}

export const supabase = createSafeSupabase();

/**
 * Required Supabase Table Structure:
 *
 * Run this SQL in your Supabase SQL editor to set up the required table:
 *
 * ```sql
 * -- Create the user_data table for app persistence
 * CREATE TABLE IF NOT EXISTS user_data (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_email TEXT NOT NULL,
 *   data_key TEXT NOT NULL,
 *   data_value JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(user_email, data_key)
 * );
 *
 * -- Create index for faster lookups
 * CREATE INDEX IF NOT EXISTS idx_user_data_lookup ON user_data (user_email, data_key);
 *
 * -- Enable Row Level Security
 * ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
 *
 * -- Create RLS policies
 * CREATE POLICY "Users can read own data" ON user_data
 *   FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
 *
 * CREATE POLICY "Users can insert own data" ON user_data
 *   FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
 *
 * CREATE POLICY "Users can update own data" ON user_data
 *   FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
 *
 * CREATE POLICY "Users can delete own data" ON user_data
 *   FOR DELETE USING (auth.jwt() ->> 'email' = user_email);
 *
 * -- Create a function to automatically update updated_at
 * CREATE OR REPLACE FUNCTION update_updated_at_column()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   NEW.updated_at = NOW();
 *   RETURN NEW;
 * END;
 * $$ language 'plpgsql';
 *
 * -- Create trigger to auto-update updated_at
 * CREATE TRIGGER update_user_data_updated_at
 *   BEFORE UPDATE ON user_data
 *   FOR EACH ROW
 *   EXECUTE FUNCTION update_updated_at_column();
 * ```
 */

// Helper function to check if table exists (useful for debugging)
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase
      .from("user_data")
      .select("count", { count: "exact", head: true })
      .limit(1);

    if (error) {
      console.error("[supabase] Connection check failed:", error.message);
      return false;
    }

    console.log("[supabase] Connection successful");
    return true;
  } catch (error) {
    console.error("[supabase] Connection error:", error);
    return false;
  }
}

// Export config values for use in other modules
export { supabaseUrl, supabasePublishableKey as supabaseAnonKey }; // alias for backward compat with existing code

// Default export for convenience
export default supabase;

// For server-side use in your Cloudflare Worker (use with service key for privileged access, e.g. in OAuth consent handler or API routes)
export function createSupabaseServerClient(url, serviceKey) {
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
