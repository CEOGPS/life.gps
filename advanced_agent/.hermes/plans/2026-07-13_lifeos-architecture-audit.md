# LifeOS1 System Architecture Audit (2026-07-13)

> Senior audit synopsis — panels, agents, workers, dashboard concept, gaps, rebuild vs fix.
> **Not an execution plan** until Chris approves priorities.

## Executive summary

LifeOS1 is a **Vite + React SPA** (optional Electron) with a **monolithic Cloudflare Worker** (`workers/index.js`, ~85 `/api/*` routes), **Supabase** auth/data, **Firebase** auth in UI, and **three parallel AI stacks** that do not share one brain:

1. **AgentDock** (floating) — Erebus/Kranos autonomous in-browser; other personas via **paid worker LLM chain**.
2. **ErebusPanel** — full “OS” UI for Erebus state, goals, media, wake cycles (separate from dock).
3. **Hermes/Spencer** — `hermes/` profile + `hermesChat.js` (gateway `:8642` → Ollama fallback).

The **dashboard** was partially re-rail’d but **does not match your mock**: banner missing from grid, **weather removed** (ClockWidget is 8–10px text only), **AIMonitor mislabels Erebus**, Spencer card duplicates dock, module **sizes are uniform** not proportional.

**Best path to production (no-cost lean):** Local **Electron** or **dev + tunnel** for Ollama + Hermes gateway + optional `localhost:8100` browser agent; **Cloudflare Worker** for OAuth, KV, social, Telegram, email proxy; **Pages** for static UI; **do not** expect Pages alone to run autonomous desktop/browser agents.

---

## Dashboard — concept vs reality

### Intended concept (your brief)

- **Command center**: black + glass + crimson accents (localized, not whole-theme churn).
- **Banner** in layout position; **large clock + weather**; modules at **mock proportions**.
- **Finance hub** as source of truth for balances, credit (Karma/Experian), budget, product revenue.
- **Tasks / calendar / notes / links** wired to hubs and KV.
- **YouTube + music** in-dashboard with **persistent playback** across navigation.
- **Erebus** → opens **Agent Dock chat** (Erebus avatar), not Erebus panel, not “monitor”.
- **5/day** tips; notifications stream; leads with timestamps; topbar reminders.

### What exists in code today

| Piece | Status |
|--------|--------|
| 3-rail grid (3\|6\|3) | Partial — proportions inside cells still wrong |
| Banner upload (`banner_pic`) | Logic exists; **not prominent in layout** |
| ClockWidget | **Time only**, tiny font — **no weather API** |
| Calendar7Day | Mini grid in `DashboardWidgets.jsx` — not Calendar hub events |
| Finance sync | `financeDashSync.js` reads `fp_*` localStorage + KV refresh |
| YouTube | `YouTubeDashboard` + `GlobalPlaybackContext` |
| Music | `MusicPlaylistMini` + global audio |
| Spencer card | `hermesChat` / Ollama — separate from Erebus |
| AI Monitor / Insights | **Wrong metaphor** for Erebus; insights use Ollama |
| AgentDock open from dashboard | **Not wired** — `open` state is internal to `AgentDock.jsx` |

### Rebuild vs fix (dashboard)

| Approach | Verdict |
|----------|---------|
| Keep patching `DashboardPanel.jsx` | **Stop** — file is 950+ lines, layout spec will keep drifting |
| **Rebuild** | New `DashboardLayout.jsx` driven by **layout spec JSON** (grid areas from mock %), widgets as dumb children; `DashboardPanel` becomes data container only |
| Design tokens | Single `dashboardTokens.css` — accents without changing glass/black base |

---

## Site-wide panels (LifeOSShell + Sidebar)

Routing: `LifeOSShell.jsx` `switch(active)` + `Sidebar.jsx` `menuStructure`.

### CORE
| ID | Panel | Purpose | Data / APIs |
|----|--------|---------|-------------|
| dashboard | DashboardPanel | Home command center | KV, worker social, finance LS, hermesChat |
| settings | SettingsPanel | App prefs, keys | localStorage, worker keys |
| messages | MessagesPanel | Unified inbox concept | Supabase / worker webhooks |
| email | EmailPanel | Gmail/Nylas-style mail | `/api/email/*`, `/api/nylas/*`, OAuth |
| calendar | CalendarPanel (OtherPanels) | Events | `lifeos_calendar`, KV |

### LIFE
| ID | Purpose | APIs |
|----|---------|------|
| social | Social hub | Meta, X, YT, LinkedIn worker routes |
| finance | FinancePanel (large) | `fp_*` keys, Stripe summary, manual credit |
| music | MusicHub | Playlists local |
| media | MediaPanel | Library, generation hooks |
| contacts | ContactsPanel | CRM-adjacent |
| family | FamilyPanel | Family schedule |
| community | CommunityPanel | Local/community |
| pulse | Life Pulse | Health metrics |
| academy | AcademyPanel | Learning |
| entertainment | EntertainmentPanel | Games/simulators entry |
| health | HealthPanel | Fitness |
| journal | JournalPanel | Notes/journal |
| activity | ActivityFeedPanel | Activity stream |

### BUSINESS
| ID | Purpose |
|----|---------|
| crm | CRMPanel — leads, pipeline |
| projects | Projects |
| tasks | Task orchestration — syncs `tasks_queue` KV |
| kpi | KPI analytics |
| marketing | Marketing |
| ceogps | CEO GPS business panel |

### AI & SYSTEM
| ID | Purpose | Notes |
|----|---------|-------|
| aihub | AIHubPanel — agent customization (`lifeos_agents`) | Feeds AgentDock avatars |
| kranos | KranosPanel | Strategist UI |
| erebus | **ErebusPanel** — full autonomous OS UI | **Not** the dock |
| cloudflare | CloudflarePanel | CF summary `/api/cloudflare/summary` |
| telegram | TelegramPanel | Worker telegram APIs |
| terminal | TerminalPanel | Shell |

**Also in repo but not all in sidebar:** AgentPanel, AgentsPanel, IntegrationsPanel (large), Email, simulators (DreamForge, etc.) — some **syntax-broken** (tsc errors).

**AgentDock** is always mounted in shell (not a `active` panel) — correct place for **Erebus chat**.

---

## Agent architecture

### AgentDock (`AgentDock.jsx`)
- **Erebus** (`avatar.id === "erebus"`): `getErebusCore().reason()` + `parseAndRunErebusTools()` — **no worker LLM**.
- **Kranos**: `getKranos().think()` — UnifiedAgent + tools.
- **Others** (Zero, Inferno, Nova, …): `POST WORKER/api/llm/invoke` with persona system prompt — **cost chain** (Groq, Grok, Claude, …).

### ErebusCore (`ErebusCore.js`)
- Memory, goals, leads, skills toggles (web_browse, execute, deploy, …).
- LLM order: `localhost:8000` backend → Ollama → worker invoke.
- Browser: `BROWSER_AGENT = localhost:8100` via `ErebusTools.js` + worker `/api/browse/*`.
- **Computer use (OS desktop)** is **not** in Erebus — that’s **Hermes Desktop** `computer_use` / cua-driver.

### Kranos (`Kranos.js` + `UnifiedAgentCore.js`)
- Tools: decisions, goals, context analysis.
- LLM: **worker-first** in UnifiedAgent — **not wired to Hermes gateway or Ollama by default**.

### Spencer / Hermes
- LifeOS `hermes/` — gateway, SOUL.md = Spencer engineer persona.
- `hermesChat.js`: health → `:8642` → Ollama `qwen3.6` / `qwen2.5-coder`.
- **Telegram bot** (if using Hermes gateway) is **LifeOS hermes profile**, separate from worker `/api/telegram/*`.

### “Agent Zero” = sum of personas
**Concept:** One dock, many avatars (AIHub overrides), optional **router** that picks persona or runs **consensus** step.

**Today:** No single “Agent Zero” orchestrator — **manual avatar switch** in dock. **Implement:** `AgentZeroRouter.js` — classify intent → pick avatar or chain (Erebus for ops, Nova for strategy, Inferno for sales copy) — all **prefer Ollama** when `model === ollama` in dock.

---

## How to use Erebus for coding, browser, computer

| Capability | Mechanism | Cost | Status |
|------------|-----------|------|--------|
| **Coding** | Enable Erebus skill `execute`; Ollama `qwen2.5-coder` / `qwen3.6`; optional Hermes delegation | $0 local | execute **off** by default |
| **Browser** | `ErebusTools` → `localhost:8100` or worker `/api/browse/fetch` | $0 if local agent running | **8100 service not verified in repo root** — may need deploy |
| **Web scrape** | Worker browse routes | Free tier CF | Works server-side |
| **Desktop computer** | **Hermes** `computer_use` on Windows | $0 local | **Not connected to LifeOS UI** — bridge needed |
| **Media** | Erebus tool commands → worker replicate/runway/elevenlabs | Often paid | Keys in KV |

**Practical start (no cost):**
1. Ollama up; Erebus dock avatar; turn on `web_browse` + `execute` in ErebusPanel skills when trusted.
2. Run Hermes gateway (`HERMES_HOME=C:/dev/LifeOS1/hermes`) for Spencer + future tool parity.
3. Wire dashboard **“Erebus”** button → `AgentDockContext.open({ agent: 'erebus' })`.
4. For desktop automation: Hermes session with `computer_use`, not ErebusPanel monitor.

---

## Kranos ↔ Hermes / Qwen / Ollama

**Gap:** Kranos `think()` uses UnifiedAgent LLM → **worker paid chain**.

**Fix options (pick one):**
1. **Add `ollama` provider** in `UnifiedAgentCore` LLM adapter → `http://127.0.0.1:11434/v1/chat/completions` with `lifeos_er_ollama_model` / `qwen3.6:latest`.
2. **Route Kranos to Hermes API** → `http://127.0.0.1:8642/v1/chat/completions` model `hermes-agent` (tools via Hermes).
3. **Dock model picker** — when user selects “Ollama (local)”, pass through to Kranos context (today dock `model` state mostly affects **non-Erebus/non-Kranos** worker calls).

**Recommendation:** **(2) for tool-rich tasks**, **(1) for fast local chat** — both $0.

---

## Cloudflare Worker (`workers/index.js`)

**Bindings:** `LIFEOS_KV`, secrets for OAuth providers, Supabase service key, Telegram token, etc.

### Route groups (working / intended)

| Group | Routes | Function |
|-------|--------|----------|
| Agents | `/api/agents`, `/run`, `/status`, logs | Scheduled-style agents (Nova intel, Make trigger, …) + Telegram notify |
| KV / state | `/api/kv/*`, `/api/state/*` | Cross-device sync |
| OAuth | `/api/oauth/*` | Multi-account Google, Meta, X, ClickUp, etc. |
| Keys | `/api/keys/*` | API key vault in KV |
| Telegram | `/api/telegram/*`, `/api/webhook/telegram` | Bot send, webhook, chat store, Supabase message mirror |
| Social | `/api/meta/*`, `/api/x/*`, `/api/linkedin/*`, `/api/social/*` | Posting, insights, queue |
| LLM | `/api/llm/invoke`, `/preference` | **Paid fallback chain** — avoid for Chris default path |
| Email | `/api/email/*`, `/api/nylas/*`, `/api/imap/store` | Mail |
| Media | `/api/youtube/*`, `/api/runway/*`, `/api/replicate/*`, `/api/elevenlabs/*` | Media gen |
| Browse | `/api/browse/fetch`, `/search` | Server fetch for Erebus |
| Finance | `/api/stripe/summary` | Revenue |
| CF | `/api/cloudflare/summary` | Account summary |
| Sentinel | `/api/sentinel/*` | Capture/items |
| BD proxy | (in worker) | Brilliant Directories |

### Workers needed / updates

| Need | Action |
|------|--------|
| YouTube **search** on dashboard | Add `/api/youtube/search?q=` (Data API key) or document Invidious — **not present** |
| Credit Karma / Experian | **No scrape routes** — needs new worker + legal/ToS review or manual entry only |
| Ollama proxy for Pages users | Optional `POST /api/ollama/chat` **only from authenticated** — still can’t reach home Ollama; **Electron is the answer** |
| Consolidate worker URLs | Code mixes `api.lifeos1.ceogps.com`, `lifeos1.ceogps.workers.dev` — **normalize `VITE_WORKER_URL`** |

---

## Telegram

| Path | Role |
|------|------|
| `/api/telegram/send` | Outbound messages |
| `/api/telegram/webhook` | Register webhook |
| `/api/telegram/incoming` | Inbound handler |
| `/api/telegram/chats`, `/messages` | KV chat history |
| `/api/webhook/telegram` | Mirror to Supabase `conversations` / `messages` |

**TelegramPanel** in app is UI over these APIs. **Hermes gateway** can run a **separate** Telegram bot for Spencer — don’t conflate without docs.

---

## APIs: working vs needed

**Working (with OAuth/keys configured):** Meta status, X user, YT channel/videos, LinkedIn status, KV get/set, Stripe summary, LLM invoke, email/nylas proxies, Telegram send/webhook.

**Needed for your dashboard spec:**
- Weather (Open-Meteo) — **client-side OK**, no key.
- Finance credit automation — **manual + Finance hub** unless new integrations.
- YouTube in-app search — worker or YT API key.
- **AgentDock bridge** — app context API (not HTTP).
- Layout spec — **no API**, just JSON + CSS grid areas.

---

## AI model routing (no-cost preference)

| Task | Best $0 stack |
|------|----------------|
| Dashboard tips / insights | Ollama `qwen3.6:latest` in browser |
| Coding / refactors | `qwen2.5-coder:latest` or Hermes + same |
| Erebus autonomous ops | ErebusCore → Ollama |
| Persona banter (Zero, Inferno) | Ollama with persona system **or** Groq free if key’d — **not Grok default** |
| Long browser jobs | Hermes agent + computer_use OR local browser agent 8100 |
| Worker cron agents | Keep; Telegram notify optional |

---

## Skills & resources for peak performance

**Use now:**
- `lifeos-local-llm-wiring` — Hermes/Ollama/Spencer/dashboard
- `frontend-visual-refactoring` — mock-proportional layout
- `hermes-agent` — gateway, delegation, computer_use
- `systematic-debugging` — integration failures
- `plan` — phased execution after you approve

**Create next (recommended):**
- `lifeos-dashboard-layout-spec` — mock % → CSS grid areas, banner/clock/weather sizes
- `lifeos-agent-dock-bridge` — open dock, select Erebus, event bus
- `lifeos-erebus-operations` — browser 8100, execute skill, tool grammar

**You can supply:**
- **Updated layout PNG** with pixel or % annotations
- **Commit hash** “dashboard before rails”
- **List of which sidebar panels are MVP vs later**
- **ceogps.com** subdomain plan for worker/Pages/Electron updates

---

## Code health (audit pass)

| Issue | Severity |
|-------|----------|
| `DreamForgeSimulator.jsx`, `EchoPersonaWeaver.jsx`, `context-menu.jsx` — **tsc syntax errors** | Medium — exclude or fix before strict CI |
| Dashboard **no weather**; banner underused | High UX |
| **AIMonitor** misrepresents Erebus | High conceptual |
| Worker LLM default chain **costs credits** | High for Chris |
| `localhost:8100` browser agent **referenced but not bundled** | High for browser autonomy |
| Duplicate AI entry points (Spencer card, Erebus panel, dock) | Medium confusion |

**Delegated subagents** were dispatched for deeper panel/worker/agent inventories — merge when results arrive.

---

## Appendix A — Panel inventory (local pass, 2026-07-13)

Subagent `deleg_940a22fe` **failed**: Ollama `qwen3.6` OOM (~9.4GB alloc). Inventory completed on host.

### Routed in `LifeOSShell.jsx` (`active` id → component)

| id | Component |
|----|-----------|
| dashboard | DashboardPanel |
| aihub | AIHubPanel |
| pulse | PulsePanel (OtherPanels) |
| calendar | CalendarPanel (OtherPanels) |
| messages | MessagesPanel_v2 |
| social | SocialPanel |
| crm | CRMPanel |
| finance | FinancePanel |
| integrations | IntegrationsPanel |
| settings | SettingsPanel |
| journal | JournalPanel |
| family | FamilyPanel |
| contacts | ContactsPanel |
| email | EmailPanel |
| marketing | MarketingPanel |
| academy | AcademyPanel |
| community | CommunityPanel |
| media | MediaPanel |
| entertainment | EntertainmentPanel |
| activity | ActivityFeedPanel |
| tasks | TaskOrchestrationPanel |
| cloudflare | CloudflarePanel |
| telegram | TelegramPanel |
| projects | ProjectsPanel |
| ceogps | CEOGPSPanel |
| terminal | TerminalPanel |
| music | MusicHub |
| erebus | ErebusPanel |
| kranos | KranosPanel |
| health | HealthPanel |
| kpi | KPIPanelUI |
| default | DashboardPanel |

**Always mounted (not `active`):** `AgentDock` via `AgentDockSafe` — **Erebus chat lives here**, not `erebus` panel id.

### In Sidebar but same ids ✓

All sidebar `id`s match shell **except** `integrations` — **routed in shell, not in sidebar menu** (reachable only via hash/LS/deep link).

### Panel files **not** in shell switch (57 files total — orphans / nested)

Examples: `AgentPanel`, `AgentsPanel`, `AIModelsPanel`, `MessagesPanel.jsx` (superseded by v2), `EventsPanel`, `InvoicingPanel`, `PeoplePanel`, `CreatorOS1`, image/video/writing UIs, simulators (`DreamForgeSimulator`, `EchoPersonaWeaver`, …). Many are **Entertainment** or **Media** children — verify per-import before deleting.

### Broken / risky

- `DreamForgeSimulator.jsx`, `EchoPersonaWeaver.jsx` — **tsc syntax errors**
- Duplicate messages panels — only v2 wired

---

## Appendix B — Agent architecture (local pass, 2026-07-13)

Subagent `deleg_0ee0a88b` **failed** (same Ollama 3.6 OOM). Facts from code.

### Entry points

| Surface | File | Who answers |
|---------|------|-------------|
| **AgentDock** | `layout/AgentDock.jsx` | Per-avatar routing (below) |
| **ErebusPanel** | `panels/ErebusPanel.jsx` | Erebus OS UI + wake loops — **not dock** |
| **KranosPanel** | `panels/KranosPanel.jsx` | Strategist UI |
| **Dashboard Spencer** | `hermesChat` | Spencer persona |
| **AgentPanel** | `panels/AgentPanel.jsx` | Also uses `hermesChat` (orphan route) |
| **Hermes Desktop** | `hermes/` gateway `:8642` | Full tools (terminal, computer_use, etc.) — **outside React** |

### AgentDock routing (`sendMsgWith`)

1. **`erebus`** → `getErebusCore().reason()` → `parseAndRunErebusTools()` — **no dock `model` picker**.
2. **`kranos`** → `getKranos().think()` — UnifiedAgent tool loop.
3. **All other avatars** (zero, inferno, nova, …) → `POST {WORKER}/api/llm/invoke` with `avatar.system` + dock `model` state (`claude`, `auto`, etc.) — **paid worker chain**.

### ErebusCore `reason()` LLM waterfall

1. `localhost:8000/chat` (Python backend) if `backendOnline`
2. **Ollama** `11434/v1/chat/completions` if `ollamaOnline` — model `lifeos_er_ollama_model` default `qwen2.5-coder:7b`
3. **WebLLM** in-browser if loaded (`ErebusLocalModel.js`)
4. **Direct browser keys** — Groq, Gemini, DeepSeek, OpenAI via `VITE_*` env
5. **Worker** `/api/llm/invoke` last

**Gap:** No Hermes gateway in Erebus chain — Spencer gets tools via Hermes; Erebus does not unless you add step 2b → `:8642/v1`.

### ErebusTools (after LLM emits command lines)

- **LifeOS:** READ_LIFEOS, UPDATE_LEAD, CREATE_TASK, REMEMBER_FACT, DRAFT_EMAIL, …
- **Web:** Prefer `BROWSER_AGENT` (`localhost:8100`) `/browse/*`; fallback **Worker** `/api/browse/fetch|search`
- **Media:** Worker replicate/runway/elevenlabs routes
- **Execute/deploy:** gated by Erebus skills (`execute` **off** by default)

**Computer use (OS desktop):** **Not in Erebus** — only **Hermes `computer_use`** on Windows desktop app.

**Browser agent:** Referenced everywhere; **moved to `archive/`** per README — must restore or run separate service on **8100**.

### Kranos (`Kranos.js` + `UnifiedAgentCore.js`)

- Tools: decisions, goals, `analyze_context`, file R/W (File System Access), **`browser_takeover`** → UnifiedAgent `browser` → **8100**
- LLM: `LLMProvider` tries worker URLs (`lifeos1.ceogps.workers.dev` + `/api/llm/invoke`) — **no Ollama, no Hermes**

**Connect Kranos to $0 stack:** Extend `LLMProvider` with `http://127.0.0.1:11434/v1` and/or `http://127.0.0.1:8642/v1` before worker chain.

### Spencer (`connectors/hermesChat.js`)

- Try `VITE_HERMES_URL` (default **8642**) `/v1/chat/completions` model `hermes-agent`
- Fallback **Ollama** with Spencer system prompt; `VITE_OLLAMA_MODEL` default `qwen-coder:latest` (may not match your `qwen3.6:latest` — align env)

### Agent Zero (sum of personas)

- **Data:** `AIHubPanel` → `localStorage lifeos_agents` overrides dock avatars (`getAgentOverride` in AgentDock).
- **Missing:** Router/orchestrator; shared memory across avatars; unified tool policy.

### Wiring gaps (priority)

| Gap | Fix |
|-----|-----|
| Dashboard Erebus opens panel not dock | `AgentDockContext` (skill `lifeos-agent-dock-bridge`) |
| Kranos + dock personas burn worker credits | Ollama/Hermes in UnifiedAgentCore |
| Erebus vs Spencer duplicate brains | Optional: Erebus `reason()` → Hermes for tool parity |
| Browser automation | Restore 8100 agent or Hermes browser tools only |
| Desktop automation | Bridge LifeOS → Hermes session (Electron shell) |
| Delegation OOM | Pin `delegation.model` to `qwen2.5-coder:latest` or smaller quant |

---

## Recommended execution order (after you approve)

1. **Layout spec** from mock — banner, clock/weather hero, proportions — **rebuild `DashboardLayout`**, not more patches.
2. **`AgentDockContext`** — `openDock({ agent: 'erebus' })`; dashboard Erebus CTA; **remove AIMonitor** or rename to “Agent health” without Erebus label.
3. **Restore weather** in clock module (Open-Meteo Atlanta).
4. **Kranos + dock Ollama** path in UnifiedAgentCore.
5. Fix or quarantine broken simulator JSX.
6. Electron production package with local Ollama + Hermes autostart.

---

**Saved for follow-up:** merge subagent reports into this doc; implement only with explicit “go phase N” from Chris.