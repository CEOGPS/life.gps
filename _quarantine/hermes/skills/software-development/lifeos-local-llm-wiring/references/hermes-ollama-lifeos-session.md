# Hermes + Ollama + LifeOS — session detail (reproduction)

Condensed from a successful Spencer dashboard wiring pass. Use with umbrella skill `lifeos-local-llm-wiring`.

**Hermes Desktop default profile (not LifeOS `HERMES_HOME`):** local tags in the model menu require `providers.ollama-local` — see `references/hermes-desktop-ollama-picker.md`.

## Ollama: bump context via API (when `ollama` not in PATH)

```bash
curl -s -m 300 http://127.0.0.1:11434/api/create \
  -d '{"model":"qwen2.5-coder-lifeos","from":"qwen2.5-coder:7b","parameters":{"num_ctx":65536}}'
```

Hermes `config.yaml` model block (example):

```yaml
model:
  default: qwen2.5-coder-lifeos:latest
  provider: ollama
  base_url: http://localhost:11434
  context_length: 65536
  ollama_num_ctx: 65536
```

Full Hermes agent may still fail until runtime ctx ≥64K; dashboard `hermesChat.js` falls back to direct Ollama.

## hermesChat.js behavior

1. `GET {HERMES_URL}/health` → `{ hermes, ollama }` from tags API.
2. `hermesChat`: POST Hermes `/v1/chat/completions`; on error or `hermes.failed`, POST Ollama `/v1/chat/completions` with Spencer system prompt.
3. Defaults: `VITE_OLLAMA_MODEL=qwen-coder:latest`, `VITE_HERMES_API_KEY` optional dev key matching gateway.

## Gateway start (bash on Windows)

```bash
export HERMES_HOME='C:/dev/LifeOS1/hermes'
export API_SERVER_ENABLED=true
export API_SERVER_KEY=lifeos-local-dev
export API_SERVER_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
hermes gateway run
```

Append to `hermes/.env` the same keys if inline export is tedious; **restart gateway** after `.env` changes.

## Verification (this project)

| Command | Expectation |
|---------|-------------|
| `npm run build` | Pass — proves DashboardPanel + hermesChat bundle |
| `npx eslint --quiet src/lib/connectors/hermesChat.js src/components/lifeos/panels/DashboardPanel.jsx` | Pass after `/* global fetch, AbortSignal */` |
| `npm run typecheck` | May fail on unrelated panels (`DreamForgeSimulator.jsx`, etc.) |
| `npm run lint` | Full tree may OOM — use scoped paths + `NODE_OPTIONS=--max-old-space-size=4096` |
| `npm run test` | Blocked if `jsdom` missing for Vitest |

Ollama smoke:

```bash
curl -s -m 120 http://127.0.0.1:11434/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen-coder:latest","messages":[{"role":"user","content":"OK"}],"max_tokens":5}'
```

## Linear MCP

Set `mcp_servers.linear.enabled: false` in LifeOS `hermes/config.yaml` when gateway hangs on OAuth during headless/API-only use.

## Windows batch launcher

`scripts/start-hermes-gateway.bat` — `HERMES_HOME=C:/dev/LifeOS1/hermes`, API server env, CORS may include `https://lifeos1.pages.dev`.

## AgentPanel + credit conservation

- Ollama `MODELS` → `hermesChat` in `callAPI`; cloud models → worker `/api/llm/invoke`.
- Dashboard AI tips → Ollama only (not worker Groq chain).
- Helpers: Spencer, ClickUp Sync (Integrations OAuth), Make Runner (`VITE_MAKE_WEBHOOK_URL`).

## Scoped verification

```bash
npm run build
NODE_OPTIONS='--max-old-space-size=4096' npx eslint --quiet \
  src/utils/lifeosStorage.js \
  src/components/lifeos/panels/DashboardPanel.jsx \
  src/components/lifeos/panels/AgentPanel.jsx
```

See also `references/production-load-crash-and-deploy.md`.