# LifeOS1 / CEO GPS - Dashboard Completion Plan

**Status**: Build Passing ✅ | Deployed Live ✅ | Core Dashboard Operational ✅
**Date**: 2026-09-10
**Target**: Complete all wiring, integrations, and missing features today

---

## 🎯 ULTIMATE GOAL
**Fully functional CEO GPS dashboard with all 42 sidebar routes wired, all OAuth providers configured with real credentials, all database tables created with 10 additional field spots, all API endpoints verified, and live deployment verified at https://lifeos1.pages.dev**

---

## 📋 SUB-GOAL (Continuous Until Complete)
**Execute phased fixes in small batches (2-4 files), build-verify after each batch, deploy and verify live. Continue until all 136 audit items show "Working: Y".**

---

## 📊 AUDIT SUMMARY (from AUDIT_SPREADSHEET.csv)

| Category | Total | Working | Needs Fix |
|----------|-------|---------|-----------|
| CORE NAVIGATION | 42 | 37 | 5 (Pulse, Insights, Veriton, LucidSystems, Vault) |
| DASHBOARD MODULES | 18 | 18 | 3 (Credit Scores, Social Analytics, Marketing Analytics - mock data) |
| OAUTH PROVIDERS | 16 | 16* | 16 (all need real credentials in Cloudflare) |
| API ENDPOINTS | 9 | 3 | 6 (need verification) |
| DATABASE TABLES | 9 | 0 | 9 (migrations not run) |
| INTEGRATIONS | 12 | 5 | 7 (env vars, Stripe, SendGrid, Twilio) |
| UI COMPONENTS | 9 | 9 | 0 |
| AUTH & SECURITY | 10 | 10 | 0 |
| MISSING/BROKEN | 11 | 0 | 11 |

*OAuth providers are wired but need real credentials

---

## 🚀 PHASED EXECUTION PLAN

### PHASE 1: Database & Environment (IMMEDIATE - 30 min)
**Goal**: Run migrations, set environment variables

| Task | Files/Action | Verification |
|------|--------------|--------------|
| 1.1 Run complete migration | Execute `supabase/migrations/complete_migration_with_10_spots.sql` in Supabase SQL Editor | All 9 tables exist with 10 additional spots |
| 1.2 Set Cloudflare Pages env vars | Dashboard → Pages → lifeos1 → Settings → Environment Variables | Build passes, no Supabase fallback warning |
| 1.3 Set Cloudflare Worker secrets | `wrangler secret put` for all OAuth keys, Supabase service key | Worker health check passes |
| 1.4 Fix Worker config | Comment out KV namespace placeholder in `wrangler.worker.toml`, remove `redact_query_string` | Worker deploys successfully |

**Required Cloudflare Pages Environment Variables:**
```
VITE_SUPABASE_URL=https://mhvcdstgkyplhzjptgfr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<from Supabase dashboard>
VITE_WORKER_URL=https://lifeos1-api.ceogps.workers.dev
```

**Required Cloudflare Worker Secrets:**
```
SUPABASE_SERVICE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
SLACK_CLIENT_ID, SLACK_CLIENT_SECRET
LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
META_APP_ID, META_APP_SECRET
TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET
ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
CLICKUP_CLIENT_ID, CLICKUP_CLIENT_SECRET
AIRTABLE_CLIENT_ID, AIRTABLE_CLIENT_SECRET
TIKTOK_CLIENT_ID, TIKTOK_CLIENT_SECRET
SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET
CALENDLY_CLIENT_ID, CALENDLY_CLIENT_SECRET
STRIPE_SECRET_KEY
SENDGRID_API_KEY
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
```

---

### PHASE 2: Route Wiring & Missing Components (1-2 hours)
**Goal**: Wire all 42 sidebar routes to real components

| Batch | Tasks | Files to Create/Modify |
|-------|-------|------------------------|
| 2.1 | Wire VeritonOS1 embedded app | `src/App.tsx` - add `<Route path="/veriton/*" element={<VeritonApp />} />` |
| 2.2 | Wire Lucid Systems embedded app | `src/App.tsx` - add `<Route path="/lucidsystems/*" element={<LucidApp />} />` |
| 2.3 | Create Insights panel | `src/pages/InsightsPanel.tsx` - new component for `/insights` |
| 2.4 | Create Pulse panel | `src/pages/PulsePanel.tsx` - new component for `/pulse` |
| 2.5 | Enhance Vault panel | `src/pages/vault.tsx` - add secure storage features |
| 2.6 | Verify Terminals panel | `src/pages/terminals_TerminalPanel.jsx` - test functionality |

**Embedded App Integration Pattern:**
```tsx
// For Veriton and LucidSystems - they have their own src/App.jsx with nested routing
import VeritonApp from "./pages/veriton/src/App.jsx";
import LucidApp from "./pages/lucidsystems/src/App.jsx";

// In App.tsx Routes:
<Route path="/veriton/*" element={<VeritonApp />} />
<Route path="/lucidsystems/*" element={<LucidApp />} />
```

**Base44 Removal for Embedded Apps:**
- Replace `@base44/sdk` auth with `@/lib/SupabaseAuthContext`
- Replace `@base44/vite-plugin` with standard Vite config
- Remove `base44/` folder and `base44Client.js`
- Replace `globalThis.B44_DB` with Supabase client
- Create missing pages using main app's UI components (`@/components/ui/*`)
- Copy shared components like `ScrollToTop` from Veriton to sub-app's `components/`

---

### PHASE 3: Real Data Connections (1-2 hours)
**Goal**: Replace mock/hardcoded data with real API connections

| Module | Current State | Target | API Needed |
|--------|---------------|--------|------------|
| Credit Scores | Hardcoded FICO 632, Vantage 639 | Real Experian/Credit Karma | Experian API, Credit Karma API |
| Social Analytics | Mock data for 6 platforms | Real social metrics | Instagram Graph, Facebook Graph, TikTok, Twitter, LinkedIn, YouTube APIs |
| Marketing Analytics | Mock activity feed | Real Stripe, GitHub, Gmail, CRM data | Stripe, GitHub, Gmail, Slack webhooks |
| AI Money Tips | Local Ollama | Enhanced with real financial data | Ollama + financial context |
| Life Hacks | Local Ollama | Enhanced with personal context | Ollama + user data |

---

### PHASE 4: OAuth Credential Setup (30 min)
**Goal**: Configure all 16 OAuth providers with real credentials

| Provider | Status | Action |
|----------|--------|--------|
| Google | Wired, needs creds | Create OAuth app in Google Cloud Console |
| Microsoft | Wired, needs creds | Register app in Azure Portal |
| GitHub | Wired, needs creds | Create OAuth app in GitHub Settings |
| Slack | Wired, needs creds | Create Slack App |
| LinkedIn | Wired, needs creds | Create LinkedIn App |
| Facebook/Instagram | Wired, needs creds | Create Meta App (covers both) |
| Twitter/X | Wired, needs creds | Create X Developer App |
| Zoom | Wired, needs creds | Create Zoom OAuth App |
| ClickUp | Wired, needs creds | Create ClickUp App |
| Airtable | Wired, needs creds | Create Airtable OAuth App |
| TikTok | Wired, needs creds | Create TikTok Developer App |
| Spotify | Wired, needs creds | Create Spotify Developer App |
| Yahoo/AOL | Wired, needs creds | Create Yahoo Developer App |
| Calendly | Wired, needs creds | Create Calendly OAuth App |

**PKCE Flow Verification**: All providers use PKCE + `select_account` prompt for multi-account support. The `login_hint` parameter allows different emails per connection.

---

### PHASE 5: API Endpoint Verification (30 min)
**Goal**: Test all 9 API endpoints return correct responses

| Endpoint | Expected Response | Test Command |
|----------|-------------------|--------------|
| `/api/health` | `{"status":"healthy",...}` | `curl https://lifeos1-api.ceogps.workers.dev/api/health` |
| `/api/cron/*` | Job status | Test each cron route |
| `/api/webhooks/*` | Webhook received | Send test payloads |
| `/api/webhooks/zerobounce` | Email verification | Test with ZeroBounce |
| `/api/oauth/start` | Redirect to provider | Test each provider |
| `/api/oauth/callback` | Success page + postMessage | Complete OAuth flow |
| `/api/oauth/status` | Connected providers list | `curl /api/oauth/status?user_id=test` |
| `/api/oauth/disconnect` | Account removed | Test disconnect |

---

### PHASE 6: Build, Deploy & Live Verification (30 min)
**Goal**: Clean build, deploy, verify all 42 routes work live

```bash
# Build
pnpm run build

# Deploy to Cloudflare Pages (bypass git)
npx wrangler pages deploy dist --project-name=lifeos1 --branch=main

# Deploy Worker
npx wrangler deploy worker.js --name lifeos1-api

# Verify live (Ctrl+F5 for cache bypass)
# Test each route: https://lifeos1.pages.dev/[route]
```

**Verification Checklist:**
- [ ] All 42 sidebar routes load without 404
- [ ] Dashboard modules display real data
- [ ] OAuth flows complete for each provider
- [ ] Supabase CRUD works (Contacts, CRM, Notes, Tasks, Events)
- [ ] Music Player persists audio across navigation
- [ ] Credit Scores show real data (or clear "connect API" state)
- [ ] Social/Marketing analytics show real data (or clear "connect API" state)
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive layout works

---

## 🤖 SUB-AGENT DELEGATION STRATEGY

### Sub-Agent 1: Database & Migrations
- Run all Supabase migrations
- Verify table structures
- Test RLS policies

### Sub-Agent 2: Route Wiring & Components
- Wire Veriton & LucidSystems in App.tsx
- Create InsightsPanel.tsx
- Create PulsePanel.tsx
- Enhance Vault panel

### Sub-Agent 3: OAuth & API Integration
- Configure all 16 OAuth providers in Cloudflare
- Verify PKCE flow with different emails
- Test all API endpoints

### Sub-Agent 4: Real Data Connections
- Connect Credit Score APIs
- Connect Social Media APIs
- Connect Marketing Analytics APIs
- Replace mock data with real endpoints

### Sub-Agent 5: Build, Deploy & QA
- Run builds after each batch
- Deploy to Cloudflare
- Live verification with cache bypass
- Regression testing

---

## 🛠️ TOOLS, SKILLS & PLATFORMS TO LEVERAGE

### Current Stack (Keep)
- **Frontend**: Vite + React 18 + TypeScript + Tailwind v4 + shadcn/ui
- **Backend**: Cloudflare Workers (itty-router) + Supabase PostgreSQL
- **Hosting**: Cloudflare Pages (frontend) + Cloudflare Workers (API)
- **Auth**: Supabase Auth (anon key) + OAuth PKCE via Worker
- **Local AI**: Ollama (deepseek-coder-v2:16b, qwen2.5-coder, mistral-nemo)

### Recommended Additions
| Tool/Platform | Purpose | Priority |
|---------------|---------|----------|
| **Supabase MCP** | Direct database operations, migrations | High - already configured |
| **Cloudflare Dashboard** | Env vars, secrets, logs, analytics | High - avoid CLI auth issues |
| **Mem0** | Cross-session memory for project state | High - already configured |
| **Vercel** | Alternative if Cloudflare Pages issues persist | Medium - backup hosting |
| **Railway/Render** | Alternative Worker hosting | Medium - backup |
| **Postman/Insomnia** | API testing | Medium |
| **Playwright** | E2E testing for 42 routes | Low - later |

### Skills to Load (Available in Hermes)
- `supabase` - Core Supabase CLI, migrations, RLS
- `cloudflare-pages-deploy` - Deploy Vite/React to Cloudflare Pages
- `wrangler-coder` - Cloudflare Workers/Pages development
- `lifeos-engineering` - 7-phase protocol for LifeOS
- `vite-react-typescript-debugging` - Fix TS build errors
- `hermes-local-model-ops` - Ollama model management
- `supabase-postgres-best-practices` - Postgres optimization

---

## ⚠️ CRITICAL CONSTRAINTS (NON-NEGOTIABLE)

1. **NEVER delete panels, modules, or features without explicit permission**
2. **NO theme/appearance changes except AI Dock (ErebusDock)**
3. **Only layout and text edits allowed for everything else**
4. **Git repo is corrupt - ALWAYS bypass git: `npx wrangler pages deploy dist --project-name=lifeos1`**
5. **Always verify live at https://lifeos1.pages.dev with Ctrl+F5 cache-bypass**
6. **Batch changes: 2-4 files max per build cycle**
7. **Sub-agents: max 3 files per agent with tight brief**
8. **Use dashboard-based deployment/secrets to avoid Wrangler CLI auth issues**

---

## 📈 SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Build Status | ✅ Passing (tsc + vite build) |
| Deploy Status | ✅ Live on Pages (200 OK) |
| Sidebar Routes | 42/42 working (no 404s) |
| OAuth Providers | 16/16 configured with real creds |
| Database Tables | 9/9 created with 10 additional spots |
| Dashboard Modules | 18/18 with real data connections |
| API Endpoints | 9/9 verified working |
| Console Errors | 0 in production |
| Mobile Responsive | ✅ All breakpoints |

---

## 🔄 CONTINUOUS SUB-GOAL LOOP

```
WHILE not all audit items "Working: Y":
  1. PICK next batch (2-4 items from highest priority)
  2. ASSIGN to sub-agent or execute directly
  3. BUILD (pnpm run build) - must pass
  4. DEPLOY (wrangler pages deploy)
  5. VERIFY LIVE (Ctrl+F5 at https://lifeos1.pages.dev)
  6. UPDATE audit spreadsheet
  7. REPEAT
```

---

## 📝 NEXT IMMEDIATE ACTIONS (Upon Approval)

1. **Run Supabase migration** - Execute `complete_migration_with_10_spots.sql`
2. **Set Cloudflare Pages env vars** - VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_WORKER_URL
3. **Fix Worker config** - Comment KV placeholder, remove redact_query_string
4. **Deploy Worker** - `npx wrangler deploy worker.js --name lifeos1-api`
5. **Verify health endpoint** - `curl https://lifeos1-api.ceogps.workers.dev/api/health`
6. **Wire Veriton & LucidSystems** in App.tsx
7. **Create InsightsPanel.tsx & PulsePanel.tsx**
8. **Build & Deploy** - Verify all 42 routes

---

**Ready to execute upon your approval.** The spreadsheet (AUDIT_SPREADSHEET.csv) and this plan provide complete visibility. Sub-agents will be spawned for parallel workstreams once Phase 1 foundation is complete.