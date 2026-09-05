// worker/index.ts
// Standalone Cloudflare Worker - NO frontend imports

interface Env {
  LIFEOS_KV?: KVNamespace;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_URL?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

// In-memory fallback when KV is not available
const memoryStore = new Map<string, string>();

async function kvGet(env: Env, key: string, type: 'json' | 'text' = 'json'): Promise<any> {
  try {
    const kv = env.LIFEOS_KV;
    if (kv && typeof kv.get === 'function') {
      return type === 'json' 
        ? await kv.get(key, 'json')
        : await kv.get(key);
    }
  } catch (e) {
    console.warn('KV get failed, using memory fallback:', e);
  }
  // Fallback to memory store
  const value = memoryStore.get(key);
  if (value === undefined) return null;
  return type === 'json' ? JSON.parse(value) : value;
}

async function kvPut(env: Env, key: string, value: string): Promise<void> {
  try {
    const kv = env.LIFEOS_KV;
    if (kv && typeof kv.put === 'function') {
      await kv.put(key, value);
      return;
    }
  } catch (e) {
    console.warn('KV put failed, using memory fallback:', e);
  }
  memoryStore.set(key, value);
}

async function kvDelete(env: Env, key: string): Promise<void> {
  try {
    const kv = env.LIFEOS_KV;
    if (kv && typeof kv.delete === 'function') {
      await kv.delete(key);
      return;
    }
  } catch (e) {
    console.warn('KV delete failed, using memory fallback:', e);
  }
  memoryStore.delete(key);
}

// ===== FINANCE ROUTES =====
async function handleFinanceBalances(request: Request, env: Env): Promise<Response> {
  try {
    const balances = await kvGet(env, 'finance_balances', 'json') || {
      checking: 0,
      savings: 0,
      credit: 0,
      investments: 0,
      crypto: 0,
      cash: 0,
      other: 0,
      updated_at: new Date().toISOString(),
    };
    return jsonResponse({ ok: true, balances });
  } catch (e) {
    return errorResponse(`Finance balances error: ${e.message}`);
  }
}

async function handleFinanceBalancesPost(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    await kvPut(env, 'finance_balances', JSON.stringify({
      ...body,
      updated_at: new Date().toISOString(),
    }));
    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(`Finance balances save error: ${e.message}`);
  }
}

// ===== KV ROUTES (generic key-value) =====
async function handleKVGet(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/kv/', '');
    if (!key) return errorResponse('Key required', 400);
    const value = await kvGet(env, key, 'json');
    return jsonResponse({ ok: true, key, value });
  } catch (e) {
    return errorResponse(`KV get error: ${e.message}`);
  }
}

async function handleKVSet(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/kv/', '');
    if (!key) return errorResponse('Key required', 400);
    const body = await request.json();
    await kvPut(env, key, JSON.stringify(body.value));
    return jsonResponse({ ok: true, key });
  } catch (e) {
    return errorResponse(`KV set error: ${e.message}`);
  }
}

async function handleKVDelete(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/kv/', '');
    if (!key) return errorResponse('Key required', 400);
    await kvDelete(env, key);
    return jsonResponse({ ok: true, key });
  } catch (e) {
    return errorResponse(`KV delete error: ${e.message}`);
  }
}

// ===== SOCIAL QUEUE ROUTES =====
async function handleSocialQueueGet(request: Request, env: Env): Promise<Response> {
  try {
    const queue = await kvGet(env, 'social_queue', 'json') || [];
    return jsonResponse({ ok: true, queue });
  } catch (e) {
    return errorResponse(`Social queue get error: ${e.message}`);
  }
}

async function handleSocialQueuePost(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { text, image_url, platforms = [], when } = body;
    if (!text || !platforms.length) {
      return errorResponse('text + platforms[] required', 400);
    }
    const id = crypto.randomUUID();
    const job = {
      id,
      text,
      image_url: image_url || null,
      platforms,
      when: when || new Date().toISOString(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const queue = await kvGet(env, 'social_queue', 'json') || [];
    queue.push(job);
    await kvPut(env, 'social_queue', JSON.stringify(queue));
    return jsonResponse({ ok: true, id, job });
  } catch (e) {
    return errorResponse(`Social queue post error: ${e.message}`);
  }
}

async function handleSocialQueueDelete(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('id required', 400);
    const queue = await kvGet(env, 'social_queue', 'json') || [];
    const filtered = queue.filter((j: any) => j.id !== id);
    await kvPut(env, 'social_queue', JSON.stringify(filtered));
    return jsonResponse({ ok: true, id, cancelled: true });
  } catch (e) {
    return errorResponse(`Social queue delete error: ${e.message}`);
  }
}

// ===== HEALTH ROUTE =====
async function handleHealth(request: Request, env: Env): Promise<Response> {
  return jsonResponse({ 
    ok: true, 
    status: 'healthy', 
    timestamp: new Date().toISOString(), 
    kv: !!(env.LIFEOS_KV && typeof env.LIFEOS_KV.get === 'function') 
  });
}

// ===== MAIN ROUTER =====
async function handleRequest(request: Request, env: Env): Promise<Response> {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Health
  if (path === '/api/health' && method === 'GET') {
    return handleHealth(request, env);
  }

  // Finance
  if (path === '/api/finance/balances' && method === 'GET') {
    return handleFinanceBalances(request, env);
  }
  if (path === '/api/finance/balances' && method === 'POST') {
    return handleFinanceBalancesPost(request, env);
  }

  // KV (generic)
  if (path.startsWith('/api/kv/') && method === 'GET') {
    return handleKVGet(request, env);
  }
  if (path.startsWith('/api/kv/') && method === 'POST') {
    return handleKVSet(request, env);
  }
  if (path.startsWith('/api/kv/') && method === 'DELETE') {
    return handleKVDelete(request, env);
  }

  // Social Queue
  if (path === '/api/social/queue' && method === 'GET') {
    return handleSocialQueueGet(request, env);
  }
  if (path === '/api/social/queue' && method === 'POST') {
    return handleSocialQueuePost(request, env);
  }
  if (path === '/api/social/queue' && method === 'DELETE') {
    return handleSocialQueueDelete(request, env);
  }

  return errorResponse('Not Found', 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },
};