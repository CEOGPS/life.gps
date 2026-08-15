# Hermes Desktop — local Ollama in the model picker

## Symptom
User set `model.provider: ollama` and `model.default: qwen2.5-coder:latest` but the **model menu** only shows **Ollama Cloud** models (hosted catalog), not local tags from `ollama list` / `GET /api/tags`.

## Cause
Desktop chat pickers call `model.options` with **`explicit_only: true`**. Bare `model.provider: ollama` does not emit a user-defined provider row; **`ollama-cloud`** is a separate built-in row with cloud models only.

## Fix (default desktop profile)

Confirm target home (not LifeOS repo unless intended):

```bash
export HERMES_HOME='C:/Users/<user>/AppData/Local/hermes'
hermes config path
```

Ensure Ollama tag exists (create with 64K ctx for full Hermes tools):

```bash
curl -s http://127.0.0.1:11434/api/create -d '{
  "model": "qwen2.5-coder:latest",
  "from": "qwen2.5-coder:7b",
  "parameters": {"num_ctx": 65536}
}'
```

Register local endpoint and point main + delegation at it:

```bash
hermes config set providers.ollama-local.base_url 'http://localhost:11434/v1'
hermes config set providers.ollama-local.name 'Ollama (local)'
hermes config set model.provider ollama-local
hermes config set model.default qwen2.5-coder:latest
hermes config set model.base_url 'http://localhost:11434'
hermes config set model.context_length 65536
hermes config set model.ollama_num_ctx 65536
hermes config set delegation.provider ollama-local
hermes config set delegation.model qwen2.5-coder:latest
```

Optional: disable `mcp_servers.linear.enabled` if gateway blocks on OAuth.

## Verify picker payload (developer)

From `hermes-agent` repo with `HERMES_HOME` set:

```python
from hermes_cli.inventory import load_picker_context, build_models_payload
ctx = load_picker_context()
p = build_models_payload(ctx, explicit_only=True, refresh=True, probe_current_custom_provider=True)
for row in p["providers"]:
    if row.get("is_user_defined") or row.get("is_current"):
        print(row["slug"], len(row.get("models") or []), row.get("models")[:5])
```

Expect **`ollama-local`** with local tags including **`qwen2.5-coder:latest`**.

## User steps
1. Ollama running on `11434`.
2. Model menu → **Ollama (local)** (not Ollama Cloud) → **qwen2.5-coder:latest**.
3. **Refresh models** in picker or restart app; **new chat** so session picks up provider.

## HTTP 400 — “does not support thinking”

Local **Qwen 2.5 Coder** is non-thinking. If `agent.reasoning_effort` is `medium` (or the session reasoning toggle is on), Ollama returns **400**.

```bash
hermes config set agent.reasoning_effort none
hermes config set delegation.reasoning_effort none
hermes config set providers.ollama-local.extra_body.enable_thinking false
# if still 400 on some Ollama builds:
hermes config set providers.ollama-local.extra_body.chat_template_kwargs.enable_thinking false
```

New chat; disable reasoning on **Ollama (local)** in the model edit submenu. Use **Alibaba** / **qwen3.7-max** when the user wants thinking on cloud Qwen.

## Agent constraint
Do not `patch` `AppData/Local/hermes/config.yaml` — use **`hermes config set`** only.