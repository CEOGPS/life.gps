// worker/index.ts
// Standalone Cloudflare Worker - NO frontend imports

interface Env {
  LIFEOS_KV?: KVNamespace;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_URL?: string;
  X_BEARER_TOKEN?: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Helper – use this everywhere instead of raw new Response
function corsResponse(body: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  const isJson = typeof body === 'object' || (typeof body === 'string' && body.trim().startsWith('{'));
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      'Content-Type': isJson ? 'application/json' : 'text/plain',
      ...extraHeaders,
    },
  });
}

function errorResponse(message: string, status = 500): Response {
  return corsResponse({ error: message }, status);
}

// Wrapper to ensure CORS headers on ANY response (including 404, errors, etc.)
function withCORS(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(CORS).forEach(([k, v]) => newHeaders.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
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

// ===== LLM INVOKE ROUTE (multi-provider) =====
async function handleLLMInvoke(request: Request, env: Env): Promise<Response> {
  try {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkRateLimit(env, `llm:${clientIp}`, 60, 30);
    if (!rateLimit.allowed) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }
    
    const body = await request.json();
    const { prompt = '', model = 'auto', system = '', messages = [], max_tokens = 800, temperature = 0.2 } = body;
    
    let msgs = Array.isArray(messages) ? messages : [];
    if (!msgs.length) {
      if (system) msgs.push({ role: 'system', content: system });
      msgs.push({ role: 'user', content: prompt });
    }
    if (!msgs.length) return errorResponse('prompt or messages required', 400);
    
    // Get API keys from KV or env
    const getKey = async (svc: string): Promise<string | null> => {
      const fromKV = await kvGet(env, `apikey_${svc}`);
      if (fromKV) return fromKV;
      const envMap: Record<string, string> = {
        claude: 'ANTHROPIC_API_KEY',
        openai: 'OPENAI_API_KEY',
        gemini: 'GEMINI_API_KEY',
        deepseek: 'DEEPSEEK_API_KEY',
        grok: 'GROK_API_KEY',
        groq: 'GROQ_API_KEY',
        mistral: 'MISTRAL_API_KEY',
        cohere: 'COHERE_API_KEY',
        together: 'TOGETHER_API_KEY',
        openrouter: 'OPENROUTER_API_KEY',
        qwen: 'QWEN_API_KEY',
        novita: 'NOVITA_API_KEY',
        fireworks: 'FIREWORKS_API_KEY',
        ai21: 'AI21_API_KEY',
        perplexity: 'PERPLEXITY_API_KEY'
      };
      return envMap[svc] ? env[envMap[svc]] || null : null;
    };
    
    const keys = {
      claude: await getKey('claude'),
      openai: await getKey('openai'),
      gemini: await getKey('gemini'),
      deepseek: await getKey('deepseek'),
      grok: await getKey('grok'),
      groq: await getKey('groq'),
      mistral: await getKey('mistral'),
      cohere: await getKey('cohere'),
      together: await getKey('together'),
      openrouter: await getKey('openrouter'),
      qwen: await getKey('qwen'),
      novita: await getKey('novita'),
      fireworks: await getKey('fireworks'),
      ai21: await getKey('ai21'),
      perplexity: await getKey('perplexity')
    };
    
    // Route to appropriate provider
    const selectedModel = model === 'auto' ? 'deepseek-coder-v2:16b' : model;
    
    // Provider chain for model="auto" - tries each provider directly
    const autoProviders = [
      'groq',
      'cf_free',
      'deepseek',
      'grok',
      'claude',
      'openai',
      'gemini',
      'mistral',
      'together',
      'openrouter',
      'cohere',
      'qwen',
      'novita',
      'fireworks',
      'ai21',
      'perplexity'
    ];
    const m = String(model).toLowerCase();
    let chain = m === 'auto' || !m ? autoProviders : [m, ...autoProviders.filter((x) => x !== m)];
    chain = chain.filter((p) => p === 'cf_free' || keys[p]);
    if (!chain.includes('cf_free')) chain.push('cf_free');
    const tried: string[] = [];
    
    for (const provider of chain) {
      try {
        let text: string | null = null;
        let statusOk = false;
        
        if (provider === 'claude' && keys.claude) {
          const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': keys.claude,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens,
              temperature,
              messages: msgs
            })
          });
          const data = await r.json();
          text = data.content?.[0]?.text;
          statusOk = r.ok;
        } else if (provider === 'openai' && keys.openai) {
          const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.openai}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'groq' && keys.groq) {
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.groq}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'gemini' && keys.gemini) {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keys.gemini}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: msgs.map((msg: any) => ({ role: msg.role === 'system' ? 'user' : msg.role, parts: [{ text: msg.content }] })),
              generationConfig: { maxOutputTokens: max_tokens, temperature }
            })
          });
          const data = await r.json();
          text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          statusOk = r.ok;
        } else if (provider === 'mistral' && keys.mistral) {
          const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.mistral}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'mistral-small-latest',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'deepseek' && keys.deepseek) {
          const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.deepseek}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'grok' && keys.grok) {
          const r = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.grok}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'grok-beta',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'together' && keys.together) {
          const r = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.together}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'openrouter' && keys.openrouter) {
          const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.openrouter}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://lifeos1.pages.dev',
              'X-Title': 'LifeOS'
            },
            body: JSON.stringify({
              model: 'deepseek/deepseek-coder-v2:free',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'cohere' && keys.cohere) {
          const r = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.cohere}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'command-r',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.text;
          statusOk = r.ok;
        } else if (provider === 'qwen' && keys.qwen) {
          const r = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.qwen}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'qwen-turbo',
              input: { messages: msgs },
              parameters: { max_tokens, temperature }
            })
          });
          const data = await r.json();
          text = data.output?.text;
          statusOk = r.ok;
        } else if (provider === 'novita' && keys.novita) {
          const r = await fetch('https://api.novita.ai/v3/openai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.novita}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3.1-8b-instruct',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'fireworks' && keys.fireworks) {
          const r = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.fireworks}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'ai21' && keys.ai21) {
          const r = await fetch('https://api.ai21.com/studio/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.ai21}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'jamba-1.5-mini',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'perplexity' && keys.perplexity) {
          const r = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${keys.perplexity}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-online',
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.choices?.[0]?.message?.content;
          statusOk = r.ok;
        } else if (provider === 'cf_free') {
          // Cloudflare Workers AI (free tier)
          if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) {
            tried.push({ provider, status: 0, reason: 'CF_ACCOUNT_ID or CF_API_TOKEN missing' });
            continue;
          }
          const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.CF_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: msgs,
              max_tokens,
              temperature
            })
          });
          const data = await r.json();
          text = data.result?.response;
          statusOk = r.ok && !!text;
        }
        
        tried.push(provider);
        if (statusOk && text) {
          return jsonResponse({ ok: true, response: text, provider, model });
        }
      } catch (e) {
        tried.push(provider + ': ' + e.message);
        continue;
      }
    }
    
    // Fallback to Ollama
    const ollamaUrl = env.OLLAMA_URL || 'http://localhost:11434';
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: msgs,
        stream: false,
        options: { max_tokens, temperature }
      })
    });
    
    const data = await res.json();
    return jsonResponse({ ok: true, response: data.message?.content || data.error, provider: 'ollama', model: selectedModel });
  } catch (e) {
    return errorResponse(`LLM invoke error: ${e.message}`);
  }
}

// Rate limiting helper using KV
async function checkRateLimit(env: Env, key: string, windowSec: number, maxRequests: number): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const now = Date.now();
    const windowMs = windowSec * 1000;
    const rateKey = `ratelimit:${key}`;
    const data = await kvGet(env, rateKey, 'json') || { requests: [], windowStart: now };
    
    // Clean old requests outside window
    data.requests = data.requests.filter((t: number) => now - t < windowMs);
    
    if (data.requests.length >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    data.requests.push(now);
    await kvPut(env, rateKey, JSON.stringify(data), { expirationTtl: windowSec + 60 });
    return { allowed: true, remaining: maxRequests - data.requests.length };
  } catch (e) {
    // On error, allow request (fail open)
    return { allowed: true, remaining: maxRequests };
  }
}
async function handleBDProxy(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const bdPath = url.pathname.replace('/api/bd', '') || '/';
    const bdKey = env.BD_API_KEY || '';
    if (!bdKey) return errorResponse('BD_API_KEY not configured', 503);
    
    const bdUrl = `https://ceogps.com/api/v2${bdPath}${url.search || ''}`;
    const bdOpts = {
      method: request.method,
      headers: {
        'X-Api-Key': bdKey,
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
      },
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text()
    };
    
    const resp = await fetch(bdUrl, bdOpts);
    const data = await resp.text();
    return corsResponse(data, resp.status, {
      'Content-Type': resp.headers.get('Content-Type') || 'application/json',
    });
  } catch (e) {
    return errorResponse(`BrightData proxy error: ${e.message}`);
  }
}
async function handleSocialPost(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { text, image_url, platforms = [] } = body;
    if (!text || !platforms.length) return errorResponse('text + platforms[] required', 400);
    
    const results: Record<string, any> = {};
    
    for (const pf of platforms) {
      try {
        if (pf === 'facebook') {
          const metaToken = env.META_TOKEN || '';
          const metaPageId = env.META_PAGE_ID || '';
          if (!metaToken || !metaPageId) {
            results[pf] = { error: 'Facebook not configured' };
            continue;
          }
          const r = await fetch(
            `https://graph.facebook.com/${metaPageId}/feed`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(image_url 
                ? { message: text, link: image_url, access_token: metaToken }
                : { message: text, access_token: metaToken })
            }
          );
          results[pf] = await r.json();
        } else if (pf === 'instagram') {
          const metaToken = env.META_TOKEN || '';
          const metaIgId = env.META_IG_ID || '';
          if (!metaToken || !metaIgId) {
            results[pf] = { error: 'Instagram not configured' };
            continue;
          }
          if (!image_url) {
            results[pf] = { error: 'instagram requires image_url' };
            continue;
          }
          const c = await fetch(
            `https://graph.facebook.com/${metaIgId}/media`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ caption: text, image_url, access_token: metaToken })
            }
          );
          const cData = await c.json();
          if (cData.id) {
            const pub = await fetch(
              `https://graph.facebook.com/${metaIgId}/media_publish`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creation_id: cData.id, access_token: metaToken })
              }
            );
            results[pf] = await pub.json();
          } else {
            results[pf] = cData;
          }
        } else if (pf === 'linkedin') {
          const liToken = env.LINKEDIN_TOKEN || '';
          if (!liToken) {
            results[pf] = { error: 'linkedin not connected' };
            continue;
          }
          // LinkedIn API v2 - get user info first
          const me = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${liToken}` }
          }).then((r) => r.json());
          
          // Use the newer /posts API
          const postRes = await fetch('https://api.linkedin.com/v2/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${liToken}`
            },
            body: JSON.stringify({
              author: `urn:li:person:${me.sub}`,
              commentary: text,
              visibility: 'PUBLIC',
              distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: []
              },
              lifecycleState: 'PUBLISHED',
              isReshareDisabledByAuthor: false
            })
          });
          results[pf] = await postRes.json();
        } else if (pf === 'x' || pf === 'twitter') {
          const manualX = await kvGet(env, 'manual_x_token', 'json');
          const bearer = manualX?.bearer_token || env.X_BEARER_TOKEN || '';
          if (!bearer) {
            results[pf] = { error: 'X/Twitter not configured' };
            continue;
          }
          const tweetRes = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${bearer}`
            },
            body: JSON.stringify({ text })
          });
          results[pf] = await tweetRes.json();
        } else {
          results[pf] = { error: `Unknown platform: ${pf}` };
        }
      } catch (e) {
        results[pf] = { error: e.message };
      }
    }
    
    return jsonResponse({ ok: true, results });
  } catch (e) {
    return errorResponse(`Social post error: ${e.message}`);
  }
}
async function handleSocialSchedule(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { text, image_url, platforms = [], when, timezone = 'UTC' } = body;
    if (!text || !platforms.length || !when) {
      return errorResponse('text + platforms[] + when required', 400);
    }
    const id = crypto.randomUUID();
    const job = {
      id,
      text,
      image_url: image_url || null,
      platforms,
      when: new Date(when).toISOString(),
      timezone,
      status: 'scheduled',
      created_at: new Date().toISOString(),
    };
    const queue = await kvGet(env, 'social_queue', 'json') || [];
    queue.push(job);
    await kvPut(env, 'social_queue', JSON.stringify(queue));
    return jsonResponse({ ok: true, id, job });
  } catch (e) {
    return errorResponse(`Social schedule error: ${e.message}`);
  }
}
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

// ===== EMAIL LABELS =====
async function handleEmailLabels(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') || 'gmail';
    const account = url.searchParams.get('account') || 'default';
    
    if (provider === 'gmail') {
      const t = await getValidAccessToken(env, 'google', account);
      if (t.error) return errorResponse(t.error, 401);
      
      const r = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        { headers: { Authorization: `Bearer ${t.access_token}` } }
      );
      if (!r.ok) return errorResponse('gmail_labels_failed', 502);
      
      const d = await r.json();
      const labels = (d.labels || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        unread: l.messagesUnread,
        total: l.messagesTotal
      }));
      return jsonResponse({ provider, account, labels });
    }
    
    // For other providers, try KV first
    const kvLabels = await kvGet(env, `email_labels_${account}`, 'json') || [];
    return jsonResponse({ provider, account, labels: kvLabels });
  } catch (e) {
    return errorResponse(`Email labels error: ${e.message}`);
  }
}

// OAuth token helper
async function getValidAccessToken(env: Env, provider: string, account: string): Promise<{ access_token?: string; error?: string; detail?: string }> {
  const idx = await kvGet(env, `oauth_index_${provider}`, 'json') || [];
  const entry = idx.find((a: any) => a.label === account || a.email === account);
  if (!entry) return { error: 'account_not_found', detail: `No ${provider} account: ${account}` };
  if (!entry.access_token) return { error: 'no_token', detail: 'Account has no access token' };
  // TODO: Check expiry and refresh if needed
  return { access_token: entry.access_token };
}

// ===== EMAIL THREADS =====
async function handleEmailThreads(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') || 'gmail';
    const account = url.searchParams.get('account') || 'default';
    const label = url.searchParams.get('label') || 'INBOX';
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '25', 10));
    
    if (provider === 'gmail') {
      const t = await getValidAccessToken(env, 'google', account);
      if (t.error) return errorResponse(t.error, 401);
      
      const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/threads');
      listUrl.searchParams.set('labelIds', label);
      listUrl.searchParams.set('maxResults', String(limit));
      
      const r = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${t.access_token}` }
      });
      if (!r.ok) return errorResponse('gmail_threads_failed', 502);
      
      const d = await r.json();
      const ids = (d.threads || []).map((x: any) => x.id);
      if (!ids.length) return jsonResponse({ provider, account, label, threads: [] });
      
      const detailed = await Promise.all(
        ids.map(async (id: string) => {
          try {
            const dr = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${t.access_token}` } }
            );
            if (!dr.ok) return null;
            const th = await dr.json();
            const msgs = th.messages || [];
            const last = msgs[msgs.length - 1] || msgs[0] || {};
            const hdrs = (last.payload?.headers || []).reduce((a: any, h: any) => {
              a[h.name.toLowerCase()] = h.value;
              return a;
            }, {});
            
            const labelIds = new Set();
            msgs.forEach((m: any) => (m.labelIds || []).forEach((l: string) => labelIds.add(l)));
            
            return {
              id: th.id,
              subject: hdrs.subject || '(no subject)',
              from: hdrs.from || '',
              date: hdrs.date || th.internalDate || '',
              snippet: last.snippet || th.snippet || '',
              message_count: msgs.length,
              unread: labelIds.has('UNREAD'),
              starred: labelIds.has('STARRED')
            };
          } catch {
            return null;
          }
        })
      );
      
      return jsonResponse({ 
        provider, 
        account, 
        label, 
        threads: detailed.filter(Boolean) 
      });
    }
    
    return jsonResponse({ provider, account, label, threads: [] });
  } catch (e) {
    return errorResponse(`Email threads error: ${e.message}`);
  }
}

// ===== EMAIL SEND =====
async function handleEmailSend(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { 
      provider = 'gmail', 
      account = 'default', 
      to = '', 
      subject = '', 
      body_text = '', 
      body_html = '' 
    } = body;
    
    if (!to || !subject) return errorResponse('to and subject required', 400);
    
    if (provider === 'gmail') {
      const t = await getValidAccessToken(env, 'google', account);
      if (t.error) return errorResponse(t.error, 401);
      
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        body_html || body_text
      ].join('\r\n');
      
      const encoded = btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${t.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encoded })
      });
      
      const d = await r.json();
      if (!r.ok) return errorResponse('gmail_send_failed: ' + JSON.stringify(d), 502);
      
      return jsonResponse({ ok: true, id: d.id, provider: 'gmail' });
    }
    
    return errorResponse(`Unsupported provider: ${provider}`, 400);
  } catch (e) {
    return errorResponse(`Email send error: ${e.message}`);
  }
}
async function handleEmailAccounts(request: Request, env: Env): Promise<Response> {
  try {
    const accounts: any[] = [];
    
    const gIdx = await kvGet(env, 'oauth_index_google', 'json') || [];
    for (const a of gIdx) {
      accounts.push({
        provider: 'gmail',
        account_label: a.label,
        email: a.identity?.email || null,
        name: a.identity?.name || null,
        can_send: true,
        can_read: true
      });
    }
    
    const mIdx = await kvGet(env, 'oauth_index_microsoft', 'json') || [];
    for (const a of mIdx) {
      accounts.push({
        provider: 'outlook',
        account_label: a.label,
        email: a.identity?.email || null,
        name: a.identity?.name || null,
        can_send: true,
        can_read: true
      });
    }
    
    const brevoKey = await kvGet(env, 'apikey_brevo');
    if (brevoKey)
      accounts.push({
        provider: 'brevo',
        account_label: 'brevo',
        email: '(via Brevo)',
        can_send: true,
        can_read: false
      });
    
    return jsonResponse({ accounts });
  } catch (e) {
    return errorResponse(`Email accounts error: ${e.message}`);
  }
}
async function handleAIGenerate(request: Request, env: Env): Promise<Response> {
  try {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkRateLimit(env, `ai:${clientIp}`, 60, 20);
    if (!rateLimit.allowed) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }
    
    const body = await request.json();
    const { prompt = '', system = '', max_tokens = 800, model = '' } = body;
    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    
    let cfModel = '@cf/meta/llama-3.1-8b-instruct';
    if (model.includes('llama-3.3') || model.includes('70b'))
      cfModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    if (model.includes('mistral'))
      cfModel = '@cf/mistral/mistral-7b-instruct-v0.1';
    
    // Check if Workers AI binding is available
    if (typeof env.AI === 'undefined' || !env.AI) {
      return errorResponse('Workers AI not bound — check wrangler.toml', 500);
    }
    
    const result = await env.AI.run(cfModel, { messages, max_tokens });
    const text = result?.response || result?.result?.response || "[No response from AI]";
    return jsonResponse({ ok: true, text, model: cfModel });
  } catch (e) {
    return errorResponse(`AI generate error: ${e.message}`);
  }
}

// ===== OAUTH TOKEN EXCHANGE =====
async function handleOAuthToken(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const code = body.code;
    const grantType = body.grant_type;

    if (grantType !== 'authorization_code' || !code) {
      return errorResponse('invalid_request', 400);
    }

    const codeDataStr = await kvGet(env, `oauth_code:${code}`);
    if (!codeDataStr) return errorResponse('invalid_grant', 400);
    
    const codeData = JSON.parse(codeDataStr);
    await kvDelete(env, `oauth_code:${code}`);
    
    const accessToken = `lo_${crypto.randomUUID().replace(/-/g, '')}`;
    const expiresIn = 3600;
    await kvPut(env, `oauth_token:${accessToken}`, JSON.stringify({
      user_id: codeData.user_id,
      client_id: codeData.client_id,
      scope: codeData.scope,
      created: Date.now()
    }), { expirationTtl: expiresIn + 60 });
    
    return jsonResponse({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: codeData.scope
    });
  } catch (e) {
    return errorResponse(`server_error: ${e.message}`, 500);
  }
}

// ===== X/TWITTER USER LOOKUP =====
async function handleXUser(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const handle = url.searchParams.get('handle') || 'ceogps';
    const manualX = await kvGet(env, 'manual_x_token', 'json');
    const bearer = manualX?.bearer_token || env.X_BEARER_TOKEN || "";
    
    if (!bearer) return jsonResponse({ tweets: [], error: "X_BEARER_TOKEN not configured" });
    
    const r = await fetch(
      `https://api.twitter.com/2/users/by/username/${handle}?user.fields=public_metrics,profile_image_url,description,verified`,
      { headers: { Authorization: `Bearer ${bearer}` } }
    );
    
    const d = await r.json();
    if (d.errors || !d.data)
      return jsonResponse({ tweets: [], error: d.errors?.[0]?.detail || "user not found" });
    const u = d.data;
    return jsonResponse({
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
    return jsonResponse({ tweets: [], error: `X user lookup error: ${e.message}` });
  }
}

// ===== X/TWITTER TIMELINE =====
async function handleXTimeline(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const handle = url.searchParams.get('handle') || 'ceogps';
    const max = Math.min(parseInt(url.searchParams.get('max') || '10'), 100);
    const manualX = await kvGet(env, 'manual_x_token', 'json');
    const bearer = manualX?.bearer_token || env.X_BEARER_TOKEN || "";
    
    if (!bearer) return jsonResponse({ tweets: [], error: "X_BEARER_TOKEN not configured" });
    
    const ur = await fetch(
      `https://api.twitter.com/2/users/by/username/${handle}?user.fields=id`,
      { headers: { Authorization: `Bearer ${bearer}` } }
    );
    const ud = await ur.json();
    if (!ud.data?.id) return jsonResponse({ tweets: [] });
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
    return jsonResponse({ tweets });
  } catch (e) {
    return jsonResponse({ tweets: [], error: e.message });
  }
}

// ===== MAIN ROUTER =====
async function handleRequest(request: Request, env: Env): Promise<Response> {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return corsResponse('', 204);
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Health
  if (path === '/api/health' && method === 'GET') {
    return handleHealth(request, env);
  }

  // OAuth token exchange
  if (path === '/oauth/token' && method === 'POST') {
    return handleOAuthToken(request, env);
  }

  // X/Twitter user lookup
  if (path === '/api/x/user' && method === 'GET') {
    return handleXUser(request, env);
  }

  // X/Twitter timeline
  if (path === '/api/x/timeline' && method === 'GET') {
    return handleXTimeline(request, env);
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

  // Social Schedule
  if (path === '/api/social/schedule' && method === 'POST') {
    return handleSocialSchedule(request, env);
  }

  // Social Post (actual publishing)
  if (path === '/api/social/post' && method === 'POST') {
    return handleSocialPost(request, env);
  }

  // BrightData Proxy
  if (path.startsWith('/api/bd') && method !== 'OPTIONS') {
    return handleBDProxy(request, env);
  }

  // LLM Invoke
  if (path === '/api/llm/invoke' && method === 'POST') {
    return handleLLMInvoke(request, env);
  }

  // AI Generate (Workers AI binding)
  if (path === '/api/ai/generate' && method === 'POST') {
    return handleAIGenerate(request, env);
  }

  // Email Accounts
  if (path === '/api/email/accounts' && method === 'GET') {
    return handleEmailAccounts(request, env);
  }

  // Email Labels
  if (path === '/api/email/labels' && method === 'GET') {
    return handleEmailLabels(request, env);
  }

  // Email Threads
  if (path === '/api/email/threads' && method === 'GET') {
    return handleEmailThreads(request, env);
  }

  // Email Send
  if (path === '/api/email/send' && method === 'POST') {
    return handleEmailSend(request, env);
  }

  return withCORS(corsResponse({ error: 'Not Found' }, 404));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return withCORS(await handleRequest(request, env));
    } catch (e) {
      return withCORS(corsResponse({ error: e.message }, 500));
    }
  },
};