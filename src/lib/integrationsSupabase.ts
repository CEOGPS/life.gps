import { supabase } from "./supabaseClient.ts";

/**
 * Supabase integration for persistent credentials storage
 * Replaces localStorage-based persistence in IntegrationsPanel
 * Uses user_email (Firebase email) for compatibility with Firebase auth
 */

export interface IntegrationCredential {
  id?: string;
  user_email: string;              // Changed from user_id to user_email
  integration_name: string;
  email?: string;
  username?: string;
  password?: string;
  api_key?: string;
  status: "on" | "off";
  label?: string;
  color?: string;
  icon?: string;
  oauth_provider?: string;
  oauth_access_token?: string;
  oauth_refresh_token?: string;
  oauth_expires_at?: string;
  oauth_scope?: string;
  created_at?: string;
  updated_at?: string;
}

export type CredentialsMap = Record<string, Record<string, IntegrationCredential>>;

/**
 * Convert Supabase rows (from api_keys table) to the credentials map format
 */
export function rowsToCredentialsMap(rows: IntegrationCredential[]): CredentialsMap {
  const map: CredentialsMap = {};
  for (const row of rows) {
    const { integration_name, email, ...rest } = row;
    if (!map[integration_name]) map[integration_name] = {};
    const key = email || `${integration_name}_${row.id?.slice(0, 8)}`;
    map[integration_name][key] = {
      ...rest,
      apiKey: rest.api_key,
      oauthAccessToken: rest.oauth_access_token,
      oauthRefreshToken: rest.oauth_refresh_token,
      oauthExpiresAt: rest.oauth_expires_at,
      oauthScope: rest.oauth_scope,
      oauthProvider: rest.oauth_provider,
    } as any;
  }
  return map;
}

/**
 * Load all credentials for the current user from Supabase (api_keys table)
 */
export async function loadCredentials(userEmail: string): Promise<CredentialsMap> {
  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_email", userEmail);

    if (error) {
      console.warn("[supabase] loadCredentials error:", error.message, error.details);
      return {};
    }

    const map: CredentialsMap = {};
    for (const row of data || []) {
      const integration = row.service || "unknown";
      const email = row.account_email || userEmail;
      if (!map[integration]) map[integration] = {};
      map[integration][email] = {
        id: row.id,
        user_email: userEmail,
        integration_name: integration,
        email,
        api_key: row.api_key,
        status: row.status || "on",
        label: row.label || email,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
    return map;
  } catch (e) {
    console.warn("[supabase] loadCredentials exception:", e);
    return {};
  }
}

/**
 * Save a single credential to Supabase (api_keys table)
 */
export async function saveCredential(
  userEmail: string,
  credential: IntegrationCredential
): Promise<IntegrationCredential | null> {
  try {
    const email = credential.email || credential.label || userEmail;
    const integration = credential.integration_name;

    console.log("[supabase] Saving API key:", {
      user_email: userEmail,
      service: integration,
      account_email: email,
    });

    const { data, error } = await supabase
      .from("api_keys")
      .upsert(
        [
          {
            user_email: userEmail,
            service: integration,
            account_email: email,
            api_key: credential.api_key,
            status: credential.status || "on",
            label: credential.label || email,
            updated_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: "user_email,service,account_email",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[supabase] saveCredential error:", error.code, error.message, error.details);
      return null;
    }

    console.log("[supabase] API key saved:", data);
    return data as any;
  } catch (e) {
    console.error("[supabase] saveCredential exception:", e);
    return null;
  }
}

/**
 * Delete a credential from Supabase (api_keys table)
 */
export async function deleteCredential(
  userEmail: string,
  integrationName: string,
  email: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("user_email", userEmail)
      .eq("service", integrationName)
      .eq("account_email", email);

    if (error) {
      console.warn("[supabase] deleteCredential failed:", error.message);
      return false;
    }

    return true;
  } catch (e) {
    console.warn("[supabase] deleteCredential exception:", e);
    return false;
  }
}

/**
 * Batch upsert multiple credentials to api_keys table
 */
export async function saveCredentials(
  userEmail: string,
  credentials: IntegrationCredential[]
): Promise<IntegrationCredential[]> {
  if (!credentials.length) return [];

  const { data, error } = await supabase
    .from("api_keys")
    .upsert(
      credentials.map((c) => ({
        user_email: userEmail,
        service: c.integration_name,
        account_email: c.email || c.label || userEmail,
        api_key: c.api_key,
        status: c.status || "on",
        label: c.label || c.email || userEmail,
        updated_at: new Date().toISOString(),
      })),
      {
        onConflict: "user_email,service,account_email",
      }
    )
    .select();

  if (error) {
    console.warn("[supabase] saveCredentials failed:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Migrate localStorage data to Supabase (api_keys table)
 */
export async function migrateFromLocalStorage(
  userEmail: string,
  localData: CredentialsMap
): Promise<void> {
  const credentials: IntegrationCredential[] = [];

  for (const [integrationName, accounts] of Object.entries(localData)) {
    for (const [email, slot] of Object.entries(accounts)) {
      if (slot.status === "on" || slot.api_key || slot.username || slot.password) {
        credentials.push({
          user_email: userEmail,
          integration_name: integrationName,
          email,
          username: slot.username || "",
          password: slot.password || "",
          api_key: slot.api_key || "",
          status: slot.status || "off",
          label: slot.label || email,
          color: slot.color || "#6aaedd",
          icon: slot.icon || "👤",
        });
      }
    }
  }

  if (credentials.length) {
    await saveCredentials(userEmail, credentials);
    console.log(`[supabase] Migrated ${credentials.length} credentials from localStorage`);
  }
}

export default {
  loadCredentials,
  saveCredential,
  saveCredentials,
  deleteCredential,
  migrateFromLocalStorage,
  rowsToCredentialsMap,
};