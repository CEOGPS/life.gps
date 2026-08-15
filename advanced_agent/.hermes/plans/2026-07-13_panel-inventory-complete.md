# LifeOS1 — Complete panel & dashboard inventory (source of truth from code)

**Date:** 2026-07-13  
**Your direction:** One combined AI (persona = personality only); global CSS in `index.css` (remove per-panel hardwired layout CSS) — **planned**, not done in this doc.

---

## DASHBOARD (`dashboard` → `DashboardPanel.jsx`)

**Purpose:** Home command center; 12-column grid (`dashboardGridStyle`), max-width 1280px, `GridCard` + `RailColumn` wrappers (glass, crimson hover, dot grid on cards).

**Shell (not inside panel but visible on dashboard):**
- **Sidebar:** Nav to all menu panels; logo upload; API key area.
- **Topbar:** Panel title; **RemindersChip** (calendar + `lifeos_reminders` + placeholder “Check birthdays”); profile pic/name; account switcher (3 emails); avatar menu.
- **AgentDock:** Floating AI dock (separate section below).
- **Background:** `LifeOSShell` canvas red-dot grid on black.

### Dashboard modules (every card)

| Module | What it does | Parts & behavior | Data / APIs |
|--------|----------------|------------------|-------------|
| **Time & Weather** | Clock display | **Mislabeled:** title says weather but only **ClockWidget** — live time (2-digit), weekday date, static text “Atlanta”. **No weather API.** Tiny 8–10px type in large card. | Local `setInterval` |
| **Calendar (7-day)** | `Calendar7Day` | Lists next 7 days; events from `lifeos_calendar` LS filtered by date; **+ Add event** (name, date, time) writes LS. | `localStorage lifeos_calendar` |
| **TASKS** | Task list | Shows up to 5 **undone** from worker KV `tasks_queue`; add via input+`; delete removes from KV. | `kvGet/kvSet tasks_queue` |
| **LINKS** | Quick links | Label+URL list; add/delete; opens in new tab. | `lifeos_dash_links` LS |
| **YouTube** | `YouTubeDashboard` | Search box: paste URL → embed via **GlobalPlaybackContext**; or **Go** fetches worker `/api/youtube/videos` and filters by title; iframe player; stop button. | Worker YT + global YouTube state |
| **Spencer (Hermes)** | Inline chat | Status: Hermes `:8642` or Ollama; one-shot **Ask** → `hermesChat`; shows last reply/error. **Not Agent Dock.** | `hermesChat.js` |
| **AI Insights** | `AIInsightsPanel` | **Refresh** → Ollama prompt for 5 bullets; caches `lifeos_ai_insights`. | Ollama |
| **Notifications** | Activity stream | Blinking “Live” dot; lines from KV `activity_events` (message/title/type). | `kvGet activity_events` |
| **LEADS** | CRM preview | Up to 6 leads from `crm_contacts` KV or `lifeos_crm` LS; lead filter by status; **timestamp** per lead. | KV + LS |
| **Finance snapshot** | Hub teaser | Total balances + credit avg from `financeSnap`; link **Finance Hub →**. | `financeDashSync` / `fp_*` |
| **AI Monitor** | `AIMonitorPanel` | Lists Spencer/Erebus/Kranos/Zero with **status text** (only Spencer polls Hermes/Ollama). **Not operational Erebus.** | `hermesHealth` |
| **NOTES** | Scratch + history | Left: draft textarea (`lifeos_dash_notes` auto-save); **Save →** pushes to right list (`lifeos_dash_previous_notes`); delete × on saved. | LS |
| **Product Revenue** | Product table | Default 3 products; **EDIT/SAVE** inline mo/ytd rev; label “Sources: KPI Revenue”. | `lifeos_dash_products` |
| **Financial Balances** | Institutions | Per-institution checking+savings sum; **EDIT/SAVE**; merged from Finance hub accounts when KV refresh. | `lifeos_dash_finance_institutions` + hub |
| **Credit Score** | Gauge | Gradient bar + avg score; Karma/Experian lines from hub/`credInput`; **EDIT** toggle (save UI minimal). | `fp_credit` via sync |
| **Budget (Finance Hub)** | Categories read-only | Top 5 categories spent/allocated from hub snapshot. | `fp_budget` |
| **Low-effort Money Tips** | 5 daily tips | Date-seeded slice from static `moneyTipsList`; **+** saves to `savedMoneyTips` LS (alert: spreadsheet later). | Static + LS |
| **Life Hacks** | 5 daily hacks | Same pattern, `lifeHacksList`, `savedLifeHacks`. | Static + LS |
| **Social Hub** | Metrics strip | IG/X/YT/LI follower counts from worker status endpoints. | `/api/meta/status`, `/api/x/user`, `/api/youtube/channel`, `/api/linkedin/status` |
| **Playlist** | `MusicPlaylistMini` | Select playlist from `lifeos_music_playlists`; play tracks via **global audio** (persists across panels). | LS + GlobalPlaybackContext |
| **Quick budget** | Local bill tracker | Add desc+$; checkbox paid; delete. **Separate** from Finance Hub budget. | `lifeos_dash_budget` |

### Dashboard code present but **NOT shown in UI**

| Item | Code exists | UI |
|------|-------------|-----|
| **Banner image** | `bannerPic`, `handleBannerUpload`, `getApiKey("banner_pic")` | **Not rendered** in JSX return |
| **AI tips (Ollama JSON)** | `aiTips` state + `useEffect` generates 4 tips from social context | **Not displayed** |
| **Supabase todos** | `supabaseTodos`, `addSupabaseTodo`, etc. | **Not in grid** (loaded only) |
| **Supabase data rows** | `supabaseData`, `sbStatus` | **Not in grid** |
| **Activity duplicate** | `activity` state | Not separate card (notifications uses `notifStream`) |
| **YouTubePlayer** (legacy iframe) | Function defined | **Unused** (replaced by YouTubeDashboard) |

### Dashboard shared UI primitives

- **GridCard:** Title bar (crimson uppercase), optional actions, glass body, hover crimson border/glow.
- **RailColumn:** Vertical stack gap 10 in 3 or 6 col span.

---

## AGENT DOCK (`AgentDock.jsx` — always on)

**Purpose (your target):** Primary AI assistant — talking avatar, should follow user, full ops.  
**Purpose (code today):** Draggable floating dock; avatar carousel; chat; voice in/out.

| Part | Behavior |
|------|----------|
| Avatar strip | Erebus, Kranos, Zero, Inferno, Nova, … — AIHub overrides (`lifeos_agents`) |
| Erebus messages | `ErebusCore.reason` + tool parse — **no worker** for LLM |
| Kranos messages | `Kranos.think` + tools |
| Other avatars | Worker `/api/llm/invoke` + system prompt |
| Model picker | Affects **non-Erebus/non-Kranos** only |
| Voice | Web Speech API TTS + recognition |
| Open state | **Internal only** — nothing on dashboard opens it yet |

---

## ROUTED PANELS (sidebar + `LifeOSShell` switch)

### CORE

**Settings (`settings`)** — App preferences, keys, appearance hooks, worker key storage UI.

**Messages (`messages`)** — `MessagesPanel_v2`: unified inbox UI; Supabase/worker conversation concepts.

**Email (`email`)** — `EmailPanel`: Gmail/Nylas-style threads via worker `/api/email/*`, `/api/nylas/*`.

**Calendar (`calendar`)** — `OtherPanels.CalendarPanel`: calendar events (hub calendar data).

### LIFE

**Social Hub (`social`)** — `SocialPanel`: Meta, X, LinkedIn, YouTube posting/insights UI; worker social routes.

**Finance Hub (`finance`)** — `FinancePanel` (**8 tabs**):
- **Overview:** 12-mo cash flow chart, accounts summary, quick nav tiles.
- **Budget:** Categories, allocation breakdown, budget health.
- **Cash Flow:** Accounts editor (checking/savings), growth graph, aligns with dashboard balances.
- **Invoices:** Invoices & payments tracking.
- **Crypto:** Holdings + market prices.
- **Stocks:** Positions + watchlist.
- **Credit Score:** Scores, utilization, factors, debts (Karma/Experian style fields).
- **AI Invest:** Investment parameters / AI-assisted invest UI.  
Storage: `fp_*` localStorage + worker KV sync.

**Music Hub (`music`)** — `MusicHub`: playlists, tracks (`lifeos_music_playlists`).

**Media Hub (`media`)** — `MediaPanel`: media library, generation entry points.

**Contacts (`contacts`)** — `ContactsPanel`: contact records; can `setActive` to other panels.

**Family Hub (`family`)** — `FamilyPanel`: family schedule/members.

**Community Hub (`community`)** — `CommunityPanel`: community/local content.

**Life Pulse (`pulse`)** — `OtherPanels.PulsePanel`: life metrics/pulse.

**Academy (`academy`)** — `AcademyPanel`: learning content.

**Entertainment (`entertainment`)** — `EntertainmentPanel`: categories Life Hacks, Free Tools, Make Money, **AI Simulators** (LLM prompts), Gaming; embeds/links simulator apps.

**Health Hub (`health`)** — `HealthPanel`: fitness/health tracking.

**Journal (`journal`)** — `JournalPanel`: journal entries.

**Activity Feed (`activity`)** — `ActivityFeedPanel`: activity event stream.

### BUSINESS

**CRM (`crm`)** — `CRMPanel`: leads, pipeline, contacts CRM.

**Projects (`projects`)** — `ProjectsPanel`: project boards/lists.

**Tasks (`tasks`)** — `TaskOrchestrationPanel`: full task queue (same KV `tasks_queue` as dashboard).

**KPI Analytics (`kpi`)** — `KPIPanelUI`: KPI charts/metrics.

**Marketing (`marketing`)** — `MarketingPanel`: campaigns/marketing tools.

**CEO GPS (`ceogps`)** — `CEOGPSPanel`: CEO GPS business dashboard.

### AI & SYSTEM

**AI Hub (`aihub`)** — `AIHubPanel` **3 tabs:**
- **Erebus:** embeds full `ErebusPanel`.
- **AI Agents:** embeds `AgentPanel` (7 agents / Hermes chat patterns).
- **AI Models:** embeds `AIModelsPanel`.

**Kranos (`kranos`)** — `KranosPanel`: strategist UI over `Kranos` agent.

**Erebus AI (`erebus`)** — `ErebusPanel` **5 tabs:**
- **Chat:** Erebus chat + wake state + avatar video hooks.
- **Mind:** memory/soul/reflections.
- **Goals:** goal list editing.
- **Projects:** Erebus projects.
- **Control:** pause, skills toggles, model, sleep/wake.

**CF Agents (`cloudflare`)** — `CloudflarePanel`: worker agent runs, CF summary.

**Telegram (`telegram`)** — `TelegramPanel`: bot chats, send, worker telegram APIs.

**Terminal (`terminal`)** — `TerminalPanel`: embedded terminal UI.

### Routed but **not in sidebar**

**Integrations (`integrations`)** — `IntegrationsPanel`: OAuth connections (Google, Meta, X, etc.), large hub.

---

## ORPHAN / NESTED PANEL FILES (not direct `active` id)

| File | Typical access |
|------|----------------|
| `AgentPanel.jsx` | AI Hub → AI Agents |
| `AgentsPanel.jsx` | Legacy/alternate agents UI |
| `AIModelsPanel.jsx` | AI Hub → AI Models |
| `MessagesPanel.jsx` | Superseded by v2 |
| `DreamForgeSimulator.jsx`, `EchoPersonaWeaver.jsx`, … | Entertainment simulators or Media; some **syntax broken** |
| `ImageGeneratorUI.jsx`, `VideoGeneratorUI.jsx`, `WritingHubUI.jsx`, … | Media / Creator flows |
| `CreatorOS1.jsx`, `EventsPanel.jsx`, `InvoicingPanel.jsx`, `PeoplePanel.jsx` | Not in shell switch |
| `LiveMarketWidget.jsx` | Widget / embed |

---

## CSS note (your requirement)

- **Global tokens:** `src/index.css` (`:root`, scrollbars, some globals).
- **Per-panel:** Most panels use inline `style={{}}` and local `const C = {...}` color objects — **not** centralized.
- **Dashboard:** `dashboardGridStyle`, `GridCard` inline styles, `@keyframes dash-blink` in component.
- **Shell:** Dot grid canvas inline in `LifeOSShell.jsx`.
- **Migration:** Move layout/spacing/typography to `index.css` (or `dashboard.css` imported once) — **future task**.

---

## Alignment checklist (same page)

| Topic | Your intent | Code today |
|-------|-------------|------------|
| One AI | Single brain; persona = skin | ErebusCore, Hermes, Spencer card, dock avatars, worker LLM — **split** |
| AI Dock | Follow avatar, full ops | Corner dock; limited tools on Erebus path; no Hermes bridge |
| Dashboard banner | On layout | **Loaded, not displayed** |
| Weather | In time module | **Missing** |
| Erebus on dashboard | Open **dock** | Spencer card + Monitor; **no `openDock`** |

---

## Appendix C — Present in code but NOT implemented (or stub / dead)

### Dashboard — UI missing though logic exists

| Feature | Code | Gap |
|---------|------|-----|
| **Banner image** | `bannerPic`, `handleBannerUpload`, KV `banner_pic` | **No JSX** — never shown |
| **Weather** | Card title “Time & Weather” | **No weather** fetch/display |
| **Ollama business tips** | `aiTips` + `useEffect` (4 JSON tips) | **Never rendered** |
| **Supabase block** | `supabaseTodos`, `addSupabaseTodo`, `supabaseData` | Loaded; **no module** |
| **Save tip/hack → sheet** | `saveToSheet` + alert | **Alert only** — “sync via worker later” |
| **Product “KPI Revenue” label** | Static text | **No live KPI sync** wired |
| **Open AI Dock / Erebus** | — | **No button**; `AgentDock` `open` internal only |
| **Follow-along avatar** | — | **Not built** |
| **Layout vs mock** | Grid rails | **Proportions/banner slot** not per your layout |

### Shell / global

| Feature | Gap |
|---------|-----|
| **Harmony score 92** | `Topbar` prop **hardcoded** in `LifeOSShell` — not computed |
| **AgentDock `active` / `setActive`** | Passed from shell but **`AgentDock()` ignores props** |
| **Duplicate AgentDock** | `src/api/agentdock.jsx` exists; **shell uses `layout/AgentDock.jsx` only** |
| **PlaceholderPanel** | Imported in shell; **not used** in `switch` (dead import) |
| **Integrations panel** | Routed `#integrations` | **Not in sidebar** — hidden unless hash |
| **Global CSS** | Tokens in `index.css` | **Most panels use inline styles** — migration not done |

### AI Dock (your full ops vision)

| Promised capability | Status |
|---------------------|--------|
| Unified one AI brain | **Split:** ErebusCore, Hermes, worker LLM, Ollama |
| Browser automation | **8100 browser agent** in `archive/`; worker fetch only fallback |
| PC files / edits | Erebus `execute` skill **disabled**; no Hermes `computer_use` in dock |
| Image / video / music / docs in dock | Partial via Erebus tool lines / worker; **not unified** |
| Persistent memory + continuous learning | Partial LS keys; **no single memory**; wake loops on **Erebus panel** only |
| Persona-only switching | Avatars change prompt/routing; **different backends** per avatar |
| Avatar follows dashboard | **Fixed/drag corner** only |

### Erebus (panel + core)

| Feature | Status |
|---------|--------|
| `localhost:8000` Python backend | Probed; **optional**, usually off |
| WebLLM in-browser | **Optional** module; often not loaded |
| Auto-deploy Vercel skill | **Off** by default |
| Terminal execute skill | **Off** by default |
| Credit Karma / Experian **live pull** | **Manual scores** in Finance; no scrape API |
| Dashboard “Erebus” in AI Monitor | **Label only** — status `idle`, not wired to dock |

### Finance Hub

| Feature | Status |
|---------|--------|
| Credit Karma / Experian automation | **Manual entry** (`fp_credit` scores) |
| Bank Plaid / live sync | **Manual accounts** + optional Stripe **summary** worker route |
| Crypto / stocks live prices | UI tabs; **depends on manual data / APIs** — not fully wired |
| AI Invest tab | UI + prompts; **not autonomous trading** |
| Invoices | **Local tracking UI** — not full accounting integration |

### Calendar

| Feature | Status |
|---------|--------|
| Google / Outlook sync | **None** — `lifeos_calendar` localStorage only |
| Dashboard 7-day vs Calendar panel | **Same key** but dashboard mini ≠ full month panel |
| `view` week/list on Calendar panel | State exists; **only month grid** implemented |
| Calendly | **External link** only |

### Social / Marketing / Email

| Feature | Status |
|---------|--------|
| Posting to Meta/X/LI/YT | Worker routes exist; **needs OAuth keys** in worker KV |
| Scheduled queue | Worker `/api/social/queue` — UI coverage varies |
| Email warm-up (email components) | **AccountsView** explicit “fallback placeholder” |

### Terminal panel

| Feature | Status |
|---------|--------|
| PowerShell / Python / etc. | **Simulated builtins** — fake `dir`, `ls`; **not real OS shell** (unless later wired to Electron) |

### Life Pulse

| Feature | Status |
|---------|--------|
| Harmony / energy / business / family tiles | **Static demo numbers** (92, 87%, etc.) |
| Insight copy | **Hardcoded narratives** — not from live CRM/calendar |
| CRM “23% close rate” | **Narrative** — not computed from CRM in code shown |

### KPI panel

| Feature | Status |
|---------|--------|
| DEFAULT_KPIS values | **Zeros** until user fills; `syncKPIToPanel` **partial** |
| Website/social analytics modules | UI shells; **live GA/Meta** needs keys + implementation |
| WebSheetBuilder | Feature present; **depth varies** |

### Cloudflare panel

| Feature | Status |
|---------|--------|
| `cfApiViaWorker('/workers')` etc. | UI calls **`/api/cloudflare/*` subpaths** |
| Worker actually implements | **`/api/cloudflare/summary` only** — deploy/list routes **likely 404** |

### Worker `/api/agents` (CF Agents tab)

| Feature | Status |
|---------|--------|
| Nova, Make trigger, etc. | **Server-side** agents; need **env tokens** + Telegram optional |
| UI trigger from panel | Partial; depends on Cloudflare panel wiring |

### Telegram panel

| Feature | Status |
|---------|--------|
| Full bot UX | UI + KV; **webhook must be registered** on worker; Hermes bot is **separate** |

### Entertainment / simulators

| Simulator file | Status |
|----------------|--------|
| In-panel LLM simulators (Entertainment) | **Work** via `invokeLLM` if worker keys |
| `DreamForgeSimulator.jsx` | **Syntax errors** — won’t build under strict tsc |
| `EchoPersonaWeaver.jsx` | **Syntax errors** |
| Standalone panels (Events, Invoicing, People, CreatorOS1) | **Not in shell route** — unreachable from nav |

### Panels in repo, **not in `LifeOSShell` switch** (57 − 31 ≈ unmounted)

`AgentPanel` (used inside AI Hub only), `AgentsPanel`, `AIModelsPanel`, `MessagesPanel` v1, `EventsPanel`, `InvoicingPanel`, `PeoplePanel`, `CreatorOS1`, `LiveMarketWidget`, dedicated Image/Video/Writing UIs — **exist as files**, **no top-level nav id**.

### Integrations / OAuth

| Feature | Status |
|---------|--------|
| OAuth flows in worker | **Implemented server-side** |
| Each provider in Integrations UI | **Per-provider** — inactive until user connects |
| `validate-key` some providers | Worker returns **“not implemented”** for some |

### Media / local services

| Service | Status |
|---------|--------|
| `localhost:8100` browser agent | **Referenced**; project **moved to archive** |
| `localhost:8000/8001/8002` media | **Referenced** in UnifiedAgent; **optional local** |
| ComfyUI / Replicate / Runway | Worker proxies; **need API keys** |

### Data / sync

| Feature | Status |
|---------|--------|
| `persistBridge` cross-device | **Partial** — KV + keys documented; not every module syncs |
| Dashboard ↔ Finance Hub | **Partial** via `financeDashSync` |
| Dashboard tasks ↔ Tasks panel | **Same KV** — implemented |
| Leads ↔ CRM | **Partial** — KV `crm_contacts` + LS |

### `invokeLLM` / `invokeLLMWithAuth` dependency

Many panels (Pulse, Academy, Community, Activity, Entertainment, Health AI tab, Cloudflare, AgentsPanel, simulators) call **`invokeLLM*`** → worker **paid chain** unless keys/Ollama proxy added — **not $0-by-default** for all features.

---