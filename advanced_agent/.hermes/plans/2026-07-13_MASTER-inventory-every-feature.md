# LifeOS1 — MASTER inventory: every panel, module, feature

**Date:** 2026-07-13  
**Rule:** Source of truth = code under `C:/dev/LifeOS1`. **No implementation** until this document is complete and signed off.  
**Architecture canon:** `2026-07-13_architecture-canon.md` (Erebus = main brain; Kranos = assistant; Zero/Inferno/Nova/Viper/… = persona skins; Spencer/Hermes separate; CF Workers = infra; target = one agent config panel + dock toggles + proactive speech).

**Legend — Wired**
- **Yes** — End-to-end works when deps (Ollama, worker keys, OAuth) are available.
- **Partial** — UI + some persistence; missing sync, live APIs, or cross-links.
- **No** — UI or logic present; backend/route missing or always fails.
- **Dead** — Code/state exists; **not rendered** or unreachable from nav.

**Table columns:** Feature | Purpose | UI elements | Data / insights shown | Storage / API | Wired | Notes

---

# PART 0 — GLOBAL SHELL (always visible)

## 0.1 LifeOSShell (`src/LifeOSShell.jsx`)

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Panel router | Switch main content by hash | (none — driven by Sidebar) | `active` panel id | `localStorage lifeos_active_panel`, `location.hash` | Yes | 31 cases + default dashboard |
| Dot-grid background | Black + red hover texture | Canvas (no clicks) | Mouse position fade | In-memory canvas | Yes | Restored interactive grid |
| GlobalPlaybackProvider | YouTube + music across panels | (context) | Playback state | React context | Yes | Used by dashboard YT + playlist |
| AgentDock mount | Floating assistant | Always mounted | — | — | Partial | Props `active`/`setActive` **ignored** by dock |
| OAuth consent route | OAuth authorize screen | Full-page at `/oauth/consent` | — | — | Yes | Not hash panel |

## 0.2 Sidebar (`layout/Sidebar.jsx`)

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Logo upload | Custom brand image | Click logo / ↑ button; file input | Preview image | `getApiKey/saveApiKey logo_pic` + Firebase uid | Partial | Falls back ShieldCheck icon |
| Nav — CORE (5) | Jump to panels | Dashboard, Settings, Messages, Email, Calendar | Highlight `active` | Hash navigation | Yes | |
| Nav — LIFE (13) | Jump to panels | Social, Finance, Music, Media, Contacts, Family, Community, Pulse, Academy, Entertainment, Health, Journal, Activity | — | Yes | |
| Nav — BUSINESS (6) | Jump to panels | CRM, Projects, Tasks, KPI, Marketing, CEO GPS | — | Yes | |
| Nav — AI & SYSTEM (6) | Jump to panels | AI Hub, Kranos, Erebus AI, CF Agents, Telegram, Terminal | — | Yes | **No** Integrations link |
| API key area (footer) | Store keys in worker KV | Inputs per provider (see Sidebar lower section) | Masked keys | Worker KV via ceogpsclient | Partial | Depends on worker + auth |

## 0.3 Topbar (`layout/Topbar.jsx`)

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Panel title | Context label | Text from `PANEL_TITLES[active]` | Title string | — | Partial | Some ids missing from map (health, erebus, kranos use fallback) |
| RemindersChip | Upcoming reminders strip | Topbar chip (⏰); ellipsis labels | Next 7d `lifeos_calendar` events + `lifeos_reminders` + placeholder **Check birthdays**; max 5 labels joined by · | LS only; **no refresh on calendar change** until remount | Partial | `DashboardWidgets.RemindersChip`; hidden if empty |
| Harmony score | Life harmony metric | Display (if rendered in bar) | Score number | Prop from shell | **No** | Shell passes **hardcoded 92** — not computed |
| Profile picture | User avatar | Click upload; image | Photo | `profile_pic` KV + Firebase user | Yes | |
| Profile name | Display / edit name | Click to edit; save | Name text | `profile_name` KV | Yes | |
| Account switcher | 3 Google accounts | Menu: CEO GPS, Business, Marketing emails | Current email | Firebase `signInWithSpecificEmail` | Partial | Needs Firebase config |
| Avatar menu | Settings / logout | Dropdown | — | Firebase signOut | Partial | |
| Notifications strip | Thin alert area | 🔔 mini module | (minimal) | — | Partial | Cosmetic |

## 0.4 Agent Dock (`layout/AgentDock.jsx`) — NOT a routed panel

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Collapsed orb | Open assistant | 64px button, avatar canvas | Current persona | — | Yes | Default bottom-right |
| Expanded dock | Chat + avatar | Open/close ×; drag pill; 292px panel | Message history | In-memory state | Yes | `open` **internal only** — nothing on dashboard opens it |
| Avatar carousel | Switch persona | Prev/next avatar buttons (in expanded UI) | 9 avatars: Erebus, Kranos, Zero, Inferno, Nova, Viper, Rage, Aurora, Breeze | `lifeos_agents` overrides from AI Hub | Partial | **Not** Spencer; **not** dock toggle for Telegram bot |
| Model picker | LLM for worker personas | Dropdown: Auto, Groq, Gemini, DeepSeek, Ollama, WebLLM, Grok, Claude, GPT-4o | Selected model id | — | Partial | Applies to **worker** avatars only |
| Chat input | User messages | Textarea; Enter send | — | — | Yes | Prompt-driven only — **no proactive wake** |
| Send pipeline — Erebus | Main brain path | (send) | Reply + tool types | `ErebusCore.reason` + `parseAndRunErebusTools` | Partial | Local core; tools limited vs Hermes full stack |
| Send pipeline — Kranos | Assistant path | (send) | Reply + tools used | `Kranos.think` | Partial | Separate from Erebus memory |
| Send pipeline — other personas | Skins | (send) | Reply text | `POST api.lifeos1.ceogps.com/api/llm/invoke` | Partial | Paid worker chain; persona = system prompt only |
| TTS | Spoken replies | Voice toggle mute/unmute | — | Web Speech API | Yes | Speaks truncated reply |
| STT | Voice input | Mic button | Transcript → send | Web Speech API | Partial | Chrome/Edge |
| Drag position | Move dock | Pointer drag on chrome | x,y fixed | — | Yes | **No** follow-along on layout |
| Face-api zoom | Avatar face track | (disabled) | — | CDN face-api | **Dead** | Disabled — CDN 404 |
| Shell props | Open dock from app | — | — | — | **No** | `AgentDock()` takes **no props** |

---

# PART 1 — DASHBOARD (`dashboard` → `DashboardPanel.jsx`)

**Layout:** 12-column grid, max-width 1280px; rails 3 | 6 | 3 + full-width rows. Wrapper: `GridCard`, `RailColumn`.

## 1.1 Dashboard modules (on screen)

| Module | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|--------|---------|-------------|-----------------|---------------|-------|-------|
| **Time & Weather** | Clock (weather intended) | (none — clock only) | Live time; weekday date; static **“Atlanta”** | `setInterval` local | **Partial** | **Mislabeled** — **no weather API** |
| **ClockWidget** | Time display | (inside card) | HH:MM, date | Local | Yes | Tiny 8–10px type |
| **Calendar (7-day)** | Short horizon events | 7 day rows; Event/date/time inputs; **+ Add event** | Events per day | LS `lifeos_calendar` | Yes | Same key as Calendar panel |
| **TASKS** | Quick task list | List ≤5 open tasks; × delete; input + **+** | Task titles | Worker KV `tasks_queue` | Yes | Syncs with Tasks panel |
| **LINKS** | Quick URLs | Links; label+URL inputs; + ; × | Label, URL | LS `lifeos_dash_links` | Yes | Opens new tab |
| **YouTube** | Watch/search YT | Search/URL input; **Go**; **■** stop; iframe; result list | Video embed | Worker `/api/youtube/videos`; `GlobalPlaybackContext` | Partial | Needs worker for search; URL paste works |
| **Spencer (Hermes)** | One-shot Hermes chat | Status line; reply area; input; **Send** | Last reply/error | `hermesChat` → gateway :8642 / Ollama | Partial | **Not** Agent Dock; not unified Erebus |
| **AI Insights** | Local AI bullets | **Refresh** button; scroll text | 5 bullet insights | Ollama chat completions; cache LS `lifeos_ai_insights` | Partial | Ollama must run; auto-refresh on mount |
| **Notifications** | Activity stream | Blinking “Live”; message lines | event message/title/type | KV `activity_events` | Partial | Depends on events being written |
| **LEADS** | CRM teaser | Up to 6 names + timestamps | Lead name, time | KV `crm_contacts` + LS `lifeos_crm` | Partial | Filter “lead” status |
| **Finance snapshot** | Hub summary | Totals, credit hint; link **Finance Hub →** | Balances, credit avg | `financeDashSync` / `fp_*` | Partial | `setActive('finance')` |
| **AI Monitor** | Agent status list | Rows per agent | Spencer ok/down; others **idle** | `hermesHealth` poll 20s | **Partial** | Erebus/Kranos/Zero **not** real dock state |
| **NOTES** | Scratch + history | Draft textarea; **Save →**; saved list × | Note text | LS `lifeos_dash_notes`, `lifeos_dash_previous_notes` | Yes | Auto-save draft |
| **Product Revenue** | Product KPI table | **EDIT/SAVE**; per product name, mo/ytd rev/sales | 3 default products | LS `lifeos_dash_products` | Partial | Label “KPI Revenue” — **no live KPI feed** |
| **Financial Balances** | Per-bank totals | **EDIT/SAVE**; institution rows | Checking+savings sum | LS `lifeos_dash_finance_institutions` + hub merge | Partial | Hub refresh can overwrite |
| **Credit Score** | Credit gauge | Bar; Karma/Experian lines; **EDIT** toggle | Avg score, % bar | `fp_credit` via sync | Partial | **Manual** scores — no Karma/Experian pull |
| **Budget (Finance Hub)** | Category peek | Read-only rows spent/allocated | Top categories | `fp_budget` snapshot | Partial | Read-only here |
| **Low-effort Money Tips** | Daily tips | 5 lines; **+** each | Tip text | Static list; save LS `savedMoneyTips` | Partial | **+** → alert only, no sheet |
| **Life Hacks** | Daily hacks | 5 lines; **+** each | Hack text | Static list; LS `savedLifeHacks` | Partial | Same alert stub |
| **Social Hub** | Follower counts | IG/X/YT/LI lines | Follower numbers | Worker status routes | Partial | Needs OAuth keys on worker |
| **Playlist** | Music mini player | Playlist select; track list; stop | Tracks | LS `lifeos_music_playlists`; global audio | Yes | Empty until Music Hub filled |
| **Quick budget** | Local bills | Desc + $; + ; checkboxes paid; × | Bill rows | LS `lifeos_dash_budget` | Yes | **Separate** from Finance Hub budget |

## 1.2 Dashboard — implemented in code, NOT in UI

| Module | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|--------|---------|-------------|-----------------|---------------|-------|-------|
| **Banner image** | Hero banner | Upload handler exists | Image data URL | KV `banner_pic`, LS `lifeos_banner_pic` | **Dead** | **Not in JSX** |
| **AI tips (Ollama JSON)** | 4 growth ideas | — | JSON array in `aiTips` state | Ollama `qwen3.6` default in effect | **Dead** | Generated on load; **never rendered** |
| **Supabase todos** | Cloud todo list | CRUD functions only | todos rows | Supabase `todos` table | **Dead** | Loaded; **no card** |
| **Supabase user_data** | Generic rows | — | `supabaseData`, `sbStatus` | Supabase | **Dead** | **No card** |
| **Legacy YouTubePlayer** | Old iframe helper | Function in file | — | — | **Dead** | Replaced by `YouTubeDashboard` |

---

# PART 2 — ROUTED PANELS (summary index)

> **Authoritative detail** for panels already audited is under **PART 2B** below. Rows here are a quick index until every panel is expanded to Part 0–1 density.

## 2.1 CORE

### Settings (`settings` → `SettingsPanel.jsx`)

| Tab | Purpose | Wired | Notes |
|-----|---------|-------|-------|
| Profile | Name, email, phones, socials, avatar, bio | Partial | `getProfile/saveProfile`, upload |
| Notifications | Prefs toggles | Partial | UI present |
| Integrations | Full `IntegrationsPanel` embed | Partial | Duplicate of `#integrations` route |
| Privacy Vault | Sensitive notes / vault | Partial | LS-backed |
| AI Settings | Model/agent prefs | Partial | |
| Appearance | Theme picker | Yes | `THEMES`, `applyTheme` |

### Messages (`messages` → `MessagesPanel_v2.jsx`)

| Feature | Purpose | Wired | Notes |
|---------|---------|-------|-------|
| Unified inbox UI | Conversations across channels | Partial | Supabase/worker concepts; depth in file |

### Email (`email` → `EmailPanel.jsx`)

| Feature | Purpose | Wired | Notes |
|---------|---------|-------|-------|
| Mail threads | Read/send email | Partial | Worker `/api/email/*`, Nylas |

### Calendar (`calendar` → `OtherPanels.CalendarPanel`)

| Feature | Purpose | Wired | Notes |
|---------|---------|-------|-------|
| Month grid | Event calendar | Partial | LS `lifeos_calendar` only — **no Google/Outlook** |
| Week/list views | Alt views | **No** | State may exist; **month only** |

## 2.2 LIFE (panels)

| Route | File | Tabs / modules | Wired (overall) | Blocker summary |
|-------|------|----------------|-----------------|-----------------|
| social | SocialPanel | Meta, X, LI, YT post/insights | Partial | OAuth + worker routes |
| finance | FinancePanel | **8 tabs:** Overview, Budget, Cash Flow, Invoices, Crypto, Stocks, Credit, AI Invest | Partial | `fp_*` LS + KV; live prices/credit automation incomplete |
| music | MusicHub | Playlists, tracks | Yes | LS `lifeos_music_playlists` |
| media | MediaPanel | Images / Video / Writing; library; albums | Partial | Nested UIs; KV `lifeos_media_*` |
| contacts | ContactsPanel | Address book | Partial | Can `setActive` elsewhere |
| family | FamilyPanel | Family members/schedule | Partial | |
| community | CommunityPanel | Community content + LLM | Partial | `invokeLLM` |
| pulse | PulsePanel | Harmony/energy/business/family tiles | **No** | **Static demo numbers**; hardcoded insights |
| academy | AcademyPanel | Learning + LLM | Partial | `invokeLLM` |
| entertainment | EntertainmentPanel | Life Hacks, Free Tools, Make Money, **AI Simulators**, Gaming | Partial | Simulators = inline `invokeLLM` modals — **not** standalone `*Simulator.jsx` files |
| health | HealthPanel | 6 tabs + AI coach | Partial | LS + `invokeLLM` on AI tab |
| journal | JournalPanel | Entries | Partial | |
| activity | ActivityFeedPanel | Activity stream | Partial | KV/events |

## 2.3 BUSINESS

| Route | File | Wired | Notes |
|-------|------|-------|-------|
| crm | CRMPanel | Partial | Pipeline, import, `invokeLLM`, KV + Supabase |
| projects | ProjectsPanel | Partial | Boards/lists |
| tasks | TaskOrchestrationPanel | Yes | Same `tasks_queue` as dashboard |
| kpi | KPIPanelUI | Partial | Defaults 0; websheets; GA/social need keys |
| marketing | MarketingPanel | Partial | Campaigns |
| ceogps | CEOGPSPanel | Partial | Worker integration |

## 2.4 AI & SYSTEM

| Route | File | Wired | Notes |
|-------|------|-------|-------|
| aihub | AIHubPanel | Partial | **3 tabs** — fragments your “one agent panel” target |
| ↳ erebus tab | ErebusPanel (duplicate route) | Partial | Full 5-tab Erebus UI embedded |
| ↳ agents tab | AgentPanel | Partial | 10 agent defs, chat, Hermes for Spencer |
| ↳ models tab | AIModelsPanel | Partial | Model switching UI |
| kranos | KranosPanel | Partial | Strategist UI over Kranos agent |
| erebus | ErebusPanel | Partial | **Chat, Mind, Goals, Projects, Control** — wake/skills optional |
| cloudflare | CloudflarePanel | **No** | UI calls many `/api/cloudflare/*`; worker often **summary only** |
| telegram | TelegramPanel | Partial | Bot UI; webhook + KV |
| terminal | TerminalPanel | **No** | **Simulated** shell — fake ls/dir |
| integrations | IntegrationsPanel | Partial | OAuth hub; **no sidebar** |

---

# PART 3 — NESTED-ONLY (no own route)

| Parent | Component | Wired | Notes |
|--------|-----------|-------|-------|
| media | VideoGeneratorUI, ImageStudioUI→ImageGeneratorUI, ImageEditorUI, WritingHubUI→WritingEditorUI | Partial | Reached via Media tabs |
| aihub | AgentPanel, AIModelsPanel, ErebusPanel | Partial | |
| settings | IntegrationsPanel | Partial | |

---

# PART 4 — UNROUTED FILES (exist; not in shell switch)

| File | Purpose (from code) | Wired | Notes |
|------|---------------------|-------|-------|
| AgentsPanel.jsx | Alternate multi-agent UI | Partial | **Unmounted** |
| MessagesPanel.jsx | v1 inbox | Dead | Superseded by v2 |
| EventsPanel.jsx | Events UI | No | Unreachable |
| InvoicingPanel.jsx | Invoicing | No | Finance has Invoices tab |
| PeoplePanel.jsx | People vs CRM | No | Unreachable |
| CreatorOS1.jsx | Creator suite | No | Large subtree unmounted |
| LiveMarketWidget.jsx | Market widget | No | Never imported |
| OpportunityEngine.jsx | CRM opportunities | No | Never imported |
| DreamForgeSimulator.jsx | Dream simulation app | No | Syntax issues; not linked |
| EchoPersonaWeaver.jsx | Group persona brainstorm | No | Syntax issues |
| AlternateLifeExplorer.jsx | Alt life explorer | No | |
| DarkCardGame.jsx, FantasyFriendSimulator.jsx, GameStateOptimizer.jsx, KaraokeDuetGenerator.jsx, MoodToMonetization.jsx, NarrativeConflictEngine.jsx, RandomJoyRoulette.jsx, ShadowBudgetOracle.jsx | Entertainment-style simulators | No | **Not** wired to Entertainment panel |
| src/api/agentdock.jsx | Old dock | Dead | Shell uses `layout/AgentDock.jsx` |
| OtherPanels.PlaceholderPanel | Coming soon | Dead | Imported, unused |

---

# PART 2B — ROUTED PANELS (feature-level detail from code)

> Section B background subagent **failed** (local qwen3.6 OOM). This section is authored in-session from source files.

## Settings (`settings` → `SettingsPanel.jsx`)

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Tab: Profile | Identity card | Avatar upload; Change Photo; fields: Full Name, Location, Profession; Phone + Add Phone; Email + Add Email; Websites; Socials grid (IG, X, LI, FB, TikTok, YT); Bio; **Save Profile** | User profile blob | `getProfile/saveProfile`, `uploadFile` avatar | Partial | Claims Cloudflare persist |
| Tab: Notifications | Alert prefs | 8 checkboxes (default checked): New messages, Lead opportunities, Event reminders, Family milestones, AI insights, Social mentions, Invoice payments, System alerts | — | **None persisted** | **No** | `defaultChecked` only — not wired to push/email |
| Tab: Integrations | OAuth hub | Full `IntegrationsPanel` embed (edge-to-edge) | Provider connection state | Worker OAuth | Partial | Duplicate of `#integrations` |
| Tab: Privacy Vault | Module access toggles | 7 checkboxes: Family, CRM, Social, Community, AI Conductor, Finance, Marketing | — | **None persisted** | **No** | Cosmetic |
| Tab: AI Settings | Proactive AI toggles | 8 checkboxes: Daily morning briefing, Proactive lead alerts, Weekly life summary, Insight Moments, Conflict detection, Opportunity scanning, Family schedule analysis, Financial shadow oracle | — | **None persisted** | **No** | Your **proactive speech** target not implemented here |
| Tab: Appearance | Theme | Theme swatch buttons from `THEMES` | Active theme id | `applyTheme`, saved theme | Yes | Instant apply |

## Messages (`messages` → `MessagesPanel_v2.jsx`)

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Platform tabs | Multi-DM hub | 10 platforms: Google Voice, Messenger, Snapchat, TikTok, Instagram, LinkedIn, X, Reddit, Telegram, Signal | Active platform | LS `lifeos_messages_accounts` labels | **Partial** | **Electron only** for embedded webview |
| Account sub-tabs | Multi-account | Account 1..N per platform; double-click rename | Custom labels | LS labels | Partial | maxAccounts per platform |
| Embedded webview | Show real DMs | Nav back/fwd/refresh; Log out; bounds to panel | Live platform UI | `electronAPI.openPlatform` | **No** in browser | Web build shows “Electron required” style empty state |
| Credentials modal | Autofill login | Username/password; save/delete; **Autofill** | Encrypted creds | `electronAPI.getCredentials/saveCredentials` | Partial | Electron only |
| Autofill | Login assist | Button on supported platforms | — | `triggerAutofill` | Partial | Messenger, IG, SC, TT, LI, X, Reddit |

## Email (`email` → `EmailPanel.jsx`)

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Main nav | Email product areas | **Inbox**, **Campaigns**, **Analytics**, **Tools** | Section switch | LS `email_*` keys + worker | Partial | Large panel ~1600 lines |
| Account connect | Mail providers | Connect Gmail, Outlook, Yahoo (OAuth); IMAP Proton/Hostinger | Connected accounts | `AUTH_WORKER` maildevil.ceogps.com | Partial | Needs OAuth completion |
| Inbox | Read/send threads | Folder list, thread list, compose, reply | Messages | API worker + Nylas-style routes | Partial | `lifeos_email_history` shared w/ CRM |
| Compose assist | AI draft | LLM helper in compose flows | Suggested text | `API_WORKER/api/llm/invoke` | Partial | Paid worker |
| Campaigns | Bulk send | Campaign name, subject, sender fields; Brevo/SendGrid hooks | Campaign stats | API worker | Partial | Keys required |
| Analytics | Send metrics | Delivered, open rate, click rate, bounces, unsubscribes, spam | Aggregate stats | Worker/campaign API | Partial | Shows — when API returns |
| Tools — Warm-up | Domain warm-up | Status ACTIVE/PAUSED, day, daily limit, total sent | Warmup object | Local + worker | Partial | |
| Contact picker | CRM integration | Typeahead from CRM + Contacts LS | Matching contacts | `lifeos_crm`, `lifeos_contacts` | Yes | Local merge |

## Calendar (`calendar` → `OtherPanels.CalendarPanel`)

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Month grid | Event calendar | ‹ › month; **Today**; **Calendly ↗** link; **+ Add Event** | Events on days | LS `lifeos_calendar` | Yes | Default seed events on first load |
| Day selection | Day detail | Click day; list events; delete × | Event name, time, tag | Same LS | Yes | |
| Add event modal | Create event | Name, date, time, tag (Business/Family/Personal/Community), icon; Cancel / Add | New event | LS | Yes | |
| Week/list views | Alt layouts | `view` state month/week/list | — | — | **No** | **Only month grid rendered** |
| External sync | Google/Outlook | — | — | — | **No** | Local only |

## Life Pulse (`pulse` → `OtherPanels.PulsePanel`)

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Stat tiles | Life KPIs | Harmony 92, Energy 87%, Business ↑14%, Family 18h/wk | Static numbers | — | **No** | **Hardcoded** — not from CRM/calendar |
| Insight cards | Narrative insights | 4 cards with **Write Script / Build Plan / Plan It / View Report** | Fixed copy (calls, takeout, guitar, CRM close rate) | — | **No** | CRM “23% close” is **story text**, not computed |
| Insight actions | LLM follow-up | Per-card action runs `invokeLLM` with card prompt | AI paragraph | Worker LLM | Partial | Needs worker keys |
| Weekly pulse | AI summary | **Run Pulse Check** (invokeLLM) | Weekly narrative | `invokeLLM` | Partial | Harmony 92 baked into prompt |

## Finance Hub (`finance` → `FinancePanel.jsx`)

**Persistence:** `fp_*` localStorage merged object + worker KV sync patterns in file.

### Tab: Overview

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Stat boxes | Snapshot | Net Worth, Monthly Income/Expenses, Savings Rate | Computed from accounts, crypto, stocks, invoices | `data.*` | Partial | Net worth formula in code |
| 12-Month Cash Flow chart | Trend viz | Area chart income vs expenses | **Randomized** monthly variation from totals | Derived | **No** | `Math.random()` on chart — not real history |
| Accounts list | Balances | Per-account rows | Name, type, balance | `data.accounts` | Partial | Empty → “add in Cash Flow” |
| Quick nav tiles | Jump tabs | Manage Budget, Track Crypto, Watch Stocks, AI Investments | — | Tab switch | Yes | |
| Full Financial Assessment | AI advisor | **Full Financial Assessment** button | LLM paragraph | `AIAdvisor` → worker/Ollama | Partial | |

### Tab: Budget

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Categories | Envelope budget | Default cats: Housing, Food, Transport, Business, …; allocated vs spent | Category rows | `data.budget` / `fp_budget` | Partial | Dashboard reads top 5 |
| Edit allocations | Plan spending | Inputs per category | spent/allocated | LS merge | Partial | |

### Tab: Cash Flow

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Accounts editor | Bank accounts | Add/edit checking/savings institutions | Balances | `data.accounts` | Partial | Syncs dashboard Financial Balances |
| Income/expense lines | Cash flow ledger | Add transactions, categories | Inflows/outflows | `data.cashflow` | Partial | |
| Growth graph | Visual | Chart of cash flow | Derived | Partial | |

### Tab: Invoices

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Invoice list | AR/AP tracking | Create invoice; status paid/pending/overdue/draft | INV- ids, amounts | `data.invoices` | Partial | Not full accounting integration |

### Tab: Crypto

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Holdings | Portfolio | Add coin (BTC, ETH, SOL, …); amount | currentPrice, value | Worker price fetch attempted in tab | Partial | Manual if API fails |

### Tab: Stocks

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Positions / watchlist | Equities | Add symbols, shares | Value | Market API partial | Partial | |

### Tab: Credit Score

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Scores & debts | Credit health | Karma/Experian fields; utilization; debt list add | Scores, debts | `data.credit` / `fp_credit` | **Partial** | **Manual entry** — no live Karma/Experian pull |
| Dashboard sync | Same data | — | Gauge on dashboard | `financeDashSync` | Partial | |

### Tab: AI Invest

| Feature | Purpose | UI elements | Data / insights | Storage / API | Wired | Notes |
|---------|---------|-------------|-----------------|---------------|-------|-------|
| Invest parameters | AI-assisted ideas | Prompts / params UI | LLM suggestions | `AIAdvisor` style | Partial | **Not** autonomous trading |

## Entertainment (`entertainment` → `EntertainmentPanel.jsx`)

| Category | Purpose | UI elements | Wired | Notes |
|----------|---------|-------------|-------|-------|
| Life Hacks | Curated hacks | Card grid; **Try This ↗** opens modal → `invokeLLM` step-by-step | Partial | Static `HACKS` array |
| Free Tools | External links | Grid of links opens new tab | Yes | URLs only |
| Make Money | Ideas list | Cards + LLM expand | Partial | |
| AI Simulators | 23 named simulators | Card per sim; modal input + run → `invokeLLM(systemPrompt)` | Partial | **These are inline prompts**, not separate `.jsx` simulator apps |
| Gaming | Games section | (see file tail) | Partial | |

**AI Simulators (all in-panel, worker LLM):** Dream Forge, Serendipity Weaver, Financial Echo Chamber, GameState Optimizer, Legacy Echo Builder, Mood-to-Monetization Bridge, Creative Flow Guardian, Alternate Life Explorer, Virtue Loop Engine, Echo Persona Weaver, Karma Credit System, Narrative Conflict Engine, Shadow Budget Oracle, Memory Palace Architect, Parallel Life Conductor (featured), Emotion-to-Expression Forge, Infinite Game Weaver, Whisper Party Engine, Meme Time Capsule, Fantasy Friend Simulator, Random Joy Roulette, Group Story Weaver, Karaoke Duet Generator.

**Unmounted duplicate apps:** Standalone `DreamForgeSimulator.jsx`, `EchoPersonaWeaver.jsx`, etc. — **not** linked to this list (PART 4).

## Health Hub (`health` → `HealthPanel.jsx`)

| Tab | Purpose | UI elements | Storage / API | Wired | Notes |
|-----|---------|-------------|---------------|-------|-------|
| Overview | Dashboard | Weight, sleep, mood, stress, energy summaries | KV `lifeos_health` via `saveApiKey` | Partial | |
| Mental | Wellness | Mood/stress/anxiety sliders; mental notes | Same blob | Partial | |
| Physical | Body metrics | Weight, sleep hours, water glasses/goal | Same | Partial | |
| Fitness | Activity | Workouts/week, logs | Same | Partial | |
| Goals | Targets | Add goal + category | goals[] in blob | Partial | |
| AI Coach | LLM tips | Run AI types: tips, mental, … | `invokeLLM` | Partial | Paid worker path |

---

# PART 5 — REMAINING PASSES

1. **Finance** — line-item every button in Budget/CashFlow/Crypto/Stocks/Credit subforms.
2. **Social, Media, Music, Contacts, Family, Community, Academy, Journal, Activity** — full tables.
3. **CRM, Projects, Tasks, KPI, Marketing, CEO GPS** — full tables.
4. **AI Hub, Erebus 5 tabs, Kranos, AgentPanel per-agent, Cloudflare, Telegram, Terminal, Integrations** — full tables.
5. Master CSV export.

**Status:** Part 0–1 complete. **Part 2B** adds Settings, Messages, Email, Calendar, Pulse, Finance tabs, Entertainment simulators list, Health tabs. **Still open:** remaining LIFE/BUSINESS/AI panels at Part 1 density.