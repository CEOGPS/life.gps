\#lifeos1-api 

var \_\_defProp \= Object.defineProperty;  
var \_\_name \= (target, value) \=\> \_\_defProp(target, "name", { value, configurable: true });

// worker/index.js  
var CORS \= {  
  "Access-Control-Allow-Origin": "\*",  
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",  
  "Access-Control-Allow-Headers": "Content-Type, Authorization"  
};  
<!-- markdownlint-disable MD034 -->
var SUPABASE\_URL \= "https://mhvcdstgkyplhzjptgfr.supabase.co";
<!-- markdownlint-enable MD034 -->
async function validateSupabaseJWT(token, env) {  
  if (\!token) return null;  
  try {  
    const parts \= token.split(".");  
    if (parts.length \!== 3\) return null;  
    const payload \= JSON.parse(atob(parts\[1\]));  
    const userId \= payload.sub;  
    if (\!userId) return null;  
    const response \= await fetch(\`${SUPABASE\_URL}/auth/v1/user\`, {  
      headers: { Authorization: \`Bearer ${token}\` }  
    });  
    if (response.ok) {  
      const user \= await response.json();  
      return { id: user.id, email: user.email, ...user };  
    }  
    return null;  
  } catch (e) {  
    console.warn("JWT validation error:", e.message);  
    return null;  
  }  
}  
\_\_name(validateSupabaseJWT, "validateSupabaseJWT");  
function json(data, status \= 200\) {  
  return new Response(JSON.stringify(data), {  
    status,  
    headers: { ...CORS, "Content-Type": "application/json" }  
  });  
}  
\_\_name(json, "json");  
function err(msg, status \= 400\) {  
  return json({ error: msg }, status);  
}  
\_\_name(err, "err");  
async function supabase(env, path, opts \= {}) {  
  const key \= env.SUPABASE\_SERVICE\_KEY || "";  
  const res \= await fetch(SUPABASE\_URL \+ path, {  
    ...opts,  
    headers: {  
      "Content-Type": "application/json",  
      apikey: key,  
      Authorization: "Bearer " \+ key,  
      Prefer: "resolution=merge-duplicates",  
      ...opts.headers || {}  
    }  
  });  
  const text \= await res.text();  
  return text ? JSON.parse(text) : \[\];  
}  
\_\_name(supabase, "supabase");  
async function getSystemUserId(env) {  
  let id \= await env.LIFEOS\_KV.get("system\_user\_id");  
  if (id) return id;  
  try {  
    const { data } \= await supabase(  
      env,  
      "/rest/v1/users?email=eq.system@lifeos1.com\&select=id"  
    );  
    if (data?.length) {  
      await env.LIFEOS\_KV.put("system\_user\_id", data\[0\].id);  
      return data\[0\].id;  
    }  
    const { data: newUser } \= await supabase(env, "/rest/v1/users", {  
      method: "POST",  
      body: JSON.stringify({  
        email: "system@lifeos1.com",  
        created\_at: (/\* @\_\_PURE\_\_ \*/ new Date()).toISOString()  
      })  
    });  
    id \= newUser?.\[0\]?.id || "sys\_fallback";  
    await env.LIFEOS\_KV.put("system\_user\_id", id);  
    return id;  
  } catch {  
    return "sys\_fallback";  
  }  
}  
\_\_name(getSystemUserId, "getSystemUserId");  
async function checkRateLimit(env, key, windowSec \= 60, maxReqs \= 30\) {  
  const slot \= Math.floor(Date.now() / 1e3 / windowSec);  
  const k \= \`rate:key:{slot}\`;  
  const val \= await env.LIFEOS\_KV.get(k, "json") || { count: 0 };  
  val.count++;  
  await env.LIFEOS\_KV.put(k, JSON.stringify(val), {  
    expirationTtl: windowSec \+ 5  
  });  
  return {  
    allowed: val.count \<= maxReqs,  
    remaining: maxReqs \- val.count,  
    reset: (slot \+ 1\) \* windowSec  
  };  
}  
\_\_name(checkRateLimit, "checkRateLimit");  
async function saveOAuthTokensToSupabase(env, provider, tokens, userId, accountEmail, accountName, platformUserId) {  
  const existing \= await supabase(  
    env,  
    \`/rest/v1/platform\_tokens?select=id\&user\_id=eq.userId\&platform=eq.{provider}\&account\_email=eq.${encodeURIComponent(accountEmail)}\`  
  );  
  const tokenData \= {  
    user\_id: userId,  
    platform: provider,  
    access\_token: tokens.access\_token,  
    refresh\_token: tokens.refresh\_token || null,  
    token\_expires\_at: tokens.expires\_at ? new Date(tokens.expires\_at).toISOString() : new Date(Date.now() \+ 36e5).toISOString(),  
    platform\_user\_id: platformUserId || null,  
    platform\_username: accountEmail,  
    account\_email: accountEmail,  
    account\_name: accountName,  
    metadata: {  
      scope: tokens.scope,  
      token\_type: tokens.token\_type || "Bearer",  
      connected\_at: Date.now()  
    },  
    is\_active: true,  
    updated\_at: (/\* @\_\_PURE\_\_ \*/ new Date()).toISOString()  
  };  
  if (existing?.length) {  
    await supabase(env, \`/rest/v1/platform\_tokens?id=eq.${existing\[0\].id}\`, {  
      method: "PATCH",  
      body: JSON.stringify(tokenData)  
    });  
  } else {  
    const { data: existingAccounts } \= await supabase(  
      env,  
      \`/rest/v1/platform\_tokens?select=id\&user\_id=eq.userId\&platform=eq.{provider}\&limit=1\`  
    );  
    tokenData.is\_primary \= \!existingAccounts?.length;  
    await supabase(env, "/rest/v1/platform\_tokens", {  
      method: "POST",  
      body: JSON.stringify(tokenData)  
    });  
  }  
}  
\_\_name(saveOAuthTokensToSupabase, "saveOAuthTokensToSupabase");  
async function getStoredTokens(env, provider, accountLabel \= "default") {  
  const k1 \= \`oauth\_${provider}\_${accountLabel}\`;  
  let rec \= await env.LIFEOS\_KV.get(k1, "json");  
  if (\!rec || \!rec.access\_token) {  
    rec \= await env.LIFEOS\_KV.get(\`oauth\_${provider}\`, "json");  
    if (\!rec || \!rec.access\_token) return null;  
  }  
  return rec;  
}  
\_\_name(getStoredTokens, "getStoredTokens");  
async function getValidAccessToken(env, provider, accountLabel \= "default") {  
  const rec \= await getStoredTokens(env, provider, accountLabel);  
  if (\!rec) return { error: "not\_connected", provider };  
  if (rec.expires\_at && rec.expires\_at \- 6e4 \> Date.now()) {  
    return {  
      ok: true,  
      access\_token: rec.access\_token,  
      identity: rec.identity,  
      rec  
    };  
  }  
  if (\!rec.refresh\_token) {  
    return {  
      error: "no\_refresh\_token",  
      detail: "Token expired. Please reconnect.",  
      provider  
    };  
  }  
  const cfg \= getProviderConfig(env, provider, rec.scope || "");  
  if (\!cfg?.client\_id) return { error: "provider\_not\_configured", provider };  
  try {  
    const r \= await fetch(cfg.token\_url, {  
      method: "POST",  
      headers: { "Content-Type": "application/x-www-form-urlencoded" },  
      body: new URLSearchParams({  
        client\_id: cfg.client\_id,  
        client\_secret: cfg.client\_secret,  
        refresh\_token: rec.refresh\_token,  
        grant\_type: "refresh\_token"  
      })  
    });  
    const t \= await r.json();  
    if (\!r.ok || t.error) {  
      return {  
        error: "refresh\_failed",  
        detail: t.error\_description || t.error || \`HTTP ${r.status}\`,  
        provider  
      };  
    }  
    const updated \= {  
      ...rec,  
      access\_token: t.access\_token,  
      refresh\_token: t.refresh\_token || rec.refresh\_token,  
      expires\_at: Date.now() \+ (t.expires\_in || 3600\) \* 1e3,  
      scope: t.scope || rec.scope,  
      refreshed\_at: Date.now()  
    };  
    await env.LIFEOS\_KV.put(  
      \`oauth\_${provider}\_${accountLabel}\`,  
      JSON.stringify(updated)  
    );  
    await env.LIFEOS\_KV.put(\`oauth\_${provider}\`, JSON.stringify(updated));  
    return {  
      ok: true,  
      access\_token: updated.access\_token,  
      identity: updated.identity,  
      rec: updated  
    };  
  } catch (e) {  
    return { error: "refresh\_exception", detail: e.message, provider };  
  }  
}  
\_\_name(getValidAccessToken, "getValidAccessToken");  
async function getUserConnectedAccounts(env, userId, platform \= null) {  
  let query \= \`/rest/v1/platform\_tokens?select=platform,account\_email,account\_name,is\_primary,created\_at,updated\_at\&user\_id=eq.${userId}\&is\_active=eq.true\`;  
  if (platform) {  
    query \+= \`\&platform=eq.${platform}\`;  
  }  
  query \+= \`\&order=platform.asc,is\_primary.desc,created\_at.asc\`;  
  const { data } \= await supabase(env, query);  
  return data || \[\];  
}  
\_\_name(getUserConnectedAccounts, "getUserConnectedAccounts");  
async function disconnectAccount(env, userId, provider, accountEmail) {  
  const { data: account } \= await supabase(  
    env,  
    \`/rest/v1/platform\_tokens?select=id,is\_primary\&user\_id=eq.userId\&platform=eq.{provider}\&account\_email=eq.${encodeURIComponent(accountEmail)}\&limit=1\`  
  );  
  if (\!account?.length) return false;  
  await supabase(env, \`/rest/v1/platform\_tokens?id=eq.${account\[0\].id}\`, {  
    method: "DELETE"  
  });  
  if (account\[0\].is\_primary) {  
    const { data: remaining } \= await supabase(  
      env,  
      \`/rest/v1/platform\_tokens?select=id\&user\_id=eq.userId\&platform=eq.{provider}\&limit=1\&order=created\_at.asc\`  
    );  
    if (remaining?.length) {  
      await supabase(env, \`/rest/v1/platform\_tokens?id=eq.${remaining\[0\].id}\`, {  
        method: "PATCH",  
        body: JSON.stringify({ is\_primary: true })  
      });  
    }  
  }  
  return true;  
}  
\_\_name(disconnectAccount, "disconnectAccount");  
async function setPrimaryAccount(env, userId, provider, accountEmail) {  
  await supabase(  
    env,  
    \`/rest/v1/platform\_tokens?user\_id=eq.userId\&platform=eq.{provider}\`,  
    {  
      method: "PATCH",  
      body: JSON.stringify({ is\_primary: false })  
    }  
  );  
  await supabase(  
    env,  
    \`/rest/v1/platform\_tokens?user\_id=eq.userId\&platform=eq.{provider}\&account\_email=eq.${encodeURIComponent(accountEmail)}\`,  
    {  
      method: "PATCH",  
      body: JSON.stringify({ is\_primary: true })  
    }  
  );  
  return true;  
}  
\_\_name(setPrimaryAccount, "setPrimaryAccount");  
async function getValidAccessTokenFromDB(env, provider, userId, accountEmail \= null) {  
  let query \= \`/rest/v1/platform\_tokens?select=\*\&user\_id=eq.userId\&platform=eq.{provider}\&is\_active=eq.true\`;  
  if (accountEmail) {  
    query \+= \`\&account\_email=eq.${encodeURIComponent(accountEmail)}\`;  
  }  
  query \+= \`\&order=is\_primary.desc,created\_at.asc\&limit=1\`;  
  const { data: tokens } \= await supabase(env, query);  
  const token \= tokens?.\[0\];  
  if (\!token) return { error: "not\_connected", provider };  
  const expiresAt \= new Date(token.token\_expires\_at).getTime();  
  if (expiresAt \- 3e5 \> Date.now()) {  
    return {  
      ok: true,  
      access\_token: token.access\_token,  
      refresh\_token: token.refresh\_token,  
      account\_email: token.account\_email,  
      account\_name: token.account\_name,  
      platform\_user\_id: token.platform\_user\_id  
    };  
  }  
  if (\!token.refresh\_token) {  
    return {  
      error: "no\_refresh\_token",  
      detail: "Token expired. Please reconnect.",  
      provider  
    };  
  }  
  const cfg \= getProviderConfig(env, provider, token.metadata?.scope || "");  
  if (\!cfg?.client\_id) return { error: "provider\_not\_configured", provider };  
  try {  
    const r \= await fetch(cfg.token\_url, {  
      method: "POST",  
      headers: { "Content-Type": "application/x-www-form-urlencoded" },  
      body: new URLSearchParams({  
        client\_id: cfg.client\_id,  
        client\_secret: cfg.client\_secret,  
        refresh\_token: token.refresh\_token,  
        grant\_type: "refresh\_token"  
      })  
    });  
    const newTokens \= await r.json();  
    if (\!r.ok || newTokens.error) {  
      return {  
        error: "refresh\_failed",  
        detail: newTokens.error\_description || newTokens.error,  
        provider  
      };  
    }  
    await supabase(env, \`/rest/v1/platform\_tokens?id=eq.${token.id}\`, {  
      method: "PATCH",  
      body: JSON.stringify({  
        access\_token: newTokens.access\_token,  
        refresh\_token: newTokens.refresh\_token || token.refresh\_token,  
        token\_expires\_at: new Date(  
          Date.now() \+ (newTokens.expires\_in || 3600\) \* 1e3  
        ).toISOString(),  
        updated\_at: (/\* @\_\_PURE\_\_ \*/ new Date()).toISOString()  
      })  
    });  
    return {  
      ok: true,  
      access\_token: newTokens.access\_token,  
      refresh\_token: newTokens.refresh\_token || token.refresh\_token,  
      account\_email: token.account\_email,  
      account\_name: token.account\_name,  
      platform\_user\_id: token.platform\_user\_id  
    };  
  } catch (e) {  
    return { error: "refresh\_exception", detail: e.message, provider };  
  }  
}  
\_\_name(getValidAccessTokenFromDB, "getValidAccessTokenFromDB");  
async function generatePKCE() {  
  const array \= new Uint8Array(32);  
  crypto.getRandomValues(array);  
  const codeVerifier \= Array.from(  
    array,  
    (b) \=\> b.toString(16).padStart(2, "0")  
  ).join("");  
  const hashBuffer \= await crypto.subtle.digest(  
    "SHA-256",  
    new TextEncoder().encode(codeVerifier)  
  );  
  const codeChallenge \= btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).replace(/\\+/g, "-").replace(/\\//g, "\_").replace(/=+$/, "");  
  return { codeVerifier, codeChallenge };  
}  
\_\_name(generatePKCE, "generatePKCE");  
function getProviderConfig(env, provider, scope) {  
  const base \= "https://lifeos1.ceogps.workers.dev";  
  const redirect\_uri \= "https://oauth.ceogps.com/api/oauth/callback";  
  const ownedRedirect \= "https://oauth.ceogps.com/api/oauth/callback";  
  const configs \= {  
    google: {  
      auth\_url: "https://accounts.google.com/o/oauth2/v2/auth",  
      token\_url: "https://oauth2.googleapis.com/token",  
      client\_id: env.GOOGLE\_CLIENT\_ID || "",  
      client\_secret: env.GOOGLE\_CLIENT\_SECRET || "",  
      scope: \[  
        "email",  
        "profile",  
        "openid",  
        "https://mail.google.com/",  
        "https://www.googleapis.com/auth/gmail.modify",  
        "https://www.googleapis.com/auth/calendar",  
        "https://www.googleapis.com/auth/youtube",  
        "https://www.googleapis.com/auth/youtube.upload"  
      \].join(" "),  
      redirect\_uri  
    },  
    microsoft: {  
      auth\_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",  
      token\_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",  
      client\_id: env.MICROSOFT\_CLIENT\_ID || "",  
      client\_secret: env.MICROSOFT\_CLIENT\_SECRET || "",  
      scope: "Mail.Read email profile offline\_access",  
      redirect\_uri  
    },  
    github: {  
      auth\_url: "https://github.com/login/oauth/authorize",  
      token\_url: "https://github.com/login/oauth/access\_token",  
      client\_id: env.GITHUB\_CLIENT\_ID || "",  
      client\_secret: env.GITHUB\_CLIENT\_SECRET || "",  
      scope: "repo user",  
      redirect\_uri  
    },  
    slack: {  
      auth\_url: "https://slack.com/oauth/v2/authorize",  
      token\_url: "https://slack.com/api/oauth.v2.access",  
      client\_id: env.SLACK\_CLIENT\_ID || "",  
      client\_secret: env.SLACK\_CLIENT\_SECRET || "",  
      scope: "chat:write channels:read",  
      redirect\_uri  
    },  
    linkedin: {  
      auth\_url: "https://www.linkedin.com/oauth/v2/authorization",  
      token\_url: "https://www.linkedin.com/oauth/v2/accessToken",  
      client\_id: env.LINKEDIN\_CLIENT\_ID || "",  
      client\_secret: env.LINKEDIN\_CLIENT\_SECRET || "",  
      scope: "openid profile email w\_member\_social r\_organization\_social rw\_organization\_admin",  
      redirect\_uri  
    },  
    facebook: {  
      auth\_url: "https://www.facebook.com/v25.0/dialog/oauth",  
      token\_url: "https://graph.facebook.com/v25.0/oauth/access\_token",  
      client\_id: env.META\_APP\_ID || "",  
      client\_secret: env.META\_APP\_SECRET || "",  
      scope: "pages\_manage\_posts pages\_read\_engagement pages\_show\_list pages\_manage\_metadata instagram\_basic instagram\_content\_publish instagram\_manage\_insights ads\_management business\_management",  
      redirect\_uri: ownedRedirect  
    },  
    instagram: {  
      auth\_url: "https://www.facebook.com/v25.0/dialog/oauth",  
      token\_url: "https://graph.facebook.com/v25.0/oauth/access\_token",  
      client\_id: env.META\_APP\_ID || "",  
      client\_secret: env.META\_APP\_SECRET || "",  
      scope: "instagram\_basic instagram\_content\_publish instagram\_manage\_insights instagram\_manage\_comments pages\_show\_list",  
      redirect\_uri: ownedRedirect  
    },  
    twitter: {  
      auth\_url: "https://twitter.com/i/oauth2/authorize",  
      token\_url: "https://api.twitter.com/2/oauth2/token",  
      client\_id: env.TWITTER\_CLIENT\_ID || "",  
      client\_secret: env.TWITTER\_CLIENT\_SECRET || "",  
      scope: "tweet.read tweet.write users.read offline.access",  
      redirect\_uri  
    },  
    zoom: {  
      auth\_url: "https://zoom.us/oauth/authorize",  
      token\_url: "https://zoom.us/oauth/token",  
      client\_id: env.ZOOM\_CLIENT\_ID || "",  
      client\_secret: env.ZOOM\_CLIENT\_SECRET || "",  
      scope: "meeting:read meeting:write",  
      redirect\_uri  
    },  
    clickup: {  
      auth\_url: "https://app.clickup.com/api",  
      token\_url: "https://api.clickup.com/api/v2/oauth/token",  
      client\_id: env.CLICKUP\_CLIENT\_ID || "",  
      client\_secret: env.CLICKUP\_CLIENT\_SECRET || "",  
      scope: "",  
      redirect\_uri  
    },  
    airtable: {  
      auth\_url: "https://airtable.com/oauth2/v1/authorize",  
      token\_url: "https://airtable.com/oauth2/v1/token",  
      client\_id: env.AIRTABLE\_CLIENT\_ID || "",  
      client\_secret: env.AIRTABLE\_CLIENT\_SECRET || "",  
      scope: "data.records:read data.records:write",  
      redirect\_uri  
    },  
    tiktok: {  
      auth\_url: "https://www.tiktok.com/auth/authorize/",  
      token\_url: "https://open-api.tiktok.com/oauth/access\_token/",  
      client\_id: env.TIKTOK\_CLIENT\_ID || "",  
      client\_secret: env.TIKTOK\_CLIENT\_SECRET || "",  
      scope: "user.info.basic video.list",  
      redirect\_uri: ownedRedirect  
    },  
    spotify: {  
      auth\_url: "https://accounts.spotify.com/authorize",  
      token\_url: "https://accounts.spotify.com/api/token",  
      client\_id: env.SPOTIFY\_CLIENT\_ID || "",  
      client\_secret: env.SPOTIFY\_CLIENT\_SECRET || "",  
      scope: "user-read-playback-state user-modify-playback-state playlist-read-private",  
      redirect\_uri  
    },  
    yahoo: {  
      auth\_url: "https://api.login.yahoo.com/oauth2/request\_auth",  
      token\_url: "https://api.login.yahoo.com/oauth2/get\_token",  
      client\_id: env.YAHOO\_CLIENT\_ID || "",  
      client\_secret: env.YAHOO\_CLIENT\_SECRET || "",  
      scope: "mail-r mail-w",  
      redirect\_uri  
    },  
    aol: {  
      auth\_url: "https://api.login.aol.com/oauth2/request\_auth",  
      token\_url: "https://api.login.aol.com/oauth2/get\_token",  
      client\_id: env.YAHOO\_CLIENT\_ID || "",  
      client\_secret: env.YAHOO\_CLIENT\_SECRET || "",  
      scope: "mail-r mail-w",  
      redirect\_uri  
    },  
    calendly: {  
      auth\_url: "https://auth.calendly.com/oauth/authorize",  
      token\_url: "https://auth.calendly.com/oauth/token",  
      client\_id: env.CALENDLY\_CLIENT\_ID || "",  
      client\_secret: env.CALENDLY\_CLIENT\_SECRET || "",  
      scope: "scheduling:read scheduling:write user:read",  
      redirect\_uri  
    }  
  };  
  return configs\[provider\] || null;  
}  
\_\_name(getProviderConfig, "getProviderConfig");  
var ANTHROPIC\_MODEL \= "claude-sonnet-4-20250514";  
async function callClaude(env, prompt, system \= "") {  
  const key \= env.ANTHROPIC\_API\_KEY || "";  
  if (\!key) return "No ANTHROPIC\_API\_KEY set in Worker secrets.";  
  const res \= await fetch("https://api.anthropic.com/v1/messages", {  
    method: "POST",  
    headers: {  
      "Content-Type": "application/json",  
      "x-api-key": key,  
      "anthropic-version": "2023-06-01"  
    },  
    body: JSON.stringify({  
      model: ANTHROPIC\_MODEL,  
      max\_tokens: 1024,  
      system: system || "You are a LifeOS1 helper agent for Chris Green, CEO GPS, Atlanta GA.",  
      messages: \[{ role: "user", content: prompt }\]  
    })  
  });  
  const d \= await res.json();  
  return d?.content?.\[0\]?.text || "No response";  
}  
\_\_name(callClaude, "callClaude");  
async function sendTelegram(env, text, chatId \= null) {  
  const token \= env.TELEGRAM\_BOT\_TOKEN || "";  
  const chat \= chatId || env.TELEGRAM\_OWNER\_CHAT\_ID || "";  
  if (\!chat)  
    return {  
      ok: false,  
      error: "No chat\_id \\u2014 set TELEGRAM\_OWNER\_CHAT\_ID in secrets"  
    };  
  const res \= await fetch(\`https://api.telegram.org/bot${token}/sendMessage\`, {  
    method: "POST",  
    headers: { "Content-Type": "application/json" },  
    body: JSON.stringify({ chat\_id: chat, text, parse\_mode: "Markdown" })  
  });  
  return await res.json();  
}  
\_\_name(sendTelegram, "sendTelegram");  
async function logRun(env, agentId, result, status \= "ok") {  
  const key \= \`agent\_log\_${agentId}\`;  
  const existing \= await env.LIFEOS\_KV.get(key, "json") || \[\];  
  existing.unshift({  
    ts: Date.now(),  
    status,  
    result: String(result).slice(0, 500\)  
  });  
  await env.LIFEOS\_KV.put(key, JSON.stringify(existing.slice(0, 50)));  
}  
\_\_name(logRun, "logRun");  
var AGENTS \= {  
  "content-writer": {  
    name: "Content Writer",  
    desc: "Generates marketing copy, social posts, email drafts",  
    async run(env, payload) {  
      const {  
        type \= "social",  
        topic \= "",  
        platform \= "Instagram",  
        tone \= "professional"  
      } \= payload;  
      const prompts \= {  
        social: \`Write a ${tone} platformpostabout:"{topic}". For CEO GPS, a digital marketing company in Atlanta run by Chris Green. Include relevant hashtags. Max 280 chars for X, longer for others. Return ONLY the post text.\`,  
        email: \`Write a toneemailabout:"{topic}". For CEO GPS Atlanta. Include subject line. Professional but approachable.\`,  
        blog: \`Write a 300-word blog post intro about: "${topic}". For CEO GPS's blog. SEO-optimized for Atlanta marketing.\`  
      };  
      const result \= await callClaude(  
        env,  
        prompts\[type\] || prompts.social,  
        "You are Aurora, CEO GPS's creative content agent. Write compelling, authentic marketing content."  
      );  
      await sendTelegram(env, \`\\u2728 \*Content Writer\*

${result}\`);  
      return result;  
    }  
  },  
  "lead-qualifier": {  
    name: "Lead Qualifier",  
    desc: "Scores and qualifies incoming leads, suggests next action",  
    async run(env, payload) {  
      const { name, company, source, notes, budget } \= payload;  
      const result \= await callClaude(  
        env,  
        \`Qualify this lead for CEO GPS (digital marketing agency, Atlanta):  
Name: ${name || "Unknown"}  
Company: ${company || "Unknown"}  
Source: ${source || "Unknown"}  
Notes: ${notes || "None"}  
Budget: ${budget || "Unknown"}  
Return JSON: { "score": 1-10, "tier": "Hot/Warm/Cold", "next\_action": "...", "pitch\_angle": "...", "estimated\_value": "$..." }  
Return ONLY valid JSON.\`,  
        "You are Zero, CEO GPS's lead intelligence agent. Score leads with brutal precision."  
      );  
      try {  
        const data \= JSON.parse(result.replace(/\`\`\`json|\`\`\`/g, "").trim());  
        const msg \= \`\\u{1F3AF} \*Lead Qualifier\*

\*name\*({company})  
Score: ${data.score}/10 \\u2014 ${data.tier}  
Next: ${data.next\_action}  
Estimated: ${data.estimated\_value}\`;  
        await sendTelegram(env, msg);  
        return data;  
      } catch {  
        return { raw: result };  
      }  
    }  
  },  
  "daily-briefing": {  
    name: "Daily Briefing",  
    desc: "Sends morning summary: tasks, leads, priorities via Telegram",  
    async run(env, payload) {  
      const crm \= await env.LIFEOS\_KV.get("crm\_contacts", "json") || \[\];  
      const hotLeads \= crm.filter(  
        (c) \=\> c.tag \=== "Hot" || c.stage \=== "Proposal" || c.stage \=== "Negotiation"  
      ).slice(0, 5);  
      const tasks \= await env.LIFEOS\_KV.get("lifeos\_tasks", "json") || \[\];  
      const pendingTasks \= tasks.filter((t) \=\> \!t.done).slice(0, 5);  
      const briefing \= await callClaude(  
        env,  
        \`Generate a sharp morning briefing for Chris Green, CEO GPS, Atlanta.  
Hot leads: ${JSON.stringify(hotLeads.map((l) \=\> ({ name: l.name, stage: l.stage, value: l.value })))}  
Pending tasks: ${JSON.stringify(pendingTasks.map((t) \=\> t.title || t.text || t.name))}  
Date: ${(/\* @\_\_PURE\_\_ \*/ new Date()).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}  
Write a motivating, actionable briefing. Max 300 words. No fluff.\`,  
        "You are AgentZero. Deliver crisp intelligence briefings."  
      );  
      const msg \= \`\\u{1F305} \*LifeOS1 Daily Briefing\*  
\_${(/\* @\_\_PURE\_\_ \*/ new Date()).toLocaleDateString()}\_

${briefing}\`;  
      await sendTelegram(env, msg);  
      return briefing;  
    }  
  },  
  "seo-auditor": {  
    name: "SEO Auditor",  
    desc: "Audits pages/topics for SEO and gives actionable fixes",  
    async run(env, payload) {  
      const { url \= "", keywords \= \[\] } \= payload;  
      const result \= await callClaude(  
        env,  
        \`Perform an SEO audit for CEO GPS (ceogps.com), a digital marketing business in Atlanta.  
${url ? \`Focus URL: ${url}\` : ""}  
${keywords.length ? \`Target keywords: ${keywords.join(", ")}\` : ""}  
Give top 5 actionable fixes with priority (High/Med/Low) and estimated impact. Format clearly.\`,  
        "You are Viper, CEO GPS's SEO intelligence agent. Be precise and data-driven."  
      );  
      await sendTelegram(env, \`\\u{1F50D} \*SEO Audit\*

${result}\`);  
      return result;  
    }  
  },  
  "review-responder": {  
    name: "Review Responder",  
    desc: "Drafts professional responses to Google/Yelp reviews",  
    async run(env, payload) {  
      const {  
        review,  
        rating \= 5,  
        platform \= "Google",  
        reviewer \= "a customer"  
      } \= payload;  
      const result \= await callClaude(  
        env,  
        \`Write a professional, warm response to this ${rating}-star ${platform} review from ${reviewer}:  
"${review}"  
For CEO GPS, Atlanta digital marketing. Sound human, grateful, address any concerns. Under 150 words.\`,  
        "You are Aurora. Write authentic, professional review responses that build trust."  
      );  
      await sendTelegram(env, \`\\u{1F4AC} \*Review Response Draft\*

${result}\`);  
      return result;  
    }  
  },  
  "competitor-intel": {  
    name: "Competitor Intel",  
    desc: "Analyzes competitor positioning and suggests counter-moves",  
    async run(env, payload) {  
      const { competitor \= "", market \= "Atlanta digital marketing" } \= payload;  
      const result \= await callClaude(  
        env,  
        \`Analyze the competitive landscape for CEO GPS in ${market}.  
${competitor ? \`Focus on competitor: ${competitor}\` : "General market analysis"}  
Provide: positioning gaps CEO GPS can own, 3 immediate counter-moves, 1 blue-ocean opportunity.\`,  
        "You are Nova. Strategic competitive intelligence. See the full chessboard."  
      );  
      await sendTelegram(env, \`\\u{1F4CA} \*Competitor Intel\*

${result}\`);  
      return result;  
    }  
  },  
  "make-trigger": {  
    name: "Make.com Trigger",  
    desc: "Triggers Make.com automation scenarios",  
    async run(env, payload) {  
      const { webhook\_url, data \= {} } \= payload;  
      if (\!webhook\_url) return { error: "webhook\_url required" };  
      const res \= await fetch(webhook\_url, {  
        method: "POST",  
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify({  
          source: "lifeos1",  
          timestamp: Date.now(),  
          ...data  
        })  
      });  
      const result \= { status: res.status, ok: res.ok };  
      await sendTelegram(  
        env,  
        \`\\u{1F504} \*Make.com Triggered\*  
Status: ${res.status} ${res.ok ? "\\u2705" : "\\u274C"}\`  
      );  
      return result;  
    }  
  }  
};  
async function handleAgents(path, req, env) {  
  const CORS2 \= {  
    "Access-Control-Allow-Origin": "\*",  
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",  
    "Access-Control-Allow-Headers": "Content-Type"  
  };  
  const json2 \= /\* @\_\_PURE\_\_ \*/ \_\_name((d, s \= 200\) \=\> new Response(JSON.stringify(d), {  
    status: s,  
    headers: { ...CORS2, "Content-Type": "application/json" }  
  }), "json2");  
  if (req.method \=== "OPTIONS") return new Response(null, { headers: CORS2 });  
  if (path \=== "/api/agents" && req.method \=== "GET") {  
    return json2(  
      Object.entries(AGENTS).map((\[id, a\]) \=\> ({  
        id,  
        name: a.name,  
        desc: a.desc  
      }))  
    );  
  }  
  if (path \=== "/api/agents/run" && req.method \=== "POST") {  
    const clientIp \= req.headers.get("CF-Connecting-IP") || "unknown";  
    const rateLimit \= await checkRateLimit(env, \`agents:${clientIp}\`, 60, 20);  
    if (\!rateLimit.allowed) {  
      return json2(  
        { error: "Rate limit exceeded. Please try again later." },  
        429  
      );  
    }  
    const { agent: agentId, payload \= {} } \= await req.json();  
    const agent \= AGENTS\[agentId\];  
    if (\!agent) return json2({ error: \`Unknown agent: ${agentId}\` }, 404);  
    try {  
      const result \= await agent.run(env, payload);  
      await logRun(env, agentId, JSON.stringify(result), "ok");  
      return json2({ ok: true, agent: agentId, result });  
    } catch (e) {  
      await logRun(env, agentId, e.message, "error");  
      return json2({ ok: false, error: e.message }, 500);  
    }  
  }  
  if (path.startsWith("/api/agents/logs/") && req.method \=== "GET") {  
    const agentId \= path.replace("/api/agents/logs/", "");  
    const logs \= await env.LIFEOS\_KV.get(\`agent\_log\_${agentId}\`, "json") || \[\];  
    return json2(logs);  
  }  
  if (path \=== "/api/agents/status" && req.method \=== "GET") {  
    const status \= {};  
    for (const id of Object.keys(AGENTS)) {  
      const logs \= await env.LIFEOS\_KV.get(\`agent\_log\_${id}\`, "json") || \[\];  
      status\[id\] \= {  
        name: AGENTS\[id\].name,  
        lastRun: logs\[0\] || null,  
        totalRuns: logs.length  
      };  
    }  
    return json2(status);  
  }  
  return null;  
}  
\_\_name(handleAgents, "handleAgents");  
var GRAPH \= "https://graph.facebook.com/v25.0";  
async function graphGet(path, token) {  
  const sep \= path.includes("?") ? "&" : "?";  
  const r \= await fetch(\`GRAPH{path}sepaccesstoken={token}\`);  
  return r.json();  
}  
\_\_name(graphGet, "graphGet");  
async function graphPost(path, body, token) {  
  const r \= await fetch(\`GRAPH{path}\`, {  
    method: "POST",  
    headers: { "Content-Type": "application/json" },  
    body: JSON.stringify({ ...body, access\_token: token })  
  });  
  return r.json();  
}  
\_\_name(graphPost, "graphPost");  
async function liToken(env) {  
  const data \= await env.LIFEOS\_KV.get(\`oauth\_linkedin\_default\`, "json") || await env.LIFEOS\_KV.get(\`oauth\_linkedin\`, "json");  
  return data?.access\_token || null;  
}  
\_\_name(liToken, "liToken");  
async function liGet(env, p, token) {  
  const r \= await fetch("https://api.linkedin.com/v2" \+ p, {  
    headers: {  
      Authorization: "Bearer " \+ token,  
      "LinkedIn-Version": "202404",  
      "X-Restli-Protocol-Version": "2.0.0"  
    }  
  });  
  return r.json();  
}  
\_\_name(liGet, "liGet");  
async function liPost(env, p, body, token) {  
  const r \= await fetch("https://api.linkedin.com/v2" \+ p, {  
    method: "POST",  
    headers: {  
      Authorization: "Bearer " \+ token,  
      "LinkedIn-Version": "202404",  
      "X-Restli-Protocol-Version": "2.0.0",  
      "Content-Type": "application/json"  
    },  
    body: JSON.stringify(body)  
  });  
  const txt \= await r.text();  
  try {  
    return JSON.parse(txt);  
  } catch {  
    return { raw: txt, status: r.status };  
  }  
}  
\_\_name(liPost, "liPost");  
async function handleOAuthStart(req, env, url) {  
  const providerName \= url.searchParams.get("provider");  
  const scope \= url.searchParams.get("scope") || "";  
  const userId \= url.searchParams.get("user\_id") || "unknown";  
  const loginHint \= url.searchParams.get("hint") || "";  
  const clientCodeChallenge \= url.searchParams.get("code\_challenge");  
  const clientCodeChallengeMethod \= url.searchParams.get("code\_challenge\_method");  
  const clientState \= url.searchParams.get("state");  
  const cfg \= getProviderConfig(env, providerName, scope);  
  if (\!cfg) return new Response("Unknown provider", { status: 400 });  
  if (\!cfg.client\_id) {  
    return new Response(  
      \`\<html\>\<body style="background:\#0d0e17;color:\#f0ede8;font-family:system-ui;padding:40px"\>  
      \<h2 style="color:\#4ab3f4"\>\\u2699\\uFE0F ${providerName} OAuth Setup Needed\</h2\>  
      \<p\>Add \<code\>providerName.toUpperCase()CLIENTID\</code\>and\<code\>{providerName.toUpperCase()}\_CLIENT\_SECRET\</code\> as Wrangler secrets.\</p\>  
    \</body\>\</html\>\`,  
      { headers: { "Content-Type": "text/html" } }  
    );  
  }  
  const PKCE\_PROVIDERS \= /\* @\_\_PURE\_\_ \*/ new Set(\[  
    "google",  
    "microsoft",  
    "twitter",  
    "airtable",  
    "linkedin",  
    "zoom",  
    "clickup",  
    "slack",  
    "spotify",  
    "tiktok",  
    "yahoo",  
    "aol",  
    "calendly"  
  \]);  
  const usePKCE \= PKCE\_PROVIDERS.has(providerName);  
  const state \= clientState || crypto.randomUUID();  
  let codeVerifier, codeChallenge;  
  if (clientCodeChallenge && usePKCE) {  
    const { codeVerifier: v, codeChallenge: c } \= await generatePKCE();  
    codeVerifier \= v;  
    codeChallenge \= c;  
  } else {  
    const { codeVerifier: v, codeChallenge: c } \= await generatePKCE();  
    codeVerifier \= v;  
    codeChallenge \= c;  
  }  
  await env.LIFEOS\_KV.put(  
    \`oauth\_state:${state}\`,  
    JSON.stringify({  
      provider: providerName,  
      codeVerifier,  
      usePKCE,  
      userId,  
      scope,  
      timestamp: Date.now()  
    }),  
    { expirationTtl: 900 }  
  );  
  const authUrl \= new URL(cfg.auth\_url);  
  authUrl.searchParams.set("client\_id", cfg.client\_id);  
  authUrl.searchParams.set("redirect\_uri", cfg.redirect\_uri);  
  authUrl.searchParams.set("response\_type", "code");  
  authUrl.searchParams.set("scope", cfg.scope);  
  authUrl.searchParams.set("state", state);  
  if (usePKCE) {  
    authUrl.searchParams.set("code\_challenge", codeChallenge);  
    authUrl.searchParams.set("code\_challenge\_method", "S256");  
  }  
  if (providerName \=== "google") {  
    authUrl.searchParams.set("access\_type", "offline");  
    authUrl.searchParams.set("prompt", "consent select\_account");  
    if (loginHint) authUrl.searchParams.set("login\_hint", loginHint);  
  } else if (providerName \=== "microsoft") {  
    authUrl.searchParams.set("prompt", "consent select\_account");  
    if (loginHint) authUrl.searchParams.set("login\_hint", loginHint);  
  } else if (providerName \=== "twitter") {  
    authUrl.searchParams.set("force\_login", "true");  
  } else if (providerName \=== "facebook" || providerName \=== "instagram") {  
    authUrl.searchParams.set("display", "popup");  
    authUrl.searchParams.set("auth\_type", "rerequest");  
  } else if (providerName \=== "slack") {  
    authUrl.searchParams.set("user\_scope", cfg.scope);  
    authUrl.searchParams.set("redirect\_uri", cfg.redirect\_uri);  
  } else if (providerName \=== "zoom") {  
    authUrl.searchParams.set("response\_type", "code");  
  } else if (providerName \=== "clickup") {  
    authUrl.searchParams.set("response\_type", "code");  
  } else if (providerName \=== "airtable") {  
  } else if (providerName \=== "spotify") {  
    authUrl.searchParams.set("show\_dialog", "true");  
  } else if (providerName \=== "tiktok") {  
    authUrl.searchParams.set("display", "popup");  
  } else if (providerName \=== "yahoo" || providerName \=== "aol") {  
    authUrl.searchParams.set("response\_type", "code");  
  } else if (providerName \=== "calendly") {  
    authUrl.searchParams.set("response\_type", "code");  
  }  
  return Response.redirect(authUrl.toString(), 302);  
}  
\_\_name(handleOAuthStart, "handleOAuthStart");  
async function handleOAuthCallback(req, env, url) {  
  const code \= url.searchParams.get("code");  
  const state \= url.searchParams.get("state");  
  if (\!code || \!state)  
    return new Response("Missing parameters", { status: 400 });  
  const stored \= await env.LIFEOS\_KV.get(\`oauth\_state:${state}\`, "json");  
  if (\!stored) return new Response("Invalid or expired state", { status: 400 });  
  const cfg \= getProviderConfig(env, stored.provider, stored.scope || "");  
  if (\!cfg || \!cfg.client\_id)  
    return new Response("Provider config error", { status: 500 });  
  const PKCE\_PROVIDERS \= /\* @\_\_PURE\_\_ \*/ new Set(\[  
    "google",  
    "microsoft",  
    "twitter",  
    "airtable",  
    "linkedin",  
    "zoom",  
    "clickup",  
    "slack",  
    "spotify",  
    "tiktok",  
    "yahoo",  
    "aol",  
    "calendly"  
  \]);  
  const tokenParams \= {  
    client\_id: cfg.client\_id,  
    client\_secret: cfg.client\_secret,  
    code,  
    redirect\_uri: cfg.redirect\_uri,  
    grant\_type: "authorization\_code"  
  };  
  if (stored.usePKCE || PKCE\_PROVIDERS.has(stored.provider)) {  
    tokenParams.code\_verifier \= stored.codeVerifier;  
  }  
  const tokenHeaders \= {  
    "Content-Type": "application/x-www-form-urlencoded",  
    Accept: "application/json"  
  };  
  if (stored.provider \=== "twitter") {  
    tokenHeaders\["Authorization"\] \= "Basic " \+ btoa(\`cfg.clientid:{cfg.client\_secret}\`);  
    delete tokenParams.client\_secret;  
  }  
  const tokenRes \= await fetch(cfg.token\_url, {  
    method: "POST",  
    headers: tokenHeaders,  
    body: new URLSearchParams(tokenParams)  
  });  
  const tokens \= await tokenRes.json();  
  if (\!tokenRes.ok || tokens.error) {  
    const msg \= tokens.error\_description || tokens.error || "Token exchange failed";  
    return new Response(  
      \`\<html\>\<body style="background:\#0d0e17;color:\#ff4f5e;font-family:system-ui;padding:40px"\>  
      \<h2\>\\u274C Connection Failed\</h2\>\<p\>${msg}\</p\>  
      \<script\>setTimeout(()=\>window.close(),4000)\<\\/script\>\</body\>\</html\>\`,  
      { headers: { "Content-Type": "text/html" } }  
    );  
  }  
  let identity \= { email: null, name: null, id: null };  
  const authHeader \= \`Bearer ${tokens.access\_token}\`;  
  try {  
    if (stored.provider \=== "google") {  
      const r \= await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {  
        headers: { Authorization: authHeader }  
      });  
      identity \= await r.json();  
    } else if (stored.provider \=== "microsoft") {  
      const r \= await fetch("https://graph.microsoft.com/v1.0/me", {  
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= {  
        email: d.mail || d.userPrincipalName,  
        name: d.displayName,  
        id: d.id  
      };  
    } else if (stored.provider \=== "github") {  
      const r \= await fetch("https://api.github.com/user", {  
        headers: { Authorization: authHeader, "User-Agent": "LifeOS1" }  
      });  
      const d \= await r.json();  
      identity \= { email: d.email, name: d.name || d.login, id: String(d.id) };  
    } else if (stored.provider \=== "facebook" || stored.provider \=== "instagram") {  
      const r \= await fetch(  
        \`https://graph.facebook.com/v25.0/me?fields=id,name,email\&access\_token=${encodeURIComponent(tokens.access\_token)}\`  
      );  
      const d \= await r.json();  
      identity \= { email: d.email, name: d.name, id: d.id };  
    } else if (stored.provider \=== "linkedin") {  
      const r \= await fetch("https://api.linkedin.com/v2/userinfo", {  
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= { email: d.email, name: d.name, id: d.sub };  
    } else if (stored.provider \=== "twitter") {  
      const r \= await fetch(  
        "https://api.twitter.com/2/users/me?user.fields=username,name",  
        { headers: { Authorization: authHeader } }  
      );  
      const d \= await r.json();  
      identity \= {  
        email: null,  
        name: d.data?.name,  
        id: d.data?.id,  
        handle: d.data?.username  
      };  
    } else if (stored.provider \=== "slack") {  
      const r \= await fetch("https://slack.com/api/users.identity", {  
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= { email: d.user?.email, name: d.user?.name, id: d.user?.id };  
    } else if (stored.provider \=== "zoom") {  
      const r \= await fetch("<https://api.zoom.us/v2/users/me>", {
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= { email: d.email, name: d.first\_name \+ " " \+ d.last\_name, id: d.id };  
    } else if (stored.provider \=== "clickup") {  
      const r \= await fetch("<https://api.clickup.com/api/v2/user>", {
        headers: { Authorization: tokens.access\_token }  
      });  
      const d \= await r.json();  
      identity \= { email: d.user?.email, name: d.user?.username, id: String(d.user?.id) };  
    } else if (stored.provider \=== "airtable") {  
      const r \= await fetch("<https://api.airtable.com/v0/meta/whoami>", {
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= { email: d.email, name: d.name || d.id, id: d.id };  
    } else if (stored.provider \=== "spotify") {  
      const r \= await fetch("https://api.spotify.com/v1/me", {  
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= { email: d.email, name: d.display\_name, id: d.id };  
    } else if (stored.provider \=== "tiktok") {  
      const r \= await fetch("https://open-api.tiktok.com/user/info/", {  
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= { email: null, name: d.data?.user?.display\_name, id: d.data?.user?.open\_id, handle: d.data?.user?.username };  
    } else if (stored.provider \=== "yahoo" || stored.provider \=== "aol") {  
      const r \= await fetch("https://api.login.yahoo.com/openid/v1/userinfo", {  
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= { email: d.email, name: d.name, id: d.sub };  
    } else if (stored.provider \=== "calendly") {  
      const r \= await fetch("https://api.calendly.com/users/me", {  
        headers: { Authorization: authHeader }  
      });  
      const d \= await r.json();  
      identity \= { email: d.resource?.email, name: d.resource?.name, id: d.resource?.uri };  
    }  
  } catch (e) {  
    console.warn("Identity fetch failed:", e.message);  
  }  
  const userId \= stored.userId || "chris-green";  
  if (identity.email || stored.provider \=== "twitter") {  
    await saveOAuthTokensToSupabase(  
      env,  
      stored.provider,  
      {  
        access\_token: tokens.access\_token,  
        refresh\_token: tokens.refresh\_token || null,  
        expires\_at: Date.now() \+ (tokens.expires\_in || 3600\) \* 1e3,  
        scope: tokens.scope || cfg.scope,  
        token\_type: tokens.token\_type || "Bearer"  
      },  
      userId,  
      identity.email || "",  
      identity.name || "",  
      identity.id || ""  
    );  
  }  
  await env.LIFEOS\_KV.put(  
    \`oauth\_${stored.provider}\`,  
    JSON.stringify({ connected: true, identity })  
  );  
  const idxKey \= \`oauth\_index\_${stored.provider}\`;  
  const idx \= await env.LIFEOS\_KV.get(idxKey, "json") || \[\];  
  const without \= idx.filter((a) \=\> a.email \!== identity.email);  
  without.push({  
    email: identity.email,  
    name: identity.name,  
    userId,  
    connected\_at: Date.now()  
  });  
  await env.LIFEOS\_KV.put(idxKey, JSON.stringify(without));  
  await env.LIFEOS\_KV.delete(\`oauth\_state:${state}\`);  
  const who \= identity.email || identity.name || identity.handle || "Account";  
  return new Response(  
    \`  
    \<html\>\<head\>\<style\>  
      body{background:\#0d0e17;color:\#f0ede8;font-family:system-ui;padding:40px;text-align:center}  
      h2{color:\#00c896}.check{font-size:64px}.who{color:\#4ab3f4;font-size:14px;margin-top:8px}  
    \</style\>\</head\>  
    \<body\>  
      \<div class="check"\>\\u2705\</div\>  
      \<h2\>${stored.provider.charAt(0).toUpperCase() \+ stored.provider.slice(1)} Connected\</h2\>  
      \<div class="who"\>${who}\</div\>  
      \<script\>  
        if (window.opener) {  
          window.opener.postMessage({  
            type: "oauth\_success",  
            provider: "${stored.provider}",  
            userId: "${userId}",  
            identity: ${JSON.stringify(identity)}  
          }, "\*");  
        }  
        setTimeout(() \=\> window.close(), 2500);  
      \<\\/script\>  
    \</body\>\</html\>  
  \`,  
    { headers: { "Content-Type": "text/html" } }  
  );  
}  
\_\_name(handleOAuthCallback, "handleOAuthCallback");  
async function handleOAuthDisconnect(req, env, url) {  
  const provider \= url.searchParams.get("provider");  
  const userId \= url.searchParams.get("user\_id");  
  const accountEmail \= url.searchParams.get("account\_email") || "";  
  if (\!provider || \!userId)  
    return new Response("Missing parameters", { status: 400 });  
  const success \= await disconnectAccount(env, userId, provider, accountEmail);  
  const idxKey \= \`oauth\_index\_${provider}\`;  
  const idx \= await env.LIFEOS\_KV.get(idxKey, "json") || \[\];  
  const next \= idx.filter((a) \=\> a.email \!== accountEmail);  
  if (next.length \=== 0\) {  
    await env.LIFEOS\_KV.delete(\`oauth\_${provider}\`);  
    await env.LIFEOS\_KV.delete(idxKey);  
  } else {  
    await env.LIFEOS\_KV.put(idxKey, JSON.stringify(next));  
  }  
  return json({ success });  
}  
\_\_name(handleOAuthDisconnect, "handleOAuthDisconnect");  
async function handleOAuthStatus(req, env, url) {  
  try {  
    const data \= await supabase(  
      env,  
      "/rest/v1/platform\_tokens?select=platform,account\_email,account\_name,is\_primary\&is\_active=eq.true\&order=platform.asc"  
    );  
    const body \= JSON.stringify({ connected: data || \[\] });  
    return new Response(body, {  
      status: 200,  
      headers: {  
        ...CORS,  
        "Content-Type": "application/json"  
      }  
    });  
  } catch {  
    const body \= JSON.stringify({ connected: \[\] });  
    return new Response(body, {  
      status: 200,  
      headers: {  
        ...CORS,  
        "Content-Type": "application/json"  
      }  
    });  
  }  
}  
\_\_name(handleOAuthStatus, "handleOAuthStatus");  
var index\_default \= {  
  async fetch(req, env) {  
    const url \= new URL(req.url);  
    const path \= url.pathname;  
    if (req.method \=== "OPTIONS") return new Response(null, { headers: CORS });  
    const authHeader \= req.headers.get("Authorization");  
    let currentUser \= null;  
    if (authHeader && authHeader.startsWith("Bearer ")) {  
      const token \= authHeader.substring(7);  
      currentUser \= await validateSupabaseJWT(token, env);  
    }  
    if (\!path.startsWith("/api/")) {  
      return env.ASSETS ? env.ASSETS.fetch(req) : err("Not found", 404);  
    }  
    if (path \=== "/api/profile") {  
      if (req.method \=== "GET") {  
        const d \= await env.LIFEOS\_KV.get("profile", "json");  
        return json(  
          d || {  
            name: "Chris Green",  
            email: "chris@ceogps.com",  
            location: "Atlanta, GA",  
            profession: "Business Owner / CEO GPS",  
            phone: "",  
            bio: "",  
            avatarUrl: ""  
          }  
        );  
      }  
      if (req.method \=== "POST") {  
        await env.LIFEOS\_KV.put("profile", JSON.stringify(await req.json()));  
        return json({ ok: true });  
      }  
    }  
    if (path.startsWith("/api/settings/")) {  
      const key \= path.replace("/api/settings/", "");  
      if (req.method \=== "GET")  
        return json(await env.LIFEOS\_KV.get("settings\_" \+ key, "json") || {});  
      if (req.method \=== "POST") {  
        await env.LIFEOS\_KV.put(  
          "settings\_" \+ key,  
          JSON.stringify(await req.json())  
        );  
        return json({ ok: true });  
      }  
    }  
    if (path \=== "/api/kv/get" && req.method \=== "GET") {  
      const key \= url.searchParams.get("key");  
      if (\!key) return err("key required");  
      const value \= await env.LIFEOS\_KV.get(key, "json");  
      return json({ key, value: value \!== null ? value : null });  
    }  
    if (path \=== "/api/kv/set" && req.method \=== "POST") {  
      const { key, value } \= await req.json();  
      if (\!key) return err("key required");  
      await env.LIFEOS\_KV.put(key, JSON.stringify(value));  
      return json({ ok: true, key });  
    }  
    if (path.startsWith("/api/kv/")) {  
      const key \= decodeURIComponent(path.replace("/api/kv/", ""));  
      if (req.method \=== "GET")  
        return json(await env.LIFEOS\_KV.get(key, "json") || null);  
      if (req.method \=== "POST") {  
        await env.LIFEOS\_KV.put(key, JSON.stringify(await req.json()));  
        return json({ ok: true });  
      }  
      if (req.method \=== "DELETE") {  
        await env.LIFEOS\_KV.delete(key);  
        return json({ ok: true });  
      }  
    }  
    if (path \=== "/api/state/snapshot" && req.method \=== "GET") {  
      const uid \= url.searchParams.get("uid") || "global";  
      const data \= await env.LIFEOS\_KV.get(\`state\_${uid}\`, "json");  
      return json(data || {});  
    }  
    if (path \=== "/api/state/set" && req.method \=== "POST") {  
      const uid \= url.searchParams.get("uid") || "global";  
      let patch \= {};  
      try {  
        patch \= await req.json();  
      } catch {  
        return err("invalid body");  
      }  
      const cur \= await env.LIFEOS\_KV.get(\`state\_${uid}\`, "json") || {};  
      for (const \[k, v\] of Object.entries(patch || {})) {  
        if (v \=== null || v \=== void 0\) delete cur\[k\];  
        else cur\[k\] \= typeof v \=== "string" ? v : JSON.stringify(v);  
      }  
      await env.LIFEOS\_KV.put(\`state\_${uid}\`, JSON.stringify(cur));  
      return json({ ok: true, count: Object.keys(cur).length });  
    }  
    if (path \=== "/api/upload" && req.method \=== "POST") {  
      const formData \= await req.formData();  
      const file \= formData.get("file");  
      const type \= formData.get("type") || "general";  
      const fileKey \= formData.get("key") || \`type/{Date.now()}\_${file.name}\`;  
      if (\!file) return err("No file");  
      await env.lifeos\_uploads.put(fileKey, await file.arrayBuffer(), {  
        httpMetadata: { contentType: file.type }  
      });  
      <!-- markdownlint-disable MD034 -->
      const publicUrl \= \`https://lifeos1.ceogps.workers.dev/api/files/${encodeURIComponent(fileKey)}\`;
      <!-- markdownlint-enable MD034 -->
      const fileInfo \= {  
        key: fileKey,  
        url: publicUrl,  
        name: file.name,  
        size: file.size,  
        mimeType: file.type,  
        type,  
        uploadedAt: Date.now()  
      };  
      const existing \= await env.LIFEOS\_KV.get("files\_" \+ type, "json") || \[\];  
      await env.LIFEOS\_KV.put(  
        "files\_" \+ type,  
        JSON.stringify(\[fileInfo, ...existing\].slice(0, 500))  
      );  
      if (type \=== "avatar") {  
        const profile \= await env.LIFEOS\_KV.get("profile", "json") || {};  
        profile.avatarUrl \= publicUrl;  
        await env.LIFEOS\_KV.put("profile", JSON.stringify(profile));  
      }  
      return json({ ok: true, url: publicUrl, key: fileKey });  
    }  
    if (path.startsWith("/api/files/") && req.method \=== "GET") {  
      const fileKey \= decodeURIComponent(path.replace("/api/files/", ""));  
      const obj \= await env.lifeos\_uploads.get(fileKey);  
      if (\!obj) return err("Not found", 404);  
      return new Response(obj.body, {  
        headers: {  
          ...CORS,  
          "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",  
          "Cache-Control": "public, max-age=31536000"  
        }  
      });  
    }  
    if (path \=== "/api/files" && req.method \=== "GET") {  
      const type \= url.searchParams.get("type") || "general";  
      return json(await env.LIFEOS\_KV.get("files\_" \+ type, "json") || \[\]);  
    }  
    if (path.startsWith("/api/files/") && req.method \=== "DELETE") {  
      const fileKey \= decodeURIComponent(path.replace("/api/files/", ""));  
      await env.lifeos\_uploads.delete(fileKey);  
      const type \= fileKey.split("/")\[0\];  
      const existing \= await env.LIFEOS\_KV.get("files\_" \+ type, "json") || \[\];  
      await env.LIFEOS\_KV.put(  
        "files\_" \+ type,  
        JSON.stringify(existing.filter((f) \=\> f.key \!== fileKey))  
      );  
      return json({ ok: true });  
    }  
    if (path \=== "/api/oauth/start" && req.method \=== "GET") {  
      return handleOAuthStart(req, env, url);  
    }  
    if (path.startsWith("/api/oauth/callback") && req.method \=== "GET") {  
      return handleOAuthCallback(req, env, url);  
    }  
    if (path \=== "/api/oauth/status" && req.method \=== "GET") {  
      const res \= await handleOAuthStatus(req, env, url);  
      const headers \= new Headers(res.headers);  
      Object.entries(CORS).forEach((\[k, v\]) \=\> headers.set(k, v));  
      return new Response(res.body, {  
        status: res.status,  
        headers  
      });  
    }  
    if (path \=== "/api/oauth/status/all" && req.method \=== "GET") {  
      const providers \= \[  
        "google",  
        "microsoft",  
        "facebook",  
        "instagram",  
        "linkedin",  
        "twitter",  
        "slack",  
        "github",  
        "zoom",  
        "clickup",  
        "airtable",  
        "spotify",  
        "tiktok",  
        "yahoo",  
        "aol",  
        "calendly"  
      \];  
      const statuses \= {};  
      for (const p of providers) {  
        const d \= await env.LIFEOS\_KV.get(\`oauth\_${p}\`, "json");  
        statuses\[p\] \= {  
          connected: \!\!(d?.access\_token || d?.connected),  
          scope: d?.scope || null,  
          identity: d?.identity || null,  
          account\_label: d?.account\_label || null  
        };  
      }  
      const res \= json(statuses);  
      const h \= new Headers(res.headers);  
      Object.entries(CORS).forEach((\[k, v\]) \=\> h.set(k, v));  
      return new Response(res.body, { status: res.status, headers: h });  
    }  
    if (path \=== "/api/oauth/verify" && req.method \=== "GET") {  
      const provider \= url.searchParams.get("provider");  
      const userId \= url.searchParams.get("user\_id") || currentUser?.id;  
      if (\!provider || \!userId)  
        return json({ ok: false, error: "provider and user\_id required" });  
      try {  
        const tokenInfo \= await getValidAccessTokenFromDB(  
          env,  
          provider,  
          userId  
        );  
        if (\!tokenInfo.ok || \!tokenInfo.access\_token) {  
          return json({ ok: false, error: "no valid token" });  
        }  
        const token \= tokenInfo.access\_token;  
        let ok \= false;  
        if (provider \=== "x" || provider \=== "twitter") {  
          const r \= await fetch("https://api.twitter.com/2/users/me", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "facebook" || provider \=== "instagram") {  
          const r \= await fetch(  
            \`https://graph.\` +
              \`facebook.com/me?fields=id\&access\_token=${encodeURIComponent(token)}\`
          ).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "google" || provider \=== "youtube") {  
          const r \= await fetch(  
            "https://www." + "googleapis.com/youtube/v3/channels?part=snippet\&mine=true",  
            {  
              headers: { Authorization: \`Bearer ${token}\` }  
            }  
          ).catch(() \=\> null);  
          if (r && r.ok) {  
            const d \= await r.json().catch(() \=\> ({}));  
            ok \= \!\!(d.items && d.items.length);  
          }  
        } else if (provider \=== "linkedin") {  
          const r \= await fetch("https://api.linkedin.com/v2/userinfo", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "slack") {  
          const r \= await fetch("https://slack.com/api/auth.test", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "microsoft") {  
          const r \= await fetch("https://graph.microsoft.com/v1.0/me", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "github") {  
          const r \= await fetch("https://api.github.com/user", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "zoom") {  
          const r \= await fetch("https://" + "api." + "zoom.us/v2/users/me", {
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "clickup") {  
          const r \= await fetch("https://api.clickup.com/api/v2/user", {  
            headers: { Authorization: token }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "airtable") {  
          const r \= await fetch("https://api.airtable.com/v0/meta/whoami", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "spotify") {  
          const r \= await fetch("https://" + "api." + "spotify.com/v1/me", {
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "tiktok") {  
          const r \= await fetch("https://open-api.tiktok.com/user/info/", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "yahoo" || provider \=== "aol") {  
          const r \= await fetch("https://api.login.yahoo.com/openid/v1/userinfo", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else if (provider \=== "calendly") {  
          const r \= await fetch("https://api.calendly.com/users/me", {  
            headers: { Authorization: \`Bearer ${token}\` }  
          }).catch(() \=\> null);  
          ok \= \!\!(r && r.ok);  
        } else {  
          ok \= true;  
        }  
        return json({ ok });  
      } catch (e) {  
        return json({ ok: false, error: e.message });  
      }  
    }  
    if (path \=== "/api/oauth/accounts" && req.method \=== "GET") {  
      const userId \= url.searchParams.get("user\_id") || currentUser?.id;  
      if (\!userId) return err("user\_id required");  
      const accounts \= await getUserConnectedAccounts(  
        env,  
        userId,  
        url.searchParams.get("provider")  
      );  
      return json({ accounts });  
    }  
    if (path \=== "/api/oauth/accounts-legacy" && req.method \=== "GET") {  
      const provider \= url.searchParams.get("provider");  
      if (\!provider) return err("provider required");  
      const idx \= await env.LIFEOS\_KV.get(\`oauth\_index\_${provider}\`, "json") || \[\];  
      return json({ provider, accounts: idx });  
    }  
    if (path \=== "/api/oauth/set-primary" && req.method \=== "POST") {  
      const { user\_id, provider, account\_email } \= await req.json();  
      if (\!user\_id || \!provider || \!account\_email)  
        return err("user\_id, provider, and account\_email required");  
      await setPrimaryAccount(env, user\_id, provider, account\_email);  
      return json({ ok: true });  
    }  
    if (path \=== "/api/oauth/disconnect" && (req.method \=== "POST" || req.method \=== "DELETE")) {  
      return handleOAuthDisconnect(req, env, url);  
    }  
    if (path \=== "/api/oauth/token" && req.method \=== "GET") {  
      const userId \= url.searchParams.get("user\_id") || currentUser?.id;  
      const provider \= url.searchParams.get("provider");  
      const accountEmail \= url.searchParams.get("account\_email");  
      if (\!userId || \!provider) return err("user\_id and provider required");  
      const result \= await getValidAccessTokenFromDB(  
        env,  
        provider,  
        userId,  
        accountEmail  
      );  
      return json(result);  
    }  
    if (path \=== "/api/oauth/test-multi" && req.method \=== "GET") {  
      const userId \= url.searchParams.get("user\_id") || currentUser?.id;  
      if (\!userId) return err("user\_id required");  
      const accounts \= await getUserConnectedAccounts(env, userId, "google");  
      const results \= \[\];  
      for (const acc of accounts) {  
        const tokenInfo \= await getValidAccessTokenFromDB(  
          env,  
          "google",  
          userId,  
          acc.account\_email  
        );  
        results.push({  
          email: acc.account\_email,  
          name: acc.account\_name,  
          is\_primary: acc.is\_primary,  
          token\_valid: tokenInfo.ok \=== true  
        });  
      }  
      return json({  
        user\_id: userId,  
        total\_accounts: accounts.length,  
        accounts: results  
      });  
    }  
    if (path \=== "/api/validate-key" && req.method \=== "POST") {  
      try {  
        const { provider, key } \= await req.json();  
        if (\!provider || \!key) return err("provider and key required");  
        const trimmed \= String(key).trim();  
        if (\!trimmed) return err("key empty");  
        let validateUrl, headers \= {}, method \= "GET", body;  
        switch (provider) {  
          case "claude":  
          case "anthropic":  
            validateUrl \= "https://api.anthropic.com/v1/models";  
            headers \= {  
              "x-api-key": trimmed,  
              "anthropic-version": "2023-06-01"  
            };  
            break;  
          case "openai":  
          case "gpt":  
            validateUrl \= "https://api.openai.com/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "gemini":  
          case "google\_ai":  
            validateUrl \= \`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}\`;  
            break;  
          case "grok":  
          case "xai":  
            validateUrl \= "https://" \+ "api.x.ai/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "groq":  
            validateUrl \= "https://" \+ "api.groq.com/openai/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "deepseek":  
            validateUrl \= "<https://api.deepseek.com/v1/models>";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "perplexity":  
            validateUrl \= "https://" \+ "api.perplexity.ai/chat/completions";
            method \= "POST";  
            headers \= {  
              Authorization: "Bearer " \+ trimmed,  
              "Content-Type": "application/json"  
            };  
            body \= JSON.stringify({  
              model: "sonar",  
              messages: \[{ role: "user", content: "hi" }\],  
              max\_tokens: 1  
            });  
            break;  
          case "brevo":  
            validateUrl \= "https://" \+ "api.brevo.com/v3/account";
            headers \= { "api-key": trimmed };  
            break;  
          case "sendgrid":  
            validateUrl \= "<https://api.sendgrid.com/v3/scopes>";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "mailchimp": {  
            const dc \= trimmed.split("-").pop();  
            validateUrl \= \`https://${dc}.api.mailchimp.com/3.0/ping\`;  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          }  
          case "clickup":  
            validateUrl \= "https://api.clickup.com/api/v2/user";  
            headers \= { Authorization: trimmed };  
            break;  
          case "mistral":  
            validateUrl \= "https://api.mistral.ai/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "cohere":  
            validateUrl \= "https://api.cohere.com/v1/check-api-key";  
            method \= "POST";  
            headers \= {  
              Authorization: "Bearer " \+ trimmed,  
              "Content-Type": "application/json"  
            };  
            body \= "{}";  
            break;  
          case "together":  
            validateUrl \= "https://api.together.xyz/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "openrouter":  
            validateUrl \= "https://openrouter.ai/api/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "anyscale":  
            validateUrl \= "https://api.endpoints.anyscale.com/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "lepton":  
            validateUrl \= "https://mistral-7b.lepton.run/api/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "novita":  
            validateUrl \= "https://api.novita.ai/v3/openai/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "ai21":  
            validateUrl \= "https://api.ai21.com/studio/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "huggingface":  
            validateUrl \= "https://huggingface.co/api/whoami-v2";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "replicate":  
            validateUrl \= "https://api.replicate.com/v1/account";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "fireworks":  
            validateUrl \= "https://api.fireworks.ai/inference/v1/models";  
            headers \= { Authorization: "Bearer " \+ trimmed };  
            break;  
          case "runway":  
          case "elevenlabs":  
          case "copilot":  
          case "qwen":  
          case "nylas":  
          case "cloudflare":  
          case "stripe":  
            return json({ valid: true, detail: "saved (no live validator)" });  
          default:  
            return json({  
              valid: null,  
              status: 0,  
              detail: "no validator for " \+ provider  
            });  
        }  
        let upstream, upstreamText \= "";  
        try {  
          upstream \= await fetch(validateUrl, { method, headers, body });  
          upstreamText \= await upstream.text();  
        } catch (e) {  
          return json({  
            valid: false,  
            status: 0,  
            detail: "network error: " \+ e.message  
          });  
        }  
        const valid \= upstream.ok;  
        let detail \= "", identity \= null;  
        try {  
          const j \= JSON.parse(upstreamText);  
          if (\!valid) {  
            detail \= j.error?.message || j.message || j.error || upstreamText.slice(0, 200);  
          } else {  
            if (provider \=== "brevo")  
              identity \= {  
                email: j.email,  
                name: \`${j.firstName || ""} ${j.lastName || ""}\`.trim()  
              };  
            if (provider \=== "clickup")  
              identity \= {  
                email: j.user?.email,  
                name: j.user?.username,  
                id: j.user?.id  
              };  
          }  
        } catch {  
          if (\!valid) detail \= upstreamText.slice(0, 200);  
        }  
        return json({ valid, status: upstream.status, detail, identity });  
      } catch (e) {  
        return err("validate failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/keys/status-all" && req.method \=== "GET") {  
      const providers \= \[  
        "claude",  
        "openai",  
        "gemini",  
        "deepseek",  
        "grok",  
        "groq",  
        "perplexity",  
        "mistral",  
        "cohere",  
        "together",  
        "openrouter",  
        "brevo",  
        "sendgrid",  
        "clickup"  
      \];  
      const result \= {};  
      for (const p of providers) {  
        const kv \= await env.LIFEOS\_KV.get(\`apikey\_${p}\`);  
        result\[p\] \= { has\_key: \!\!kv };  
      }  
      return json(result);  
    }  
    if (path \=== "/api/keys/store" && req.method \=== "POST") {  
      try {  
        const { service, key } \= await req.json();  
        if (\!service || \!key) return err("service and key required");  
        await env.LIFEOS\_KV.put(\`apikey\_${service}\`, String(key));  
        await env.LIFEOS\_KV.put(  
          \`apikey\_meta\_${service}\`,  
          JSON.stringify({  
            stored\_at: Date.now(),  
            last4: String(key).slice(-4)  
          })  
        );  
        return json({ ok: true, service });  
      } catch (e) {  
        return err("store failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/keys/status" && req.method \=== "GET") {  
      const service \= url.searchParams.get("service");  
      if (\!service) return err("service required");  
      const meta \= await env.LIFEOS\_KV.get(\`apikey\_meta\_${service}\`, "json");  
      const exists \= \!\!await env.LIFEOS\_KV.get(\`apikey\_${service}\`);  
      return json({ has\_key: exists, ...meta || {} });  
    }  
    if (path \=== "/api/keys/delete" && req.method \=== "DELETE") {  
      const service \= url.searchParams.get("service");  
      if (\!service) return err("service required");  
      await env.LIFEOS\_KV.delete(\`apikey\_${service}\`);  
      await env.LIFEOS\_KV.delete(\`apikey\_meta\_${service}\`);  
      return json({ ok: true, service, deleted: true });  
    }  
    if (path \=== "/api/keys/get" && req.method \=== "GET") {  
      const service \= url.searchParams.get("service");  
      if (\!service) return err("service required");  
      const key \= await env.LIFEOS\_KV.get(\`apikey\_${service}\`);  
      if (\!key) return json({ found: false });  
      return json({ found: true, key });  
    }  
    if (path \=== "/api/keys/get-all" && req.method \=== "GET") {  
      let result \= {};  
      let cursor;  
      do {  
        const listOptions \= { prefix: "apikey\_" };  
        if (cursor) listOptions.cursor \= cursor;  
        const list \= await env.LIFEOS\_KV.list(listOptions);  
        for (const k of list.keys) {  
          if (k.name.includes("\_meta\_")) continue;  
          const service \= k.name.replace("apikey\_", "");  
          result\[service\] \= await env.LIFEOS\_KV.get(k.name);  
        }  
        cursor \= list.cursor;  
      } while (cursor);  
      return json(result);  
    }  
    const TELEGRAM\_TOKEN \= env.TELEGRAM\_BOT\_TOKEN || "";  
    const TELEGRAM\_API \= \`https://api.telegram.org/bot${TELEGRAM\_TOKEN}\`;  
    if (path \=== "/api/telegram/send" && req.method \=== "POST") {  
      const { chat\_id, text, parse\_mode } \= await req.json();  
      if (\!chat\_id || \!text) return err("chat\_id and text required");  
      const res \= await fetch(\`${TELEGRAM\_API}/sendMessage\`, {  
        method: "POST",  
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify({  
          chat\_id,  
          text,  
          parse\_mode: parse\_mode || "Markdown"  
        })  
      });  
      return json(await res.json());  
    }  
    if (path \=== "/api/telegram/updates" && req.method \=== "GET") {  
      const offset \= url.searchParams.get("offset") || "";  
      const res \= await fetch(  
        \`TELEGRAMAPI/getUpdates?timeout=0\&limit=20{offset ? "\&offset=" \+ offset : ""}\`  
      );  
      return json(await res.json());  
    }  
    if (path \=== "/api/telegram/info" && req.method \=== "GET") {  
      const res \= await fetch(\`${TELEGRAM\_API}/getMe\`);  
      return json(await res.json());  
    }  
    if (path \=== "/api/telegram/webhook" && req.method \=== "POST") {  
      let webhook\_url \= null;  
      try {  
        const body \= await req.json();  
        webhook\_url \= body?.webhook\_url || null;  
      } catch {  
      }  
      if (webhook\_url && \!webhook\_url.startsWith("https://")) {  
        return json({ ok: false, error: "Webhook URL must use HTTPS" }, 400);  
      }  
      const wUrl \= webhook\_url || \`https://lifeos1.ceogps.workers.dev/api/telegram/incoming\`;  
      const res \= await fetch(  
        \`TELEGRAMAPI/setWebhook?url={encodeURIComponent(wUrl)}\`  
      );  
      return json(await res.json());  
    }  
    if (path \=== "/api/telegram/incoming" && req.method \=== "POST") {  
      const update \= await req.json();  
      const msg \= update.message || update.edited\_message;  
      if (msg) {  
        const chatId \= msg.chat.id;  
        const key \= \`telegram\_chat\_${chatId}\`;  
        const existing \= await env.LIFEOS\_KV.get(key, "json") || {  
          messages: \[\],  
          chat: msg.chat  
        };  
        existing.messages \= \[  
          {  
            from: msg.from?.username || msg.from?.first\_name || "User",  
            text: msg.text || "",  
            ts: msg.date \* 1e3  
          },  
          ...existing.messages  
        \].slice(0, 200);  
        await env.LIFEOS\_KV.put(key, JSON.stringify(existing));  
        const chatList \= await env.LIFEOS\_KV.get("telegram\_chats", "json") || \[\];  
        if (\!chatList.find((c) \=\> c.id \=== chatId)) {  
          chatList.unshift({  
            id: chatId,  
            name: msg.chat.title || msg.from?.first\_name || "Unknown",  
            type: msg.chat.type  
          });  
          await env.LIFEOS\_KV.put(  
            "telegram\_chats",  
            JSON.stringify(chatList.slice(0, 100))  
          );  
        }  
      }  
      return json({ ok: true });  
    }  
    if (path \=== "/api/telegram/chats" && req.method \=== "GET") {  
      return json(await env.LIFEOS\_KV.get("telegram\_chats", "json") || \[\]);  
    }  
    if (path \=== "/api/telegram/messages" && req.method \=== "GET") {  
      const chatId \= url.searchParams.get("chat\_id");  
      if (\!chatId) return err("chat\_id required");  
      return json(  
        await env.LIFEOS\_KV.get(\`telegram\_chat\_${chatId}\`, "json") || {  
          messages: \[\],  
          chat: {}  
        }  
      );  
    }  
    const manualMeta \= await env.LIFEOS\_KV.get(  
      "manual\_meta\_token",  
      "json"  
    ).catch(() \=\> null);  
    const META\_TOKEN \= manualMeta?.access\_token || env.META\_PAGE\_ACCESS\_TOKEN || "";  
    const META\_PAGE\_ID \= (manualMeta?.page\_id && manualMeta.page\_id.length \> 5 ? manualMeta.page\_id : null) || env.META\_PAGE\_ID || "";  
    const META\_IG\_ID \= (manualMeta?.ig\_user\_id && manualMeta.ig\_user\_id.length \> 5 ? manualMeta.ig\_user\_id : null) || env.META\_IG\_USER\_ID || "";  
    const META\_AD\_ACCT \= env.META\_AD\_ACCOUNT\_ID || "";  
    if (path \=== "/api/meta/status" && req.method \=== "GET") {  
      try {  
        if (\!META\_TOKEN || META\_TOKEN.trim().length \< 10\)  
          return json({ connected: false, error: "token\_missing" });  
        let resolvedPageId \= META\_PAGE\_ID && META\_PAGE\_ID.trim().length \> 5 ? META\_PAGE\_ID : null;  
        let resolvedIgId \= META\_IG\_ID && META\_IG\_ID.trim().length \> 5 ? META\_IG\_ID : null;  
        if (\!resolvedPageId) {  
          const me \= await graphGet(  
            "/me?fields=id,name,instagram\_business\_account",  
            META\_TOKEN  
          );  
          if (me?.error?.type \=== "OAuthException") {  
            return json({  
              connected: false,  
              error: "token\_expired",  
              detail: me.error.message  
            });  
          }  
          if (me?.id && \!me?.error) {  
            resolvedPageId \= me.id;  
            if (\!resolvedIgId && me.instagram\_business\_account?.id)  
              resolvedIgId \= me.instagram\_business\_account.id;  
          }  
          if (\!resolvedPageId) {  
            const accounts \= await graphGet(  
              "/me/accounts?fields=id,name,instagram\_business\_account",  
              META\_TOKEN  
            );  
            if (accounts?.data?.length) {  
              const first \= accounts.data\[0\];  
              resolvedPageId \= first.id;  
              if (\!resolvedIgId && first.instagram\_business\_account?.id)  
                resolvedIgId \= first.instagram\_business\_account.id;  
            }  
          }  
          if (resolvedPageId) {  
            const existing \= await env.LIFEOS\_KV.get("manual\_meta\_token", "json").catch(  
              () \=\> null  
            ) || {};  
            await env.LIFEOS\_KV.put(  
              "manual\_meta\_token",  
              JSON.stringify({  
                ...existing,  
                access\_token: META\_TOKEN,  
                page\_id: resolvedPageId,  
                ig\_user\_id: resolvedIgId || ""  
              })  
            );  
          }  
        }  
        const page \= resolvedPageId ? await graphGet(  
          \`/${resolvedPageId}?fields=name,fan\_count,followers\_count\`,  
          META\_TOKEN  
        ) : null;  
        const ig \= resolvedIgId ? await graphGet(  
          \`/${resolvedIgId}?fields=username,followers\_count,media\_count\`,  
          META\_TOKEN  
        ) : null;  
        const tokenExpired \= page?.error?.type \=== "OAuthException" || ig?.error?.type \=== "OAuthException";  
        if (tokenExpired)  
          return json({  
            connected: false,  
            error: "token\_expired",  
            detail: page?.error?.message || ig?.error?.message  
          });  
        if (\!resolvedPageId && \!resolvedIgId) {  
          const meDebug \= await graphGet("/me?fields=id,name", META\_TOKEN);  
          return json({  
            connected: false,  
            error: "discovery\_failed",  
            me\_response: meDebug,  
            token\_length: META\_TOKEN.length  
          });  
        }  
        return json({  
          connected: \!\!(META\_TOKEN && (resolvedPageId || resolvedIgId)),  
          page: page && \!page.error ? {  
            id: resolvedPageId,  
            name: page.name,  
            fans: page.fan\_count,  
            followers: page.followers\_count  
          } : null,  
          instagram: ig && \!ig.error ? {  
            id: resolvedIgId,  
            username: ig.username,  
            followers: ig.followers\_count,  
            posts: ig.media\_count  
          } : null,  
          ad\_account: META\_AD\_ACCT  
        });  
      } catch (e) {  
        return json({ connected: false, error: e.message });  
      }  
    }  
    if (path \=== "/api/meta/pages" && req.method \=== "GET") {  
      return json(  
        await graphGet(  
          "/me/accounts?fields=name,id,fan\_count,access\_token",  
          META\_TOKEN  
        )  
      );  
    }  
    if (path \=== "/api/meta/feed" && req.method \=== "GET") {  
      const limit \= url.searchParams.get("limit") || "10";  
      const cached \= await env.LIFEOS\_KV.get("manual\_meta\_token", "json").catch(  
        () \=\> null  
      );  
      const feedPageId \= (cached?.page\_id && cached.page\_id.length \> 5 ? cached.page\_id : null) || META\_PAGE\_ID;  
      if (\!feedPageId || feedPageId.trim().length \< 5\)  
        return json({ data: \[\], error: "page\_id\_not\_set" });  
      return json(  
        await graphGet(  
          \`/feedPageId/feed?fields=message,createdtime,likes.summary(true),comments.summary(true)\&limit={limit}\`,  
          META\_TOKEN  
        )  
      );  
    }  
    if (path \=== "/api/meta/instagram/feed" && req.method \=== "GET") {  
      const limit \= url.searchParams.get("limit") || "12";  
      return json(  
        await graphGet(  
          \`/METAIGID/media?fields=id,caption,mediatype,thumbnailurl,permalink,likecount,commentscount,timestamp\&limit={limit}\`,  
          META\_TOKEN  
        )  
      );  
    }  
    if (path \=== "/api/meta/instagram/insights" && req.method \=== "GET") {  
      return json(  
        await graphGet(  
          \`/${META\_IG\_ID}/insights?metric=impressions,reach,profile\_views\&period=day\`,  
          META\_TOKEN  
        )  
      );  
    }  
    if (path \=== "/api/meta/ads" && req.method \=== "GET") {  
      return json(  
        await graphGet(  
          \`/${META\_AD\_ACCT}/campaigns?fields=name,status,objective,budget\_remaining,spend\_cap\&limit=10\`,  
          META\_TOKEN  
        )  
      );  
    }  
    if (path \=== "/api/meta/post" && req.method \=== "POST") {  
      const { message, page\_id, media\_url } \= await req.json();  
      const pid \= page\_id || META\_PAGE\_ID;  
      const body \= { message };  
      if (media\_url) body.link \= media\_url;  
      return json(await graphPost(\`/${pid}/feed\`, body, META\_TOKEN));  
    }  
    if (path \=== "/api/meta/instagram/post" && req.method \=== "POST") {  
      const { caption, image\_url } \= await req.json();  
      if (\!image\_url) return err("image\_url required for Instagram");  
      const container \= await graphPost(  
        \`/${META\_IG\_ID}/media\`,  
        { caption, image\_url },  
        META\_TOKEN  
      );  
      if (\!container.id)  
        return json({  
          error: "Failed to create media container",  
          detail: container  
        });  
      return json(  
        await graphPost(  
          \`/${META\_IG\_ID}/media\_publish\`,  
          { creation\_id: container.id },  
          META\_TOKEN  
        )  
      );  
    }  
    if (path \=== "/api/linkedin/status" && req.method \=== "GET") {  
      const tok \= await liToken(env);  
      if (\!tok) return json({ connected: false });  
      const me \= await fetch("https://api.linkedin.com/v2/userinfo", {  
        headers: { Authorization: "Bearer " \+ tok }  
      }).then((r) \=\> r.json()).catch(() \=\> null);  
      return json({  
        connected: \!\!me?.sub,  
        profile: me ? { id: me.sub, name: me.name, email: me.email, picture: me.picture } : null  
      });  
    }  
    if (path \=== "/api/linkedin/posts" && req.method \=== "GET") {  
      const tok \= await liToken(env);  
      if (\!tok) return json({ data: \[\], error: "not\_connected" });  
      const me \= await fetch("https://api.linkedin.com/v2/userinfo", {  
        headers: { Authorization: "Bearer " \+ tok }  
      }).then((r) \=\> r.json()).catch(() \=\> null);  
      if (\!me?.sub) return json({ data: \[\], error: "no\_profile" });  
      const author \= encodeURIComponent(\`urn:li:person:${me.sub}\`);  
      const data \= await liGet(  
        env,  
        \`/posts?author=${author}\&q=author\&count=10\`,  
        tok  
      );  
      return json(data);  
    }  
    if (path \=== "/api/linkedin/post" && req.method \=== "POST") {  
      const tok \= await liToken(env);  
      if (\!tok) return err("LinkedIn not connected", 401);  
      const { text } \= await req.json();  
      const me \= await fetch("https://api.linkedin.com/v2/userinfo", {  
        headers: { Authorization: "Bearer " \+ tok }  
      }).then((r) \=\> r.json());  
      if (\!me?.sub) return err("LinkedIn profile fetch failed", 401);  
      const body \= {  
        author: \`urn:li:person:${me.sub}\`,  
        commentary: text || "",  
        visibility: "PUBLIC",  
        distribution: {  
          feedDistribution: "MAIN\_FEED",  
          targetEntities: \[\],  
          thirdPartyDistributionChannels: \[\]  
        },  
        lifecycleState: "PUBLISHED",  
        isReshareDisabledByAuthor: false  
      };  
      return json(await liPost(env, "/posts", body, tok));  
    }  
    if (path \=== "/api/oauth/token/save" && req.method \=== "POST") {  
      try {  
        const {  
          provider,  
          access\_token,  
          page\_id,  
          ig\_user\_id,  
          channel\_id,  
          channel\_handle,  
          bearer\_token  
        } \= await req.json();  
        if (\!provider) return err("provider required");  
        if (provider \=== "facebook" || provider \=== "instagram") {  
          if (\!access\_token) return err("access\_token required");  
          const test \= await fetch(  
            \`https://graph.facebook.com/v25.0/me?access\_token=${encodeURIComponent(access\_token)}\`  
          ).then((r) \=\> r.json()).catch(() \=\> null);  
          if (test?.error)  
            return json({ ok: false, error: test.error.message });  
          let finalToken \= access\_token;  
          if (access\_token.length \< 200 && env.META\_APP\_ID && env.META\_APP\_SECRET) {  
            const ll \= await fetch(  
              \`https://graph.facebook.com/v25.0/oauth/access\_token?grant\_type=fb\_exchange\_token\&client\_id=env.METAAPPID\&clientsecret={env.META\_APP\_SECRET}\&fb\_exchange\_token=${encodeURIComponent(access\_token)}\`  
            ).then((r) \=\> r.json()).catch(() \=\> null);  
            if (ll?.access\_token) finalToken \= ll.access\_token;  
          }  
          await env.LIFEOS\_KV.put(  
            "manual\_meta\_token",  
            JSON.stringify({  
              access\_token: finalToken,  
              page\_id: page\_id || "",  
              ig\_user\_id: ig\_user\_id || "",  
              saved\_at: Date.now()  
            })  
          );  
          return json({  
            ok: true,  
            token\_length: finalToken.length,  
            name: test.name,  
            id: test.id  
          });  
        }  
        if (provider \=== "youtube") {  
          const save \= {  
            channel\_id: channel\_id || "",  
            channel\_handle: channel\_handle || "@ceogps",  
            saved\_at: Date.now()  
          };  
          await env.LIFEOS\_KV.put("manual\_yt\_config", JSON.stringify(save));  
          return json({ ok: true });  
        }  
        if (provider \=== "x") {  
          if (\!bearer\_token) return err("bearer\_token required");  
          const test2 \= await fetch(  
            "https://api.twitter.com/2/users/by/username/ceogps?user.fields=id",  
            { headers: { Authorization: \`Bearer ${bearer\_token}\` } }  
          ).then((r) \=\> r.json()).catch(() \=\> null);  
          if (test2?.errors)  
            return json({ ok: false, error: test2.errors\[0\]?.detail });  
          await env.LIFEOS\_KV.put(  
            "manual\_x\_token",  
            JSON.stringify({ bearer\_token, saved\_at: Date.now() })  
          );  
          return json({ ok: true, handle: test2?.data?.username });  
        }  
        return err("unsupported provider for manual token save");  
      } catch (e) {  
        return json({ ok: false, error: e.message }, 500);  
      }  
      if (path \=== "/oauth/authorize" && req.method \=== "GET") {  
        const clientId \= url.searchParams.get("client\_id");  
        const redirectUri \= url.searchParams.get("redirect\_uri");  
        const scope \= url.searchParams.get("scope") || "profile";  
        const state \= url.searchParams.get("state") || "";  
        const responseType \= url.searchParams.get("response\_type") || "code";  
        if (\!clientId || \!redirectUri) {  
          return new Response("Missing client\_id or redirect\_uri", {  
            status: 400  
          });  
        }  
        const REGISTERED\_CLIENTS \= {  
          "da025257-10ff-438c-8840-f29fc5f147b2": {  
            name: "LifeOS1",  
            // Add specific allowed redirect\_uris for this client in production  
            allowed\_redirects: \[\]  
          }  
        };  
        if (\!REGISTERED\_CLIENTS\[clientId\]) {  
          return new Response("Unknown or untrusted client\_id", {  
            status: 400  
          });  
        }  
        const authRequestId \= crypto.randomUUID();  
        await env.LIFEOS\_KV.put(  
          \`oauth\_authz:${authRequestId}\`,  
          JSON.stringify({  
            client\_id: clientId,  
            redirect\_uri: redirectUri,  
            scope,  
            state,  
            response\_type: responseType,  
            code\_challenge: url.searchParams.get("code\_challenge"),  
            code\_challenge\_method: url.searchParams.get(  
              "code\_challenge\_method"  
            ),  
            created: Date.now()  
          }),  
          { expirationTtl: 600 }  
        );  
        const consentUrl \= new URL("https://lifeos1.pages.dev/oauth/consent");  
        consentUrl.searchParams.set("client\_id", clientId);  
        consentUrl.searchParams.set("redirect\_uri", redirectUri);  
        consentUrl.searchParams.set("scope", scope);  
        if (state) consentUrl.searchParams.set("state", state);  
        consentUrl.searchParams.set("authz\_id", authRequestId);  
        return Response.redirect(consentUrl.toString(), 302);  
      }  
      if (path \=== "/api/oauth/consent" && req.method \=== "POST") {  
        try {  
          const {  
            client\_id,  
            redirect\_uri,  
            scope,  
            state,  
            approved,  
            user\_id,  
            authz\_id,  
            code\_challenge  
          } \= await req.json();  
          if (\!approved) {  
            const errUrl \= new URL(redirect\_uri);  
            errUrl.searchParams.set("error", "access\_denied");  
            if (state) errUrl.searchParams.set("state", state);  
            return json({ redirect\_url: errUrl.toString() });  
          }  
          let authReq \= null;  
          if (authz\_id) {  
            authReq \= await env.LIFEOS\_KV.get(  
              \`oauth\_authz:${authz\_id}\`,  
              "json"  
            );  
          }  
          const code \= crypto.randomUUID().replace(/-/g, "");  
          const codeData \= {  
            client\_id,  
            redirect\_uri,  
            scope: scope || authReq?.scope,  
            user\_id,  
            code\_challenge: code\_challenge || authReq?.code\_challenge,  
            created: Date.now()  
          };  
          await env.LIFEOS\_KV.put(  
            \`oauth\_code:${code}\`,  
            JSON.stringify(codeData),  
            { expirationTtl: 600 }  
          );  
          if (authz\_id) await env.LIFEOS\_KV.delete(\`oauth\_authz:${authz\_id}\`);  
          const successUrl \= new URL(redirect\_uri);  
          successUrl.searchParams.set("code", code);  
          if (state) successUrl.searchParams.set("state", state);  
          return json({ redirect\_url: successUrl.toString() });  
        } catch (e) {  
          return json({ error: e.message }, 500);  
        }  
      }  
      if (path \=== "/oauth/token" && req.method \=== "POST") {  
        try {  
          const body \= await req.formData ? await req.formData() : await req.json();  
          const code \= body.get ? body.get("code") : body.code;  
          const grantType \= body.get ? body.get("grant\_type") : body.grant\_type;  
          if (grantType \!== "authorization\_code" || \!code) {  
            return json({ error: "invalid\_request" }, 400);  
          }  
          const codeDataStr \= await env.LIFEOS\_KV.get(\`oauth\_code:${code}\`);  
          if (\!codeDataStr) return json({ error: "invalid\_grant" }, 400);  
          const codeData \= JSON.parse(codeDataStr);  
          await env.LIFEOS\_KV.delete(\`oauth\_code:${code}\`);  
          const accessToken \= \`lo\_${crypto.randomUUID().replace(/-/g, "")}\`;  
          const expiresIn \= 3600;  
          await env.LIFEOS\_KV.put(  
            \`oauth\_token:${accessToken}\`,  
            JSON.stringify({  
              user\_id: codeData.user\_id,  
              client\_id: codeData.client\_id,  
              scope: codeData.scope,  
              created: Date.now()  
            }),  
            { expirationTtl: expiresIn \+ 60 }  
          );  
          return json({  
            access\_token: accessToken,  
            token\_type: "Bearer",  
            expires\_in: expiresIn,  
            scope: codeData.scope  
          });  
        } catch (e) {  
          return json(  
            { error: "server\_error", error\_description: e.message },  
            500  
          );  
        }  
      }  
    }  
    if (path \=== "/api/x/user" && req.method \=== "GET") {  
      const handle \= url.searchParams.get("handle") || "ceogps";  
      const manualX \= await env.LIFEOS\_KV.get("manual\_x\_token", "json").catch(  
        () \=\> null  
      );  
      const bearer \= manualX?.bearer\_token || env.X\_BEARER\_TOKEN || "";  
      if (\!bearer) return json({ error: "X\_BEARER\_TOKEN not configured" }, 503);  
      try {  
        const r \= await fetch(  
          \`https://api.twitter.com/2/users/by/username/${handle}?user.fields=public\_metrics,profile\_image\_url,description,verified\`,  
          {  
            headers: { Authorization: \`Bearer ${bearer}\` }  
          }  
        );  
        const d \= await r.json();  
        if (d.errors || \!d.data)  
          return json(  
            { error: d.errors?.\[0\]?.detail || "user not found" },  
            404  
          );  
        const u \= d.data;  
        return json({  
          id: u.id,  
          handle: u.username,  
          name: u.name,  
          followers: u.public\_metrics?.followers\_count || 0,  
          following: u.public\_metrics?.following\_count || 0,  
          tweets: u.public\_metrics?.tweet\_count || 0,  
          avatar: u.profile\_image\_url?.replace("\_normal", "\_400x400") || "",  
          verified: u.verified || false  
        });  
      } catch (e) {  
        return json({ error: e.message }, 500);  
      }  
    }  
    if (path \=== "/api/x/timeline" && req.method \=== "GET") {  
      const handle \= url.searchParams.get("handle") || "ceogps";  
      const max \= Math.min(parseInt(url.searchParams.get("max") || "10"), 100);  
      const manualX2 \= await env.LIFEOS\_KV.get("manual\_x\_token", "json").catch(  
        () \=\> null  
      );  
      const bearer \= manualX2?.bearer\_token || env.X\_BEARER\_TOKEN || "";  
      if (\!bearer)  
        return json({ tweets: \[\], error: "X\_BEARER\_TOKEN not configured" });  
      try {  
        const ur \= await fetch(  
          \`https://api.twitter.com/2/users/by/username/${handle}?user.fields=id\`,  
          {  
            headers: { Authorization: \`Bearer ${bearer}\` }  
          }  
        );  
        const ud \= await ur.json();  
        if (\!ud.data?.id) return json({ tweets: \[\] });  
        const userId \= ud.data.id;  
        const tr \= await fetch(  
          \`https://api.twitter.com/2/users/userId/tweets?maxresults={max}\&tweet.fields=public\_metrics,created\_at\&exclude=retweets,replies\`,  
          {  
            headers: { Authorization: \`Bearer ${bearer}\` }  
          }  
        );  
        const td \= await tr.json();  
        const tweets \= (td.data || \[\]).map((t) \=\> ({  
          id: t.id,  
          text: t.text,  
          likes: t.public\_metrics?.like\_count || 0,  
          retweets: t.public\_metrics?.retweet\_count || 0,  
          replies: t.public\_metrics?.reply\_count || 0,  
          impressions: t.public\_metrics?.impression\_count || 0,  
          createdAt: t.created\_at,  
          url: \`https://twitter.com/handle/status/{t.id}\`  
        }));  
        return json({ tweets });  
      } catch (e) {  
        return json({ tweets: \[\], error: e.message });  
      }  
    }  
    if (path \=== "/api/social/schedule" && req.method \=== "POST") {  
      const body \= await req.json();  
      if (\!body?.text || \!Array.isArray(body?.platforms) || \!body.platforms.length) {  
        return err("text \+ platforms\[\] required");  
      }  
      const id \= crypto.randomUUID();  
      const job \= {  
        id,  
        text: body.text,  
        image\_url: body.image\_url || null,  
        platforms: body.platforms,  
        when: body.when || (/\* @\_\_PURE\_\_ \*/ new Date()).toISOString(),  
        status: "pending",  
        created\_at: (/\* @\_\_PURE\_\_ \*/ new Date()).toISOString()  
      };  
      const queue \= await env.LIFEOS\_KV.get("social\_queue", "json") || \[\];  
      queue.push(job);  
      await env.LIFEOS\_KV.put("social\_queue", JSON.stringify(queue));  
      return json({ ok: true, id, job });  
    }  
    if (path \=== "/api/social/queue" && req.method \=== "GET") {  
      return json(await env.LIFEOS\_KV.get("social\_queue", "json") || \[\]);  
    }  
    if (path \=== "/api/social/queue" && req.method \=== "DELETE") {  
      const id \= url.searchParams.get("id");  
      if (\!id) return err("id required");  
      const q \= await env.LIFEOS\_KV.get("social\_queue", "json") || \[\];  
      await env.LIFEOS\_KV.put(  
        "social\_queue",  
        JSON.stringify(q.filter((j) \=\> j.id \!== id))  
      );  
      return json({ ok: true, id, cancelled: true });  
    }  
    if (path \=== "/api/social/post" && req.method \=== "POST") {  
      const { text, image\_url, platforms \= \[\] } \= await req.json();  
      if (\!text || \!platforms.length) return err("text \+ platforms\[\] required");  
      const results \= {};  
      for (const pf of platforms) {  
        try {  
          if (pf \=== "facebook") {  
            results\[pf\] \= await graphPost(  
              \`/${META\_PAGE\_ID}/feed\`,  
              image\_url ? { message: text, link: image\_url } : { message: text },  
              META\_TOKEN  
            );  
          } else if (pf \=== "instagram") {  
            if (\!image\_url) {  
              results\[pf\] \= { error: "instagram requires image\_url" };  
              continue;  
            }  
            const c \= await graphPost(  
              \`/${META\_IG\_ID}/media\`,  
              { caption: text, image\_url },  
              META\_TOKEN  
            );  
            results\[pf\] \= c.id ? await graphPost(  
              \`/${META\_IG\_ID}/media\_publish\`,  
              { creation\_id: c.id },  
              META\_TOKEN  
            ) : c;  
          } else if (pf \=== "linkedin") {  
            const tok \= await liToken(env);  
            if (\!tok) {  
              results\[pf\] \= { error: "linkedin not connected" };  
              continue;  
            }  
            const me \= await fetch("https://api.linkedin.com/v2/userinfo", {  
              headers: { Authorization: "Bearer " \+ tok }  
            }).then((r) \=\> r.json());  
            results\[pf\] \= await liPost(  
              env,  
              "/posts",  
              {  
                author: \`urn:li:person:${me.sub}\`,  
                commentary: text,  
                visibility: "PUBLIC",  
                distribution: {  
                  feedDistribution: "MAIN\_FEED",  
                  targetEntities: \[\],  
                  thirdPartyDistributionChannels: \[\]  
                },  
                lifecycleState: "PUBLISHED",  
                isReshareDisabledByAuthor: false  
              },  
              tok  
            );  
          } else {  
            results\[pf\] \= { error: \`platform "${pf}" not yet wired\` };  
          }  
        } catch (e) {  
          results\[pf\] \= { error: e.message };  
        }  
      }  
      return json({ ok: true, results });  
    }  
    if (path.startsWith("/api/bd")) {  
      const bdPath \= path.replace("/api/bd", "") || "/";  
      const bdUrl \= \`https://ceogps.com/api/v2bdPath{url.search || ""}\`;  
      const bdKey \= env.BD\_API\_KEY || "";  
      const bdOpts \= {  
        method: req.method,  
        headers: {  
          "X-Api-Key": bdKey,  
          "Content-Type": "application/json",  
          Accept: "application/json"  
        }  
      };  
      if (req.method \!== "GET" && req.method \!== "HEAD") {  
        bdOpts.body \= await req.text();  
      }  
      try {  
        const bdRes \= await fetch(bdUrl, bdOpts);  
        const bdData \= await bdRes.text();  
        return new Response(bdData, {  
          status: bdRes.status,  
          headers: { ...CORS, "Content-Type": "application/json" }  
        });  
      } catch (e) {  
        return json(  
          { status: "error", message: "BD proxy error: " \+ e.message },  
          502  
        );  
      }  
    }  
    if (path \=== "/api/llm/invoke" && req.method \=== "POST") {  
      const clientIp \= req.headers.get("CF-Connecting-IP") || "unknown";  
      const rateLimit \= await checkRateLimit(env, \`llm:${clientIp}\`, 60, 30);  
      if (\!rateLimit.allowed) {  
        return json(  
          { error: "Rate limit exceeded. Please try again later." },  
          429  
        );  
      }  
      try {  
        const body \= await req.json();  
        const {  
          prompt \= "",  
          system \= "",  
          model \= "auto",  
          max\_tokens \= 800  
        } \= body;  
        let messages \= Array.isArray(body.messages) ? body.messages : \[\];  
        if (\!messages.length) {  
          if (system) messages.push({ role: "system", content: system });  
          messages.push({ role: "user", content: prompt });  
        }  
        if (\!messages.length) return err("prompt or messages required");  
        const k \= /\* @\_\_PURE\_\_ \*/ \_\_name(async (svc) \=\> {  
          const fromKV \= await env.LIFEOS\_KV.get(\`apikey\_${svc}\`);  
          if (fromKV) return fromKV;  
          const envMap \= {  
            claude: "ANTHROPIC\_API\_KEY",  
            openai: "OPENAI\_API\_KEY",  
            gemini: "GEMINI\_API\_KEY",  
            deepseek: "DEEPSEEK\_API\_KEY",  
            grok: "GROK\_API\_KEY",  
            groq: "GROQ\_API\_KEY",  
            mistral: "MISTRAL\_API\_KEY"  
          };  
          return envMap\[svc\] ? env\[envMap\[svc\]\] : null;  
        }, "k");  
        const keys \= {  
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
        const auto \= \[  
          "groq",  
          "cf\_free",  
          "deepseek",  
          "grok",  
          "claude",  
          "openai",  
          "gemini",  
          "mistral",  
          "together",  
          "openrouter",  
          "cohere",  
          "qwen",  
          "novita",  
          "fireworks",  
          "ai21",  
          "perplexity"  
        \];  
        const m \= String(model).toLowerCase();  
        let chain \= m \=== "auto" || \!m ? auto : \[m, ...auto.filter((x) \=\> x \!== m)\];  
        chain \= chain.filter((p) \=\> p \=== "cf\_free" || keys\[p\]);  
        if (\!chain.includes("cf\_free")) chain.push("cf\_free");  
        const tried \= \[\];  
        for (const provider of chain) {  
          try {  
            let text, statusOk \= false;  
            if (provider \=== "claude") {  
              const r \= await fetch("https://api.anthropic.com/v1/messages", {  
                method: "POST",  
                headers: {  
                  "x-api-key": keys.claude,  
                  "anthropic-version": "2023-06-01",  
                  "Content-Type": "application/json"  
                },  
                body: JSON.stringify({  
                  model: "claude-sonnet-4-20250514",  
                  max\_tokens,  
                  system,  
                  messages: messages.filter((m2) \=\> m2.role \!== "system")  
                })  
              });  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const d \= await r.json();  
              text \= d.content?.\[0\]?.text || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "openai") {  
              const r \= await fetch(  
                "https://api.openai.com/v1/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.openai,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "gpt-4o-mini",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const d \= await r.json();  
              text \= d.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "gemini") {  
              const contents \= messages.filter((m2) \=\> m2.role \!== "system").map((m2) \=\> ({  
                role: m2.role \=== "assistant" ? "model" : "user",  
                parts: \[{ text: m2.content }\]  
              }));  
              const sysInst \= system || messages.find((m2) \=\> m2.role \=== "system")?.content;  
              const r \= await fetch(  
                \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(keys.gemini)}\`,  
                {  
                  method: "POST",  
                  headers: { "Content-Type": "application/json" },  
                  body: JSON.stringify({  
                    contents,  
                    ...sysInst ? { systemInstruction: { parts: \[{ text: sysInst }\] } } : {},  
                    generationConfig: { maxOutputTokens: max\_tokens }  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const d \= await r.json();  
              text \= d.candidates?.\[0\]?.content?.parts?.\[0\]?.text || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "deepseek") {  
              const r \= await fetch(  
                "https://api.deepseek.com/v1/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.deepseek,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "deepseek-chat",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const d \= await r.json();  
              text \= d.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "grok") {  
              const r \= await fetch("https://api.x.ai/v1/chat/completions", {  
                method: "POST",  
                headers: {  
                  Authorization: "Bearer " \+ keys.grok,  
                  "Content-Type": "application/json"  
                },  
                body: JSON.stringify({  
                  model: "grok-2-latest",  
                  messages,  
                  max\_tokens  
                })  
              });  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const d \= await r.json();  
              text \= d.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "groq") {  
              const r \= await fetch(  
                "https://api.groq.com/openai/v1/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.groq,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "llama-3.3-70b-versatile",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const d \= await r.json();  
              text \= d.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "mistral") {  
              const r \= await fetch(  
                "https://api.mistral.ai/v1/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.mistral,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "mistral-small-latest",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const d \= await r.json();  
              text \= d.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "qwen") {  
              const r \= await fetch(  
                "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.qwen,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "qwen-plus",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const dq \= await r.json();  
              text \= dq.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "novita") {  
              const r \= await fetch(  
                "https://api.novita.ai/v3/openai/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.novita,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "meta-llama/llama-3.1-70b-instruct",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const dn \= await r.json();  
              text \= dn.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "fireworks") {  
              const r \= await fetch(  
                "https://api.fireworks.ai/inference/v1/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.fireworks,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "accounts/fireworks/models/llama-v3p1-70b-instruct",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const df \= await r.json();  
              text \= df.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "ai21") {  
              const r \= await fetch(  
                "https://api.ai21.com/studio/v1/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.ai21,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "jamba-1.5-mini",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const da \= await r.json();  
              text \= da.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "perplexity") {  
              const r \= await fetch(  
                "https://api.perplexity.ai/chat/completions",  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ keys.perplexity,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    model: "sonar",  
                    messages,  
                    max\_tokens  
                  })  
                }  
              );  
              if (\!r.ok) {  
                tried.push({  
                  provider,  
                  status: r.status,  
                  reason: (await r.text()).slice(0, 140\)  
                });  
                continue;  
              }  
              const dp \= await r.json();  
              text \= dp.choices?.\[0\]?.message?.content || "";  
              statusOk \= \!\!text;  
            } else if (provider \=== "cf\_free") {  
              if (\!env.AI) {  
                tried.push({  
                  provider,  
                  status: 0,  
                  reason: "AI binding missing"  
                });  
                continue;  
              }  
              const result \= await env.AI.run(  
                "@cf/meta/llama-3.3-70b-instruct-fp8-fast",  
                { messages, max\_tokens }  
              );  
              text \= result?.response || result?.result?.response || "";  
              statusOk \= \!\!text;  
              if (\!statusOk) {  
                tried.push({ provider, status: 500, reason: "no response" });  
                continue;  
              }  
            }  
            if (statusOk) {  
              tried.push({ provider, status: 200, reason: "ok" });  
              return json({  
                text,  
                model\_used: provider,  
                fallback\_count: tried.length \- 1,  
                providers\_tried: tried  
              });  
            }  
          } catch (e) {  
            tried.push({  
              provider,  
              status: 0,  
              reason: e.message?.slice(0, 140\) || "exception"  
            });  
            continue;  
          }  
        }  
        return json(  
          {  
            text: "\[All AI providers unavailable. Add an API key in Integrations.\]",  
            model\_used: null,  
            fallback\_count: tried.length,  
            providers\_tried: tried,  
            error: "no\_provider\_responded"  
          },  
          503  
        );  
      } catch (e) {  
        return err("LLM invoke failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/llm/preference" && req.method \=== "GET") {  
      const preferred \= await env.LIFEOS\_KV.get("llm\_preferred\_model") || "auto";  
      return json({ preferred });  
    }  
    if (path \=== "/api/llm/preference" && req.method \=== "POST") {  
      try {  
        const { model } \= await req.json();  
        const next \= String(model || "auto").trim().toLowerCase();  
        await env.LIFEOS\_KV.put("llm\_preferred\_model", next);  
        return json({ ok: true, preferred: next });  
      } catch (e) {  
        return err("preference save failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/ai/generate" && req.method \=== "POST") {  
      const clientIp \= req.headers.get("CF-Connecting-IP") || "unknown";  
      const rateLimit \= await checkRateLimit(env, \`ai:${clientIp}\`, 60, 20);  
      if (\!rateLimit.allowed) {  
        return json(  
          { error: "Rate limit exceeded. Please try again later." },  
          429  
        );  
      }  
      try {  
        const body \= await req.json();  
        const { prompt \= "", system \= "", max\_tokens \= 800, model \= "" } \= body;  
        const messages \= \[\];  
        if (system) messages.push({ role: "system", content: system });  
        messages.push({ role: "user", content: prompt });  
        let cfModel \= "@cf/meta/llama-3.1-8b-instruct";  
        if (model.includes("llama-3.3") || model.includes("70b"))  
          cfModel \= "@cf/meta/llama-3.3-70b-instruct-fp8-fast";  
        if (model.includes("mistral"))  
          cfModel \= "@cf/mistral/mistral-7b-instruct-v0.1";  
        if (\!env.AI)  
          return json(  
            { text: "\[Workers AI not bound \\u2014 check wrangler.toml\]" },  
            500  
          );  
        const result \= await env.AI.run(cfModel, { messages, max\_tokens });  
        const text \= result?.response || result?.result?.response || "\[No response from AI\]";  
        return json({ text, model: cfModel });  
      } catch (e) {  
        return json({ text: "\[AI Error: " \+ e.message \+ "\]" }, 500);  
      }  
    }  
    if (path \=== "/api/email/accounts" && req.method \=== "GET") {  
      const accounts \= \[\];  
      const gIdx \= await env.LIFEOS\_KV.get("oauth\_index\_google", "json") || \[\];  
      for (const a of gIdx) {  
        accounts.push({  
          provider: "gmail",  
          account\_label: a.label,  
          email: a.identity?.email || null,  
          name: a.identity?.name || null,  
          can\_send: true,  
          can\_read: true  
        });  
      }  
      const mIdx \= await env.LIFEOS\_KV.get("oauth\_index\_microsoft", "json") || \[\];  
      for (const a of mIdx) {  
        accounts.push({  
          provider: "outlook",  
          account\_label: a.label,  
          email: a.identity?.email || null,  
          name: a.identity?.name || null,  
          can\_send: true,  
          can\_read: true  
        });  
      }  
      const brevoKey \= await env.LIFEOS\_KV.get("apikey\_brevo");  
      if (brevoKey)  
        accounts.push({  
          provider: "brevo",  
          account\_label: "brevo",  
          email: "(via Brevo)",  
          can\_send: true,  
          can\_read: false  
        });  
      return json({ accounts });  
    }  
    if (path \=== "/api/email/labels" && req.method \=== "GET") {  
      const provider \= url.searchParams.get("provider") || "gmail";  
      const account \= url.searchParams.get("account") || "default";  
      if (provider \=== "gmail") {  
        const t \= await getValidAccessToken(env, "google", account);  
        if (t.error) return json({ error: t.error, detail: t.detail }, 401);  
        const r \= await fetch(  
          "https://gmail.googleapis.com/gmail/v1/users/me/labels",  
          { headers: { Authorization: "Bearer " \+ t.access\_token } }  
        );  
        if (\!r.ok)  
          return json({ error: "gmail\_labels\_failed", status: r.status }, 502);  
        const d \= await r.json();  
        const labels \= (d.labels || \[\]).map((l) \=\> ({  
          id: l.id,  
          name: l.name,  
          type: l.type,  
          unread: l.messagesUnread,  
          total: l.messagesTotal  
        }));  
        return json({ provider, account, labels });  
      }  
      return json({ provider, account, labels: \[\] });  
    }  
    if (path \=== "/api/email/threads" && req.method \=== "GET") {  
      const provider \= url.searchParams.get("provider") || "gmail";  
      const account \= url.searchParams.get("account") || "default";  
      const label \= url.searchParams.get("label") || "INBOX";  
      const limit \= Math.min(  
        50,  
        parseInt(url.searchParams.get("limit") || "25", 10\)  
      );  
      if (provider \=== "gmail") {  
        const t \= await getValidAccessToken(env, "google", account);  
        if (t.error) return json({ error: t.error, detail: t.detail }, 401);  
        const listUrl \= new URL(  
          "https://gmail.googleapis.com/gmail/v1/users/me/threads"  
        );  
        listUrl.searchParams.set("labelIds", label);  
        listUrl.searchParams.set("maxResults", String(limit));  
        const r \= await fetch(listUrl, {  
          headers: { Authorization: "Bearer " \+ t.access\_token }  
        });  
        if (\!r.ok)  
          return json({ error: "gmail\_threads\_failed", status: r.status }, 502);  
        const d \= await r.json();  
        const ids \= (d.threads || \[\]).map((x) \=\> x.id);  
        if (\!ids.length) return json({ provider, account, label, threads: \[\] });  
        const detailed \= await Promise.all(  
          ids.map(async (id) \=\> {  
            try {  
              const dr \= await fetch(  
                \`https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}?format=metadata\&metadataHeaders=From\&metadataHeaders=Subject\&metadataHeaders=Date\`,  
                { headers: { Authorization: "Bearer " \+ t.access\_token } }  
              );  
              if (\!dr.ok) return null;  
              const th \= await dr.json();  
              const msgs \= th.messages || \[\];  
              const last \= msgs\[msgs.length \- 1\] || msgs\[0\] || {};  
              const hdrs \= (last.payload?.headers || \[\]).reduce((a, h) \=\> {  
                a\[h.name.toLowerCase()\] \= h.value;  
                return a;  
              }, {});  
              const labelIds \= /\* @\_\_PURE\_\_ \*/ new Set();  
              msgs.forEach(  
                (m) \=\> (m.labelIds || \[\]).forEach((l) \=\> labelIds.add(l))  
              );  
              return {  
                id: th.id,  
                subject: hdrs.subject || "(no subject)",  
                from: hdrs.from || "",  
                date: hdrs.date || "",  
                snippet: last.snippet || th.snippet || "",  
                message\_count: msgs.length,  
                unread: labelIds.has("UNREAD"),  
                starred: labelIds.has("STARRED")  
              };  
            } catch {  
              return null;  
            }  
          })  
        );  
        return json({  
          provider,  
          account,  
          label,  
          threads: detailed.filter(Boolean)  
        });  
      }  
      return json({ provider, account, label, threads: \[\] });  
    }  
    if (path \=== "/api/email/send" && req.method \=== "POST") {  
      try {  
        const body \= await req.json();  
        const {  
          provider \= "gmail",  
          account \= "default",  
          to \= "",  
          subject \= "",  
          body\_text \= "",  
          body\_html \= ""  
        } \= body;  
        if (\!to) return err("to required");  
        if (provider \=== "gmail") {  
          const t \= await getValidAccessToken(env, "google", account);  
          if (t.error) return json({ error: t.error, detail: t.detail }, 401);  
          const fromEmail \= t.identity?.email || "";  
          const mime \= \[  
            \`From: ${fromEmail}\`,  
            \`To: ${to}\`,  
            \`Subject: ${subject}\`,  
            "MIME-Version: 1.0",  
            body\_html ? "Content-Type: text/html; charset=utf-8" : "Content-Type: text/plain; charset=utf-8",  
            "",  
            body\_html || body\_text  
          \].filter(Boolean).join("\\r\\n");  
          const enc \= btoa(unescape(encodeURIComponent(mime))).replace(/\\+/g, "-").replace(/\\//g, "\_").replace(/=+$/, "");  
          const r \= await fetch(  
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",  
            {  
              method: "POST",  
              headers: {  
                Authorization: "Bearer " \+ t.access\_token,  
                "Content-Type": "application/json"  
              },  
              body: JSON.stringify({ raw: enc })  
            }  
          );  
          if (\!r.ok)  
            return json({ error: "gmail\_send\_failed", status: r.status }, 502);  
          const d \= await r.json();  
          return json({  
            ok: true,  
            provider: "gmail",  
            id: d.id,  
            thread\_id: d.threadId  
          });  
        }  
        if (provider \=== "brevo") {  
          const key \= await env.LIFEOS\_KV.get("apikey\_brevo");  
          if (\!key) return json({ error: "brevo\_no\_key" }, 401);  
          const r \= await fetch("https://api.brevo.com/v3/smtp/email", {  
            method: "POST",  
            headers: { "api-key": key, "Content-Type": "application/json" },  
            body: JSON.stringify({  
              sender: { email: "noreply@example.com" },  
              to: to.split(",").map((e) \=\> ({ email: e.trim() })),  
              subject,  
              htmlContent: body\_html || \`\<pre\>${body\_text}\</pre\>\`,  
              textContent: body\_text || void 0  
            })  
          });  
          if (\!r.ok)  
            return json({ error: "brevo\_send\_failed", status: r.status }, 502);  
          return json({ ok: true, provider: "brevo" });  
        }  
        return json({ error: "unsupported\_provider", provider }, 400);  
      } catch (e) {  
        return err("send failed: " \+ e.message, 500);  
      }  
    }  
    if (path.startsWith("/api/email/thread/") && req.method \=== "GET") {  
      const threadId \= decodeURIComponent(  
        path.replace("/api/email/thread/", "")  
      );  
      const provider \= url.searchParams.get("provider") || "gmail";  
      const account \= url.searchParams.get("account") || "default";  
      if (provider \=== "gmail") {  
        const t \= await getValidAccessToken(env, "google", account);  
        if (t.error) return json({ error: t.error, detail: t.detail }, 401);  
        try {  
          const r \= await fetch(  
            \`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full\`,  
            {  
              headers: { Authorization: "Bearer " \+ t.access\_token }  
            }  
          );  
          if (\!r.ok)  
            return json(  
              { error: "gmail\_thread\_failed", status: r.status },  
              502  
            );  
          const th \= await r.json();  
          const messages \= (th.messages || \[\]).map((m) \=\> {  
            const hdrs \= (m.payload?.headers || \[\]).reduce((a, h) \=\> {  
              a\[h.name.toLowerCase()\] \= h.value;  
              return a;  
            }, {});  
            let text \= "", html \= "";  
            function extractParts(parts \= \[\]) {  
              for (const p of parts) {  
                if (p.mimeType \=== "text/plain" && p.body?.data)  
                  text \= atob(  
                    p.body.data.replace(/-/g, "+").replace(/\_/g, "/")  
                  );  
                if (p.mimeType \=== "text/html" && p.body?.data)  
                  html \= atob(  
                    p.body.data.replace(/-/g, "+").replace(/\_/g, "/")  
                  );  
                if (p.parts) extractParts(p.parts);  
              }  
            }  
            \_\_name(extractParts, "extractParts");  
            if (m.payload?.body?.data) {  
              const raw \= atob(  
                m.payload.body.data.replace(/-/g, "+").replace(/\_/g, "/")  
              );  
              if (m.payload.mimeType \=== "text/html") html \= raw;  
              else text \= raw;  
            }  
            extractParts(m.payload?.parts || \[\]);  
            return {  
              id: m.id,  
              from: hdrs.from || "",  
              to: hdrs.to || "",  
              date: hdrs.date || "",  
              subject: hdrs.subject || "",  
              text,  
              html,  
              snippet: m.snippet || "",  
              labelIds: m.labelIds || \[\]  
            };  
          });  
          return json({ id: th.id, messages, message\_count: messages.length });  
        } catch (e) {  
          return err("thread fetch failed: " \+ e.message, 500);  
        }  
      }  
      return json({ error: "unsupported\_provider", provider }, 400);  
    }  
    if (path \=== "/api/email/mark" && req.method \=== "POST") {  
      try {  
        const body \= await req.json();  
        const {  
          provider \= "gmail",  
          account \= "default",  
          message\_ids \= \[\],  
          action \= "read"  
        } \= body;  
        if (provider \=== "gmail") {  
          const t \= await getValidAccessToken(env, "google", account);  
          if (t.error) return json({ error: t.error, detail: t.detail }, 401);  
          const addLabels \= action \=== "unread" ? \["UNREAD"\] : action \=== "starred" ? \["STARRED"\] : \[\];  
          const removeLabels \= action \=== "read" ? \["UNREAD"\] : action \=== "unstarred" ? \["STARRED"\] : \[\];  
          await Promise.all(  
            message\_ids.map(  
              (id) \=\> fetch(  
                \`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify\`,  
                {  
                  method: "POST",  
                  headers: {  
                    Authorization: "Bearer " \+ t.access\_token,  
                    "Content-Type": "application/json"  
                  },  
                  body: JSON.stringify({  
                    addLabelIds: addLabels,  
                    removeLabelIds: removeLabels  
                  })  
                }  
              )  
            )  
          );  
          return json({ ok: true, action, count: message\_ids.length });  
        }  
        return json({ ok: true });  
      } catch (e) {  
        return err("mark failed: " \+ e.message, 500);  
      }  
    }  
    const YT\_KEY \= env.YOUTUBE\_DATA\_V3\_API\_KEY || "";  
    const manualYt \= await env.LIFEOS\_KV.get("manual\_yt\_config", "json").catch(  
      () \=\> null  
    );  
    const YT\_CHANNEL\_ID \= (manualYt?.channel\_id && manualYt.channel\_id.trim().length \> 5 ? manualYt.channel\_id : null) || env.YOUTUBE\_CHANNEL\_ID || "";  
    if (path \=== "/api/youtube/channel" && req.method \=== "GET") {  
      try {  
        if (\!YT\_KEY)  
          return json({ error: "YouTube API key not configured" }, 503);  
        const YT\_HANDLE \= manualYt?.channel\_handle || env.YOUTUBE\_CHANNEL\_HANDLE || "@ceogps";  
        const query \= YT\_CHANNEL\_ID && YT\_CHANNEL\_ID.trim().length \> 5 ? \`id=YTCHANNELID\`:\`forHandle={encodeURIComponent(YT\_HANDLE)}\`;  
        const r \= await fetch(  
          \`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics\&query\&key={YT\_KEY}\`  
        );  
        const d \= await r.json();  
        const ch \= d.items?.\[0\];  
        if (\!ch)  
          return json(  
            {  
              error: "Channel not found \\u2014 set YOUTUBE\_CHANNEL\_ID or YOUTUBE\_CHANNEL\_HANDLE in Worker env"  
            },  
            404  
          );  
        return json({  
          connected: true,  
          id: ch.id,  
          title: ch.snippet.title,  
          description: ch.snippet.description,  
          thumbnail: ch.snippet.thumbnails?.default?.url,  
          subscribers: parseInt(ch.statistics.subscriberCount || 0),  
          views: parseInt(ch.statistics.viewCount || 0),  
          videoCount: parseInt(ch.statistics.videoCount || 0\)  
        });  
      } catch (e) {  
        return json({ error: e.message }, 500);  
      }  
    }  
    if (path \=== "/api/youtube/videos" && req.method \=== "GET") {  
      try {  
        if (\!YT\_KEY)  
          return json({ items: \[\], error: "YouTube API key not configured" });  
        let channelId \= YT\_CHANNEL\_ID && YT\_CHANNEL\_ID.trim().length \> 5 ? YT\_CHANNEL\_ID : null;  
        if (\!channelId) {  
          const YT\_HANDLE \= manualYt?.channel\_handle || env.YOUTUBE\_CHANNEL\_HANDLE || "@ceogps";  
          const cr \= await fetch(  
            \`https://www.googleapis.com/youtube/v3/channels?part=id\&forHandle=encodeURIComponent(YTHANDLE)\&key={YT\_KEY}\`  
          );  
          const cd \= await cr.json();  
          channelId \= cd.items?.\[0\]?.id || null;  
        }  
        if (\!channelId) return json({ items: \[\] });  
        const max \= url.searchParams.get("max") || "10";  
        const r \= await fetch(  
          \`https://www.googleapis.com/youtube/v3/search?part=snippet\&channelId=channelId\&maxResults={max}\&order=date\&type=video\&key=${YT\_KEY}\`  
        );  
        const d \= await r.json();  
        const items \= (d.items || \[\]).map((v) \=\> ({  
          id: v.id.videoId,  
          title: v.snippet.title,  
          description: v.snippet.description,  
          thumbnail: v.snippet.thumbnails?.medium?.url,  
          publishedAt: v.snippet.publishedAt,  
          url: \`https://www.youtube.com/watch?v=${v.id.videoId}\`  
        }));  
        return json({ items });  
      } catch (e) {  
        return json({ error: e.message, items: \[\] }, 500);  
      }  
    }  
    if (path \=== "/api/browse/fetch" && req.method \=== "POST") {  
      try {  
        const { url: fetchUrl, extract \= "text" } \= await req.json();  
        if (\!fetchUrl) return err("url is required");  
        const r \= await fetch(fetchUrl, {  
          headers: { "User-Agent": "Mozilla/5.0 (compatible; LifeOS1/1.0)" },  
          redirect: "follow"  
        });  
        if (\!r.ok)  
          return json({ error: "HTTP " \+ r.status, url: fetchUrl }, r.status);  
        const html \= await r.text();  
        const finalUrl \= r.url || fetchUrl;  
        const cleanText \= html.replace(/\<script\[\\s\\S\]\*?\<\\/script\>/gi, "").replace(/\<style\[\\s\\S\]\*?\<\\/style\>/gi, "").replace(/\<\[^\>\]+\>/g, " ").replace(/\\s+/g, " ").trim().slice(0, 8e3);  
        const titleMatch \= html.match(/\<title\[^\>\]\*\>(\[\\s\\S\]\*?)\<\\/title\>/i);  
        const title \= titleMatch ? titleMatch\[1\].replace(/\\s+/g, " ").trim() : "";  
        if (extract \=== "links") {  
          const linkMatches \= \[  
            ...html.matchAll(  
              /\<a\\s\[^\>\]\*href=\["'\](\[^"'\]+)\["'\]\[^\>\]\*\>(\[\\s\\S\]\*?)\<\\/a\>/gi  
            )  
          \];  
          const links \= linkMatches.map((m) \=\> ({  
            href: m\[1\].startsWith("http") ? m\[1\] : new URL(m\[1\], fetchUrl).href,  
            text: m\[2\].replace(/\<\[^\>\]+\>/g, "").trim().slice(0, 80\)  
          })).filter((l) \=\> l.text.length \> 1).slice(0, 30);  
          return json({ success: true, url: finalUrl, title, links });  
        }  
        return json({ success: true, url: finalUrl, title, text: cleanText });  
      } catch (e) {  
        return json({ error: e.message }, 500);  
      }  
    }  
    if (path \=== "/api/browse/search" && req.method \=== "POST") {  
      try {  
        const { query, limit \= 8 } \= await req.json();  
        if (\!query) return err("query is required");  
        const encodedQ \= encodeURIComponent(query);  
        const r \= await fetch(  
          "https://html.duckduckgo.com/html/?q=" \+ encodedQ,  
          {  
            headers: { "User-Agent": "Mozilla/5.0 (compatible; LifeOS1/1.0)" }  
          }  
        );  
        const html \= await r.text();  
        const results \= \[\];  
        const blocks \= html.split('\<div class="result ');  
        for (const block of blocks.slice(1, limit \+ 1)) {  
          const titleM \= block.match(  
            /\<a\[^\>\]+class="result\_\_a"\[^\>\]\*\>(\[\\s\\S\]\*?)\<\\/a\>/i  
          );  
          const urlM \= block.match(  
            /\<a\[^\>\]+class="result\_\_url"\[^\>\]\*\>(\[\\s\\S\]\*?)\<\\/a\>/i  
          );  
          const snippM \= block.match(  
            /\<a\[^\>\]+class="result\_\_snippet"\[^\>\]\*\>(\[\\s\\S\]\*?)\<\\/a\>/i  
          );  
          const title \= titleM ? titleM\[1\].replace(/\<\[^\>\]+\>/g, "").trim() : "";  
          const urlText \= urlM ? urlM\[1\].replace(/\<\[^\>\]+\>/g, "").trim() : "";  
          const snippet \= snippM ? snippM\[1\].replace(/\<\[^\>\]+\>/g, "").trim() : "";  
          if (title)  
            results.push({  
              title,  
              url: urlText ? "https://" \+ urlText : "",  
              snippet  
            });  
        }  
        return json({ success: true, query, results });  
      } catch (e) {  
        return json({ error: e.message }, 500);  
      }  
    }  
    if (path.startsWith("/api/agents")) {  
      const agentRes \= await handleAgents(path, req, env);  
      if (agentRes) return agentRes;  
    }  
    if (path \=== "/api/enrich/contact" && req.method \=== "POST") {  
      const key \= env.ENRICH\_API\_KEY;  
      if (\!key) return err("ENRICH\_API\_KEY not configured on Worker", 503);  
      try {  
        const payload \= await req.json();  
        const upstream \= await fetch("https://api.enrich.so/v1/lookup", {  
          method: "POST",  
          headers: {  
            Authorization: \`Bearer ${key}\`,  
            "Content-Type": "application/json"  
          },  
          body: JSON.stringify(payload)  
        });  
        const data \= await upstream.json().catch(() \=\> ({}));  
        if (\!upstream.ok)  
          return json(  
            {  
              error: data?.message || "enrich upstream error",  
              status: upstream.status  
            },  
            502  
          );  
        return json(data);  
      } catch (e) {  
        return err("enrich failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/runway/generate" && req.method \=== "POST") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_runway");  
      if (\!apiKey)  
        return err(  
          "Runway API key not configured. Add it in Integrations.",  
          503  
        );  
      try {  
        const body \= await req.json();  
        const upstream \= await fetch(  
          "https://api.dev.runwayml.com/v1/image\_to\_video",  
          {  
            method: "POST",  
            headers: {  
              Authorization: \`Bearer ${apiKey}\`,  
              "Content-Type": "application/json",  
              "X-Runway-Version": "2024-11-06"  
            },  
            body: JSON.stringify({  
              promptImage: body.image\_url,  
              promptText: body.prompt,  
              model: body.model || "gen3a\_turbo",  
              duration: body.duration || 5,  
              ratio: body.ratio || "1280:768"  
            })  
          }  
        );  
        const data \= await upstream.json().catch(() \=\> ({}));  
        if (\!upstream.ok)  
          return json(  
            { error: data?.error || "Runway error", status: upstream.status },  
            502  
          );  
        return json(data);  
      } catch (e) {  
        return err("Runway failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/runway/status" && req.method \=== "GET") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_runway");  
      if (\!apiKey) return err("Runway API key not configured", 503);  
      const taskId \= new URL(req.url).searchParams.get("task\_id");  
      if (\!taskId) return err("task\_id required", 400);  
      try {  
        const upstream \= await fetch(  
          \`https://api.dev.runwayml.com/v1/tasks/${taskId}\`,  
          {  
            headers: {  
              Authorization: \`Bearer ${apiKey}\`,  
              "X-Runway-Version": "2024-11-06"  
            }  
          }  
        );  
        const data \= await upstream.json().catch(() \=\> ({}));  
        if (\!upstream.ok)  
          return json(  
            { error: data?.error || "Runway error", status: upstream.status },  
            502  
          );  
        return json(data);  
      } catch (e) {  
        return err("Runway status failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/elevenlabs/tts" && req.method \=== "POST") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_elevenlabs");  
      if (\!apiKey)  
        return err(  
          "ElevenLabs API key not configured. Add it in Integrations.",  
          503  
        );  
      try {  
        const body \= await req.json();  
        const voiceId \= body.voice\_id || "21m00Tcm4TlvDq8ikWAM";  
        const upstream \= await fetch(  
          \`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}\`,  
          {  
            method: "POST",  
            headers: {  
              "xi-api-key": apiKey,  
              "Content-Type": "application/json"  
            },  
            body: JSON.stringify({  
              text: body.text,  
              model\_id: body.model || "eleven\_monolingual\_v1",  
              voice\_settings: { stability: 0.5, similarity\_boost: 0.75 }  
            })  
          }  
        );  
        if (\!upstream.ok) {  
          const e \= await upstream.json().catch(() \=\> ({}));  
          return json({ error: e?.detail?.message || "ElevenLabs error" }, 502);  
        }  
        const audio \= await upstream.arrayBuffer();  
        return new Response(audio, {  
          headers: { ...CORS, "Content-Type": "audio/mpeg" }  
        });  
      } catch (e) {  
        return err("ElevenLabs failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/elevenlabs/voices" && req.method \=== "GET") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_elevenlabs");  
      if (\!apiKey) return err("ElevenLabs API key not configured", 503);  
      try {  
        const r \= await fetch("https://api.elevenlabs.io/v1/voices", {  
          headers: { "xi-api-key": apiKey }  
        });  
        const d \= await r.json().catch(() \=\> ({}));  
        return json(d);  
      } catch (e) {  
        return err("ElevenLabs voices failed: " \+ e.message, 500);  
      }  
    }  
    if (path \=== "/api/replicate/run" && req.method \=== "POST") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_replicate");  
      if (\!apiKey)  
        return err(  
          "Replicate API key not configured. Add it in Integrations.",  
          503  
        );  
      try {  
        const body \= await req.json();  
        const upstream \= await fetch(  
          "https://api.replicate.com/v1/predictions",  
          {  
            method: "POST",  
            headers: {  
              Authorization: \`Bearer ${apiKey}\`,  
              "Content-Type": "application/json"  
            },  
            body: JSON.stringify({ version: body.version, input: body.input })  
          }  
        );  
        const data \= await upstream.json().catch(() \=\> ({}));  
        if (\!upstream.ok)  
          return json({ error: data?.detail || "Replicate error" }, 502);  
        return json(data);  
      } catch (e) {  
        return err("Replicate failed: " \+ e.message, 500);  
      }  
    }  
    if (path.startsWith("/api/replicate/") && req.method \=== "GET") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_replicate");  
      if (\!apiKey) return err("Replicate API key not configured", 503);  
      const predId \= path.replace("/api/replicate/", "");  
      try {  
        const r \= await fetch(  
          \`https://api.replicate.com/v1/predictions/${predId}\`,  
          {  
            headers: { Authorization: \`Bearer ${apiKey}\` }  
          }  
        );  
        const d \= await r.json().catch(() \=\> ({}));  
        return json(d);  
      } catch (e) {  
        return err("Replicate status failed: " \+ e.message, 500);  
      }  
    }  
    async function getNylasGrants(env2) {  
      const raw \= await env2.LIFEOS\_KV.get("nylas\_grants");  
      if (raw) {  
        try {  
          return JSON.parse(raw);  
        } catch {  
        }  
      }  
      const single \= await env2.LIFEOS\_KV.get("apikey\_nylas\_grant\_id");  
      return single ? \[{ email: "iCloud", grant\_id: single }\] : \[\];  
    }  
    \_\_name(getNylasGrants, "getNylasGrants");  
    if (path \=== "/api/nylas/accounts" && req.method \=== "GET") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_nylas");  
      if (\!apiKey) return json(\[\]);  
      const grants \= await getNylasGrants(env);  
      if (\!grants.length) return json(\[\]);  
      return json(  
        grants.map((g) \=\> ({  
          id: g.grant\_id,  
          account\_label: g.email,  
          email: g.email,  
          provider: "nylas",  
          grant\_id: g.grant\_id,  
          can\_read: true,  
          can\_send: true  
        }))  
      );  
    }  
    if (path \=== "/api/nylas/threads" && req.method \=== "GET") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_nylas");  
      if (\!apiKey) return err("Nylas not configured", 503);  
      const qs \= new URL(req.url).searchParams;  
      let grantId \= qs.get("grant\_id");  
      if (\!grantId) {  
        const grants \= await getNylasGrants(env);  
        grantId \= grants\[0\]?.grant\_id;  
      }  
      if (\!grantId) return err("No Nylas grant found", 503);  
      const limit \= qs.get("limit") || "40";  
      const pageToken \= qs.get("page\_token") || "";  
      const q \= qs.get("q") || "";  
      let url2 \= \`https://api.us.nylas.com/v3/grants/grantId/threads?limit={limit}\`;  
      if (pageToken) url2 \+= \`\&page\_token=${encodeURIComponent(pageToken)}\`;  
      if (q) url2 \+= \`\&subject=${encodeURIComponent(q)}\`;  
      const r \= await fetch(url2, {  
        headers: { Authorization: \`Bearer ${apiKey}\` }  
      });  
      if (\!r.ok) return err("Nylas threads error: " \+ r.status, 502);  
      const d \= await r.json();  
      const threads \= (d.data || \[\]).map((t) \=\> ({  
        id: t.id,  
        subject: t.subject || "(no subject)",  
        snippet: t.snippet || "",  
        from: t.from?.\[0\]?.email || "",  
        date: t.latest\_message\_received\_date ? t.latest\_message\_received\_date \* 1e3 : Date.now(),  
        unread: \!t.read,  
        message\_count: t.message\_ids?.length || 1,  
        provider: "nylas",  
        grant\_id: grantId  
      }));  
      return json({ threads, next\_page\_token: d.next\_page\_token });  
    }  
    if (path.startsWith("/api/nylas/thread/") && req.method \=== "GET") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_nylas");  
      if (\!apiKey) return err("Nylas not configured", 503);  
      const qs \= new URL(req.url).searchParams;  
      let grantId \= qs.get("grant\_id");  
      if (\!grantId) {  
        const grants \= await getNylasGrants(env);  
        grantId \= grants\[0\]?.grant\_id;  
      }  
      if (\!grantId) return err("No Nylas grant found", 503);  
      const threadId \= decodeURIComponent(  
        path.replace("/api/nylas/thread/", "").split("?")\[0\]  
      );  
      const r \= await fetch(  
        \`https://api.us.nylas.com/v3/grants/grantId/messages?threadid={encodeURIComponent(threadId)}\&limit=50\`,  
        {  
          headers: { Authorization: \`Bearer ${apiKey}\` }  
        }  
      );  
      if (\!r.ok) return err("Nylas thread error: " \+ r.status, 502);  
      const d \= await r.json();  
      const messages \= (d.data || \[\]).map((m) \=\> ({  
        id: m.id,  
        from: m.from?.\[0\]?.email || "",  
        to: m.to?.map((a) \=\> a.email).join(", ") || "",  
        date: m.date ? m.date \* 1e3 : Date.now(),  
        subject: m.subject || "",  
        text: m.body || "",  
        html: m.body?.includes("\<") ? m.body : null,  
        attachments: (m.attachments || \[\]).map((a) \=\> ({  
          id: a.id,  
          filename: a.filename,  
          size: a.size  
        })),  
        unread: \!m.unread  
      }));  
      return json({  
        id: threadId,  
        subject: messages\[0\]?.subject || "",  
        messages,  
        provider: "nylas",  
        grant\_id: grantId  
      });  
    }  
    if (path \=== "/api/nylas/send" && req.method \=== "POST") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_nylas");  
      if (\!apiKey) return err("Nylas not configured", 503);  
      const body \= await req.json();  
      const grantId \= body.grant\_id || (await getNylasGrants(env))\[0\]?.grant\_id;  
      if (\!grantId) return err("No Nylas grant found", 503);  
      const payload \= {  
        subject: body.subject || "",  
        body: body.body || "",  
        to: (body.to || "").split(",").map((e) \=\> ({ email: e.trim() })).filter((e) \=\> e.email)  
      };  
      if (body.cc)  
        payload.cc \= body.cc.split(",").map((e) \=\> ({ email: e.trim() })).filter((e) \=\> e.email);  
      if (body.reply\_to\_message\_id)  
        payload.reply\_to\_message\_id \= body.reply\_to\_message\_id;  
      const r \= await fetch(  
        \`https://api.us.nylas.com/v3/grants/${grantId}/messages/send\`,  
        {  
          method: "POST",  
          headers: {  
            Authorization: \`Bearer ${apiKey}\`,  
            "Content-Type": "application/json"  
          },  
          body: JSON.stringify(payload)  
        }  
      );  
      const data \= await r.json().catch(() \=\> ({}));  
      if (\!r.ok)  
        return json({ error: data?.error?.message || "Nylas send error" }, 502);  
      return json({ ok: true, id: data.data?.id });  
    }  
    if (path \=== "/api/nylas/mark" && req.method \=== "POST") {  
      const apiKey \= await env.LIFEOS\_KV.get("apikey\_nylas");  
      if (\!apiKey) return err("Nylas not configured", 503);  
      const { message\_ids, unread, grant\_id: reqGrantId } \= await req.json();  
      const grantId \= reqGrantId || (await getNylasGrants(env))\[0\]?.grant\_id;  
      if (\!grantId) return err("No Nylas grant found", 503);  
      const results \= await Promise.all(  
        (message\_ids || \[\]).map(  
          (id) \=\> fetch(  
            \`https://api.us.nylas.com/v3/grants/grantId/messages/{id}\`,  
            {  
              method: "PUT",  
              headers: {  
                Authorization: \`Bearer ${apiKey}\`,  
                "Content-Type": "application/json"  
              },  
              body: JSON.stringify({ unread: \!\!unread })  
            }  
          ).then((r) \=\> ({ id, ok: r.ok })).catch(() \=\> ({ id, ok: false }))  
        )  
      );  
      return json({ ok: true, results });  
    }  
    if (path \=== "/api/nylas/store-grant" && req.method \=== "POST") {  
      const { email, grant\_id } \= await req.json().catch(() \=\> ({}));  
      if (\!email || \!grant\_id) return err("Missing email or grant\_id", 400);  
      let grants \= \[\];  
      try {  
        const raw \= await env.LIFEOS\_KV.get("nylas\_grants");  
        if (raw) grants \= JSON.parse(raw);  
      } catch {  
      }  
      const idx \= grants.findIndex((g) \=\> g.email \=== email);  
      if (idx \>= 0\) grants\[idx\] \= { email, grant\_id };  
      else grants.push({ email, grant\_id });  
      await env.LIFEOS\_KV.put("nylas\_grants", JSON.stringify(grants));  
      return json({ ok: true, grants });  
    }  
    if (path \=== "/api/stripe/summary" && req.method \=== "GET") {  
      const stripeKey \= await env.LIFEOS\_KV.get("apikey\_stripe");  
      if (\!stripeKey) return err("Stripe key not configured", 400);  
      const \[balRes, chRes\] \= await Promise.all(\[  
        fetch("https://api.stripe.com/v1/balance", {  
          headers: { Authorization: \`Bearer ${stripeKey}\` }  
        }),  
        fetch("https://api.stripe.com/v1/charges?limit=5", {  
          headers: { Authorization: \`Bearer ${stripeKey}\` }  
        })  
      \]);  
      if (\!balRes.ok) return err(\`Stripe error ${balRes.status}\`, 502);  
      const balance \= await balRes.json();  
      const chargesBody \= chRes.ok ? await chRes.json() : { data: \[\] };  
      return json({ balance, charges: chargesBody.data || \[\] });  
    }  
    if (path \=== "/api/cloudflare/summary" && req.method \=== "GET") {  
      const cfToken \= await env.LIFEOS\_KV.get("apikey\_cloudflare");  
      if (\!cfToken) return err("Cloudflare token not configured", 400);  
      const hdrs \= {  
        Authorization: \`Bearer ${cfToken}\`,  
        "Content-Type": "application/json"  
      };  
      const zonesRes \= await fetch(  
        "https://api.cloudflare.com/client/v4/zones?per\_page=20",  
        { headers: hdrs }  
      );  
      if (\!zonesRes.ok) return err(\`CF error ${zonesRes.status}\`, 502);  
      const zonesBody \= await zonesRes.json();  
      const zoneList \= (zonesBody.result || \[\]).slice(0, 10);  
      const since \= new Date(Date.now() \- 864e5).toISOString();  
      const until \= (/\* @\_\_PURE\_\_ \*/ new Date()).toISOString();  
      const zonesWithData \= await Promise.all(  
        zoneList.map(async (z) \=\> {  
          try {  
            const aRes \= await fetch(  
              \`https://api.cloudflare.com/client/v4/zones/z.id/analytics/dashboard?since={since}\&until=${until}\&continuous=true\`,  
              { headers: hdrs }  
            );  
            const aBody \= aRes.ok ? await aRes.json() : null;  
            const totals \= aBody?.result?.totals || {};  
            const bytes \= totals.bandwidth?.all || 0;  
            const bw \= bytes \> 1e9 ? \`(bytes/1e9).toFixed(1)GB\`:bytes\>1e6?\`{(bytes / 1e6).toFixed(1)} MB\` : \`${(bytes / 1024).toFixed(0)} KB\`;  
            return {  
              id: z.id,  
              name: z.name,  
              status: z.status,  
              requests: totals.requests?.all || 0,  
              threats: totals.threats?.all || 0,  
              uniques: totals.uniques?.all || 0,  
              bandwidth: bw  
            };  
          } catch {  
            return {  
              id: z.id,  
              name: z.name,  
              status: z.status,  
              requests: 0,  
              threats: 0,  
              uniques: 0,  
              bandwidth: "\\u2014"  
            };  
          }  
        })  
      );  
      return json({ zones: zonesWithData });  
    }  
    if (path \=== "/api/webhook/telegram" && req.method \=== "POST") {  
      try {  
        const body \= await req.json();  
        const msg \= body.message || body.edited\_message;  
        if (\!msg) return json({ ok: true });  
        const chatId \= String(msg.chat && msg.chat.id ? msg.chat.id : "");  
        const fromName \= (msg.from && msg.from.first\_name || "") \+ " " \+ (msg.from && msg.from.last\_name || "");  
        const name \= fromName.trim() || msg.chat && msg.chat.title || "Telegram User";  
        const text \= msg.text || "\[media\]";  
        const ts \= new Date((msg.date || 0\) \* 1e3 || Date.now()).toISOString();  
        const convId \= "telegram\_" \+ chatId;  
        const systemUserId \= await getSystemUserId(env);  
        await supabase(env, "/rest/v1/conversations", {  
          method: "POST",  
          prefer: "resolution=merge-duplicates",  
          body: JSON.stringify({  
            id: convId,  
            user\_id: systemUserId,  
            contact\_name: name,  
            contact\_initials: name.slice(0, 2).toUpperCase(),  
            platforms: \["telegram"\],  
            primary\_platform: "telegram",  
            is\_group: false,  
            unread\_count: 1,  
            last\_message\_at: ts,  
            created\_at: ts  
          })  
        });  
        await supabase(env, "/rest/v1/messages", {  
          method: "POST",  
          prefer: "resolution=merge-duplicates",  
          body: JSON.stringify({  
            id: "tg\_" \+ (msg.message\_id || Date.now()) \+ "\_" \+ chatId,  
            user\_id: systemUserId,  
            conversation\_id: convId,  
            platform: "telegram",  
            sender\_type: "contact",  
            content: text,  
            message\_type: "text",  
            status: "received",  
            created\_at: ts  
          })  
        });  
        return json({ ok: true });  
      } catch (e) {  
        return json({ ok: true, warn: e.message });  
      }  
    }  
    if (path \=== "/api/webhook/meta" && req.method \=== "GET") {  
      const mode \= url.searchParams.get("hub.mode");  
      const token \= url.searchParams.get("hub.verify\_token");  
      const challenge \= url.searchParams.get("hub.challenge");  
      if (mode \=== "subscribe" && token \=== "lifeos1\_meta\_verify\_2026") {  
        return new Response(challenge, { status: 200, headers: CORS });  
      }  
      return new Response("Forbidden", { status: 403, headers: CORS });  
    }  
    if (path \=== "/api/webhook/meta" && req.method \=== "POST") {  
      try {  
        const body \= await req.json();  
        const systemUserId \= await getSystemUserId(env);  
        for (const entry of body.entry || \[\]) {  
          for (const event of entry.messaging || \[\]) {  
            if (\!event.message || event.message.is\_echo) continue;  
            const senderId \= event.sender && event.sender.id ? event.sender.id : "unknown";  
            const text \= event.message && event.message.text || "\[media\]";  
            const ts \= new Date(event.timestamp || Date.now()).toISOString();  
            const convId \= "messenger\_" \+ senderId;  
            await supabase(env, "/rest/v1/conversations", {  
              method: "POST",  
              prefer: "resolution=merge-duplicates",  
              body: JSON.stringify({  
                id: convId,  
                user\_id: systemUserId,  
                contact\_name: "Messenger " \+ senderId,  
                contact\_initials: "MS",  
                platforms: \["messenger"\],  
                primary\_platform: "messenger",  
                is\_group: false,  
                unread\_count: 1,  
                last\_message\_at: ts,  
                created\_at: ts  
              })  
            });  
            await supabase(env, "/rest/v1/messages", {  
              method: "POST",  
              prefer: "resolution=merge-duplicates",  
              body: JSON.stringify({  
                id: "msg\_" \+ (event.message && event.message.mid || Date.now()),  
                user\_id: systemUserId,  
                conversation\_id: convId,  
                platform: "messenger",  
                sender\_type: "contact",  
                content: text,  
                message\_type: "text",  
                status: "received",  
                created\_at: ts  
              })  
            });  
          }  
          for (const change of entry.changes || \[\]) {  
            if (change.field \!== "messages") continue;  
            const val \= change.value || {};  
            if (\!val.message) continue;  
            if (val.sender && val.recipient && val.sender.id \=== val.recipient.id)  
              continue;  
            const senderId \= val.sender && val.sender.id ? val.sender.id : "unknown";  
            const text \= val.message && val.message.text || "\[media\]";  
            const ts \= new Date(  
              (val.timestamp || 0\) \* 1e3 || Date.now()  
            ).toISOString();  
            const convId \= "instagram\_" \+ senderId;  
            await supabase(env, "/rest/v1/conversations", {  
              method: "POST",  
              prefer: "resolution=merge-duplicates",  
              body: JSON.stringify({  
                id: convId,  
                user\_id: systemUserId,  
                contact\_name: "Instagram " \+ senderId,  
                contact\_initials: "IG",  
                platforms: \["instagram"\],  
                primary\_platform: "instagram",  
                is\_group: false,  
                unread\_count: 1,  
                last\_message\_at: ts,  
                created\_at: ts  
              })  
            });  
            await supabase(env, "/rest/v1/messages", {  
              method: "POST",  
              prefer: "resolution=merge-duplicates",  
              body: JSON.stringify({  
                id: "ig\_" \+ (val.message && val.message.mid || Date.now()),  
                user\_id: systemUserId,  
                conversation\_id: convId,  
                platform: "instagram",  
                sender\_type: "contact",  
                content: text,  
                message\_type: "text",  
                status: "received",  
                created\_at: ts  
              })  
            });  
          }  
        }  
        return json({ ok: true });  
      } catch (e) {  
        return json({ ok: true, warn: e.message });  
      }  
    }  
    if (path \=== "/api/imap/store" && req.method \=== "POST") {  
      try {  
        const body \= await req.json();  
        const {  
          provider,  
          account\_label,  
          email: acctEmail,  
          app\_password,  
          host,  
          port,  
          smtp\_host,  
          smtp\_port  
        } \= body;  
        if (\!provider || \!acctEmail || \!app\_password)  
          return json(  
            { ok: false, error: "provider, email, app\_password required" },  
            400  
          );  
        const key \= \`imap\_${provider}\_${account\_label || "default"}\`;  
        await env.LIFEOS\_KV.put(  
          key,  
          JSON.stringify({  
            provider,  
            account\_label,  
            email: acctEmail,  
            app\_password,  
            host,  
            port,  
            smtp\_host,  
            smtp\_port,  
            connected\_at: Date.now()  
          })  
        );  
        const idxKey \= \`oauth\_index\_${provider}\`;  
        const idx \= await env.LIFEOS\_KV.get(idxKey, "json") || \[\];  
        const without \= idx.filter((a) \=\> a.email \!== acctEmail);  
        without.push({  
          email: acctEmail,  
          name: acctEmail,  
          connected\_at: Date.now(),  
          imap: true  
        });  
        await env.LIFEOS\_KV.put(idxKey, JSON.stringify(without));  
        await env.LIFEOS\_KV.put(  
          \`oauth\_${provider}\`,  
          JSON.stringify({  
            connected: true,  
            identity: { email: acctEmail, name: acctEmail }  
          })  
        );  
        return json({ ok: true });  
      } catch (e) {  
        return json({ ok: false, error: e.message }, 500);  
      }  
    }  
    if (path \=== "/api/sentinel/capture" && req.method \=== "POST") {  
      try {  
        const body \= await req.json();  
        const item \= {  
          id: "sen\_" \+ Date.now() \+ "\_" \+ Math.random().toString(36).slice(2, 7),  
          url: body.url || "",  
          title: body.title || "Untitled",  
          snippet: body.snippet || "",  
          selectedText: body.selectedText || "",  
          source: body.source || "bookmarklet",  
          capturedAt: (/\* @\_\_PURE\_\_ \*/ new Date()).toISOString(),  
          status: "new",  
          aiAction: null  
        };  
        const existing \= JSON.parse(  
          await env.LIFEOS\_KV.get("sentinel\_items") || "\[\]"  
        );  
        const all \= \[item, ...existing\];  
        const trimmed \= all.slice(0, 500);  
        await env.LIFEOS\_KV.put("sentinel\_items", JSON.stringify(trimmed));  
        return json({ ok: true, id: item.id });  
      } catch (e) {  
        return json({ ok: false, error: e.message }, 500);  
      }  
    }  
    if (path \=== "/api/sentinel/items" && req.method \=== "GET") {  
      try {  
        const items \= JSON.parse(  
          await env.LIFEOS\_KV.get("sentinel\_items") || "\[\]"  
        );  
        return json({ ok: true, items });  
      } catch (e) {  
        return json({ ok: false, items: \[\] });  
      }  
    }  
    if (path.startsWith("/api/sentinel/item/") && req.method \=== "DELETE") {  
      try {  
        const itemId \= path.replace("/api/sentinel/item/", "");  
        const items \= JSON.parse(  
          await env.LIFEOS\_KV.get("sentinel\_items") || "\[\]"  
        );  
        const filtered \= items.filter((i) \=\> i.id \!== itemId);  
        await env.LIFEOS\_KV.put("sentinel\_items", JSON.stringify(filtered));  
        return json({ ok: true });  
      } catch (e) {  
        return json({ ok: false, error: e.message }, 500);  
      }  
    }  
    return new Response("Not Found", { status: 404 });  
  }  
};  
export {  
  index\_default as default  
};  
//\# sourceMappingURL=index.js.map

