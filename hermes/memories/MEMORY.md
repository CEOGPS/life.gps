LifeOS React dashboard: glass/crimson UI, many modules; iterates layout/padding/order often.
§
Hermes: multi-provider fallbacks (not OpenRouter-only). Always curl Ollama /api/tags vs config. Codex can lock weeks. Inventory: hermes status + auth + tags → G/Y/R.
§
Dashboard rails: smoke scripts/dashboard-layout-smoke.py + npm run build.
§
Erebus v3: advanced_agent :8000; start_erebus.bat or PYTHONPATH-cleared venv python runtime/main.py. Env merges 3 .env + VITE_* aliases (advanced_agent/.env has no bare keys). /hermes bridge. Router: groq→openrouter→grok→gemini→openai→ollama. Optional browser :8100. FE lifeos_er_*; BE erebus_memory.json. USER RULE: never delete/remove files without explicit notice—fill/rewire in place.
§
LifeOS align: lifeos-platform-audit inventory first. Global CSS index.css. plan skill protected.
§
LifeOS inventory: Parts.xlsx + master md; big audits in-session/cloud (4GB OOM).
§
Broken LifeOS features: prefer nuke-rebuild; give dev URL+route not dead hostnames.
§
OAuth: redirect https://oauth.ceogps.com/api/oauth/callback. Firebase lifeos-dashboard-85759 (any Google); worker careful-span-485509-a0 (chrisgr33ninc only).
§
Chris Green chris@ceogps.com: concise, iterative, cheap/local models, practical.
§
Hermes skills imported from C:\dev\.claude\skills → %LOCALAPPDATA%\hermes\skills\chris-claude\: advanced-oauth-identity, autonomous-agentic-os, build-list, adaptive-cognition-user-modeling, lifeos-deploy, desktop-commander-overview, lifeos-electron-build, meta-cognitive-execution-engine, omni-platform-orchestrator, project-architecture-systems-opt. Load via skill_view(name). lifeos-deploy = bun build + wrangler pages; lifeos-electron-build = ELECTRON=true. Meta-cognitive = LifeOS Chief Systems Engineer mode.
§
User built a shell using Hercules AI App (web UI) but cannot export the code; needs help retrieving it.