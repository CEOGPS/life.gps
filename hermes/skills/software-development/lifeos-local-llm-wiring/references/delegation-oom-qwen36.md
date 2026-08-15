# delegate_task OOM with qwen3.6:latest (Windows)

## Symptom
```
ggml_aligned_malloc: insufficient memory (attempted to allocate ~9409 MB)
llama-server process has terminated: exit status 1
```
Subagent `delegate_task` with `model: qwen3.6:latest` fails in ~8–16s when the same model is already loaded (Hermes desktop + Qwen Code terminal).

## Fix
1. Pin **`delegation.model`** to **`qwen2.5-coder:latest`** (or smaller quant) in active `config.yaml`.
2. Or unload 3.6 / stop other Ollama clients before delegate.
3. For **panel inventories** and large parallel reads: run in **parent session** — see **`lifeos-platform-audit`**.

## Do not
- Re-dispatch identical heavy inventory subagents on 3.6 without VRAM headroom.