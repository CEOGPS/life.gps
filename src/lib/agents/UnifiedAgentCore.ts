// @ts-nocheck -- converted from .js; deep agent logic, typing deferred
// ============================================================
// UnifiedAgentCore.js — The foundation for Erebus & Kranos
// Place in: src/lib/agents/UnifiedAgentCore.js
// ============================================================

// === Configuration (hardcoded as requested, with fallbacks) ===
const config = {
  worker: "https://lifeos1.ceogps.workers.dev",
  fallbackWorkers: [
    "https://lifeos1.ceogps.workers.dev",
    null, // local mock as last resort
  ],
  browserAgent: "http://localhost:8100",
  mediaEndpoints: {
    image: ["http://localhost:8000", "https://api.replicate.com/v1"],
    video: ["http://localhost:8001", "https://api.runwayml.com/v1"],
    audio: ["http://localhost:8002", "https://api.elevenlabs.io/v1"],
  },
  cloudflare: {
    apiToken: null,
    accountId: "4cb5c0d8553b8c0c9156ee4f2bad9e6f",
    projectName: "lifeos1",
  },
  bd: {
    siteUrl: "https://ceogps.com",
    adminPath: "/admin",
  },
};

// === Tool Definition System ===
class Tool {
  constructor(spec) {
    this.name = spec.name;
    this.description = spec.description;
    this.parameters = spec.parameters;
    this.permission = spec.permission;
    this.handler = spec.handler;
    this.requiresBrowser = spec.requiresBrowser || false;
  }

  validate(args) {
    const required = this.parameters.required || [];
    for (const req of required) {
      if (args[req] === undefined) {
        throw new Error(`Missing required parameter: ${req}`);
      }
    }
    return true;
  }

  async execute(args, context) {
    this.validate(args);
    return this.handler(args, context);
  }
}

// === Memory System ===
class MemorySystem {
  constructor() {
    this.episodic = [];
    this.semantic = new Map();
    this.procedural = [];
    this.load();
  }

  add(role, content, metadata = {}) {
    this.episodic.push({
      role,
      content,
      metadata,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
    if (this.episodic.length > 100) this.episodic.shift();
    this.persist();
  }

  async search(query, limit = 5) {
    const terms = query.toLowerCase().split(/\s+/);
    const scored = this.episodic.map((ep) => {
      let score = 0;
      const content = ep.content.toLowerCase();
      for (const term of terms) {
        if (content.includes(term)) score++;
      }
      const age = Date.now() - ep.timestamp;
      const recency = Math.max(0, 1 - age / (24 * 60 * 60 * 1000));
      return { ep, score: score * 0.7 + recency * 0.3 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.ep);
  }

  persist() {
    localStorage.setItem(
      "agent_memory",
      JSON.stringify({
        episodic: this.episodic,
        procedural: this.procedural.slice(-50),
      }),
    );
  }

  load() {
    const saved = localStorage.getItem("agent_memory");
    if (saved) {
      const data = JSON.parse(saved);
      this.episodic = data.episodic || [];
      this.procedural = data.procedural || [];
    }
  }
}

// === Browser Session Manager (Real Takeover) ===
class BrowserSessionManager {
  constructor(agentUrl) {
    this.agentUrl = agentUrl;
    this.activeSessions = new Map();
    this.userTakeoverMode = false;
  }

  async createSession(sessionId = crypto.randomUUID()) {
    const response = await fetch(`${this.agentUrl}/session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (response.ok) {
      const data = await response.json();
      this.activeSessions.set(sessionId, {
        id: sessionId,
        wsUrl: data.wsUrl,
        createdAt: Date.now(),
      });
      return sessionId;
    }
    throw new Error("Failed to create browser session");
  }

  async navigate(sessionId, url) {
    return this.exec(sessionId, "navigate", { url });
  }

  async click(sessionId, selector) {
    return this.exec(sessionId, "click", { selector });
  }

  async type(sessionId, selector, text) {
    return this.exec(sessionId, "type", { selector, text });
  }

  async screenshot(sessionId) {
    return this.exec(sessionId, "screenshot", {});
  }

  async takeover(sessionId) {
    this.userTakeoverMode = true;
    await this.exec(sessionId, "takeover", {});
    return {
      message:
        "Browser control handed to user. Say 'take back control' to resume.",
      sessionId,
    };
  }

  async release(sessionId) {
    this.userTakeoverMode = false;
    await this.exec(sessionId, "release", {});
  }

  async exec(sessionId, action, params) {
    const response = await fetch(
      `${this.agentUrl}/session/${sessionId}/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
    );
    return response.json();
  }
}

// === LLM Router (Multi-provider with fallback) ===
class LLMRouter {
  constructor(workerUrl, fallbacks) {
    this.primary = workerUrl;
    this.fallbacks = fallbacks.filter((f) => f !== workerUrl);
  }

  async invoke(messages, options = {}) {
    const providers = [this.primary, ...this.fallbacks];

    for (const url of providers) {
      if (!url) continue;
      try {
        const response = await fetch(`${url}/api/llm/invoke`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            model: options.model || "auto",
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
          }),
          signal: AbortSignal.timeout(options.timeout || 30000),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            text: data.text || data.response,
            provider: url,
            model: data.model_used || "unknown",
          };
        }
      } catch (e) {
        console.warn(`Provider ${url} failed:`, e.message);
      }
    }
    throw new Error("All LLM providers failed");
  }
}

// === Media Generation ===
class MediaGenerator {
  constructor(endpoints) {
    this.endpoints = endpoints;
  }

  async generateImage(prompt, options = {}) {
    for (const endpoint of this.endpoints.image) {
      try {
        const response = await fetch(`${endpoint}/generate/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, ...options }),
        });
        if (response.ok) {
          const data = await response.json();
          return {
            url: data.url || data.image_url,
            provider: endpoint,
            prompt,
          };
        }
      } catch (e) {
        continue;
      }
    }
    throw new Error("All image providers failed");
  }

  async generateVideo(prompt, options = {}) {
    for (const endpoint of this.endpoints.video) {
      try {
        const response = await fetch(`${endpoint}/generate/video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, ...options }),
        });
        if (response.ok) return await response.json();
      } catch (e) {
        continue;
      }
    }
    throw new Error("All video providers failed");
  }

  async generateAudio(prompt, options = {}) {
    for (const endpoint of this.endpoints.audio) {
      try {
        const response = await fetch(`${endpoint}/generate/audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt, ...options }),
        });
        if (response.ok) return await response.json();
      } catch (e) {
        continue;
      }
    }
    throw new Error("All audio providers failed");
  }
}

// === Cloudflare Pages Deployer ===
class CloudflareDeployer {
  constructor(apiToken, accountId, projectName) {
    this.apiToken = apiToken;
    this.accountId = accountId;
    this.projectName = projectName;
  }

  async deploy(files) {
    const formData = new FormData();
    formData.append("project", this.projectName);
    for (const [path, content] of Object.entries(files)) {
      const blob = new Blob([content], { type: "application/octet-stream" });
      formData.append("files", blob, path);
    }
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects/${this.projectName}/deployments`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiToken}` },
        body: formData,
      },
    );
    return response.json();
  }
}

// === Main Agent Class ===
class UnifiedAgent {
  constructor(customConfig = {}) {
    this.config = { ...config, ...customConfig };
    this.memory = new MemorySystem();
    this.browser = new BrowserSessionManager(this.config.browserAgent);
    this.llm = new LLMRouter(this.config.worker, this.config.fallbackWorkers);
    this.media = new MediaGenerator(this.config.mediaEndpoints);
    this.cloudflare = this.config.cloudflare.apiToken
      ? new CloudflareDeployer(
          this.config.cloudflare.apiToken,
          this.config.cloudflare.accountId,
          this.config.cloudflare.projectName,
        )
      : null;
    this.tools = new Map();
    this.isThinking = false;
  }

  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }

  async think(userMessage, context = {}) {
    this.isThinking = true;
    try {
      this.memory.add("user", userMessage, context);
      const relevantMemories = await this.memory.search(userMessage);
      const systemPrompt = this.buildSystemPrompt(relevantMemories);

      const messages = [
        { role: "system", content: systemPrompt },
        ...this.memory.episodic
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ];

      const llmResponse = await this.llm.invoke(messages);
      const toolCalls = this.parseToolCalls(llmResponse.text);
      const toolResults = [];

      for (const call of toolCalls) {
        const tool = this.tools.get(call.tool);
        if (tool) {
          const result = await tool.execute(call.args, {
            agent: this,
            context,
          });
          toolResults.push({ tool: call.tool, result });
        }
      }

      let finalResponse = llmResponse.text;
      if (toolResults.length > 0) {
        finalResponse = await this.synthesize(
          userMessage,
          llmResponse.text,
          toolResults,
        );
      }

      this.memory.add("assistant", finalResponse);
      this.isThinking = false;
      return {
        response: finalResponse,
        toolResults,
        model: llmResponse.model,
        provider: llmResponse.provider,
      };
    } catch (error) {
      this.isThinking = false;
      return { response: `Error: ${error.message}`, error: error.message };
    }
  }

  buildSystemPrompt(memories) {
    const toolsList = Array.from(this.tools.values())
      .map((t) => `- ${t.name}: ${t.description} (${t.permission})`)
      .join("\n");

    const recentMemories = memories
      .map((m) => `[${m.role}]: ${m.content.slice(0, 100)}`)
      .join("\n");

    return `You are ${this.identity || "an autonomous agent"} with these capabilities:

## Available Tools
${toolsList}

## Recent Relevant Memories
${recentMemories || "No relevant memories."}

## Response Format
When you need to use a tool, output:
<tool_call>
{"tool": "tool_name", "args": {"arg1": "value1"}}
</tool_call>

## Instructions
- Think step by step
- Use tools when needed
- Be concise but thorough
- For browser takeover, use browser_takeover
- For media generation, use generate_image/video/audio
- For deployment, use cloudflare_deploy

Proceed.`;
  }

  parseToolCalls(text) {
    const calls = [];
    const regex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.tool && parsed.args) calls.push(parsed);
      } catch (e) {}
    }
    return calls;
  }

  async synthesize(originalQuery, llmResponse, toolResults) {
    const synthesisPrompt = `Original: ${originalQuery}

Initial response: ${llmResponse}

Tool results:
${toolResults.map((r) => `${r.tool}: ${JSON.stringify(r.result).slice(0, 200)}`).join("\n")}

Provide final answer incorporating tool results. Be concise.`;

    const response = await this.llm.invoke(
      [{ role: "user", content: synthesisPrompt }],
      { maxTokens: 500 },
    );
    return response.text;
  }
}

export {
  UnifiedAgent,
  Tool,
  config,
  BrowserSessionManager,
  MediaGenerator,
  CloudflareDeployer,
};
