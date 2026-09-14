// worker/index.js
// LifeOS1 Worker - Combined & Optimized
// Single file deployment for Cloudflare Workers

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ── CORS ──────────────────────────────────────────────────────────────────────
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

var SUPABASE_URL = "https://mhvcdstgkyplhzjptgfr.supabase.co";
var WORKER_BASE = "https://lifeos1-api.ceogps.workers.dev";

// ── In-memory KV fallback (when KV namespace not bound) ───────────────────────
const memoryStore = new Map();

function kvGet(env, key, type = "json") {
  try {
    const kv = env.LIFEOS_KV;
    if (kv && typeof kv.get === "function") {
      return type === "json" ? kv.get(key, "json") : kv.get(key);
    }
  } catch (e) {
    console.warn("KV get failed, using memory fallback:", e);
  }
  const value = memoryStore.get(key);
  if (value === undefined) return Promise.resolve(null);
  return Promise.resolve(type === "json" ? JSON.parse(value) : value);
}

function kvPut(env, key, value) {
  try {
    const kv = env.LIFEOS_KV;
    if (kv && typeof kv.put === "function") {
      return kv.put(key, value);
    }
  } catch (e) {
    console.warn("KV put failed, using memory fallback:", e);
  }
  memoryStore.set(key, value);
  return Promise.resolve();
}

function kvDelete(env, key) {
  try {
    const kv = env.LIFEOS_KV;
    if (kv && typeof kv.delete === "function") {
      return kv.delete(key);
    }
  } catch (e) {
    console.warn("KV delete failed, using memory fallback:", e);
  }
  memoryStore.delete(key);
  return Promise.resolve();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function validateSupabaseJWT(token, env) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;
    if (!userId) return null;
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const user = await response.json();
      return { id: user.id, email: user.email, ...user };
    }
    return null;
  } catch (e) {
    console.warn("JWT validation error:", e.message);
    return null;
  }
}
__name(validateSupabaseJWT, "validateSupabaseJWT");

// ── Response Helpers ──────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  });
}
__name(json, "json");

function err(msg, status = 400) {
  return json({ error: msg }, status);
}
__name(err, "err");

// ── Supabase Client ──────────────────────────────────────────────────────────
async function supabase(env, path, opts = {}) {
  const key = env.SUPABASE_SERVICE_KEY || "";
  if (!key) return null;
  const res = await fetch(SUPABASE_URL + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: "Bearer " + key,
      Prefer: "resolution=merge-duplicates",
      ...opts.headers || {}
    }
  });
  const text = await res.text();
  if (!text) return res.ok ? [] : null;
  try {
    const parsed = JSON.parse(text);
    if (!res.ok) return null;
    if (parsed && typeof parsed === "object" && (parsed.message || parsed.hint || parsed.code)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
__name(supabase, "supabase");

async function getSystemUserId(env) {
  let id = await env.LIFEOS_KV.get("system_user_id");
  if (id) return id;
  try {
    const data = await supabase(env, "/rest/v1/users?email=eq.system@lifeos1.com&select=id");
    if (data?.length) {
      await env.LIFEOS_KV.put("system_user_id", data[0].id);
      return data[0].id;
    }
    const newUser = await supabase(env, "/rest/v1/users", {
      method: "POST",
      body: JSON.stringify({ email: "system@lifeos1.com", created_at: new Date().toISOString() })
    });
    id = newUser?.[0]?.id || "sys_fallback";
    await env.LIFEOS_KV.put("system_user_id", id);
    return id;
  } catch {
    return "sys_fallback";
  }
}
__name(getSystemUserId, "getSystemUserId");

// ── Rate Limiting ─────────────────────────────────────────────────────────────
async function checkRateLimit(env, key, windowSec = 60, maxReqs = 30) {
  const slot = Math.floor(Date.now() / 1000 / windowSec);
  const k = `rate:${key}:${slot}`;
  const val = await env.LIFEOS_KV.get(k, "json") || { count: 0 };
  val.count++;
  await env.LIFEOS_KV.put(k, JSON.stringify(val), { expirationTtl: windowSec + 5 });
  return {
    allowed: val.count <= maxReqs,
    remaining: maxReqs - val.count,
    reset: (slot + 1) * windowSec
  };
}
__name(checkRateLimit, "checkRateLimit");

// ── OAuth Helpers ────────────────────────────────────────────────────────────
async function saveOAuthTokensToSupabase(env, provider, tokens, userId, accountEmail, accountName, platformUserId) {
  const existing = await supabase(
    env,
    `/rest/v1/platform_tokens?select=id&user_id=eq.${userId}&platform=eq.${provider}&account_email=eq.${encodeURIComponent(accountEmail)}`
  );
  const tokenData = {
    user_id: userId,
    platform: provider,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    token_expires_at: tokens.expires_at ? new Date(tokens.expires_at).toISOString() : new Date(Date.now() + 3600000).toISOString(),
    platform_user_id: platformUserId || null,
    platform_username: accountEmail,
    account_email: accountEmail,
    account_name: accountName,
    metadata: {
      scope: tokens.scope,
      token_type: tokens.token_type || "Bearer",
      connected_at: Date.now()
    },
    is_active: true,
    updated_at: new Date().toISOString()
  };
  if (existing?.length) {
    await supabase(env, `/rest/v1/platform_tokens?id=eq.${existing[0].id}`, {
      method: "PATCH",
      body: JSON.stringify(tokenData)
    });
  } else {
    const existingAccounts = await supabase(
      env,
      `/rest/v1/platform_tokens?select=id&user_id=eq.${userId}&platform=eq.${provider}&limit=1`
    );
    tokenData.is_primary = !(Array.isArray(existingAccounts) && existingAccounts.length);
    await supabase(env, "/rest/v1/platform_tokens", {
      method: "POST",
      body: JSON.stringify(tokenData)
    });
  }
}
__name(saveOAuthTokensToSupabase, "saveOAuthTokensToSupabase");

async function getValidAccessTokenFromDB(env, provider, userId, accountEmail = null) {
  let query = `/rest/v1/platform_tokens?select=*&user_id=eq.${userId}&platform=eq.${provider}&is_active=eq.true`;
  if (accountEmail) {
    query += `&account_email=eq.${encodeURIComponent(accountEmail)}`;
  }
  query += `&order=is_primary.desc,created_at.asc&limit=1`;
  const tokens = await supabase(env, query);
  const token = tokens?.[0];
  if (!token) return { error: "not_connected", provider };
  const expiresAt = new Date(token.token_expires_at).getTime();
  if (expiresAt - 300000 > Date.now()) {
    return {
      ok: true,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      account_email: token.account_email,
      account_name: token.account_name,
      platform_user_id: token.platform_user_id
    };
  }
  if (!token.refresh_token) {
    return { error: "no_refresh_token", detail: "Token expired. Please reconnect.", provider };
  }
  const cfg = getProviderConfig(env, provider, token.metadata?.scope || "");
  if (!cfg?.client_id) return { error: "provider_not_configured", provider };
  try {
    const r = await fetch(cfg.token_url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cfg.client_id,
        client_secret: cfg.client_secret,
        refresh_token: token.refresh_token,
        grant_type: "refresh_token"
      })
    });
    const newTokens = await r.json();
    if (!r.ok || newTokens.error) {
      return { error: "refresh_failed", detail: newTokens.error_description || newTokens.error, provider };
    }
    await supabase(env, `/rest/v1/platform_tokens?id=eq.${token.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || token.refresh_token,
        token_expires_at: new Date(Date.now() + (newTokens.expires_in || 3600) * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    return {
      ok: true,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || token.refresh_token,
      account_email: token.account_email,
      account_name: token.account_name,
      platform_user_id: token.platform_user_id
    };
  } catch (e) {
    return { error: "refresh_exception", detail: e.message, provider };
  }
}
__name(getValidAccessTokenFromDB, "getValidAccessTokenFromDB");

async function getUserConnectedAccounts(env, userId, platform = null) {
  let query = `/rest/v1/platform_tokens?select=platform,account_email,account_name,is_primary,created_at,updated_at&user_id=eq.${userId}&is_active=eq.true`;
  if (platform) {
    query += `&platform=eq.${platform}`;
  }
  query += `&order=platform.asc,is_primary.desc,created_at.asc`;
  const data = await supabase(env, query);
  return Array.isArray(data) ? data : [];
}
__name(getUserConnectedAccounts, "getUserConnectedAccounts");

async function disconnectAccount(env, userId, provider, accountEmail) {
  const account = await supabase(
    env,
    `/rest/v1/platform_tokens?select=id,is_primary&user_id=eq.${userId}&platform=eq.${provider}&account_email=eq.${encodeURIComponent(accountEmail)}&limit=1`
  );
  if (!account?.length) return false;
  await supabase(env, `/rest/v1/platform_tokens?id=eq.${account[0].id}`, {
    method: "DELETE"
  });
  if (account[0].is_primary) {
    const remaining = await supabase(
      env,
      `/rest/v1/platform_tokens?select=id&user_id=eq.${userId}&platform=eq.${provider}&limit=1&order=created_at.asc`
    );
    if (remaining?.length) {
      await supabase(env, `/rest/v1/platform_tokens?id=eq.${remaining[0].id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_primary: true })
      });
    }
  }
  return true;
}
__name(disconnectAccount, "disconnectAccount");

async function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { codeVerifier, codeChallenge };
}
__name(generatePKCE, "generatePKCE");

// ── Provider Config ──────────────────────────────────────────────────────────
function getProviderConfig(env, provider, scope) {
  const redirectUri = `${WORKER_BASE}/api/oauth/callback`;
  const ownedRedirect = "https://oauth.ceogps.com/api/oauth/callback";

  console.log(`[getProviderConfig] provider=${provider}, GOOGLE_CLIENT_ID=${env.GOOGLE_CLIENT_ID ? "SET" : "EMPTY"}`);
  
  const configs = {
      google: {
        auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
        token_url: "https://oauth2.googleapis.com/token",
        client_id: env.GOOGLE_CLIENT_ID || "",
        client_secret: env.GOOGLE_CLIENT_SECRET || "",
        scope: [
          "email", "profile", "openid",
          "https://mail.google.com/",
          "https://www.googleapis.com/auth/gmail.modify",
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.upload"
        ].join(" "),
        redirect_uri: ownedRedirect
      },
      microsoft: {
        auth_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        client_id: env.MICROSOFT_CLIENT_ID || "",
        client_secret: env.MICROSOFT_CLIENT_SECRET || "",
        scope: "Mail.Read email profile offline_access",
        redirect_uri: ownedRedirect
      },
      github: {
        auth_url: "https://github.com/login/oauth/authorize",
        token_url: "https://github.com/login/oauth/access_token",
        client_id: env.GITHUB_CLIENT_ID || "",
        client_secret: env.GITHUB_CLIENT_SECRET || "",
        scope: "repo user",
        redirect_uri: ownedRedirect
      },
      slack: {
        auth_url: "https://slack.com/oauth/v2/authorize",
        token_url: "https://slack.com/api/oauth.v2.access",
        client_id: env.SLACK_CLIENT_ID || "",
        client_secret: env.SLACK_CLIENT_SECRET || "",
        scope: "chat:write channels:read",
        redirect_uri: ownedRedirect
      },
      linkedin: {
        auth_url: "https://www.linkedin.com/oauth/v2/authorization",
        token_url: "https://www.linkedin.com/oauth/v2/accessToken",
        client_id: env.LINKEDIN_CLIENT_ID || "",
        client_secret: env.LINKEDIN_CLIENT_SECRET || "",
        scope: "openid profile email w_member_social r_organization_social rw_organization_admin",
        redirect_uri: ownedRedirect
      },
    facebook: {
      auth_url: "https://www.facebook.com/v25.0/dialog/oauth",
      token_url: "https://graph.facebook.com/v25.0/oauth/access_token",
      client_id: env.META_APP_ID || "",
      client_secret: env.META_APP_SECRET || "",
      scope: "pages_manage_posts pages_read_engagement pages_show_list pages_manage_metadata instagram_basic instagram_content_publish instagram_manage_insights ads_management business_management",
      redirect_uri: ownedRedirect
    },
    instagram: {
      auth_url: "https://www.facebook.com/v25.0/dialog/oauth",
      token_url: "https://graph.facebook.com/v25.0/oauth/access_token",
      client_id: env.META_APP_ID || "",
      client_secret: env.META_APP_SECRET || "",
      scope: "instagram_basic instagram_content_publish instagram_manage_insights instagram_manage_comments pages_show_list",
      redirect_uri: ownedRedirect
    },
    twitter: {
          auth_url: "https://twitter.com/i/oauth2/authorize",
          token_url: "https://api.twitter.com/2/oauth2/token",
          client_id: env.TWITTER_CLIENT_ID || "",
          client_secret: env.TWITTER_CLIENT_SECRET || "",
          scope: "tweet.read tweet.write users.read offline.access",
          redirect_uri: ownedRedirect
        },
        zoom: {
          auth_url: "https://zoom.us/oauth/authorize",
          token_url: "https://zoom.us/oauth/token",
          client_id: env.ZOOM_CLIENT_ID || "",
          client_secret: env.ZOOM_CLIENT_SECRET || "",
          scope: "meeting:read meeting:write",
          redirect_uri: ownedRedirect
        },
        clickup: {
          auth_url: "https://app.clickup.com/api",
          token_url: "https://api.clickup.com/api/v2/oauth/token",
          client_id: env.CLICKUP_CLIENT_ID || "",
          client_secret: env.CLICKUP_CLIENT_SECRET || "",
          scope: "",
          redirect_uri: ownedRedirect
        },
        airtable: {
          auth_url: "https://airtable.com/oauth2/v1/authorize",
          token_url: "https://airtable.com/oauth2/v1/token",
          client_id: env.AIRTABLE_CLIENT_ID || "",
          client_secret: env.AIRTABLE_CLIENT_SECRET || "",
          scope: "data.records:read data.records:write",
          redirect_uri: ownedRedirect
        },
        tiktok: {
          auth_url: "https://www.tiktok.com/auth/authorize/",
          token_url: "https://open-api.tiktok.com/oauth/access_token/",
          client_id: env.TIKTOK_CLIENT_ID || "",
          client_secret: env.TIKTOK_CLIENT_SECRET || "",
          scope: "user.info.basic video.list",
          redirect_uri: ownedRedirect
        },
        spotify: {
          auth_url: "https://accounts.spotify.com/authorize",
          token_url: "https://accounts.spotify.com/api/token",
          client_id: env.SPOTIFY_CLIENT_ID || "",
          client_secret: env.SPOTIFY_CLIENT_SECRET || "",
          scope: "user-read-playback-state user-modify-playback-state playlist-read-private",
          redirect_uri: ownedRedirect
        },
        yahoo: {
          auth_url: "https://api.login.yahoo.com/oauth2/request_auth",
          token_url: "https://api.login.yahoo.com/oauth2/get_token",
          client_id: env.YAHOO_CLIENT_ID || "",
          client_secret: env.YAHOO_CLIENT_SECRET || "",
          scope: "mail-r mail-w",
          redirect_uri: ownedRedirect
        },
        aol: {
          auth_url: "https://api.login.aol.com/oauth2/request_auth",
          token_url: "https://api.login.aol.com/oauth2/get_token",
          client_id: env.YAHOO_CLIENT_ID || "",
          client_secret: env.YAHOO_CLIENT_SECRET || "",
          scope: "mail-r mail-w",
          redirect_uri: ownedRedirect
        },
        calendly: {
          auth_url: "https://auth.calendly.com/oauth/authorize",
          token_url: "https://auth.calendly.com/oauth/token",
          client_id: env.CALENDLY_CLIENT_ID || "",
          client_secret: env.CALENDLY_CLIENT_SECRET || "",
          scope: "scheduling:read scheduling:write user:read",
          redirect_uri: ownedRedirect
        }
  };
  return configs[provider] || null;
}
__name(getProviderConfig, "getProviderConfig");

async function handleOAuthStart(req, env, url) {
  try {
    const providerName = url.searchParams.get("provider");
    const scope = url.searchParams.get("scope") || "";
    const userId = url.searchParams.get("user_id") || "unknown";
    const loginHint = url.searchParams.get("hint") || "";
    const accountEmail = url.searchParams.get("account_email") || "";

    console.log(`[OAUTH START] ENTERED - provider=${providerName}, userId=${userId}, env.LIFEOS_KV=${env.LIFEOS_KV ? "exists" : "MISSING"}`);

  const cfg = getProviderConfig(env, providerName, scope);
  if (!cfg) return new Response("Unknown provider", { status: 400 });

  console.log(`[OAUTH START] cfg.client_id=${cfg.client_id ? "SET" : "EMPTY"}, client_secret=${cfg.client_secret ? "SET" : "EMPTY"}`);
  
  if (!cfg.client_id) {
    return new Response(
      `<html><body style="background:#0d0e17;color:#f0ede8;font-family:system-ui;padding:40px">
      <h2 style="color:#4ab3f4">⚙️ ${providerName} OAuth Setup Needed</h2>
      <p>Add <code>${providerName.toUpperCase()}_CLIENT_ID</code> and <code>${providerName.toUpperCase()}_CLIENT_SECRET</code> as Wrangler secrets.</p>
    </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  console.log(`[OAUTH START] Generating PKCE...`);
  const PKCE_PROVIDERS = new Set(["google", "microsoft", "twitter", "airtable", "linkedin", "zoom", "clickup", "slack", "spotify", "tiktok", "yahoo", "aol", "calendly"]);
    const usePKCE = PKCE_PROVIDERS.has(providerName);
    const state = crypto.randomUUID();
    console.log(`[OAUTH START] State generated: ${state}`);
  
    let codeVerifier, codeChallenge;
    try {
      const pkce = await generatePKCE();
      codeVerifier = pkce.codeVerifier;
      codeChallenge = pkce.codeChallenge;
      console.log(`[OAUTH START] PKCE generated successfully`);
    } catch (e) {
      console.error(`[OAUTH START] PKCE generation FAILED: ${e.message}`, e.stack);
      return new Response(`PKCE generation failed: ${e.message}`, { status: 500 });
    }

  try {
    await env.LIFEOS_KV.put(
      `oauth_state:${state}`,
      JSON.stringify({
        provider: providerName,
        codeVerifier,
        usePKCE,
        userId,
        accountEmail,
        scope,
        timestamp: Date.now()
      }),
      { expirationTtl: 900 }
    );
    console.log(`[OAUTH START] KV put done`);
  } catch (e) {
    console.error(`[OAUTH START] KV put ERROR: ${e.message}`);
    return new Response(`KV put failed: ${e.message}`, { status: 500 });
  }

  console.log(`[OAUTH START] Building auth URL for ${cfg.auth_url}`);
  const authUrl = new URL(cfg.auth_url);
  console.log(`[OAUTH START] client_id: ${cfg.client_id ? cfg.client_id.substring(0, 20) + "..." : "EMPTY"}`);
  console.log(`[OAUTH START] redirect_uri: ${cfg.redirect_uri}`);
  console.log(`[OAUTH START] scope: ${cfg.scope}`);
  
  authUrl.searchParams.set("client_id", cfg.client_id);
  authUrl.searchParams.set("redirect_uri", cfg.redirect_uri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", cfg.scope);
  authUrl.searchParams.set("state", state);

  if (usePKCE) {
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
  }

  if (providerName === "google") {
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent select_account");
    if (loginHint) authUrl.searchParams.set("login_hint", loginHint);
  } else if (providerName === "microsoft") {
    authUrl.searchParams.set("prompt", "consent select_account");
    if (loginHint) authUrl.searchParams.set("login_hint", loginHint);
  } else if (providerName === "twitter") {
    authUrl.searchParams.set("force_login", "true");
  } else if (providerName === "facebook" || providerName === "instagram") {
    authUrl.searchParams.set("display", "popup");
    authUrl.searchParams.set("auth_type", "rerequest");
  } else if (providerName === "slack") {
    authUrl.searchParams.set("user_scope", cfg.scope);
  } else if (providerName === "spotify") {
    authUrl.searchParams.set("show_dialog", "true");
  }

  return Response.redirect(authUrl.toString(), 302);
    } catch (e) {
      console.error(`[OAUTH START] FATAL ERROR: ${e.message}`, e.stack);
      return new Response(`OAuth start failed: ${e.message}`, { status: 500 });
    }
  }
  __name(handleOAuthStart, "handleOAuthStart");

async function handleOAuthCallback(req, env, url) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return new Response("Missing parameters", { status: 400 });

  const stored = await env.LIFEOS_KV.get(`oauth_state:${state}`, "json");
  if (!stored) return new Response("Invalid or expired state", { status: 400 });

  const cfg = getProviderConfig(env, stored.provider, stored.scope || "");
  if (!cfg || !cfg.client_id) return new Response("Provider config error", { status: 500 });

  const PKCE_PROVIDERS = new Set(["google", "microsoft", "twitter", "airtable", "linkedin", "zoom", "clickup", "slack", "spotify", "tiktok", "yahoo", "aol", "calendly"]);

  const tokenParams = {
    client_id: cfg.client_id,
    client_secret: cfg.client_secret,
    code,
    redirect_uri: cfg.redirect_uri,
    grant_type: "authorization_code"
  };

  if (stored.usePKCE || PKCE_PROVIDERS.has(stored.provider)) {
    tokenParams.code_verifier = stored.codeVerifier;
  }

  const tokenHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json"
  };

  if (stored.provider === "twitter") {
    tokenHeaders["Authorization"] = "Basic " + btoa(`${cfg.client_id}:${cfg.client_secret}`);
    delete tokenParams.client_secret;
  }

  const tokenRes = await fetch(cfg.token_url, {
    method: "POST",
    headers: tokenHeaders,
    body: new URLSearchParams(tokenParams)
  });

  const tokens = await tokenRes.json();

  if (!tokenRes.ok || tokens.error) {
    const msg = tokens.error_description || tokens.error || "Token exchange failed";
    return new Response(
      `<html><body style="background:#0d0e17;color:#ff4f5e;font-family:system-ui;padding:40px">
      <h2>❌ Connection Failed</h2><p>${msg}</p>
      <script>setTimeout(()=>window.close(),4000)</script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Fetch identity
  let identity = { email: null, name: null, id: null };
  const authHeader = `Bearer ${tokens.access_token}`;

  try {
    if (stored.provider === "google") {
      const r = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: authHeader }
      });
      identity = await r.json();
    } else if (stored.provider === "microsoft") {
      const r = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: d.mail || d.userPrincipalName, name: d.displayName, id: d.id };
    } else if (stored.provider === "github") {
      const r = await fetch("https://api.github.com/user", {
        headers: { Authorization: authHeader, "User-Agent": "LifeOS1" }
      });
      const d = await r.json();
      identity = { email: d.email, name: d.name || d.login, id: String(d.id) };
    } else if (stored.provider === "facebook" || stored.provider === "instagram") {
      const r = await fetch(
        `https://graph.facebook.com/v25.0/me?fields=id,name,email&access_token=${encodeURIComponent(tokens.access_token)}`
      );
      const d = await r.json();
      identity = { email: d.email, name: d.name, id: d.id };
    } else if (stored.provider === "linkedin") {
      const r = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: d.email, name: d.name, id: d.sub };
    } else if (stored.provider === "twitter") {
      const r = await fetch("https://api.twitter.com/2/users/me?user.fields=username,name", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: null, name: d.data?.name, id: d.data?.id, handle: d.data?.username };
    } else if (stored.provider === "slack") {
      const r = await fetch("https://slack.com/api/users.identity", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: d.user?.email, name: d.user?.name, id: d.user?.id };
    } else if (stored.provider === "zoom") {
      const r = await fetch("https://api.zoom.us/v2/users/me", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: d.email, name: d.first_name + " " + d.last_name, id: d.id };
    } else if (stored.provider === "clickup") {
      const r = await fetch("https://api.clickup.com/api/v2/user", {
        headers: { Authorization: tokens.access_token }
      });
      const d = await r.json();
      identity = { email: d.user?.email, name: d.user?.username, id: String(d.user?.id) };
    } else if (stored.provider === "airtable") {
      const r = await fetch("https://api.airtable.com/v0/meta/whoami", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: d.email, name: d.name || d.id, id: d.id };
    } else if (stored.provider === "spotify") {
      const r = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: d.email, name: d.display_name, id: d.id };
    } else if (stored.provider === "tiktok") {
      const r = await fetch("https://open-api.tiktok.com/user/info/", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: null, name: d.data?.user?.display_name, id: d.data?.user?.open_id, handle: d.data?.user?.username };
    } else if (stored.provider === "yahoo" || stored.provider === "aol") {
      const r = await fetch("https://api.login.yahoo.com/openid/v1/userinfo", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: d.email, name: d.name, id: d.sub };
    } else if (stored.provider === "calendly") {
      const r = await fetch("https://api.calendly.com/users/me", {
        headers: { Authorization: authHeader }
      });
      const d = await r.json();
      identity = { email: d.resource?.email, name: d.resource?.name, id: d.resource?.uri };
    }
  } catch (e) {
    console.warn("Identity fetch failed:", e.message);
  }

  const userId = stored.userId || "chris-green";
  const accountEmail = stored.accountEmail || identity.email || "";

  if (identity.email || stored.provider === "twitter") {
    await saveOAuthTokensToSupabase(
      env,
      stored.provider,
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
        scope: tokens.scope || cfg.scope,
        token_type: tokens.token_type || "Bearer"
      },
      userId,
      identity.email || accountEmail,
      identity.name || "",
      identity.id || ""
    );
  }

  // Store in KV
  const kvRec = {
    connected: true,
    identity,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
    scope: tokens.scope || cfg.scope,
    token_type: tokens.token_type || "Bearer",
    userId
  };

  await env.LIFEOS_KV.put(`oauth_${stored.provider}`, JSON.stringify(kvRec));

  // Index for multi-account support
  const idxKey = `oauth_index_${stored.provider}`;
  const idx = await env.LIFEOS_KV.get(idxKey, "json") || [];
  const without = idx.filter((a) => a.email !== identity.email);
  without.push({ email: identity.email, name: identity.name, userId, connected_at: Date.now() });
  await env.LIFEOS_KV.put(idxKey, JSON.stringify(without));

  await env.LIFEOS_KV.delete(`oauth_state:${state}`);

  const who = identity.email || identity.name || identity.handle || "Account";

  return new Response(
    `
    <html><head><style>
      body{background:#0d0e17;color:#f0ede8;font-family:system-ui;padding:40px;text-align:center}
      h2{color:#00c896}.check{font-size:64px}.who{color:#4ab3f4;font-size:14px;margin-top:8px}
    </style></head>
    <body>
      <div class="check">✅</div>
      <h2>${stored.provider.charAt(0).toUpperCase() + stored.provider.slice(1)} Connected</h2>
      <div class="who">${who}</div>
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: "oauth_success",
            provider: "${stored.provider}",
            userId: "${userId}",
            identity: ${JSON.stringify(identity)}
          }, "*");
        }
        setTimeout(() => window.close(), 2500);
      <\/script>
    </body></html>
    `,
    { headers: { "Content-Type": "text/html" } }
  );
}
__name(handleOAuthCallback, "handleOAuthCallback");

async function handleOAuthStatus(req, env, url) {
  const userId = url.searchParams.get("user_id") || "";
  const provider = url.searchParams.get("provider");

  if (provider) {
    // Check specific provider
    const data = await kvGet(env, `oauth_${provider}`, "json");
    return json({
      connected: !!(data?.connected || data?.access_token),
      provider,
      identity: data?.identity || null,
      user_id: userId
    });
  }

  // Return all connected providers
  const providers = ["google", "microsoft", "facebook", "instagram", "linkedin", "twitter", "slack", "github", "zoom", "clickup", "airtable", "spotify", "tiktok", "yahoo", "aol", "calendly"];
  const statuses = {};

  for (const p of providers) {
    const d = await kvGet(env, `oauth_${p}`, "json");
    if (d?.connected || d?.access_token) {
      statuses[p] = {
        connected: true,
        identity: d.identity || null,
        scope: d.scope || null
      };
    } else {
      statuses[p] = { connected: false };
    }
  }

  return json({ connected: Object.keys(statuses).filter(k => statuses[k].connected), statuses });
  }
  __name(handleOAuthStatus, "handleOAuthStatus");

  async function handleOAuthVerify(req, env, url) {
    const provider = url.searchParams.get("provider");
    const userId = url.searchParams.get("user_id") || "";
  
    if (!provider) return err("provider required");
  
    const data = await kvGet(env, `oauth_${provider}`, "json");
    const connected = !!(data?.connected || data?.access_token);
  
    return json({
      connected,
      provider,
      identity: data?.identity || null,
      user_id: userId
    });
  }
  __name(handleOAuthVerify, "handleOAuthVerify");

  async function handleOAuthDisconnect(req, env, url) {
  const provider = url.searchParams.get("provider");
  const userId = url.searchParams.get("user_id");
  const accountEmail = url.searchParams.get("account_email") || "";

  if (!provider || !userId) return new Response("Missing parameters", { status: 400 });

  const success = await disconnectAccount(env, userId, provider, accountEmail);

  // Clean up KV
  await env.LIFEOS_KV.delete(`oauth_${provider}`);
  const idxKey = `oauth_index_${provider}`;
  const idx = await env.LIFEOS_KV.get(idxKey, "json") || [];
  const next = idx.filter((a) => a.email !== accountEmail);
  if (next.length === 0) {
    await env.LIFEOS_KV.delete(idxKey);
  } else {
    await env.LIFEOS_KV.put(idxKey, JSON.stringify(next));
  }

  return json({ success });
}
__name(handleOAuthDisconnect, "handleOAuthDisconnect");

// ── OAuth Token Save (Manual) ──────────────────────────────────────────────
async function handleOAuthTokenSave(req, env) {
  try {
    const { provider, access_token, page_id, ig_user_id, bearer_token } = await req.json();
    if (!provider) return err("provider required");

    if (provider === "facebook" || provider === "instagram") {
      if (!access_token) return err("access_token required");
      const test = await fetch(
        `https://graph.facebook.com/v25.0/me?access_token=${encodeURIComponent(access_token)}`
      ).then((r) => r.json()).catch(() => null);
      if (test?.error) return json({ ok: false, error: test.error.message });

      let finalToken = access_token;
      if (access_token.length < 200 && env.META_APP_ID && env.META_APP_SECRET) {
        const ll = await fetch(
          `https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&fb_exchange_token=${encodeURIComponent(access_token)}`
        ).then((r) => r.json()).catch(() => null);
        if (ll?.access_token) finalToken = ll.access_token;
      }

      await env.LIFEOS_KV.put(
        "manual_meta_token",
        JSON.stringify({
          access_token: finalToken,
          page_id: page_id || "",
          ig_user_id: ig_user_id || "",
          saved_at: Date.now()
        })
      );
      return json({ ok: true, token_length: finalToken.length, name: test.name, id: test.id });
    }

    if (provider === "x") {
      if (!bearer_token) return err("bearer_token required");
      const test = await fetch(
        "https://api.twitter.com/2/users/by/username/ceogps?user.fields=id",
        { headers: { Authorization: `Bearer ${bearer_token}` } }
      ).then((r) => r.json()).catch(() => null);
      if (test?.errors) return json({ ok: false, error: test.errors[0]?.detail });
      await env.LIFEOS_KV.put(
        "manual_x_token",
        JSON.stringify({ bearer_token, saved_at: Date.now() })
      );
      return json({ ok: true, handle: test?.data?.username });
    }

    if (provider === "youtube") {
      const { channel_id, channel_handle } = await req.json();
      await env.LIFEOS_KV.put(
        "manual_yt_config",
        JSON.stringify({
          channel_id: channel_id || "",
          channel_handle: channel_handle || "@ceogps",
          saved_at: Date.now()
        })
      );
      return json({ ok: true });
    }

    return err("unsupported provider for manual token save");
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
__name(handleOAuthTokenSave, "handleOAuthTokenSave");

// ── API Key Management ──────────────────────────────────────────────────────
async function handleKeys(req, env, url) {
  const path = url.pathname;

  // GET /api/keys/status-all
  if (path === "/api/keys/status-all" && req.method === "GET") {
    const providers = ["claude", "openai", "gemini", "deepseek", "grok", "groq", "perplexity", "mistral", "cohere", "together", "openrouter", "brevo", "sendgrid", "clickup"];
    const result = {};
    for (const p of providers) {
      const kv = await env.LIFEOS_KV.get(`apikey_${p}`);
      result[p] = { has_key: !!kv };
    }
    return json(result);
  }

  // POST /api/keys/store
  if (path === "/api/keys/store" && req.method === "POST") {
    try {
      const { service, key } = await req.json();
      if (!service || !key) return err("service and key required");
      await env.LIFEOS_KV.put(`apikey_${service}`, String(key));
      await env.LIFEOS_KV.put(`apikey_meta_${service}`, JSON.stringify({
        stored_at: Date.now(),
        last4: String(key).slice(-4)
      }));
      return json({ ok: true, service });
    } catch (e) {
      return err("store failed: " + e.message, 500);
    }
  }

  // GET /api/keys/status
  if (path === "/api/keys/status" && req.method === "GET") {
    const service = url.searchParams.get("service");
    if (!service) return err("service required");
    const meta = await env.LIFEOS_KV.get(`apikey_meta_${service}`, "json");
    const exists = !!await env.LIFEOS_KV.get(`apikey_${service}`);
    return json({ has_key: exists, ...meta || {} });
  }

  // DELETE /api/keys/delete
  if (path === "/api/keys/delete" && req.method === "DELETE") {
    const service = url.searchParams.get("service");
    if (!service) return err("service required");
    await env.LIFEOS_KV.delete(`apikey_${service}`);
    await env.LIFEOS_KV.delete(`apikey_meta_${service}`);
    return json({ ok: true, service, deleted: true });
  }

  // GET /api/keys/get
  if (path === "/api/keys/get" && req.method === "GET") {
    const service = url.searchParams.get("service");
    if (!service) return err("service required");
    const key = await env.LIFEOS_KV.get(`apikey_${service}`);
    if (!key) return json({ found: false });
    return json({ found: true, key });
  }

  // GET /api/keys/get-all
  if (path === "/api/keys/get-all" && req.method === "GET") {
    let result = {};
    let cursor;
    do {
      const listOptions = { prefix: "apikey_" };
      if (cursor) listOptions.cursor = cursor;
      const list = await env.LIFEOS_KV.list(listOptions);
      for (const k of list.keys) {
        if (k.name.includes("_meta_")) continue;
        const service = k.name.replace("apikey_", "");
        result[service] = await env.LIFEOS_KV.get(k.name);
      }
      cursor = list.cursor;
    } while (cursor);
    return json(result);
  }

  return null;
}
__name(handleKeys, "handleKeys");

// ── LLM Invoke ──────────────────────────────────────────────────────────────
async function handleLLM(req, env) {
  const clientIp = req.headers.get("CF-Connecting-IP") || "unknown";
  const rateLimit = await checkRateLimit(env, `llm:${clientIp}`, 60, 30);
  if (!rateLimit.allowed) {
    return json({ error: "Rate limit exceeded. Please try again later." }, 429);
  }

  try {
    const body = await req.json();
    const { prompt = "", system = "", model = "auto", max_tokens = 800 } = body;
    let messages = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length) {
      if (system) messages.push({ role: "system", content: system });
      messages.push({ role: "user", content: prompt });
    }
    if (!messages.length) return err("prompt or messages required");

    const k = async (svc) => {
      const fromKV = await env.LIFEOS_KV.get(`apikey_${svc}`);
      if (fromKV) return fromKV;
      const envMap = {
        claude: "ANTHROPIC_API_KEY",
        openai: "OPENAI_API_KEY",
        gemini: "GEMINI_API_KEY",
        deepseek: "DEEPSEEK_API_KEY",
        grok: "GROK_API_KEY",
        groq: "GROQ_API_KEY",
        mistral: "MISTRAL_API_KEY"
      };
      return envMap[svc] ? env[envMap[svc]] : null;
    };

    const keys = {
      claude: await k("claude"),
      openai: await k("openai"),
      gemini: await k("gemini"),
      deepseek: await k("deepseek"),
      grok: await k("grok"),
      groq: await k("groq"),
      mistral: await k("mistral"),
      cohere: await k("cohere"),
      together: await k("together"),
      openrouter: await k("openrouter"),
      qwen: await k("qwen"),
      novita: await k("novita"),
      fireworks: await k("fireworks"),
      ai21: await k("ai21"),
      perplexity: await k("perplexity")
    };

    const auto = ["groq", "cf_free", "deepseek", "grok", "claude", "openai", "gemini", "mistral", "together", "openrouter", "cohere", "qwen", "novita", "fireworks", "ai21", "perplexity"];
    const m = String(model).toLowerCase();
    let chain = m === "auto" || !m ? auto : [m, ...auto.filter((x) => x !== m)];
    chain = chain.filter((p) => p === "cf_free" || keys[p]);
    if (!chain.includes("cf_free")) chain.push("cf_free");

    const tried = [];

    for (const provider of chain) {
      try {
        let text, statusOk = false;

        if (provider === "claude") {
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": keys.claude,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens,
              system,
              messages: messages.filter((m2) => m2.role !== "system")
            })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.content?.[0]?.text || "";
          statusOk = !!text;
        } else if (provider === "openai") {
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.openai,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "gemini") {
          const contents = messages.filter((m2) => m2.role !== "system").map((m2) => ({
            role: m2.role === "assistant" ? "model" : "user",
            parts: [{ text: m2.content }]
          }));
          const sysInst = system || messages.find((m2) => m2.role === "system")?.content;
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(keys.gemini)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents,
                ...sysInst ? { systemInstruction: { parts: [{ text: sysInst }] } } : {},
                generationConfig: { maxOutputTokens: max_tokens }
              })
            }
          );
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
          statusOk = !!text;
        } else if (provider === "deepseek") {
          const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.deepseek,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "deepseek-chat", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "grok") {
          const r = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.grok,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "grok-2-latest", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "groq") {
          const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.groq,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "mistral") {
          const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.mistral,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "mistral-small-latest", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "qwen") {
          const r = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.qwen,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "qwen-plus", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "novita") {
          const r = await fetch("https://api.novita.ai/v3/openai/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.novita,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "meta-llama/llama-3.1-70b-instruct", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "fireworks") {
          const r = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.fireworks,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "accounts/fireworks/models/llama-v3p1-70b-instruct", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "ai21") {
          const r = await fetch("https://api.ai21.com/studio/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.ai21,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "jamba-1.5-mini", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "perplexity") {
          const r = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + keys.perplexity,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "sonar", messages, max_tokens })
          });
          if (!r.ok) {
            tried.push({ provider, status: r.status, reason: (await r.text()).slice(0, 140) });
            continue;
          }
          const d = await r.json();
          text = d.choices?.[0]?.message?.content || "";
          statusOk = !!text;
        } else if (provider === "cf_free") {
          if (!env.AI) {
            tried.push({ provider, status: 0, reason: "AI binding missing" });
            continue;
          }
          const result = await env.AI.run(
            "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            { messages, max_tokens }
          );
          text = result?.response || result?.result?.response || "";
          statusOk = !!text;
          if (!statusOk) {
            tried.push({ provider, status: 500, reason: "no response" });
            continue;
          }
        }

        if (statusOk) {
          tried.push({ provider, status: 200, reason: "ok" });
          return json({
            text,
            model_used: provider,
            fallback_count: tried.length - 1,
            providers_tried: tried
          });
        }
      } catch (e) {
        tried.push({ provider, status: 0, reason: e.message?.slice(0, 140) || "exception" });
        continue;
      }
    }

    return json({
      text: "[All AI providers unavailable. Add an API key in Integrations.]",
      model_used: null,
      fallback_count: tried.length,
      providers_tried: tried,
      error: "no_provider_responded"
    }, 503);
  } catch (e) {
    return err("LLM invoke failed: " + e.message, 500);
  }
}
__name(handleLLM, "handleLLM");

// ── Meta Graph Helpers ──────────────────────────────────────────────────────
async function graphGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`https://graph.facebook.com/v25.0${path}${sep}access_token=${token}`);
  return r.json();
}
__name(graphGet, "graphGet");

async function graphPost(path, body, token) {
  const r = await fetch(`https://graph.facebook.com/v25.0${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: token })
  });
  return r.json();
}
__name(graphPost, "graphPost");

async function handleMeta(req, env, url) {
  const path = url.pathname;

  const manualMeta = await env.LIFEOS_KV.get("manual_meta_token", "json").catch(() => null);
  const META_TOKEN = manualMeta?.access_token || env.META_PAGE_ACCESS_TOKEN || "";
  const META_PAGE_ID = (manualMeta?.page_id && manualMeta.page_id.length > 5 ? manualMeta.page_id : null) || env.META_PAGE_ID || "";
  const META_IG_ID = (manualMeta?.ig_user_id && manualMeta.ig_user_id.length > 5 ? manualMeta.ig_user_id : null) || env.META_IG_USER_ID || "";

  // GET /api/meta/status
  if (path === "/api/meta/status" && req.method === "GET") {
    try {
      if (!META_TOKEN || META_TOKEN.trim().length < 10) return json({ connected: false, error: "token_missing" });

      let resolvedPageId = META_PAGE_ID && META_PAGE_ID.trim().length > 5 ? META_PAGE_ID : null;
      let resolvedIgId = META_IG_ID && META_IG_ID.trim().length > 5 ? META_IG_ID : null;

      if (!resolvedPageId) {
        const me = await graphGet("/me?fields=id,name,instagram_business_account", META_TOKEN);
        if (me?.error?.type === "OAuthException") {
          return json({ connected: false, error: "token_expired", detail: me.error.message });
        }
        if (me?.id && !me?.error) {
          resolvedPageId = me.id;
          if (!resolvedIgId && me.instagram_business_account?.id) resolvedIgId = me.instagram_business_account.id;
        }
        if (!resolvedPageId) {
          const accounts = await graphGet("/me/accounts?fields=id,name,instagram_business_account", META_TOKEN);
          if (accounts?.data?.length) {
            const first = accounts.data[0];
            resolvedPageId = first.id;
            if (!resolvedIgId && first.instagram_business_account?.id) resolvedIgId = first.instagram_business_account.id;
          }
        }
        if (resolvedPageId) {
          const existing = await env.LIFEOS_KV.get("manual_meta_token", "json").catch(() => null) || {};
          await env.LIFEOS_KV.put("manual_meta_token", JSON.stringify({
            ...existing,
            access_token: META_TOKEN,
            page_id: resolvedPageId,
            ig_user_id: resolvedIgId || ""
          }));
        }
      }

      const page = resolvedPageId ? await graphGet(`/${resolvedPageId}?fields=name,fan_count,followers_count`, META_TOKEN) : null;
      const ig = resolvedIgId ? await graphGet(`/${resolvedIgId}?fields=username,followers_count,media_count`, META_TOKEN) : null;

      const tokenExpired = page?.error?.type === "OAuthException" || ig?.error?.type === "OAuthException";
      if (tokenExpired) {
        return json({ connected: false, error: "token_expired", detail: page?.error?.message || ig?.error?.message });
      }

      return json({
        connected: !!(META_TOKEN && (resolvedPageId || resolvedIgId)),
        page: page && !page.error ? { id: resolvedPageId, name: page.name, fans: page.fan_count, followers: page.followers_count } : null,
        instagram: ig && !ig.error ? { id: resolvedIgId, username: ig.username, followers: ig.followers_count, posts: ig.media_count } : null
      });
    } catch (e) {
      return json({ connected: false, error: e.message });
    }
  }

  // GET /api/meta/feed
  if (path === "/api/meta/feed" && req.method === "GET") {
    const limit = url.searchParams.get("limit") || "10";
    const cached = await env.LIFEOS_KV.get("manual_meta_token", "json").catch(() => null);
    const feedPageId = (cached?.page_id && cached.page_id.length > 5 ? cached.page_id : null) || META_PAGE_ID;
    if (!feedPageId || feedPageId.trim().length < 5) return json({ data: [], error: "page_id_not_set" });
    return json(await graphGet(`/${feedPageId}/feed?fields=message,created_time,likes.summary(true),comments.summary(true)&limit=${limit}`, META_TOKEN));
  }

  // POST /api/meta/post
  if (path === "/api/meta/post" && req.method === "POST") {
    const { message, page_id, media_url } = await req.json();
    const pid = page_id || META_PAGE_ID;
    const body = { message };
    if (media_url) body.link = media_url;
    return json(await graphPost(`/${pid}/feed`, body, META_TOKEN));
  }

  return null;
}
__name(handleMeta, "handleMeta");

// ── LinkedIn Helpers ────────────────────────────────────────────────────────
async function liToken(env) {
  const data = await env.LIFEOS_KV.get("oauth_linkedin", "json");
  return data?.access_token || null;
}
__name(liToken, "liToken");

async function liGet(env, p, token) {
  const r = await fetch("https://api.linkedin.com/v2" + p, {
    headers: {
      Authorization: "Bearer " + token,
      "LinkedIn-Version": "202404",
      "X-Restli-Protocol-Version": "2.0.0"
    }
  });
  return r.json();
}
__name(liGet, "liGet");

async function liPost(env, p, body, token) {
  const r = await fetch("https://api.linkedin.com/v2" + p, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "LinkedIn-Version": "202404",
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const txt = await r.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { raw: txt, status: r.status };
  }
}
__name(liPost, "liPost");

async function handleLinkedIn(req, env, url) {
  const path = url.pathname;

  // GET /api/linkedin/status
  if (path === "/api/linkedin/status" && req.method === "GET") {
    const tok = await liToken(env);
    if (!tok) return json({ connected: false });
    const me = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: "Bearer " + tok }
    }).then((r) => r.json()).catch(() => null);
    return json({
      connected: !!me?.sub,
      profile: me ? { id: me.sub, name: me.name, email: me.email, picture: me.picture } : null
    });
  }

  // GET /api/linkedin/posts
  if (path === "/api/linkedin/posts" && req.method === "GET") {
    const tok = await liToken(env);
    if (!tok) return json({ data: [], error: "not_connected" });
    const me = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: "Bearer " + tok }
    }).then((r) => r.json()).catch(() => null);
    if (!me?.sub) return json({ data: [], error: "no_profile" });
    const author = encodeURIComponent(`urn:li:person:${me.sub}`);
    const data = await liGet(env, `/posts?author=${author}&q=author&count=10`, tok);
    return json(data);
  }

  // POST /api/linkedin/post
  if (path === "/api/linkedin/post" && req.method === "POST") {
    const tok = await liToken(env);
    if (!tok) return err("LinkedIn not connected", 401);
    const { text } = await req.json();
    const me = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: "Bearer " + tok }
    }).then((r) => r.json());
    if (!me?.sub) return err("LinkedIn profile fetch failed", 401);
    const body = {
      author: `urn:li:person:${me.sub}`,
      commentary: text || "",
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    };
    return json(await liPost(env, "/posts", body, tok));
  }

  return null;
}
__name(handleLinkedIn, "handleLinkedIn");

// ── X (Twitter) Helpers ─────────────────────────────────────────────────────
async function handleX(req, env, url) {
  const path = url.pathname;

  const manualX = await kvGet(env, "manual_x_token", "json").catch(() => null);
  const bearer = manualX?.bearer_token || env.X_BEARER_TOKEN || "";

  // GET /api/x/user
  if (path === "/api/x/user" && req.method === "GET") {
    const handle = url.searchParams.get("handle") || "ceogps";
    if (!bearer) return json({ error: "X_BEARER_TOKEN not configured" }, 503);
    try {
      const r = await fetch(
        `https://api.twitter.com/2/users/by/username/${handle}?user.fields=public_metrics,profile_image_url,description,verified`,
        { headers: { Authorization: `Bearer ${bearer}` } }
      );
      const d = await r.json();
      if (d.errors || !d.data) return json({ error: d.errors?.[0]?.detail || "user not found" }, 404);
      const u = d.data;
      return json({
        id: u.id,
        handle: u.username,
        name: u.name,
        followers: u.public_metrics?.followers_count || 0,
        following: u.public_metrics?.following_count || 0,
        tweets: u.public_metrics?.tweet_count || 0,
        avatar: u.profile_image_url?.replace("_normal", "_400x400") || "",
        verified: u.verified || false
      });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // GET /api/x/timeline
  if (path === "/api/x/timeline" && req.method === "GET") {
    const handle = url.searchParams.get("handle") || "ceogps";
    const max = Math.min(parseInt(url.searchParams.get("max") || "10"), 100);
    if (!bearer) return json({ tweets: [], error: "X_BEARER_TOKEN not configured" });
    try {
      const ur = await fetch(
        `https://api.twitter.com/2/users/by/username/${handle}?user.fields=id`,
        { headers: { Authorization: `Bearer ${bearer}` } }
      );
      const ud = await ur.json();
      if (!ud.data?.id) return json({ tweets: [] });
      const userId = ud.data.id;
      const tr = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=${max}&tweet.fields=public_metrics,created_at&exclude=retweets,replies`,
        { headers: { Authorization: `Bearer ${bearer}` } }
      );
      const td = await tr.json();
      const tweets = (td.data || []).map((t) => ({
        id: t.id,
        text: t.text,
        likes: t.public_metrics?.like_count || 0,
        retweets: t.public_metrics?.retweet_count || 0,
        replies: t.public_metrics?.reply_count || 0,
        impressions: t.public_metrics?.impression_count || 0,
        createdAt: t.created_at,
        url: `https://twitter.com/${handle}/status/${t.id}`
      }));
      return json({ tweets });
    } catch (e) {
      return json({ tweets: [], error: e.message });
    }
  }

  return null;
}
__name(handleX, "handleX");

// ── Social Queue ─────────────────────────────────────────────────────────────
async function handleSocialQueue(req, env, url) {
  const path = url.pathname;

  // GET /api/social/queue
  if (path === "/api/social/queue" && req.method === "GET") {
    return json(await env.LIFEOS_KV.get("social_queue", "json") || []);
  }

  // POST /api/social/schedule
  if (path === "/api/social/schedule" && req.method === "POST") {
    const body = await req.json();
    if (!body?.text || !Array.isArray(body?.platforms) || !body.platforms.length) {
      return err("text + platforms[] required");
    }
    const id = crypto.randomUUID();
    const job = {
      id,
      text: body.text,
      image_url: body.image_url || null,
      platforms: body.platforms,
      when: body.when || new Date().toISOString(),
      status: "pending",
      created_at: new Date().toISOString()
    };
    const queue = await env.LIFEOS_KV.get("social_queue", "json") || [];
    queue.push(job);
    await env.LIFEOS_KV.put("social_queue", JSON.stringify(queue));
    return json({ ok: true, id, job });
  }

  // DELETE /api/social/queue
  if (path === "/api/social/queue" && req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return err("id required");
    const q = await env.LIFEOS_KV.get("social_queue", "json") || [];
    await env.LIFEOS_KV.put("social_queue", JSON.stringify(q.filter((j) => j.id !== id)));
    return json({ ok: true, id, cancelled: true });
  }

  // POST /api/social/post
  if (path === "/api/social/post" && req.method === "POST") {
    const { text, image_url, platforms = [] } = await req.json();
    if (!text || !platforms.length) return err("text + platforms[] required");

    const manualMeta = await env.LIFEOS_KV.get("manual_meta_token", "json").catch(() => null);
    const META_TOKEN = manualMeta?.access_token || env.META_PAGE_ACCESS_TOKEN || "";
    const META_PAGE_ID = (manualMeta?.page_id && manualMeta.page_id.length > 5 ? manualMeta.page_id : null) || env.META_PAGE_ID || "";
    const META_IG_ID = (manualMeta?.ig_user_id && manualMeta.ig_user_id.length > 5 ? manualMeta.ig_user_id : null) || env.META_IG_USER_ID || "";

    const results = {};
    for (const pf of platforms) {
      try {
        if (pf === "facebook") {
          results[pf] = await graphPost(
            `/${META_PAGE_ID}/feed`,
            image_url ? { message: text, link: image_url } : { message: text },
            META_TOKEN
          );
        } else if (pf === "instagram") {
          if (!image_url) {
            results[pf] = { error: "instagram requires image_url" };
            continue;
          }
          const c = await graphPost(
            `/${META_IG_ID}/media`,
            { caption: text, image_url },
            META_TOKEN
          );
          results[pf] = c.id ? await graphPost(
            `/${META_IG_ID}/media_publish`,
            { creation_id: c.id },
            META_TOKEN
          ) : c;
        } else if (pf === "linkedin") {
          const tok = await liToken(env);
          if (!tok) {
            results[pf] = { error: "linkedin not connected" };
            continue;
          }
          const me = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: "Bearer " + tok }
          }).then((r) => r.json());
          results[pf] = await liPost(env, "/posts", {
            author: `urn:li:person:${me.sub}`,
            commentary: text,
            visibility: "PUBLIC",
            distribution: {
              feedDistribution: "MAIN_FEED",
              targetEntities: [],
              thirdPartyDistributionChannels: []
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false
          }, tok);
        } else {
          results[pf] = { error: `platform "${pf}" not yet wired` };
        }
      } catch (e) {
        results[pf] = { error: e.message };
      }
    }
    return json({ ok: true, results });
  }

  return null;
}
__name(handleSocialQueue, "handleSocialQueue");

// ── Webhooks ──────────────────────────────────────────────────────────────────
async function handleWebhooks(req, env, url) {
  const path = url.pathname;

  // POST /api/webhook/telegram
  if (path === "/api/webhook/telegram" && req.method === "POST") {
    try {
      const body = await req.json();
      const msg = body.message || body.edited_message;
      if (!msg) return json({ ok: true });
      const chatId = String(msg.chat && msg.chat.id ? msg.chat.id : "");
      const fromName = (msg.from && msg.from.first_name || "") + " " + (msg.from && msg.from.last_name || "");
      const name = fromName.trim() || msg.chat && msg.chat.title || "Telegram User";
      const text = msg.text || "[media]";
      const ts = new Date((msg.date || 0) * 1000 || Date.now()).toISOString();
      const convId = "telegram_" + chatId;
      const systemUserId = await getSystemUserId(env);

      await supabase(env, "/rest/v1/conversations", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: JSON.stringify({
          id: convId,
          user_id: systemUserId,
          contact_name: name,
          contact_initials: name.slice(0, 2).toUpperCase(),
          platforms: ["telegram"],
          primary_platform: "telegram",
          is_group: false,
          unread_count: 1,
          last_message_at: ts,
          created_at: ts
        })
      });

      await supabase(env, "/rest/v1/messages", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: JSON.stringify({
          id: "tg_" + (msg.message_id || Date.now()) + "_" + chatId,
          user_id: systemUserId,
          conversation_id: convId,
          platform: "telegram",
          sender_type: "contact",
          content: text,
          message_type: "text",
          status: "received",
          created_at: ts
        })
      });

      return json({ ok: true });
    } catch (e) {
      return json({ ok: true, warn: e.message });
    }
  }

  // GET /api/webhook/meta - verification
  if (path === "/api/webhook/meta" && req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === "lifeos1_meta_verify_2026") {
      return new Response(challenge, { status: 200, headers: CORS });
    }
    return new Response("Forbidden", { status: 403, headers: CORS });
  }

  // POST /api/webhook/meta
  if (path === "/api/webhook/meta" && req.method === "POST") {
    try {
      const body = await req.json();
      const systemUserId = await getSystemUserId(env);

      for (const entry of body.entry || []) {
        for (const event of entry.messaging || []) {
          if (!event.message || event.message.is_echo) continue;
          const senderId = event.sender && event.sender.id ? event.sender.id : "unknown";
          const text = event.message && event.message.text || "[media]";
          const ts = new Date(event.timestamp || Date.now()).toISOString();
          const convId = "messenger_" + senderId;

          await supabase(env, "/rest/v1/conversations", {
            method: "POST",
            prefer: "resolution=merge-duplicates",
            body: JSON.stringify({
              id: convId,
              user_id: systemUserId,
              contact_name: "Messenger " + senderId,
              contact_initials: "MS",
              platforms: ["messenger"],
              primary_platform: "messenger",
              is_group: false,
              unread_count: 1,
              last_message_at: ts,
              created_at: ts
            })
          });

          await supabase(env, "/rest/v1/messages", {
            method: "POST",
            prefer: "resolution=merge-duplicates",
            body: JSON.stringify({
              id: "msg_" + (event.message && event.message.mid || Date.now()),
              user_id: systemUserId,
              conversation_id: convId,
              platform: "messenger",
              sender_type: "contact",
              content: text,
              message_type: "text",
              status: "received",
              created_at: ts
            })
          });
        }

        for (const change of entry.changes || []) {
          if (change.field !== "messages") continue;
          const val = change.value || {};
          if (!val.message) continue;
          if (val.sender && val.recipient && val.sender.id === val.recipient.id) continue;
          const senderId = val.sender && val.sender.id ? val.sender.id : "unknown";
          const text = val.message && val.message.text || "[media]";
          const ts = new Date((val.timestamp || 0) * 1000 || Date.now()).toISOString();
          const convId = "instagram_" + senderId;

          await supabase(env, "/rest/v1/conversations", {
            method: "POST",
            prefer: "resolution=merge-duplicates",
            body: JSON.stringify({
              id: convId,
              user_id: systemUserId,
              contact_name: "Instagram " + senderId,
              contact_initials: "IG",
              platforms: ["instagram"],
              primary_platform: "instagram",
              is_group: false,
              unread_count: 1,
              last_message_at: ts,
              created_at: ts
            })
          });

          await supabase(env, "/rest/v1/messages", {
            method: "POST",
            prefer: "resolution=merge-duplicates",
            body: JSON.stringify({
              id: "ig_" + (val.message && val.message.mid || Date.now()),
              user_id: systemUserId,
              conversation_id: convId,
              platform: "instagram",
              sender_type: "contact",
              content: text,
              message_type: "text",
              status: "received",
              created_at: ts
            })
          });
        }
      }
      return json({ ok: true });
    } catch (e) {
      return json({ ok: true, warn: e.message });
    }
  }

  return null;
}
__name(handleWebhooks, "handleWebhooks");

// ── Validate Key ─────────────────────────────────────────────────────────────
async function handleValidateKey(req, env) {
  try {
    const { provider, key } = await req.json();
    if (!provider || !key) return err("provider and key required");
    const trimmed = String(key).trim();
    if (!trimmed) return err("key empty");

    let validateUrl, headers = {}, method = "GET", body;

    switch (provider) {
      case "claude":
      case "anthropic":
        validateUrl = "https://api.anthropic.com/v1/models";
        headers = { "x-api-key": trimmed, "anthropic-version": "2023-06-01" };
        break;
      case "openai":
      case "gpt":
        validateUrl = "https://api.openai.com/v1/models";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "gemini":
      case "google_ai":
        validateUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}`;
        break;
      case "grok":
      case "xai":
        validateUrl = "https://api.x.ai/v1/models";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "groq":
        validateUrl = "https://api.groq.com/openai/v1/models";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "deepseek":
        validateUrl = "https://api.deepseek.com/v1/models";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "perplexity":
        validateUrl = "https://api.perplexity.ai/chat/completions";
        method = "POST";
        headers = { Authorization: "Bearer " + trimmed, "Content-Type": "application/json" };
        body = JSON.stringify({ model: "sonar", messages: [{ role: "user", content: "hi" }], max_tokens: 1 });
        break;
      case "brevo":
        validateUrl = "https://api.brevo.com/v3/account";
        headers = { "api-key": trimmed };
        break;
      case "sendgrid":
        validateUrl = "https://api.sendgrid.com/v3/scopes";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "mailchimp": {
        const dc = trimmed.split("-").pop();
        validateUrl = `https://${dc}.api.mailchimp.com/3.0/ping`;
        headers = { Authorization: "Bearer " + trimmed };
        break;
      }
      case "clickup":
        validateUrl = "https://api.clickup.com/api/v2/user";
        headers = { Authorization: trimmed };
        break;
      case "mistral":
        validateUrl = "https://api.mistral.ai/v1/models";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "cohere":
        validateUrl = "https://api.cohere.com/v1/check-api-key";
        method = "POST";
        headers = { Authorization: "Bearer " + trimmed, "Content-Type": "application/json" };
        body = "{}";
        break;
      case "together":
        validateUrl = "https://api.together.xyz/v1/models";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "openrouter":
        validateUrl = "https://openrouter.ai/api/v1/models";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "fireworks":
        validateUrl = "https://api.fireworks.ai/inference/v1/models";
        headers = { Authorization: "Bearer " + trimmed };
        break;
      case "elevenlabs":
      case "runway":
      case "replicate":
      case "nylas":
      case "cloudflare":
      case "stripe":
        return json({ valid: true, detail: "saved (no live validator)" });
      default:
        return json({ valid: null, status: 0, detail: "no validator for " + provider });
    }

    let upstream, upstreamText = "";
    try {
      upstream = await fetch(validateUrl, { method, headers, body });
      upstreamText = await upstream.text();
    } catch (e) {
      return json({ valid: false, status: 0, detail: "network error: " + e.message });
    }

    const valid = upstream.ok;
    let detail = "", identity = null;
    try {
      const j = JSON.parse(upstreamText);
      if (!valid) {
        detail = j.error?.message || j.message || j.error || upstreamText.slice(0, 200);
      } else {
        if (provider === "brevo") identity = { email: j.email, name: `${j.firstName || ""} ${j.lastName || ""}`.trim() };
        if (provider === "clickup") identity = { email: j.user?.email, name: j.user?.username, id: j.user?.id };
      }
    } catch {
      if (!valid) detail = upstreamText.slice(0, 200);
    }

    return json({ valid, status: upstream.status, detail, identity });
  } catch (e) {
    return err("validate failed: " + e.message, 500);
  }
}
__name(handleValidateKey, "handleValidateKey");

// ── Main Worker ──────────────────────────────────────────────────────────────
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS preflight
        if (req.method === "OPTIONS") {
          return new Response(null, { headers: CORS });
        }

        // Health check (public, no auth required)
        if (path === "/api/health" && req.method === "GET") {
          return json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            services: {
              supabase: "connected",
              email: "operational",
            },
          });
        }

        // Weather (free, no API key - Open-Meteo)
        if (path === "/api/weather" && req.method === "GET") {
          const lat = url.searchParams.get("latitude");
          const lon = url.searchParams.get("longitude");

          if (!lat || !lon) {
            return json({ error: "Missing latitude/longitude" }, 400);
          }

          try {
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index&timezone=America/New_York`
            );

            if (!response.ok) {
              return json({ error: "Weather service unavailable" }, 503);
            }

            const data = await response.json();
            return json(data);
          } catch (e) {
            return json({ error: e.message }, 500);
          }
        }

        // OAuth Status (public for checking connected providers)
        if (path === "/api/oauth/status" && req.method === "GET") {
          return handleOAuthStatus(req, env, url);
        }
        if (path === "/api/oauth/status/all" && req.method === "GET") {
          return handleOAuthStatus(req, env, url);
        }

        // OAuth Start (public, no auth required)
        if (path === "/api/oauth/start" && req.method === "GET") {
          return handleOAuthStart(req, env, url);
        }

        // OAuth Callback (public, no auth required)
                if (path === "/api/oauth/callback" && req.method === "GET") {
                  return handleOAuthCallback(req, env, url);
                }

                // OAuth Verify (public, checks if provider is connected)
                if (path === "/api/oauth/verify" && req.method === "GET") {
                  return handleOAuthVerify(req, env, url);
                }

                // OAuth Disconnect (requires auth)
                if (path === "/api/oauth/disconnect" && req.method === "POST") {
                  return handleOAuthDisconnect(req, env, url);
                }

                // Validate Key (public, no auth required)
        if (path === "/api/validate-key" && req.method === "POST") {
          return handleValidateKey(req, env);
        }

        // Webhook endpoints (public, no auth required)
        if (path === "/api/webhook/telegram" && req.method === "POST") {
          return handleWebhookTelegram(req, env);
        }
        if (path === "/api/webhook/meta" && req.method === "POST") {
          return handleWebhookMeta(req, env);
        }

        // Auth for protected endpoints
        const authHeader = req.headers.get("Authorization");
        let currentUser = null;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          try {
            const body = await req.json();
            const code = body.code;
            const grantType = body.grant_type;

            if (grantType !== "authorization_code" || !code) {
              return err("invalid_request", 400);
            }

            const codeDataStr = await kvGet(env, `oauth_code:${code}`);
            if (!codeDataStr) return err("invalid_grant", 400);

            const codeData = JSON.parse(codeDataStr);
            await kvDelete(env, `oauth_code:${code}`);

            const accessToken = `lo_${crypto.randomUUID().replace(/-/g, "")}`;
            const expiresIn = 3600;
            await env.LIFEOS_KV.put(
              `oauth_token:${accessToken}`,
              JSON.stringify({
                user_id: codeData.user_id,
                client_id: codeData.client_id,
                scope: codeData.scope,
                created: Date.now()
              }),
              { expirationTtl: expiresIn + 60 }
            );

            return json({
              access_token: accessToken,
              token_type: "Bearer",
              expires_in: expiresIn,
              scope: codeData.scope
            });
          } catch (e) {
            return err(`server_error: ${e.message}`, 500);
          }
        }

    // ── X/Twitter User Lookup ──────────────────────────────────────────────────────
    if (path === "/api/x/user" && req.method === "GET") {
      try {
        const handle = url.searchParams.get("handle") || "ceogps";
        const manualX = await kvGet(env, "manual_x_token", "json").catch(() => null);
        const bearer = manualX?.bearer_token || env.X_BEARER_TOKEN || "";

        if (!bearer) return json({ error: "X_BEARER_TOKEN not configured" }, 503);

        const response = await fetch(
          `https://api.twitter.com/2/users/by/username/${handle}?user.fields=id,name,username,public_metrics`,
          { headers: { Authorization: `Bearer ${bearer}` } }
        );

        const data = await response.json();
        if (!response.ok) {
          return json({ error: data.detail || "X API error" }, response.status);
        }

        return json({ ok: true, user: data.data });
      } catch (e) {
        return json({ error: `X user lookup error: ${e.message}` }, 500);
      }
    }

    // ── Protected Routes (require auth) ──

    // Check auth for protected routes
        if (!currentUser && !["/api/health", "/api/oauth/start", "/api/oauth/callback", "/api/oauth/status", "/api/oauth/verify", "/api/oauth/disconnect", "/api/validate-key", "/api/webhook/telegram", "/api/webhook/meta"].includes(path)) {
          return err("Unauthorized", 401);
        }

    // KV
    if (path === "/api/kv/get" && req.method === "GET") {
      const key = url.searchParams.get("key");
      if (!key) return err("key required");
      const value = await env.LIFEOS_KV.get(key, "json");
      return json({ key, value: value !== null ? value : null });
    }
    if (path === "/api/kv/set" && req.method === "POST") {
      const { key, value } = await req.json();
      if (!key) return err("key required");
      await env.LIFEOS_KV.put(key, JSON.stringify(value));
      return json({ ok: true, key });
    }
    if (path.startsWith("/api/kv/")) {
      const key = decodeURIComponent(path.replace("/api/kv/", ""));
      if (req.method === "GET") return json(await env.LIFEOS_KV.get(key, "json") || null);
      if (req.method === "POST") {
        await env.LIFEOS_KV.put(key, JSON.stringify(await req.json()));
        return json({ ok: true });
      }
      if (req.method === "DELETE") {
        await env.LIFEOS_KV.delete(key);
        return json({ ok: true });
      }
    }

    // API Keys
    const keysResult = await handleKeys(req, env, url);
    if (keysResult) return keysResult;

    // LLM
    if (path === "/api/llm/invoke" && req.method === "POST") {
      return handleLLM(req, env);
    }

    // LLM preference
    if (path === "/api/llm/preference" && req.method === "GET") {
      const preferred = await env.LIFEOS_KV.get("llm_preferred_model") || "auto";
      return json({ preferred });
    }
    if (path === "/api/llm/preference" && req.method === "POST") {
      try {
        const { model } = await req.json();
        const next = String(model || "auto").trim().toLowerCase();
        await env.LIFEOS_KV.put("llm_preferred_model", next);
        return json({ ok: true, preferred: next });
      } catch (e) {
        return err("preference save failed: " + e.message, 500);
      }
    }

    // Meta
    const metaResult = await handleMeta(req, env, url);
    if (metaResult) return metaResult;

    // LinkedIn
    const liResult = await handleLinkedIn(req, env, url);
    if (liResult) return liResult;

    // X (Twitter)
    const xResult = await handleX(req, env, url);
    if (xResult) return xResult;

    // Social Queue
    const socialResult = await handleSocialQueue(req, env, url);
    if (socialResult) return socialResult;

    // Webhooks
    const webhookResult = await handleWebhooks(req, env, url);
    if (webhookResult) return webhookResult;

    // Profile
    if (path === "/api/profile") {
      if (req.method === "GET") {
        const d = await env.LIFEOS_KV.get("profile", "json");
        return json(d || { name: "Chris Green", email: "chris@ceogps.com", location: "Atlanta, GA" });
      }
      if (req.method === "POST") {
        await env.LIFEOS_KV.put("profile", JSON.stringify(await req.json()));
        return json({ ok: true });
      }
    }

    // Upload
    if (path === "/api/upload" && req.method === "POST") {
      const formData = await req.formData();
      const file = formData.get("file");
      const type = formData.get("type") || "general";
      const fileKey = formData.get("key") || `${type}/${Date.now()}_${file.name}`;
      if (!file) return err("No file");
      await env.lifeos_uploads.put(fileKey, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
      });
      const publicUrl = `${WORKER_BASE}/api/files/${encodeURIComponent(fileKey)}`;
      const fileInfo = {
        key: fileKey,
        url: publicUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        type,
        uploadedAt: Date.now()
      };
      const existing = await env.LIFEOS_KV.get("files_" + type, "json") || [];
      await env.LIFEOS_KV.put("files_" + type, JSON.stringify([fileInfo, ...existing].slice(0, 500)));
      if (type === "avatar") {
        const profile = await env.LIFEOS_KV.get("profile", "json") || {};
        profile.avatarUrl = publicUrl;
        await env.LIFEOS_KV.put("profile", JSON.stringify(profile));
      }
      return json({ ok: true, url: publicUrl, key: fileKey });
    }

    // Files
    if (path.startsWith("/api/files/") && req.method === "GET") {
      const fileKey = decodeURIComponent(path.replace("/api/files/", ""));
      const obj = await env.lifeos_uploads.get(fileKey);
      if (!obj) return err("Not found", 404);
      return new Response(obj.body, {
        headers: {
          ...CORS,
          "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000"
        }
      });
    }
    if (path === "/api/files" && req.method === "GET") {
      const type = url.searchParams.get("type") || "general";
      return json(await env.LIFEOS_KV.get("files_" + type, "json") || []);
    }
    if (path.startsWith("/api/files/") && req.method === "DELETE") {
      const fileKey = decodeURIComponent(path.replace("/api/files/", ""));
      await env.lifeos_uploads.delete(fileKey);
      const type = fileKey.split("/")[0];
      const existing = await env.LIFEOS_KV.get("files_" + type, "json") || [];
      await env.LIFEOS_KV.put("files_" + type, JSON.stringify(existing.filter((f) => f.key !== fileKey)));
      return json({ ok: true });
    }

    // Sentinel
    if (path === "/api/sentinel/capture" && req.method === "POST") {
      try {
        const body = await req.json();
        const item = {
          id: "sen_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
          url: body.url || "",
          title: body.title || "Untitled",
          snippet: body.snippet || "",
          selectedText: body.selectedText || "",
          source: body.source || "bookmarklet",
          capturedAt: new Date().toISOString(),
          status: "new",
          aiAction: null
        };
        const existing = JSON.parse(await env.LIFEOS_KV.get("sentinel_items") || "[]");
        const all = [item, ...existing];
        const trimmed = all.slice(0, 500);
        await env.LIFEOS_KV.put("sentinel_items", JSON.stringify(trimmed));
        return json({ ok: true, id: item.id });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }
    if (path === "/api/sentinel/items" && req.method === "GET") {
      try {
        const items = JSON.parse(await env.LIFEOS_KV.get("sentinel_items") || "[]");
        return json({ ok: true, items });
      } catch (e) {
        return json({ ok: false, items: [] });
      }
    }
    if (path.startsWith("/api/sentinel/item/") && req.method === "DELETE") {
      try {
        const itemId = path.replace("/api/sentinel/item/", "");
        const items = JSON.parse(await env.LIFEOS_KV.get("sentinel_items") || "[]");
        const filtered = items.filter((i) => i.id !== itemId);
        await env.LIFEOS_KV.put("sentinel_items", JSON.stringify(filtered));
        return json({ ok: true });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // Not Found
    return new Response("Not Found", { status: 404 });
  }
};