// src/worker/index.ts
// Main Cloudflare Worker entry point - handles all API routes with CORS

import type { KVNamespace, ExecutionContext } from '@cloudflare/workers-types';
import { createRouter } from '../api/router';
import healthRoutes from '../api/health/routes';
import cronRoutes from '../api/cron/routes';
import webhookRoutes from '../api/webhooks/routes';
import zerobounceRoutes from '../api/webhooks/zerobounce/routes';

// Finance routes (inline since they don't exist in src/api yet)
interface Env {
  LIFEOS_KV: KVNamespace;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_URL?: string;
  // Add other bindings as needed
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

async function handleFinanceBalances(request: Request, env: Env): Promise<Response> {
  try {
    // Return mock/empty balances - replace with real logic
    const balances = await env.LIFEOS_KV.get('finance_balances', 'json') || {
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
    await env.LIFEOS_KV.put('finance_balances', JSON.stringify({
      ...body,
      updated_at: new Date().toISOString(),
    }));
    return jsonResponse({ ok: true });
  } catch (e) {
    return errorResponse(`Finance balances save error: ${e.message}`);
  }
}

async function handleKVGet(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/kv/', '');
    const value = await env.LIFEOS_KV.get(key, 'json');
    return jsonResponse({ ok: true, key, value });
  } catch (e) {
    return errorResponse(`KV get error: ${e.message}`);
  }
}

async function handleKVSet(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/kv/', '');
    const body = await request.json();
    await env.LIFEOS_KV.put(key, JSON.stringify(body.value));
    return jsonResponse({ ok: true, key });
  } catch (e) {
    return errorResponse(`KV set error: ${e.message}`);
  }
}

async function handleKVDelete(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/api/kv/', '');
    await env.LIFEOS_KV.delete(key);
    return jsonResponse({ ok: true, key });
  } catch (e) {
    return errorResponse(`KV delete error: ${e.message}`);
  }
}

async function handleSocialQueueGet(request: Request, env: Env): Promise<Response> {
  try {
    const queue = (await env.LIFEOS_KV.get('social_queue', 'json')) as any[] || [];
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
    const queue = (await env.LIFEOS_KV.get('social_queue', 'json')) as any[] || [];
    queue.push(job);
    await env.LIFEOS_KV.put('social_queue', JSON.stringify(queue));
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
    const queue = (await env.LIFEOS_KV.get('social_queue', 'json')) as any[] || [];
    const filtered = queue.filter((j: any) => j.id !== id);
    await env.LIFEOS_KV.put('social_queue', JSON.stringify(filtered));
    return jsonResponse({ ok: true, id, cancelled: true });
  } catch (e) {
    return errorResponse(`Social queue delete error: ${e.message}`);
  }
}

// Create main router with all routes
const router = createRouter();

// Health routes
router.use('/health', healthRoutes);

// Cron routes
router.use('/cron', cronRoutes);

// Webhook routes
router.use('/webhooks', webhookRoutes);
router.use('/webhooks/zerobounce', zerobounceRoutes);

// Finance routes
router.get('/finance/balances', handleFinanceBalances);
router.post('/finance/balances', handleFinanceBalancesPost);

// KV routes (generic key-value storage)
router.get('/kv/*', handleKVGet);
router.post('/kv/*', handleKVSet);
router.delete('/kv/*', handleKVDelete);

// Social media queue routes
router.get('/social/queue', handleSocialQueueGet);
router.post('/social/queue', handleSocialQueuePost);
router.delete('/social/queue', handleSocialQueueDelete);

// Export the worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return router.handle(request, env, ctx);
  },
};