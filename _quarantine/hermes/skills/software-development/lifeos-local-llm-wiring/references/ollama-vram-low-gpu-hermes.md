# Ollama + Hermes on low VRAM GPUs (e.g. GTX 1650 4GB)

Session recipe when **local models “don’t work”**: completions **hang**, **curl exit 52** (empty reply), or Hermes **falls back to Grok** after timeouts.

## Symptoms vs cause

| Symptom | Likely cause |
|---------|----------------|
| `/v1/chat/completions` hangs 60–120s+ | `model.ollama_num_ctx` too high for VRAM (e.g. **65536** on **4GB**) |
| Works on `/api/generate` with small `num_ctx`, chat v1 fails | Same; or model crash mid-load |
| `qwen3.6:latest` never responds | **~23GB** model on **4GB** GPU — use **7B coder** only |
| Hermes shows Grok while user wanted local | **Default** still cloud; or fallback after local failure |
| `qwen-coder:latest` as primary agent | Tag often **no tools** in Ollama — use **`qwen2.5-coder:*`** for full Hermes |

## Diagnose once (don’t burn tokens on repeated 120s curls)

1. **VRAM:** `nvidia-smi` (or assume 4GB if user has GTX 1650 class card).
2. **Tags:** `curl -s -m 5 http://127.0.0.1:11434/api/tags` — confirm **`qwen2.5-coder:latest`** exists and lists **tools**.
3. **Smoke (native API):**
   ```bash
   curl -s -m 90 http://127.0.0.1:11434/api/generate \
     -d '{"model":"qwen2.5-coder:latest","prompt":"OK","stream":false,"options":{"num_predict":3,"num_ctx":8192}}'
   ```
   Cold load **15–30s** on 4GB is normal, not “stuck.”

## Fix (Hermes 64K floor vs Ollama VRAM)

Hermes **rejects** main models with detected context **&lt; 64K** unless `model.context_length` is set ≥ 65536. That value is the **agent/compression budget**, not what Ollama must allocate.

**Split the knobs:**

| Config key | 4GB GPU typical value | Role |
|------------|----------------------|------|
| `model.context_length` | `65536` | Satisfies Hermes minimum; compression threshold math |
| `model.ollama_num_ctx` | **`8192`** (try `16384` only if VRAM headroom) | Passed to Ollama as `options.num_ctx` every request |

Setting **both to 65536** on a 4GB card → OOM/hang. See `hermes-agent` `agent_init.py`: explicit `ollama_num_ctx` is **not** auto-capped by `context_length`.

## Apply (desktop profile)

Agent **`patch` on `%LOCALAPPDATA%/hermes/config.yaml` is blocked** — use CLI:

```bash
export HERMES_HOME='C:/Users/<user>/AppData/Local/hermes'
hermes config set model.provider ollama-local
hermes config set model.default qwen2.5-coder:latest
hermes config set model.base_url http://localhost:11434/v1
hermes config set model.ollama_num_ctx 8192
hermes config set model.context_length 65536
```

LifeOS repo profile: edit `C:/dev/LifeOS1/hermes/config.yaml` when scoped to project (same YAML shape).

Also: `providers.ollama-local.extra_body.enable_thinking: false`, `agent.reasoning_effort: none`.

## Verify

```bash
hermes config show   # under correct HERMES_HOME
hermes doctor
```

User: **New chat** → picker **Ollama (local)** · **qwen2.5-coder:latest**. Old threads keep prior model.

## Models to avoid on 4GB

- **`qwen3.6:latest`** — primary, delegation, or fallback 3 on this hardware
- **`qwen-coder:latest`** as **only** agent model (no tools)
- Duplicate tags **`qwen2.5-coder-lifeos:latest`** unless user explicitly uses that name

## Chris / token discipline

State root cause + config keys in one pass. One Ollama smoke with `num_ctx: 8192`; avoid stacking long `/v1/chat/completions` probes unless generate already passed and v1 still fails after config fix.