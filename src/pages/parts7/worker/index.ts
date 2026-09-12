export interface Env {
  ENVIRONMENT: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OAUTH_STATE: KVNamespace;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://zero.ceogps.com",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === "/health") {
      return json({ ok: true, env: env.ENVIRONMENT });
    }

    // OAuth start: /oauth/:provider/start
    const startMatch = url.pathname.match(/^\/oauth\/([a-z0-9_-]+)\/start$/);
    if (startMatch && request.method === "GET") {
      return handleOAuthStart(startMatch[1], url, env);
    }

    // OAuth callback: /oauth/:provider/callback
    const callbackMatch = url.pathname.match(/^\/oauth\/([a-z0-9_-]+)\/callback$/);
    if (callbackMatch && request.method === "GET") {
      return handleOAuthCallback(callbackMatch[1], url, env);
    }

    // LLM router: /api/llm/invoke
    if (url.pathname === "/api/llm/invoke" && request.method === "POST") {
      return handleLLMInvoke(request, env);
    }

    return json({ error: "Not found" }, 404);
  },
};

async function handleLLMInvoke(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }
  // TODO: verify the Supabase JWT (authHeader token) against SUPABASE_URL,
  // then route to whichever model provider is configured (Workers AI,
  // OpenAI, Anthropic, etc.) using per-user keys from platform_tokens.
  return json({ error: "LLM routing not yet wired", providers_tried: [] }, 501);
}

async function handleOAuthStart(provider: string, url: URL, env: Env): Promise<Response> {
  // TODO: per-provider authorize URL construction (client_id/scope/redirect_uri),
  // store `state` in OAUTH_STATE KV keyed to the signed-in supabase user id.
  return json({ error: `OAuth start not yet wired for provider: ${provider}` }, 501);
}

async function handleOAuthCallback(provider: string, url: URL, env: Env): Promise<Response> {
  // TODO: exchange `code` for tokens, verify `state` against OAUTH_STATE KV,
  // upsert into Supabase `platform_tokens` table using the service-role key,
  // then redirect back to https://zero.ceogps.com/integrations?connected=<provider>
  return json({ error: `OAuth callback not yet wired for provider: ${provider}` }, 501);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
