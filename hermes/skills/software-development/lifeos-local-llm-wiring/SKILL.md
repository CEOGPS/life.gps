---
name: lifeos-local-llm-wiring
description: Wire LifeOS1 (Vite dashboard, Erebus, workers) to local LLMs via Ollama and the LifeOS Hermes profile (HERMES_HOME) API server — Spencer chat, model tags, gateway startup, and verification.
version: 1.6.0
author: Hermes Agent
license: MIT
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [lifeos, hermes, ollama, qwen, dashboard, spencer, vite, api-server]
    related_skills: [frontend-visual-refactoring, systematic-debugging, hermes-agent, lifeos-platform-audit]
    category: software-development
---

# LifeOS local LLM wiring (Hermes + Ollama)

Connect the **LifeOS1** app (`C:/dev/LifeOS1` or user’s clone) to **local Qwen/Coder models** in Ollama and optionally to **Spencer** via the project’s **Hermes profile** (`hermes/` under the repo).

**Repo anchors**
- LifeOS Hermes home: `hermes/` (`config.yaml`, `SOUL.md`, `.env`)
- Dashboard panel: `src/components/lifeos/panels/DashboardPanel.jsx`
- Shared persistence: `src/utils/lifeosStorage.js` (`load` / `save` — **import** in panels; never rely on undeployed inline helpers)
- Connectors: `src/lib/connectors/hermesChat.js`, `hermesQweb.js`
- Gateway launcher: `scripts/start-hermes-gateway.bat` (`HERMES_HOME=C:/dev/LifeOS1/hermes`, API server env)
- Agent helpers: `src/components/lifeos/panels/AgentPanel.jsx` (Spencer, ClickUp Sync, Make Runner; Ollama models via `hermesChat`)
- Erebus Ollama defaults: `src/lib/agents/erebus/ErebusCore.js` (`lifeos_er_ollama_model` key)
- Vite env injection: `vite.config.js` (`VITE_HERMES_*`, `VITE_OLLAMA_*`, **`effectiveWorkerUrl`** for worker)
- Worker URL sanitize: `src/lib/workerUrlSanitize.js`
- Docs: `Docs/HERMES_QWEB.md`

## When to use
- User: “connect dashboard to Qwen in terminal”, “Spencer on LifeOS”, “Hermes gateway for LifeOS”, “Ollama qwen-coder:latest”.
- User: **Hermes Desktop** on **local Ollama** (not Grok) — `%LOCALAPPDATA%\\hermes` unless `HERMES_HOME` is set. On **≤4GB VRAM** (e.g. GTX 1650): **`qwen2.5-coder:latest`** with **`model.ollama_num_ctx: 8192`** and **`model.context_length: 65536`**. **`qwen3.6:latest`** is not viable on 4GB. Configure desktop via **`hermes config set`**; align LifeOS `hermes/` when using that profile.
- User: **local models hang / Grok fallback** — see **`references/ollama-vram-low-gpu-hermes.md`**.
- User: “don’t see Qwen under Ollama” in the **desktop model picker** (often confused with **Ollama Cloud**).
- User: **HTTP 404** on gateway with `provider=custom`, `base_url=http://localhost:11434` (missing **`/v1`**) — fix `config.yaml`; restart gateway.
- User: **HTTP 400** “does not support thinking” on local **`qwen2.5-coder:latest`** — disable reasoning for `ollama-local`.
- User: **one permanent $0 model + 3 fallbacks**, hide broken picker entries — `references/fallback-chain-local-qwen.md`.
- User: **GitHub Copilot CLI** in Hermes terminal — “couldn’t connect”, **`copilot: logged out`**; see `references/github-copilot-cli-hermes.md`.
- User: **Qwen app credits** (3.6/3.7) for Hermes — OAuth vs DashScope; see `references/qwen-cloud-credits-hermes.md`.
- User: **`ERR_NAME_NOT_RESOLVED` / api.lifeos1.ceogps.com** — user opened **wrong URL** in browser; LifeOS is **`localhost:5173`**. See **`references/worker-url-sanitize.md`**.
- User: **Integrations / Gmail OAuth / white screen / Failed to fetch / Nylas worker 500** — **`references/integrations-panel-rebuild.md`** + **`references/oauth-worker-deploy.md`**. If panel never worked after many patches, **rebuild from scratch** (KISS Integrations Hub), don’t endless-fix.
- User: **Erebus backend / advanced_agent / :8000 / wake / Hermes use Erebus / fill tools (browser files media skills)** — **`references/erebus-advanced-agent-backend.md`**. Restore tree if missing; start with **cleared PYTHONPATH**; verify `/wake` model ≠ `local`.

**Response style (Chris):** Runbooks compact; substance over filler; state what was wrong and the one fix path. “What do you have/need?” → short table, then act on defaults (map `VITE_*` keys) without demanding secret paste.

## Architecture (pick layers)
1. **Dashboard quick chat** — browser → `hermesChat.js` → try Hermes `:8642` → **fallback** `OLLAMA_URL/v1/chat/completions` with Spencer system prompt. Works without full Hermes tool loop.
2. **Full Hermes agent** — `hermes gateway run` with `API_SERVER_ENABLED=true`; dashboard or Open WebUI hits `/v1/chat/completions` model `hermes-agent`.
3. **Erebus SPA** — browser `ErebusCore` (Ollama/localStorage) **and/or** Python **`advanced_agent` on `:8000`** (full tools). See **`references/erebus-advanced-agent-backend.md`**.
4. **Workers** — `POST /api/llm/invoke` in `workers/index.js`; same worker serves **OAuth** (`/api/oauth/*`), **API keys** (`/api/keys/*`), **Nylas** (`/api/nylas/*`). Frontend: `src/lib/workerConfig.js`, `IntegrationsPanel.jsx`.

Do not assume one path subsumes the others; document which UX surface uses which layer.

### Erebus Python backend (quick)
- Path: `C:/dev/LifeOS1/advanced_agent` — FastAPI v3, not Hermes.
- **Start:** `start_erebus.bat` or `env -u PYTHONPATH -u PYTHONHOME PYTHONPATH=. .venv/Scripts/python runtime/main.py` (Hermes PYTHONPATH breaks the venv).
- **Env:** `runtime/env_loader.py` merges `advanced_agent/.env` + LifeOS `.env` + Hermes `.env` and aliases `VITE_*` → router/media keys.
- **Hermes call:** `POST http://127.0.0.1:8000/hermes` `{goal, mode: chat|task}`.
- **Never silent-delete stubs** — fill empty model/tool files in place (Chris rule).
- Full runbook: **`references/erebus-advanced-agent-backend.md`**.

## Workflow
1. **Confirm Ollama** — `curl http://127.0.0.1:11434/api/tags`; note exact tags (`qwen-coder:latest`, `qwen2.5-coder:7b`, etc.).
2. **Align model names** — Hermes `config.yaml` `model.default` must match an installed tag (often `name:latest`).
3. **Which Hermes home** — run `hermes config path` first. **Desktop default** = `C:/Users/<user>/AppData/Local/hermes`. **LifeOS project** = `C:/dev/LifeOS1/hermes` only when that profile is active. Use **forward slashes** in `HERMES_HOME`; never rely on `/c/dev/...` for config writes.
4. **Hermes Desktop picker (local Ollama)** — bare `model.provider: ollama` + `base_url` is **not enough** for the chat model menu (`explicit_only` hides it). Register **`providers.ollama-local`** and set **`model.provider: ollama-local`**. See `references/hermes-desktop-ollama-picker.md`. Do **not** edit `AppData\\Local\\hermes\\config.yaml` via agent `patch` — use **`hermes config set`** (security guard).
5. **LifeOS Hermes profile** — when scoping to the repo, set `HERMES_HOME` to `hermes/` and verify `hermes config show` (model non-empty).
6. **Gateway + API server** — export before run if `.env` is not picked up:
   - `API_SERVER_ENABLED=true`
   - `API_SERVER_KEY` (≥8 chars)
   - `API_SERVER_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
7. **Dashboard** — Spencer `GridCard` + `hermesHealth()` polling; `VITE_OLLAMA_MODEL` override in `.env.local` if user wants 7B not `qwen-coder:latest`.
8. **Verify** — `python scripts/dashboard-layout-smoke.py` (in LifeOS1 repo); `npm run build`; scoped ESLint on touched files; `curl` `/v1/models`. Full-repo `eslint .` may OOM. Build proves compile; Chris signs off visuals in `npm run dev`.
9. **Ship production crash fixes** — If users see `ReferenceError: load is not defined` on Cloudflare Pages, local source must import `@/utils/lifeosStorage`; then `npm run build` + `npm run deploy`. Hard-refresh after deploy.

## Credit conservation (Chris / LifeOS default)
- **Do not** route dashboard AI tips or Ollama-tagged agent chats through `WORKER /api/llm/invoke` (Groq/Grok chain) while user is switching to local Qwen.
- **Dashboard tips** → browser `OLLAMA_URL/v1/chat/completions` only; fail silent on Pages (no localhost).
- **AgentPanel** → if `MODELS[].provider === "ollama"` (or qwen tag, not `qwen-max`), use `hermesChat` with `ollamaModel`; cloud models still use worker with auth.
- **Make.com** — `VITE_MAKE_WEBHOOK_URL` in `.env.local`; **ClickUp** — Integrations OAuth (`clickup` provider in worker); helper agents document payloads, never invent tokens.

## Pitfalls
- **`HERMES_HOME=/c/dev/...` (Git Bash MSYS)** — Hermes may ignore `config.yaml`; model shows empty and API returns “No inference provider”. Use `C:/dev/LifeOS1/hermes` (forward slashes).
- **Ollama Cloud vs local in picker** — **Ollama Cloud** (`ollama-cloud`) is the hosted catalog (qwen3-coder-next, etc.). **Local tags** (`qwen2.5-coder:latest`) appear only under **`Ollama (local)`** / slug **`ollama-local`** after `providers.ollama-local` is configured. User symptom: “configured Qwen but don’t see it under Ollama.”
- **`hermes config set` targets wrong home** — If shell has `HERMES_HOME=C:/dev/LifeOS1/hermes`, desktop default profile is untouched. `unset HERMES_HOME` or set explicitly to `C:/Users/<user>/AppData/Local/hermes` before configuring **this** desktop app.
- **Gateway blocked on MCP OAuth** — `mcp_servers.linear` with `enabled: true` can halt startup waiting for browser OAuth. Disable for local-only API server runs unless user needs Linear.
- **Local Ollama hangs / empty reply / Grok fallback** — **`ollama_num_ctx` too high** for GPU VRAM. Cap **`model.ollama_num_ctx`** (8192 on 4GB); keep **`model.context_length: 65536`** for Hermes 64K floor only. **`references/ollama-vram-low-gpu-hermes.md`**.
- **Hermes 64K context floor** — Set **`model.context_length`** ≥ 65536 so the full agent starts. **Do not** mirror that into **`model.ollama_num_ctx`** on low VRAM — cap `ollama_num_ctx` separately. Dashboard **Ollama fallback** avoids this for simple chat.
- **Hermes → Ollama 404 (`404 page not found`)** — Dump shows `http://localhost:11434/chat/completions`. Use **`http://localhost:11434/v1`**, **`provider: ollama-local`**, and **`providers.ollama-local.base_url`** with `/v1`. **`provider: ollama`** without `/v1` → **`custom`** and wrong path. **Restart gateway**; **new chat** if session still pins `qwen2.5-coder-lifeos`.
- **`fallback_providers: [groq]`** — Invalid. Each entry must be `{provider, model, base_url?}`. Verify with `hermes fallback list` under the correct **`HERMES_HOME`**.
- **Dashboard helper amputation** — Visual edit batches can delete `WORKER`, `load`/`save`, `ClockWidget`, `YouTubePlayer`. **Fix:** centralize `load`/`save` in `src/utils/lifeosStorage.js` and import in `DashboardPanel.jsx`. Production Pages can ship an old bundle that calls `load()` without a definition → hard refresh after deploy.
- **Cloudflare Pages vs Ollama** — `lifeos1.pages.dev` cannot reach `127.0.0.1:11434`. Spencer/Qwen chat works on **local `npm run dev`** or **Electron**; production fix is mainly crash-free shell + no paid worker LLM for tips.
- **`src/lib/**` ESLint** — Flat config ignores `src/lib` for browser globals; add `/* global fetch, AbortSignal */` on new connector files if running scoped lint.
- **Erebus localStorage key** — Save Ollama model under `ER_PREFIX + "ollama_model"` (`lifeos_er_ollama_model`), not a hardcoded `er_ollama_model` string.
- **HTTP 400: model does not support thinking** — On **`qwen2.5-coder:latest`** (and most local coder tags), Hermes must not send reasoning/thinking. Set `agent.reasoning_effort` and `delegation.reasoning_effort` to **`none`**, plus `providers.ollama-local.extra_body.enable_thinking` **`false`**. **New chat** after change. See `references/hermes-desktop-ollama-picker.md`.
- **Qwen app credits ≠ automatic Hermes billing** — See `references/qwen-cloud-credits-hermes.md`.
- **`delegate_task` + `qwen3.6:latest` OOM** — See `references/delegation-oom-qwen36.md`. Prefer **`qwen2.5-coder:latest`** for subagents or inventory in parent session.
- **Integrations white screen** — Syntax error in `IntegrationsPanel.jsx` (e.g. corrupt `apiKey` line) fails module import → blank route. Always **`bun run build`** after panel edits.
- **`api.lifeos1.ceogps.com`** — **No DNS** (`ERR_NAME_NOT_RESOLVED`). Not the app URL. Use **`lifeos1.ceogps.workers.dev`** in `.env`; guard via **`src/lib/workerUrlSanitize.js`** + **`vite.config.js`**. See **`references/worker-url-sanitize.md`**.
- **Dev proxy** — Vite `/api` → `effectiveWorkerUrl(VITE_WORKER_URL)`; **`/api/hermes` before `/api`**.
- **`bun run build` ≠ server** — User “can’t reach page” after build → need **`bun run dev`** or **`bun run preview`**.

## References
- **`references/ollama-vram-low-gpu-hermes.md`** — hangs, 4GB GPU, `context_length` vs `ollama_num_ctx`.
- `references/delegation-oom-qwen36.md` — subagent memory failure on 3.6 when already loaded.
- `references/hermes-desktop-ollama-picker.md`
- `references/github-copilot-cli-hermes.md`
- `references/qwen-cloud-credits-hermes.md`
- `references/fallback-chain-local-qwen.md`
- `references/hermes-ollama-lifeos-session.md`
- `scripts/hermes-verify-lifeos-config.py`
- `scripts/erebus-smoke.py` — HTTP smoke for Erebus `:8000` (`python scripts/erebus-smoke.py`)
- `references/production-load-crash-and-deploy.md`
- `references/lifeos-dashboard-rail-rebuild.md`
- **`references/integrations-panel-rebuild.md`** — nuke-and-rebuild Integrations, dev proxy, Nylas manual grant.
- **`references/oauth-worker-deploy.md`** — wrangler `workers/index.js`, secrets, KV token storage.
- **`references/worker-url-sanitize.md`** — dead host in `.env`, Vite define + proxy rewrite.
- **`lifeos-platform-audit`** — panel inventory, stubs, alignment before build.
- **`references/erebus-advanced-agent-backend.md`** — Erebus FastAPI v3 start, env aliases, tools, `/hermes`, smoke.

## Quick commands (Windows)
```powershell
$env:HERMES_HOME = "C:\dev\LifeOS1\hermes"
$env:API_SERVER_ENABLED = "true"
$env:API_SERVER_KEY = "lifeos-local-dev"
hermes gateway run
```

```bash
curl -s http://127.0.0.1:8642/health
curl -s http://127.0.0.1:11434/v1/chat/completions -H 'Content-Type: application/json' \
  -d '{"model":"qwen-coder:latest","messages":[{"role":"user","content":"OK"}],"max_tokens":5}'
```