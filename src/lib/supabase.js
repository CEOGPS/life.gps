/**
 * Central Supabase configuration
 *
 * IMPORTANT: Set these environment variables in your deployment:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 *
 * For local development: Create a .env file:
 *   VITE_SUPABASE_URL=your_supabase_url
 *   VITE_SUPABASE_ANON_KEY=your_anon_key
 *
 * For Cloudflare Pages: Set environment variables in the dashboard
 */

// Validate environment variables
const requiredEnvVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const missingVars = requiredEnvVars.filter((key) => !import.meta.env[key]);

if (missingVars.length > 0) {
  console.error("❌ Missing Supabase environment variables:", missingVars);

  // In development, show a helpful message
  if (import.meta.env.DEV) {
    console.warn(`
      ⚠️  Supabase environment variables are missing!
      
      Create a .env file in your project root with:
        VITE_SUPABASE_URL=https://mhvcdstgkyplhzjptgfr.supabase.co
        VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      
      For production, set these in your Cloudflare Pages dashboard.
    `);
  }
}

// Export configuration
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://mhvcdstgkyplhzjptgfr.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Log warning if using fallbacks (development only)
if (
  import.meta.env.DEV &&
  (!import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY)
) {
  console.warn(
    "⚠️  Using fallback Supabase configuration. Set environment variables for production.",
  );
}

/**
 * Supabase table structure:
 *
 * TABLE user_data (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_email TEXT NOT NULL,
 *   data_key TEXT NOT NULL,
 *   data_value JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(user_email, data_key)
 * );
 *
 * INDEX ON user_data (user_email, data_key);
 *
 * RLS POLICIES:
 *   CREATE POLICY "Users can read own data" ON user_data
 *     FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
 *
 *   CREATE POLICY "Users can insert own data" ON user_data
 *     FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
 *
 *   CREATE POLICY "Users can update own data" ON user_data
 *     FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
 */

/**
 * Generic fetch helper for Supabase REST API
 * @param {string} path - API path (e.g., 'user_data?user_email=eq.test@example.com')
 * @param {Object} opts - Fetch options
 * @returns {Promise<Array|Object|null>} - Response data or null on error
 */
export async function dbFetch(path, opts = {}) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const response = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: opts.prefer || "return=representation",
        ...opts.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Supabase API error [${response.status}] for ${path}:`,
        errorText,
      );

      // Throw different errors based on status
      if (response.status === 401) {
        throw new Error("Unauthorized: Please check your Supabase anon key");
      } else if (response.status === 404) {
        throw new Error(`Endpoint not found: ${path}`);
      } else {
        throw new Error(`Supabase error ${response.status}: ${errorText}`);
      }
    }

    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error(`Failed to fetch from Supabase (${path}):`, error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Helper for common operations
 */
export const supabaseAPI = {
  /**
   * Get user data by email and key
   */
  async getUserData(userEmail, dataKey) {
    if (!userEmail || !dataKey) return null;

    const path = `user_data?user_email=eq.${encodeURIComponent(userEmail)}&data_key=eq.${encodeURIComponent(dataKey)}&select=data_value`;
    const result = await dbFetch(path);
    return result && result.length > 0 ? result[0].data_value : null;
  },

  /**
   * Set user data by email and key
   */
  async setUserData(userEmail, dataKey, value) {
    if (!userEmail || !dataKey) return null;

    return await dbFetch("user_data", {
      method: "POST",
      body: JSON.stringify({
        user_email: userEmail,
        data_key: dataKey,
        data_value: value,
        updated_at: new Date().toISOString(),
      }),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  },

  /**
   * Delete user data by email and key
   */
  async deleteUserData(userEmail, dataKey) {
    if (!userEmail || !dataKey) return null;

    const path = `user_data?user_email=eq.${encodeURIComponent(userEmail)}&data_key=eq.${encodeURIComponent(dataKey)}`;
    return await dbFetch(path, { method: "DELETE" });
  },

  /**
   * Delete all user data (for account deletion)
   */
  async deleteAllUserData(userEmail) {
    if (!userEmail) return null;

    const path = `user_data?user_email=eq.${encodeURIComponent(userEmail)}`;
    return await dbFetch(path, { method: "DELETE" });
  },
};

export default supabaseAPI;
