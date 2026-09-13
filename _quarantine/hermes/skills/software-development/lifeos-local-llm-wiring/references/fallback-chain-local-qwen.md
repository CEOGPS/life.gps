# Fallback chain — local primary + three backups (Chris / LifeOS)

Use when the user wants **one permanent model that does not burn API credits** plus **automatic failover** when the primary errors (rate limit, 5xx, connection).

## Recommended stack (models already on disk)

| Role | Provider | Model | Cost |
|------|----------|--------|------|
| **Primary** | `ollama-local` | `qwen2.5-coder:latest` | $0 |
| Fallback 1 | `ollama-local` | `qwen-coder:latest` | $0 (smaller/faster) |
| Fallback 2 | `ollama-local` | `qwen2.5-coder:7b` | $0 (alt tag) |
| Fallback 3 | `xai-oauth` | `grok-composer-2.5-fast` | Grok credits (emergency only) |

For **all-free** fallback 3, use **`qwen3.6:latest`** on `ollama-local` (heavy; enable thinking only if user accepts 400 risk on coder tags).

## LifeOS `hermes/config.yaml` snippet

```yaml
model:
  default: qwen2.5-coder:latest
  provider: ollama-local
  base_url: http://localhost:11434/v1
  context_length: 65536
  ollama_num_ctx: 65536
providers:
  ollama-local:
    base_url: http://localhost:11434/v1
    name: Ollama (local)
    extra_body:
      enable_thinking: false
fallback_providers:
  - provider: ollama-local
    model: qwen-coder:latest
    base_url: http://localhost:11434/v1
  - provider: ollama-local
    model: qwen2.5-coder:7b
    base_url: http://localhost:11434/v1
  - provider: xai-oauth
    model: grok-composer-2.5-fast
agent:
  reasoning_effort: none
delegation:
  provider: ollama-local
  model: qwen2.5-coder:latest
  reasoning_effort: none
```

**Invalid:** `fallback_providers: [groq]` — must be dict entries; `groq` must be logged in via `hermes auth`.

## Default desktop profile (`%LOCALAPPDATA%/hermes`)

Agent `patch` on `config.yaml` is blocked — use `hermes config set` for scalar fields; set `fallback_providers` via YAML edit or short Python `yaml.safe_load`/`dump` when user approves.

Optional: `agent.api_max_retries: 1` for faster failover to the chain.

## Verify

```bash
export HERMES_HOME='C:/dev/LifeOS1/hermes'   # or AppData Local hermes
hermes fallback list
```

Run `scripts/hermes-verify-lifeos-config.py` from the skill directory (copy to `%TEMP%` if needed).

## Hide broken models (stop mis-clicks)

Hermes Desktop → model menu → **manage visible models** (gear). Uncheck providers that `hermes auth list` marks **auth failed** / **logged out** (e.g. Anthropic exhausted, DeepSeek 402, Ollama Cloud 403, Groq, Copilot until OAuth). Keep **Ollama (local)** and optional **xai-oauth** for emergency fallback.

Storage key: `hermes.desktop.visible-models` (JSON array of `provider::model` keys).

## After changes

1. **Restart** `hermes gateway run` for LifeOS/Telegram.
2. **New chat** — old sessions can pin `qwen2.5-coder-lifeos` or old provider URLs.