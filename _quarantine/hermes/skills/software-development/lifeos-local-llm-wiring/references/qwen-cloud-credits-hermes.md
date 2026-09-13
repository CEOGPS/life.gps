# Qwen cloud credits in Hermes Desktop

Chris often has **Qwen 3.6 / 3.7 credits in the Qwen desktop app** and wants Hermes (Spencer) to use them instead of Grok. Three separate paths — do not conflate.

## Path comparison

| Path | Hermes provider | Auth | Typical models | Credits bucket |
|------|-----------------|------|----------------|----------------|
| **Local Ollama** | `ollama-local` | none (localhost) | `qwen2.5-coder:latest` | GPU/time on PC; no app credits |
| **Qwen OAuth** | `qwen-oauth` | `~/.qwen/oauth_creds.json` | picker after OAuth | Qwen app / portal subscription |
| **DashScope API** | `alibaba` | `DASHSCOPE_API_KEY` in `~/.hermes/.env` | `qwen3.7-max`, `qwen3.6-plus`, `qwen3-coder-plus` | Alibaba Model Studio API billing |

**Ollama Cloud** (`ollama-cloud`) is yet another row — hosted ollama.com catalog, not local disk tags.

## Qwen app → Hermes (OAuth)

Hermes reads CLI OAuth file:

`%USERPROFILE%\.qwen\oauth_creds.json`

If missing (Qwen desktop installed but no CLI auth), Hermes cannot attach to app credits.

1. Install/use **Qwen CLI**; run `qwen auth qwen-oauth` (browser login).
2. `hermes auth add qwen-oauth`
3. Model menu → **Qwen OAuth** → pick listed model.
4. New chat.

Do not paste tokens in chat; credentials stay in `.qwen` and Hermes credential pool.

## DashScope (already common for Chris)

`hermes auth status alibaba` → logged in when `DASHSCOPE_API_KEY` is set.

- Model menu → **Alibaba** (Qwen Cloud) → `qwen3.7-max` or `qwen3-coder-plus` for coding.
- CLI: `hermes config set model.provider alibaba` + `hermes config set model.default qwen3.7-max`

`alibaba-coding-plan` uses a different base URL; 401 often means wrong endpoint for the key type (see Hermes doctor / region intl vs China).

## Recommended stack (Chris)

| Role | Provider | Model |
|------|----------|--------|
| Default coding, conserve Grok | `ollama-local` | `qwen2.5-coder:latest` |
| Heavy cloud / 3.7 | `alibaba` | `qwen3.7-max` or `qwen3-coder-plus` |
| App subscription (after OAuth) | `qwen-oauth` | as listed in picker |

Keep **reasoning off** for local 2.5 Coder; enable for cloud 3.x where supported.

## Verify without exposing secrets

```bash
export HERMES_HOME='C:/Users/<user>/AppData/Local/hermes'
hermes config path
hermes auth list
hermes config show | head -25
```

Never commit or echo API keys from `.env`.