# API keys and model routing (Hermes desktop)

Hermes stores **secrets** in `%LOCALAPPDATA%\hermes\.env` (Windows) or `~/.hermes/.env`. **Behavior** (model id, provider, ctx caps) lives in `config.yaml`. Use **`hermes config set`** for model keys — agent `patch` on desktop `config.yaml` is blocked.

## Verify keys are loaded

CLI must use the **same profile** as the desktop app:

```bash
cd "C:/Users/<user>/AppData/Local/hermes"
./hermes-agent/venv/Scripts/hermes doctor
```

If `HERMES_HOME` points at `C:/dev/LifeOS1/hermes` or Git Bash `/c/...` is wrong, doctor may report **“.env missing”** and **all keys unset** even when the desktop `.env` exists.

`hermes config show` lists which named keys are **set vs missing** (not values).

## There is no “Meta Llama API key” field

**Llama 3.3 70B Instruct** is always reached through a **host**. Pick the path that matches **who issued the key** (prefix only — never paste secrets into chat):

| Key source (typical prefix / dashboard) | Where it goes | Hermes provider | Model id example |
|----------------------------------------|---------------|-----------------|------------------|
| **OpenRouter** (`sk-or-v1-…`) | `OPENROUTER_API_KEY` in `.env` | `openrouter` | `meta-llama/llama-3.3-70b-instruct:free` or without `:free` |
| **Together** | `TOGETHER_API_KEY` in `.env` | `custom` (wizard) or `providers:` entry | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| **Groq** | `GROQ_API_KEY` in `.env` | `custom` | `https://api.groq.com/openai/v1` + Groq’s current Llama 3.3 id |
| **NVIDIA NIM** | `NVIDIA_API_KEY` (already common in LifeOS setups) | `nvidia` | NIM catalog id (e.g. `meta/llama-3.3-70b-instruct` on build.nvidia.com) |
| **xAI Grok** | `XAI_API_KEY` and/or OAuth via `hermes model` | `xai` / `xai-oauth` | Not Llama |

**OpenRouter:** one key unlocks the whole catalog — no second “Meta” key. After `.env` has `OPENROUTER_API_KEY`:

```bash
hermes config set model.provider openrouter
hermes config set model.default meta-llama/llama-3.3-70b-instruct:free
```

**New chat** after changing default.

## LifeOS dashboard keys ≠ Hermes chat

LifeOS Vite sidebar / worker env keys do **not** automatically wire Spencer/Hermes desktop. Duplicate into **`AppData/Local/hermes/.env`** (or LifeOS `hermes/.env` when that profile is active).

## Inventory after user adds keys

Run **`hermes doctor`** from desktop home and read:

- **API Connectivity** — which providers answer (OpenRouter, Anthropic, DeepSeek, HF, NVIDIA, ollama-cloud, …)
- **Tool Availability** — `web`, `x_search`, `vision`, `image_gen` unlock when the backing keys exist (often OpenRouter + OAuth, not only Exa/Tavily)

Do **not** run long repeated API probes when diagnosing — one doctor pass + one short smoke per provider is enough (Chris: token discipline).

## Custom OpenAI-compatible endpoint

`hermes model` → **Custom endpoint**, or `providers.<slug>` in `config.yaml` with `base_url`, optional `key_env`, and `model`. Runtime provider is **`custom:<slug>`** or **`ollama-local`** for the local pattern documented in `lifeos-local-llm-wiring`.

## Related

- `lifeos-local-llm-wiring` — local Ollama, `ollama-local`, VRAM caps
- Hermes docs: `/docs/integrations/providers.md` — full provider list