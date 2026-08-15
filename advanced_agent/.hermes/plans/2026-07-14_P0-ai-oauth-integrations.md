# P0 — AI, OAuth & Integrations (execution started 2026-07-14)

**Priority order:** Integrations discoverability → OAuth URL consistency → Agent Dock bridge → Spencer/Hermes in dock → AI Hub consolidation (next chunk).

## Sprint 1 (this session)

| # | Task | Status |
|---|------|--------|
| 1 | `workerConfig.js` — one API URL + OAuth URL | Done |
| 2 | Sidebar **Integrations** nav (`#integrations`) | Done |
| 3 | `AgentDockContext` + `openDock({ agentId })` | Done |
| 4 | Fix AgentDock worker fetch (`https://…`) | Done |
| 5 | Spencer avatar in dock → `hermesChat` | Done |
| 6 | `model: auto` → `invokeLLM` (local-first) | Done |
| 7 | Dashboard Spencer → **Open dock** | Done |

## Sprint 2 (next — sync with Chris)

| # | Task |
|---|------|
| 8 | Settings **AI** tab ↔ `getPreferredModel` / Integrations model row |
| 9 | AI Hub tab 4 shortcut: “OAuth & keys” → `#integrations` |
| 10 | Erebus dashboard card → `openDock({ agentId: 'erebus' })` not `#erebus` |
| 11 | Worker OAuth: verify `/api/oauth/start` on deployed worker vs `VITE_OAUTH_WORKER_URL` |
| 12 | Social/Email panels read tokens from `getOAuthTokens` after connect |
| 13 | Merge duplicate Spencer widget into dock-only (optional) |

## Env (Cloudflare Pages + local `.env`)

```env
VITE_WORKER_URL=https://api.lifeos1.ceogps.com
VITE_OAUTH_WORKER_URL=https://oauth.ceogps.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_HERMES_URL=http://127.0.0.1:8642
VITE_OLLAMA_URL=http://127.0.0.1:11434
VITE_OLLAMA_MODEL=qwen2.5-coder:latest
```

## Architecture target (unchanged)

```
AgentDock UI → Erebus/Kranos local cores | Spencer → Hermes :8642 → Ollama
Other personas → Worker /api/llm/invoke (persona = system prompt only)
OAuth / KV / social → Worker (Integrations panel)
```

## Verify

1. `#integrations` from sidebar loads Integrations hub.
2. Connect Google → OAuth window uses `getOAuthWorkerUrl()`.
3. Dashboard **Dock** on Spencer card opens dock with Spencer selected.
4. Dock **Auto** model sends via `invokeLLM` when not Erebus/Kranos/Spencer.
5. `bun run build` passes `verify-c-imports`.