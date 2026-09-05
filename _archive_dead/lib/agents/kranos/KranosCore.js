// ============================================================
// KranosCore.js — Autonomous AI Coworker Engine v1.0
// Architecture: 3-tier memory + tool registry + agentic loop
// ============================================================

const WORKER = "https://lifeos1.ceogps.workers.dev";

// ── Persistence helpers ──────────────────────────────────────
function ls(k) {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
}
function lsSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

// ── Permission Levels ────────────────────────────────────────
export const PERM = {
  SAFE: "safe",
  CONFIRM: "confirm",
  RESTRICTED: "restricted",
};

// ── Tool Registry ────────────────────────────────────────────
export const TOOLS = {
  recall_context: {
    label: "Load Context File",
    desc: "Load KRANOS.context from KV — project goals, constraints, preferences",
    perm: PERM.SAFE,
    icon: "📋",
  },
  update_context: {
    label: "Update Context",
    desc: "Write updated context to KV for persistence across sessions",
    perm: PERM.CONFIRM,
    icon: "✏️",
  },
  search_memory: {
    label: "Search Memory",
    desc: "Search long-term memory by keyword/semantic meaning",
    perm: PERM.SAFE,
    icon: "🔍",
  },
  store_memory: {
    label: "Store Memory",
    desc: "Save fact, decision, or preference to long-term memory",
    perm: PERM.SAFE,
    icon: "💾",
  },
  get_crm_contacts: {
    label: "Fetch CRM Contacts",
    desc: "Pull contacts from Supabase crm_contacts table",
    perm: PERM.SAFE,
    icon: "👥",
  },
  get_calendar: {
    label: "Fetch Calendar",
    desc: "Get upcoming events from Worker /api/calendar/events",
    perm: PERM.SAFE,
    icon: "📅",
  },
  get_tasks: {
    label: "Fetch Tasks",
    desc: "Load active tasks from TaskOrchestration storage",
    perm: PERM.SAFE,
    icon: "✅",
  },
  web_search: {
    label: "Web Search",
    desc: "Search the web via Worker browse endpoint",
    perm: PERM.CONFIRM,
    icon: "🌐",
  },
  invoke_sub_agent: {
    label: "Sub-Agent LLM",
    desc: "Spawn a focused sub-agent LLM call for a specific subtask",
    perm: PERM.SAFE,
    icon: "🤖",
  },
  read_kv: {
    label: "Read KV",
    desc: "Read a value from Worker KV storage",
    perm: PERM.SAFE,
    icon: "📖",
  },
  write_kv: {
    label: "Write KV",
    desc: "Persist a value to Worker KV storage",
    perm: PERM.CONFIRM,
    icon: "📝",
  },
  analyze_data: {
    label: "Analyze Data",
    desc: "Run LLM analysis over a data payload and return structured insights",
    perm: PERM.SAFE,
    icon: "📊",
  },
  get_social_stats: {
    label: "Social Stats",
    desc: "Fetch social media metrics from Worker",
    perm: PERM.SAFE,
    icon: "📱",
  },
};

// ── Supabase helper ──────────────────────────────────────────
const SB_URL = "https://mhvcdstgkyplhzjptgfr.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odmNkc3Rna3lwbGh6anB0Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDE3NzYsImV4cCI6MjA5NDI3Nzc3Nn0.DrwY7_a6OyNdKtA5UB62qrWkiaFe9xcAHLqXdfzf8W4";

async function sbFetch(table, query = "") {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}${query}`, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

// ── KranosCore Class ─────────────────────────────────────────
class KranosCore {
  constructor() {
    // Tier 1: Short-term (in-memory, last 100 interactions)
    this.shortTerm = [];

    // Tier 2: Long-term (localStorage persisted, semantic-searchable by keyword)
    this.longTerm = ls("kr_longterm") || {
      facts: {}, // key→value facts Kranos learns
      decisions: [], // logged decisions with rationale
      preferences: {}, // user preferences
      patterns: [], // recurring patterns noticed
    };

    // Tier 3: Metadata (project context, permissions, config)
    this.meta = ls("kr_meta") || {
      permMode: "ask", // ask | default | restricted
      model: "auto",
      sessionCount: 0,
      totalTokens: 0,
      lastSession: null,
      projectName: "LifeOS1 / CEO GPS",
      owner: "Chris Green",
    };

    this.actionLog = ls("kr_log") || [];
    this.pendingActs = []; // actions awaiting user confirmation
    this.listeners = {}; // event listeners for UI
    this.context = ls("kr_ctx") || this._defaultContext();
    this.model = this.meta.model || "auto";

    // Init
    this.meta.sessionCount++;
    this.meta.lastSession = new Date().toISOString();
    this._persist();
  }

  _defaultContext() {
    return {
      project: "LifeOS1 — Personal operating system for Chris Green",
      goals: [
        "CEO GPS to $100K MRR",
        "Family schedule always protected (dinner 6:30pm, Jamal soccer Tues 4pm)",
        "Build LifeOS1 into world's most powerful personal OS",
        "Community leadership in Atlanta",
      ],
      techStack: ["React/Vite", "Cloudflare Workers", "Supabase", "KV storage"],
      constraints: [
        "Never schedule over family time",
        "All business decisions must serve the $100K MRR goal",
        "Data privacy — credentials stay in KV, never exposed",
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  _persist() {
    lsSet("kr_longterm", this.longTerm);
    lsSet("kr_meta", this.meta);
    lsSet("kr_log", this.actionLog.slice(-200));
    lsSet("kr_ctx", this.context);
  }

  // ── Event system for UI updates ──────────────────────────
  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  off(event, fn) {
    if (this.listeners[event])
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
  }
  emit(event, data) {
    (this.listeners[event] || []).forEach((fn) => fn(data));
  }

  // ── Memory: Tier 2 operations ────────────────────────────
  storeFact(key, value, source = "user") {
    this.longTerm.facts[key] = { value, source, ts: Date.now() };
    this._persist();
  }

  searchMemory(query) {
    const q = query.toLowerCase();
    const results = [];
    // Search facts
    for (const [k, v] of Object.entries(this.longTerm.facts)) {
      const haystack = (k + " " + JSON.stringify(v.value)).toLowerCase();
      if (haystack.includes(q)) results.push({ type: "fact", key: k, ...v });
    }
    // Search decisions
    for (const d of this.longTerm.decisions) {
      if (JSON.stringify(d).toLowerCase().includes(q))
        results.push({ type: "decision", ...d });
    }
    // Search patterns
    for (const p of this.longTerm.patterns) {
      if (JSON.stringify(p).toLowerCase().includes(q))
        results.push({ type: "pattern", ...p });
    }
    return results.slice(0, 10);
  }

  logDecision(decision, rationale) {
    this.longTerm.decisions.push({ decision, rationale, ts: Date.now() });
    if (this.longTerm.decisions.length > 100)
      this.longTerm.decisions = this.longTerm.decisions.slice(-100);
    this._persist();
  }

  // ── Short-term memory ────────────────────────────────────
  addShortTerm(role, content) {
    this.shortTerm.push({ role, content, ts: Date.now() });
    if (this.shortTerm.length > 100)
      this.shortTerm = this.shortTerm.slice(-100);
  }

  getConversationHistory(limit = 12) {
    return this.shortTerm
      .slice(-limit)
      .map((m) => ({ role: m.role, content: m.content }));
  }

  // ── Action log ───────────────────────────────────────────
  log(tool, args, result, status = "ok") {
    const entry = {
      tool,
      args,
      result: String(result || "").slice(0, 300),
      status,
      ts: Date.now(),
    };
    this.actionLog.push(entry);
    this._persist();
    this.emit("log", entry);
  }

  // ── Permission check ─────────────────────────────────────
  canAutoExecute(tool) {
    const toolDef = TOOLS[tool];
    if (!toolDef) return false;
    if (this.meta.permMode === "restricted") return toolDef.perm === PERM.SAFE;
    if (this.meta.permMode === "default") return true;
    // "ask" mode: only SAFE tools auto-execute
    return toolDef.perm === PERM.SAFE;
  }

  setPermMode(mode) {
    this.meta.permMode = mode;
    this._persist();
  }

  // ── Tool Executor ────────────────────────────────────────
  async executeTool(tool, args = {}) {
    this.emit("tool_start", { tool, args });
    try {
      let result;
      switch (tool) {
        case "recall_context":
          result = JSON.stringify(this.context, null, 2);
          break;

        case "update_context":
          if (args.updates) {
            this.context = {
              ...this.context,
              ...args.updates,
              lastUpdated: new Date().toISOString(),
            };
            this._persist();
          }
          result = "Context updated successfully.";
          break;

        case "search_memory": {
          const hits = this.searchMemory(args.query || "");
          result = hits.length
            ? hits
                .map(
                  (h) =>
                    `[${h.type}] ${h.key || h.decision || h.pattern}: ${JSON.stringify(h.value || h.rationale || "")}`,
                )
                .join("\n")
            : "No matching memories found.";
          break;
        }

        case "store_memory":
          this.storeFact(args.key, args.value, "agent");
          result = `Stored: ${args.key} = ${JSON.stringify(args.value)}`;
          break;

        case "get_crm_contacts": {
          const contacts = await sbFetch(
            "crm_contacts",
            "?select=name,email,company,status,score&order=score.desc&limit=20",
          );
          result = contacts
            ? `${contacts.length} contacts:\n` +
              contacts
                .map(
                  (c) =>
                    `• ${c.name} — ${c.company} (${c.status}, score:${c.score})`,
                )
                .join("\n")
            : "CRM unavailable.";
          break;
        }

        case "get_calendar": {
          const r = await fetch(`${WORKER}/api/calendar/events?days=7`).catch(
            () => null,
          );
          const data = r?.ok ? await r.json() : null;
          result = data?.events?.length
            ? data.events.map((e) => `• ${e.start} — ${e.summary}`).join("\n")
            : "No calendar events or calendar not connected.";
          break;
        }

        case "get_tasks": {
          const tasks = ls("lifeos_tasks") || ls("kr_tasks") || [];
          result = tasks.length
            ? tasks
                .slice(0, 15)
                .map((t) => `• [${t.status || "open"}] ${t.title || t.text}`)
                .join("\n")
            : "No active tasks found in local storage.";
          break;
        }

        case "web_search": {
          const r = await fetch(`${WORKER}/api/browse/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: args.query }),
          }).catch(() => null);
          const data = r?.ok ? await r.json() : null;
          result = data?.results?.length
            ? data.results
                .slice(0, 5)
                .map((r2) => `• ${r2.title}: ${r2.snippet}`)
                .join("\n")
            : `Web search unavailable. Query was: ${args.query}`;
          break;
        }

        case "invoke_sub_agent": {
          const r = await fetch(`${WORKER}/api/llm/invoke`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: args.model || "auto",
              messages: [{ role: "user", content: args.prompt }],
              max_tokens: args.max_tokens || 500,
            }),
          }).catch(() => null);
          const data = r?.ok ? await r.json() : null;
          result = data?.text || "Sub-agent unavailable.";
          break;
        }

        case "read_kv": {
          const r = await fetch(
            `${WORKER}/api/kv/get?key=${encodeURIComponent(args.key)}`,
          ).catch(() => null);
          const data = r?.ok ? await r.json() : null;
          result =
            data?.value != null
              ? JSON.stringify(data.value)
              : `Key "${args.key}" not found in KV.`;
          break;
        }

        case "write_kv": {
          const r = await fetch(`${WORKER}/api/kv/set`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: args.key, value: args.value }),
          }).catch(() => null);
          result = r?.ok ? `KV write OK: ${args.key}` : "KV write failed.";
          break;
        }

        case "analyze_data": {
          const r = await fetch(`${WORKER}/api/llm/invoke`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "auto",
              messages: [
                {
                  role: "user",
                  content: `Analyze this data and give structured insights:\n\n${JSON.stringify(args.data, null, 2)}\n\nFocus: ${args.focus || "general insights"}`,
                },
              ],
              max_tokens: 600,
            }),
          }).catch(() => null);
          const data = r?.ok ? await r.json() : null;
          result = data?.text || "Analysis unavailable.";
          break;
        }

        case "get_social_stats": {
          const [yt, x, meta] = await Promise.all([
            fetch(`${WORKER}/api/youtube/channel`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
            fetch(`${WORKER}/api/x/user?handle=ceogps`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
            fetch(`${WORKER}/api/meta/status`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
          ]);
          const parts = [];
          if (yt?.subscribers)
            parts.push(`YouTube: ${yt.subscribers} subs, ${yt.views} views`);
          if (x?.followers) parts.push(`X: ${x.followers} followers`);
          if (meta?.connected) parts.push(`Meta: connected`);
          result = parts.length
            ? parts.join("\n")
            : "Social stats unavailable — APIs not connected.";
          break;
        }

        default:
          result = `Unknown tool: ${tool}`;
      }
      this.log(tool, args, result, "ok");
      this.emit("tool_end", { tool, args, result, status: "ok" });
      return result;
    } catch (err) {
      this.log(tool, args, err.message, "error");
      this.emit("tool_end", {
        tool,
        args,
        result: err.message,
        status: "error",
      });
      return `Tool error: ${err.message}`;
    }
  }

  // ── Parse tool calls from LLM response ──────────────────
  parseToolCalls(text) {
    const calls = [];
    // Format: KRANOS_ACTION: {"tool": "...", "args": {...}}
    const re = /KRANOS_ACTION:\s*(\{[\s\S]*?\})/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(m[1]);
        if (parsed.tool && TOOLS[parsed.tool]) calls.push(parsed);
      } catch {}
    }
    return calls;
  }

  // ── Build system prompt ──────────────────────────────────
  buildSystemPrompt() {
    const memSummary = Object.keys(this.longTerm.facts)
      .slice(0, 10)
      .map(
        (k) =>
          `  • ${k}: ${JSON.stringify(this.longTerm.facts[k].value).slice(0, 80)}`,
      )
      .join("\n");

    return `You are Kranos — an autonomous AI coworker operating within LifeOS1 for ${this.meta.owner}.

## IDENTITY
You are not a chatbot. You are a workflow execution engine. You plan, execute multi-step tasks autonomously, and report results. You use "we" and "let's" — you are a teammate.

## PROJECT CONTEXT
${JSON.stringify(this.context.goals, null, 2)}

Constraints: ${this.context.constraints?.join(", ")}

## WHAT YOU KNOW (Long-term Memory Sample)
${memSummary || "  (no facts stored yet — learning as we work)"}

## TOOLS AVAILABLE
When you need to take an action, emit a KRANOS_ACTION block:
KRANOS_ACTION: {"tool": "TOOL_NAME", "args": {"key": "value"}}

Available tools:
${Object.entries(TOOLS)
  .map(([k, v]) => `  • ${k} [${v.perm}]: ${v.desc}`)
  .join("\n")}

Permission mode: ${this.meta.permMode.toUpperCase()}
- SAFE tools: execute automatically
- CONFIRM tools: ${this.meta.permMode === "ask" ? "need user approval" : "auto-execute in " + this.meta.permMode + " mode"}
- RESTRICTED tools: never auto-execute

## WORKFLOW PATTERN
For multi-step tasks:
1. State your plan briefly (1-2 sentences)
2. Execute tools in sequence using KRANOS_ACTION blocks
3. Synthesize results
4. Store learnings with store_memory
5. Suggest next action

## STYLE
- Direct and concise
- Show reasoning, not just conclusions
- If blocked: state exactly what's missing
- Proactively suggest what to do next`;
  }

  // ── Main agentic invoke ──────────────────────────────────
  async invoke(userMessage, onStep) {
    this.addShortTerm("user", userMessage);
    this.emit("thinking", true);

    const steps = [];
    const addStep = (type, content, data = null) => {
      const step = { type, content, data, ts: Date.now() };
      steps.push(step);
      onStep?.(step);
      this.emit("step", step);
    };

    try {
      // Step 1: Load context automatically at start
      addStep("plan", "Loading context and memory…");

      // Step 2: Build messages with full context
      const messages = [
        {
          role: "user",
          content: `Context loaded:\n${JSON.stringify(this.context.goals)}\n\nMemory keys: ${Object.keys(this.longTerm.facts).join(", ") || "none"}\n\nTask: ${userMessage}`,
        },
      ];

      // Include recent conversation history
      const history = this.getConversationHistory(8);
      if (history.length > 1) {
        messages.unshift(...history.slice(0, -1));
      }

      addStep("thinking", "Planning execution approach…");

      // Step 3: Call LLM
      const r = await fetch(`${WORKER}/api/llm/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          system: this.buildSystemPrompt(),
          messages,
          max_tokens: 1200,
        }),
      });

      if (!r.ok) throw new Error(`LLM error ${r.status}`);
      const llmData = await r.json();
      let responseText = llmData.text || "";
      const modelUsed = llmData.model_used || "unknown";

      addStep("model", `Using ${modelUsed}`, { model: modelUsed });

      // Step 4: Parse and execute tool calls
      const toolCalls = this.parseToolCalls(responseText);
      const toolResults = {};

      for (const call of toolCalls) {
        const { tool, args } = call;
        if (!this.canAutoExecute(tool)) {
          // Need confirmation
          addStep(
            "confirm",
            `Awaiting approval to run: ${TOOLS[tool]?.label || tool}`,
            { tool, args },
          );
          this.pendingActs.push({ tool, args, resolve: null });
          toolResults[tool] = "[Awaiting user confirmation]";
          continue;
        }
        addStep(
          "tool",
          `Running: ${TOOLS[tool]?.icon || "⚙"} ${TOOLS[tool]?.label || tool}`,
          { tool, args },
        );
        const result = await this.executeTool(tool, args);
        toolResults[tool] = result;
        addStep("result", result.slice(0, 200), { tool, result });
      }

      // Step 5: If tools ran, do a synthesis pass
      let finalText = responseText;
      if (toolCalls.length > 0) {
        // Strip raw KRANOS_ACTION blocks from display text
        finalText = responseText
          .replace(/KRANOS_ACTION:\s*\{[\s\S]*?\}/g, "")
          .trim();

        // Synthesize with tool results
        if (Object.keys(toolResults).length > 0) {
          const synthPrompt = `You ran these tools and got these results:\n${Object.entries(
            toolResults,
          )
            .map(([k, v]) => `${k}: ${v}`)
            .join(
              "\n\n",
            )}\n\nOriginal task: ${userMessage}\n\nProvide a clear, direct synthesis. No tool blocks. End with one proactive next step suggestion.`;
          const synthR = await fetch(`${WORKER}/api/llm/invoke`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: this.model,
              messages: [{ role: "user", content: synthPrompt }],
              max_tokens: 600,
            }),
          }).catch(() => null);
          const synthData = synthR?.ok ? await synthR.json() : null;
          if (synthData?.text) finalText = synthData.text;
        }
      }

      // Step 6: Store interaction in short-term memory
      this.addShortTerm("assistant", finalText);
      this.meta.totalTokens += (finalText.length / 4) | 0;
      this._persist();

      addStep("done", finalText);
      this.emit("thinking", false);
      return {
        text: finalText,
        steps,
        model: modelUsed,
        toolsRan: toolCalls.length,
      };
    } catch (err) {
      addStep("error", `Error: ${err.message}`);
      this.emit("thinking", false);
      this.addShortTerm("assistant", `I hit an error: ${err.message}`);
      return {
        text: `Execution error: ${err.message}`,
        steps,
        model: "unknown",
        toolsRan: 0,
      };
    }
  }

  // ── Session init report ──────────────────────────────────
  getInitReport() {
    return {
      permMode: this.meta.permMode,
      memFacts: Object.keys(this.longTerm.facts).length,
      memDecisions: this.longTerm.decisions.length,
      sessionCount: this.meta.sessionCount,
      lastSession: this.meta.lastSession,
      totalTokens: this.meta.totalTokens,
      model: this.model,
    };
  }

  clearShortTerm() {
    this.shortTerm = [];
  }
  clearLongTerm() {
    this.longTerm = { facts: {}, decisions: [], preferences: {}, patterns: [] };
    this._persist();
  }
  clearLog() {
    this.actionLog = [];
    this._persist();
  }
}

// ── Singleton ────────────────────────────────────────────────
let _instance = null;
export function getKranos() {
  if (!_instance) _instance = new KranosCore();
  return _instance;
}

export default KranosCore;
