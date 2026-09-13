---
name: lifeos-erebus-ops
description: Use when starting, restarting, rewiring, debugging, or extending the Erebus autonomous agent backend (advanced_agent/ FastAPI service on :8000) for LifeOS1. Covers Python-path isolation, VITE_* key aliasing, capability endpoints, the /hermes bridge, and the no-silent-deletion rule.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [lifeos, erebus, backend, fastapi, agent, autonomous]
    related_skills: [lifeos-platform-audit, lifeos-local-llm-wiring, lifeos-agent-dock-bridge]
---

# LifeOS Erebus Backend Ops

## Overview
Erebus is LifeOS1's autonomous agent. Its Python brain lives at `C:\dev\LifeOS1\advanced_agent\` and runs a FastAPI service on `:8000`. The React frontend calls it at `http://localhost:8000` (`/wake`, `/chat`, `/task`, `/stream`, `/hermes`, `/execute`, `/sync`, `/memory`, `/tools`, `/capabilities`). This skill is for **operating, rewiring, and debugging that service** — not the browser-only Erebus JS persona.

## When to Use
- Erebus server is down / dashboard shows "Failed to fetch" / white screen on the agent panel.
- Rewiring Erebus capabilities (browser, files, media, skills, lists, learning).
- Adding a model provider or media API key.
- Wiring Hermes → Erebus dispatch ("ask Erebus to…").
- User says "start Erebus", "Erebus is down", "restart Erebus".

## Critical: start with a clean Python path
Hermes injects itself onto `sys.path`. Running the server with Hermes's environment makes imports resolve to Hermes packages and FastAPI breaks. ALWAYS launch with PYTHONPATH cleared:

```bat
cd /c/dev/LifeOS1/advanced_agent
env -u PYTHONPATH -u PYTHONHOME PYTHONPATH=. .venv/Scripts/python runtime/main.py
```

Bash (git-bash) uses the same prefix. Exact smoke sequence in `references/start-verify.md`.

## Critical: keys load from three .env files
`runtime/env_loader.py` reads (in order) `advanced_agent/.env` → LifeOS root `.env` → Hermes `.env`, and aliases `VITE_*` names into canonical names (`VITE_GROQ_API_KEY`→`GROQ_API_KEY`, `VITE_GROk_API_KEY`/`VITE_GROK_API_KEY`→`GROK_API_KEY`, `VITE_OPENAI_API_KEY`→`OPENAI_API_KEY`, `VITE_GEMINI_API_KEY`/`GOOGLE_API_KEY`→`GEMINI_API_KEY`, `VITE_REPLICATE_API_KEY`→`REPLICATE_API_KEY`, `VITE_ELEVENLABS_API_KEY`→`ELEVENLABS_API_KEY`, `VITE_STABILITY_AI_API_KEY`→`STABILITY_API_KEY`, `VITE_HUGGINGFACE_API_KEY`→`HF_TOKEN`, `VITE_LUMA_API_KEY`→`LUMA_API_KEY`, `VITE_DID_API_KEY`→`DID_API_KEY`, `VITE_WORKER_URL`/`CLOUDFLARE_WORKER_URL`→`WORKER_URL`). It does **NOT** rewrite your .env files. See `references/env-and-keys.md`.

Model priority in `agent/router.py`: groq → openrouter → grok → gemini → openai → ollama → local fallback. If `/chat` returns "local pattern core", cloud keys didn't load — re-run env loader with `force=True` and re-check `/health`.

## Critical: the server does NOT survive between turns
A background `terminal(background=true)` Erebus process is NOT durable. Across sessions/turns it frequently dies. Symptom: `curl :8000` → connection refused, or the dashboard/Swagger shows "Failed to fetch". **Fix: restart it with the command above, then verify `/health`.** Never assume it's still up — check first.

## USER RULE — never delete silently
Chris explicitly requires: when rewiring Erebus, **do not remove any file or capability without telling him first.** Implement/extend in place; fill empty stubs; keep integrations as stubs if not wired. This overrides "clean up dead code" instincts for this repo. If deletion is truly necessary, state it explicitly and get acknowledgment.

## Capability surface (v3)
chat, reasoning, learning (memory facts + SAVE_SKILL), browser (search/browse/scrape via httpx/worker; click/fill/screenshot need agent on :8100), files (virtual FS + real disk sandbox + shell + python), media (image/video/speech/music via Stability/Replicate/ElevenLabs/Luma/HF), skills, lists. Browser agent :8100 is optional and usually offline.

## Hermes bridge
`POST /hermes` with `{"goal": "...", "mode": "chat"|"task"}`. From Hermes: tell the agent "ask Erebus to…" and it POSTs there. Helper: `advanced_agent/hermes_bridge.py`.

## Common Pitfalls
- **Server dead but you blame CORS.** "Failed to fetch" from Swagger `/docs` is almost always the server being down, not CORS. `curl :8000/health` first.
- **PYTHONPATH pollution** → import errors. Always `env -u PYTHONPATH`.
- **Swagger `/docs` is not a chat UI.** Click "Try it out", edit the body, "Execute". Or just call `/chat` via curl/Hermes.
- **Edited code but Erebus still old** → background process didn't reload; restart it.
- **`recursion` / import loop in env loader** → ensure `snapshot_keys()` and `load_erebus_env()` don't call each other unguarded (use a `_LOADED` flag + non-recursive helpers).

## Verification Checklist
- [ ] `curl :8000/health` → `status: online` and expected `model`.
- [ ] `/wake` → active model + "Full tool surface ready".
- [ ] `/capabilities` → chat/files/media/skills/lists all true.
- [ ] `/chat` returns a model other than `local` (proves keys loaded).
- [ ] `/execute` `FS_LS` on `/lifeos` works.

## References
- `references/start-verify.md` — exact start + smoke-test commands.
- `references/env-and-keys.md` — env file precedence and VITE_* alias map.
