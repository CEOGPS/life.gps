# Erebus Advanced Agent — Python backend v3 (`:8000`)

## What it is
Standalone **FastAPI** brain for LifeOS Erebus — **not Hermes**, **not AgentDock**.

Frontend probes:
- `BACKEND = "http://localhost:8000"` in `src/lib/agents/erebus/ErebusCore.js`
- `/wake`, `/chat`, `/sync`, `/task`, `/stream`

| Memory | Where |
|--------|--------|
| SPA browser | `lifeos_er_*` localStorage |
| Backend process | `advanced_agent/erebus_memory.json` (+ skills/lists/vfs JSON) |

Optional sibling: **browser agent** on **`:8100`** (click/fill/screenshot). Search/browse work without it via httpx/worker.

## Path
`C:\dev\LifeOS1\advanced_agent` (repo root). Restored after reorg delete `5bb0d39` if missing:
```bash
git checkout 5bb0d39^ -- advanced_agent
```

## Layout (v3)
- `runtime/main.py` — FastAPI v3 + uvicorn (`FASTAPI_PORT` default 8000)
- `runtime/env_loader.py` — tolerant multi-file env (does **not** rewrite `.env`)
- `agent/` — core, memory, planner, router, **tools/** (browser, files, media, skills, lists)
- `models/` — gpt, grok, gemini, claude, perplexity, suno helpers
- `utils/` — web_search, code_executor (sandboxed paths)
- `start_erebus.bat` / `start_erebus.sh` — clean-path launchers
- `hermes_bridge.py` — tiny HTTP client for Hermes→Erebus
- `outputs/` — generated media files

## Env loading (critical)
`runtime/env_loader.py` merges **later overrides earlier**:
1. `advanced_agent/.env`
2. LifeOS root `.env`
3. `%LOCALAPPDATA%/hermes/.env`

Aliases bare names from `VITE_*` / typos, e.g.:
- `VITE_GROQ_API_KEY` → `GROQ_API_KEY`
- `VITE_OPENAI_API_KEY` → `OPENAI_API_KEY`
- `VITE_GROk_API_KEY` / `XAI_API_KEY` → `GROK_API_KEY`
- media: Replicate, ElevenLabs, Stability, HF, Luma, DID

Do **not** paste secrets into chat. Presence-check keys only.

## Router priority
**Groq → OpenRouter → Grok/xAI → Gemini → OpenAI → Ollama → local pattern-match**  
(with failover on HTTP errors). Override with `EREBUS_MODEL=groq|openrouter|…`.

## Start (Windows — MUST clear Hermes PYTHONPATH)
Hermes injects itself onto `sys.path` and breaks the Erebus venv (wrong packages / missing deps).

```bat
C:\dev\LifeOS1\advanced_agent\start_erebus.bat
```

```bash
cd /c/dev/LifeOS1/advanced_agent
# one-time venv:
# env -u PYTHONPATH -u PYTHONHOME python -m venv .venv
# env -u PYTHONPATH -u PYTHONHOME .venv/Scripts/python -m pip install -r runtime/requirements.txt
env -u PYTHONPATH -u PYTHONHOME PYTHONPATH=. .venv/Scripts/python runtime/main.py
```

Expect: `Erebus v3 starting on port 8000` and `Model: groq` (or next available).

Kill stuck listener (Git Bash): get PID via `netstat -ano | grep 8000`, then  
`powershell.exe -NoProfile -Command "Stop-Process -Id <PID> -Force"`  
(Avoid `taskkill //PID` from MSYS — arg mangling.)

## Capabilities (v3 tool surface)
Chat/reasoning · learning (facts + SAVE_SKILL) · browser search/browse/scrape · virtual FS + real disk sandbox · shell/python · GEN_IMAGE/VIDEO/MUSIC/SPEECH/AVATAR · skills · lists · LifeOS CRM/task side-effects.

## Endpoints
| Path | Role |
|------|------|
| GET `/health` `/wake` `/capabilities` `/tools` | status |
| POST `/chat` | single-turn soul reasoning |
| POST `/task` `/stream` | agentic planner (+ tools) |
| POST `/hermes` | Hermes bridge `{goal, context, mode: chat\|task}` |
| POST `/sync` | frontend localStorage push |
| GET/POST `/memory` `/memory/learn` | backend memory |
| POST `/execute` | one-shot tools (`FS_LS`, `GEN_IMAGE`, `SAVE_SKILL`, …) |

## Smoke (write JSON files — avoid curl shell escaping)
```bash
curl -s http://127.0.0.1:8000/wake
curl -s http://127.0.0.1:8000/capabilities
# chat:
# {"message":"Reply exactly: OK","mode":"reasoning"} → POST /chat
# hermes:
# {"goal":"status","mode":"chat"} → POST /hermes
# execute:
# {"action":"FS_LS","path":"/lifeos"}
# {"action":"GEN_IMAGE","prompt":"…"}
```

Pass criteria: `model` ≠ `local` when keys present; `/capabilities.skills` true; FS_LS lists `notes`; GEN_IMAGE returns `url` when Stability/Replicate present.

## User rules (Chris)
- **DO NOT REMOVE** files/stubs without explicit tell — **fill empty modules in place**.
- Ignore desktop-attachment **venv binaries** (pip.exe, python.exe, pywin32_*) — noise.
- When asked “what do you have / need?”: compact table; default to aliasing existing `VITE_*` keys rather than demanding new secrets.
- Prefer **nuke-and-rebuild** only for hopeless UI panels; backend = expand tools, don’t strip endpoints.

## Hermes “use Erebus”
1. Server up; `/wake` shows real model.
2. `POST http://127.0.0.1:8000/hermes` or `/task` from Hermes terminal/tools.
3. Never claim Hermes memory == Erebus memory.

## Browser agent (optional click automation)
```bash
cd /c/dev/LifeOS1/archive/browser_agent && npm install && npm start  # :8100
```
`BROWSER_AGENT_URL` default `http://127.0.0.1:8100`.
