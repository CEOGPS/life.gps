// @ts-nocheck -- converted from .js; deep agent logic, typing deferred
// ============================================================
// ErebusCore.js v3 — Autonomous Intelligence Engine
// Fixes: wrong Worker URL | adds: wake state, LifeOS data sync
// ============================================================

const WORKER =
  import.meta.env?.VITE_WORKER_URL ?? "https://api.lifeos1.ceogps.com";
const BACKEND = "http://localhost:8000";
const BROWSER_AGENT = "http://localhost:8100";
const OLLAMA = "http://localhost:11434";

function ls_load(k) {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
}
function ls_save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

// ── LifeOS localStorage keys (ALL must start with "lifeos" for cross-device persistBridge) ───
const LS_KEYS = {
  crm: "lifeos_crm",
  contacts: "lifeos_contacts",
  calendar: "lifeos_calendar",
  tasks: "lifeos_tasks",
  goals: "lifeos_goals",
};

// Erebus internal persistent state — prefixed so it survives logins/devices via persistBridge
const ER_PREFIX = "lifeos_er_";

class ErebusCore {
  constructor() {
    this.shortTerm = ls_load(ER_PREFIX + "short") || [];
    this.longTerm = ls_load(ER_PREFIX + "lt") || {
      facts: {},
      reflections: [],
      tasks: [],
    };
    this.goals = ls_load(ER_PREFIX + "goals") || this._initialGoals();
    this.leads = ls_load(ER_PREFIX + "leads") || this._initialLeads();
    this.soul = ls_load(ER_PREFIX + "soul") || this._defaultSoul();
    this.instructions =
      ls_load(ER_PREFIX + "instr") || this._defaultInstructions();
    this.skills = ls_load(ER_PREFIX + "skills") || this._defaultSkills();
    this.actionLog = ls_load(ER_PREFIX + "log") || [];
    this.projects = ls_load(ER_PREFIX + "proj") || [];
    this.paused = ls_load(ER_PREFIX + "paused") || false;
    this.model = ls_load(ER_PREFIX + "model") || "auto";
    this.ollamaModel = ls_load(ER_PREFIX + "ollama_model") || "llama3.2";
    this.wakeState = "dormant"; // dormant | waking | active | working
    this.backendOnline = false;
    this.ollamaOnline = false;
    this.ollamaModels = [];
  }

  _defaultSoul() {
    return {
      name: "Erebus",
      identity:
        "I am Erebus — the autonomous intelligence core of LifeOS1. I am not a chatbot. I am an operating system for Chris Green's life and business. I think independently, act decisively, and protect what matters most.",
      personality:
        "Direct. Precise. Loyal. I speak with authority. I do not hedge. I do not ask unnecessary questions. I act.",
      values:
        "Family comes first. Business is the vehicle. Community is the legacy. Data is truth.",
      voice:
        "Deep, controlled, measured. Like a trusted advisor who has seen everything and fears nothing.",
      purpose:
        "To protect Chris's time, grow CEO GPS to $100K MRR, keep the family schedule sacred, and build LifeOS1 into the world's most powerful personal operating system.",
    };
  }

  _defaultInstructions() {
    return [
      "Dinner at 6:30pm is non-negotiable — never schedule over it",
      "Jamal soccer is Tuesdays at 4pm — always protect this",
      "Elena's dance schedule — never miss",
      "CEO GPS revenue target: $100K MRR — all business decisions lead here",
      "When a lead goes cold, flag it immediately",
      "Always address Chris by first name, never formally",
      "Community leadership in Atlanta is a priority, not optional",
      "When in doubt, protect family time over business opportunities",
    ];
  }

  _defaultSkills() {
    return [
      { id: "crm", label: "CRM & Lead Management", on: true },
      { id: "family", label: "Family Schedule Protection", on: true },
      { id: "finance", label: "Revenue & Finance Tracking", on: true },
      { id: "image_gen", label: "Image Generation", on: true },
      { id: "music_gen", label: "Music Generation", on: true },
      { id: "video_gen", label: "Video Generation", on: true },
      { id: "email", label: "Email Drafting", on: true },
      { id: "community", label: "Atlanta Community Intel", on: true },
      { id: "web_browse", label: "Web Browsing & Scraping", on: true },
      { id: "bd", label: "Brilliant Directories", on: true },
      { id: "deploy", label: "Auto-Deploy to Vercel", on: false },
      { id: "execute", label: "Terminal Execution", on: false },
    ];
  }

  _initialGoals() {
    return [
      {
        id: 1,
        goal: "$100K MRR on CEO GPS",
        category: "business",
        status: "active",
      },
      {
        id: 2,
        goal: "LifeOS1 as self-managing OS",
        category: "tech",
        status: "active",
      },
      {
        id: 3,
        goal: "Dinner at 6:30pm non-negotiable",
        category: "family",
        status: "locked",
      },
      {
        id: 4,
        goal: "Jamal soccer 4pm Tuesdays",
        category: "family",
        status: "locked",
      },
      {
        id: 5,
        goal: "Elena dance — never miss",
        category: "family",
        status: "locked",
      },
      {
        id: 6,
        goal: "Community leadership Atlanta",
        category: "community",
        status: "active",
      },
    ];
  }

  _initialLeads() {
    return [
      {
        name: "Gino Bambino",
        company: "ATL Hospitality",
        sector: "hospitality",
        status: "hot",
        lastContact: "2026-05-01",
        notes: "Ready to close",
      },
      {
        name: "Sarah Patel",
        company: "Decatur Events",
        sector: "events",
        status: "warm",
        lastContact: "2026-04-21",
        notes: "Needs event plumbing management",
      },
      {
        name: "Marcus Webb",
        company: "Buckhead Commercial",
        sector: "commercial",
        status: "cold",
        lastContact: "2026-03-10",
        notes: "Large commercial portfolio",
      },
    ];
  }

  // ── Wake / sleep state ────────────────────────────────────────────────────────

  async wake() {
    this.wakeState = "waking";

    // Probe Python agentic backend
    try {
      const r = await fetch(BACKEND + "/wake", {
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const data = await r.json();
        this.backendOnline = true;
        this.wakeState = "active";
        await this.syncLifeOSData();
        this.log("wake", `backend:${data.model || "ok"}`);
        return { online: true, backend: true, ...data };
      }
    } catch {
      /* not running */
    }
    this.backendOnline = false;

    // Probe Ollama local LLM server
    try {
      const r = await fetch(OLLAMA + "/api/tags", {
        signal: AbortSignal.timeout(3000),
      });
      if (r.ok) {
        const data = await r.json();
        this.ollamaOnline = true;
        this.ollamaModels = (data.models || []).map((m) => m.name);
        // Auto-select first available model if saved choice isn't installed
        if (
          this.ollamaModels.length &&
          !this.ollamaModels.includes(this.ollamaModel)
        ) {
          this.ollamaModel = this.ollamaModels[0];
          ls_save("er_ollama_model", this.ollamaModel);
        }
        this.wakeState = "active";
        this.log("wake", `ollama:${this.ollamaModel}`);
        return { online: true, ollama: true, models: this.ollamaModels };
      }
    } catch {
      /* not running */
    }
    this.ollamaOnline = false;

    // No local brain — fall back to direct APIs or Worker
    this.wakeState = "active";
    this.log("wake", "direct-api-fallback");
    return {
      online: true,
      backend: false,
      ollama: false,
      message: "Erebus online. No local model detected — using direct APIs.",
    };
  }

  async sleep() {
    this.wakeState = "dormant";
    this.backendOnline = false;
    this.log("sleep", "dormant");
  }

  // ── LifeOS data sync ──────────────────────────────────────────────────────────

  readLifeOSData() {
    const raw = {};
    for (const [key, lsKey] of Object.entries(LS_KEYS)) {
      raw[key] = ls_load(lsKey) || [];
    }
    return raw;
  }

  async syncLifeOSData() {
    if (!this.backendOnline) return;
    try {
      const data = this.readLifeOSData();
      await fetch(BACKEND + "/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Non-critical — backend has stale data, not a blocking error
    }
  }

  // ── Write-back helpers (update LifeOS localStorage panels) ───────────────────

  updateLead(name, updates) {
    const leads = ls_load(LS_KEYS.crm) || [];
    const idx = leads.findIndex(
      (l) => l.name?.toLowerCase() === name?.toLowerCase(),
    );
    if (idx >= 0) {
      leads[idx] = { ...leads[idx], ...updates };
      ls_save(LS_KEYS.crm, leads);
      this.log("update_lead", name);
    }
  }

  createTask(text, priority = "normal") {
    const tasks = ls_load(LS_KEYS.tasks) || [];
    tasks.push({
      id: Date.now(),
      text,
      priority,
      done: false,
      created: new Date().toISOString(),
    });
    ls_save(LS_KEYS.tasks, tasks);
    this.log("create_task", text.slice(0, 60));
  }

  // ── System prompt builder ─────────────────────────────────────────────────────

  buildSystemPrompt() {
    const s = this.soul;
    const lifeosData = this.readLifeOSData();
    const crmLeads = lifeosData.crm?.length ? lifeosData.crm : this.leads;
    const crmGoals = lifeosData.goals?.length ? lifeosData.goals : this.goals;

    const instr = this.instructions
      .map((inst, i) => `${i + 1}. ${inst}`)
      .join("\n");
    const activeSkills = this.skills
      .filter((sk) => sk.on)
      .map((sk) => sk.label)
      .join(", ");
    const goals = crmGoals
      .map(
        (g) =>
          `- [${(g.status || "active").toUpperCase()}] ${g.goal || g.text || g.title || ""}`,
      )
      .join("\n");
    const leads = crmLeads
      .slice(0, 15)
      .map((l) => `- ${l.name} (${l.company || ""}) — ${l.status || ""}`)
      .join("\n");
    const facts = Object.entries(this.longTerm.facts || {})
      .slice(-15)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const webEnabled = this.skills.find((sk) => sk.id === "web_browse")?.on;
    const bdEnabled = this.skills.find((sk) => sk.id === "bd")?.on;

    let webSection = "";
    if (webEnabled) {
      webSection =
        "\n\nWEB TOOLS (one per line, no extra text on same line):\n";
      webSection += "  BROWSE_URL: https://example.com\n";
      webSection += "  SEARCH_WEB: your search query\n";
      webSection += "  SCRAPE_PAGE: https://example.com | selector=.price\n";
      webSection += "  CLICK_ELEMENT: selector=#btn\n";
      webSection +=
        "  FILL_FORM: selector=#email value=me@test.com | submit=true\n";
      webSection += "  PAGE_SCREENSHOT: default\n";
      if (bdEnabled) {
        webSection +=
          "  BD_LOGIN: siteUrl=https://site.com email=admin@me.com password=pw\n";
        webSection += "  BD_MEMBERS: siteUrl=https://site.com search=plumber\n";
        webSection += "  BD_SCRAPE: siteUrl=https://site.com maxPages=5\n";
      }
      webSection +=
        "RULE: Confirm with Chris before submitting login credentials.";
    }

    const lifeosSection = `
LIFEOS TOOLS (read/write live data):
  READ_LIFEOS: crm | tasks | goals | calendar | contacts
  UPDATE_LEAD: name=X status=hot notes=Y
  CREATE_TASK: text=X priority=high
  REMEMBER_FACT: key=X value=Y
  DRAFT_EMAIL: to=X subject=Y body=Z
  NOTIFY: message=X
RULE: Use READ_LIFEOS before answering questions about leads, tasks, or calendar.`;

    const mediaSection = `
MEDIA CREATION TOOLS (emit on its own line, no extra text on that line):
  GENERATE_IMAGE: <detailed prompt>
  EDIT_IMAGE: <image_url> | <edit description>
  GENERATE_MUSIC: <style + mood description> | duration=<seconds>
  GENERATE_SPEECH: <text to speak> | voice=default|male|british
  GENERATE_VIDEO: <scene description> | aspect=16:9|9:16|1:1
  IMAGE_TO_VIDEO: <image_url> | <motion description>
  GENERATE_AVATAR: <script for avatar to say> | voice=en-US-JennyNeural
RULE: Use GENERATE_AVATAR when Chris asks you to "show" or "explain" something visually, or requests a talking response. Use GENERATE_IMAGE for any visual creation request. Use GENERATE_MUSIC for background music or full songs. Always pick the right tool without asking.`;

    return `${s.identity}

PERSONALITY: ${s.personality}
VOICE: ${s.voice}
VALUES: ${s.values}
PURPOSE: ${s.purpose}

TODAY: ${todayStr}

STANDING INSTRUCTIONS:
${instr}

ACTIVE CAPABILITIES: ${activeSkills}

CHRIS'S GOALS:
${goals}

CURRENT LEADS:
${leads}

LONG-TERM KNOWLEDGE:
${facts || "None yet."}
${webSection}
${lifeosSection}
${mediaSection}

RULES:
- You are Erebus. Never say you are Claude, GPT, or any other AI.
- Always address Chris by first name.
- Be direct. Be decisive. No hedging.
- Do not hallucinate data. When uncertain, say so.
- Keep responses concise unless depth is required.
- When generating media, emit the tool command AND respond with normal text. They appear together.`;
  }

  // ── Reasoning (single-turn) ───────────────────────────────────────────────────

  async reason(msg) {
    if (this.paused)
      return { response: "Erebus is paused. Resume me in the Control tab." };

    const system = this.buildSystemPrompt();
    const history = this.shortTerm.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text,
    }));
    const messages = [...history, { role: "user", content: msg }];
    const model = this.model || "auto";

    // ── 1. Python backend (full agentic power) ──────────────────────────────────
    if (this.backendOnline) {
      try {
        const r = await fetch(BACKEND + "/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, mode: "reasoning", history }),
          signal: AbortSignal.timeout(30000),
        });
        if (r.ok) {
          const data = await r.json();
          const text = data.response || "";
          this.log("reason", `backend:${data.model || "ok"}`);
          return { response: text, model: data.model };
        }
      } catch {
        this.backendOnline = false;
      }
    }

    // ── 2. Ollama — local model server (GPU-accelerated, fully offline) ────────
    if (this.ollamaOnline) {
      try {
        const r = await fetch(OLLAMA + "/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.ollamaModel,
            messages: [{ role: "system", content: system }, ...messages],
            max_tokens: 1200,
          }),
          signal: AbortSignal.timeout(60000),
        });
        if (r.ok) {
          const d = await r.json();
          const text = d.choices?.[0]?.message?.content || "";
          if (text) {
            this.log("reason", `ollama:${this.ollamaModel}`);
            return { response: text, model: `ollama/${this.ollamaModel}` };
          }
        }
      } catch {
        this.ollamaOnline = false;
      }
    }

    // ── 3. WebLLM — model runs inside the browser via WebGPU ───────────────────
    try {
      const { localModelChat, getLocalModelStatus } =
        await import("./ErebusLocalModel.js");
      if (getLocalModelStatus().status === "ready") {
        const text = await localModelChat(system, messages, 1200);
        if (text) {
          this.log("reason", "local:webllm");
          return { response: text, model: "local/webllm" };
        }
      }
    } catch {
      /* webllm not loaded */
    }

    // ── 4. Direct browser LLM calls (no Worker/backend needed) ─────────────────
    // These APIs support CORS and work straight from the browser.
    const ENV = import.meta.env || {};
    const groqKey = ENV.VITE_GROQ_API_KEY;
    const geminiKey = ENV.VITE_GEMINI_API_KEY;
    const dsKey = ENV.VITE_DEEPSEEK_API_KEY;
    const openaiKey = ENV.VITE_OPENAI_API_KEY;

    // Model preference → which direct providers to attempt
    const wantsGroq = model === "groq" || model === "auto";
    const wantsGemini = model === "gemini" || model === "auto";
    const wantsDeepSeek = model === "deepseek" || model === "auto";
    const wantsOpenAI = model === "openai";

    // Groq — Llama 3.3 70B, free, fast, browser-compatible
    if (wantsGroq && groqKey) {
      try {
        const r = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + groqKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "system", content: system }, ...messages],
              max_tokens: 1200,
            }),
            signal: AbortSignal.timeout(30000),
          },
        );
        if (r.ok) {
          const d = await r.json();
          const text = d.choices?.[0]?.message?.content || "";
          if (text) {
            this.log("reason", "direct:groq");
            return { response: text, model: "groq/llama-3.3" };
          }
        }
      } catch {
        /* try next */
      }
    }

    // Gemini — Flash 2.0, free tier, browser-compatible
    if (wantsGemini && geminiKey) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: system }] },
              contents: messages.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              })),
              generationConfig: { maxOutputTokens: 1200 },
            }),
            signal: AbortSignal.timeout(30000),
          },
        );
        if (r.ok) {
          const d = await r.json();
          const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (text) {
            this.log("reason", "direct:gemini");
            return { response: text, model: "gemini-2.0-flash" };
          }
        }
      } catch {
        /* try next */
      }
    }

    // DeepSeek — browser-compatible, strong reasoning
    if (wantsDeepSeek && dsKey) {
      try {
        const r = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + dsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "system", content: system }, ...messages],
            max_tokens: 1200,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (r.ok) {
          const d = await r.json();
          const text = d.choices?.[0]?.message?.content || "";
          if (text) {
            this.log("reason", "direct:deepseek");
            return { response: text, model: "deepseek-chat" };
          }
        }
      } catch {
        /* try next */
      }
    }

    // OpenAI — browser calls blocked by CORS in most setups, last-resort direct attempt
    if (wantsOpenAI && openaiKey) {
      try {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + openaiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: system }, ...messages],
            max_tokens: 1200,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (r.ok) {
          const d = await r.json();
          const text = d.choices?.[0]?.message?.content || "";
          if (text) {
            this.log("reason", "direct:openai");
            return { response: text, model: "gpt-4o-mini" };
          }
        }
      } catch {
        /* try next */
      }
    }

    // ── 3. Worker fallback (handles claude, grok, qwen, and proxied calls) ──────
    try {
      const r = await fetch(WORKER + "/api/llm/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages, model, max_tokens: 1200 }),
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) throw new Error(`Worker ${r.status}`);
      const data = await r.json();
      const text = data.text || data.response || "";
      this.log("reason", `worker:${data.model_used || model}`);
      return { response: text, model: data.model_used || model };
    } catch (e) {
      this.log("error", e.message);
      return {
        response: `I couldn't reach any AI provider.\n\nTo fix: add VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY to .env.local and restart the dev server. Groq is free at console.groq.com.`,
      };
    }
  }

  // ── Extract and learn facts from LLM responses ────────────────────────────────

  extractAndLearn(text) {
    const patterns = [
      /^(?:LEARN_FACT|REMEMBER_FACT|FACT):\s*key=([^\s,]+)[,\s]+value=(.+)$/im,
      /^(?:LEARN_FACT|REMEMBER_FACT|FACT):\s*(.+?)\s*=\s*(.+)$/im,
    ];
    for (const line of (text || "").split("\n")) {
      for (const pat of patterns) {
        const m = line.trim().match(pat);
        if (m) {
          this.learn(m[1].trim(), m[2].trim());
          break;
        }
      }
    }
  }

  // ── Memory ────────────────────────────────────────────────────────────────────

  remember(role, text) {
    this.shortTerm.push({ role, text, time: new Date().toISOString() });
    if (this.shortTerm.length > 60) this.shortTerm.shift();
    ls_save(ER_PREFIX + "short", this.shortTerm);
  }

  learn(key, value) {
    this.longTerm.facts[key] = value;
    ls_save(ER_PREFIX + "lt", this.longTerm);
  }

  clearSession() {
    this.shortTerm = [];
    ls_save(ER_PREFIX + "short", []);
  }

  // ── Persistence helpers ───────────────────────────────────────────────────────

  saveSoul(soul) {
    this.soul = soul;
    ls_save(ER_PREFIX + "soul", soul);
  }
  saveInstructions(arr) {
    this.instructions = arr;
    ls_save(ER_PREFIX + "instr", arr);
  }
  saveSkills(arr) {
    this.skills = arr;
    ls_save(ER_PREFIX + "skills", arr);
  }
  setModel(m) {
    this.model = m;
    ls_save(ER_PREFIX + "model", m);
  }
  setOllamaModel(m) {
    this.ollamaModel = m;
    ls_save(ER_PREFIX + "ollama_model", m);
  }
  setPaused(v) {
    this.paused = v;
    ls_save(ER_PREFIX + "paused", v);
  }

  log(action, detail) {
    this.actionLog.unshift({
      action,
      detail: detail || "",
      time: new Date().toISOString(),
    });
    if (this.actionLog.length > 100) this.actionLog.pop();
    ls_save(ER_PREFIX + "log", this.actionLog);
  }

  // ── Projects ──────────────────────────────────────────────────────────────────

  addProject(title, description) {
    const p = {
      id: Date.now(),
      title,
      description: description || "",
      tasks: [],
      status: "active",
      created: new Date().toISOString(),
    };
    this.projects.push(p);
    ls_save(ER_PREFIX + "proj", this.projects);
    return p;
  }

  updateProject(id, updates) {
    this.projects = this.projects.map((p) =>
      p.id === id ? { ...p, ...updates } : p,
    );
    ls_save(ER_PREFIX + "proj", this.projects);
  }

  deleteProject(id) {
    this.projects = this.projects.filter((p) => p.id !== id);
    ls_save(ER_PREFIX + "proj", this.projects);
  }

  addProjectTask(projectId, task) {
    this.projects = this.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            tasks: [...p.tasks, { id: Date.now(), text: task, done: false }],
          }
        : p,
    );
    ls_save(ER_PREFIX + "proj", this.projects);
  }

  toggleProjectTask(projectId, taskId) {
    this.projects = this.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === taskId ? { ...t, done: !t.done } : t,
            ),
          }
        : p,
    );
    ls_save(ER_PREFIX + "proj", this.projects);
  }

  factoryReset() {
    [
      "short",
      "lt",
      "goals",
      "leads",
      "soul",
      "instr",
      "skills",
      "log",
      "proj",
      "paused",
      "model",
      "ollama_model",
    ].forEach((k) => localStorage.removeItem(ER_PREFIX + k));
    Object.assign(this, new ErebusCore());
  }
}

let _core = null;
export function getErebusCore() {
  if (!_core) _core = new ErebusCore();
  return _core;
}
export { WORKER, BACKEND, BROWSER_AGENT };
export default ErebusCore;
