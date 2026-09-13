# Not implemented / stub checklist (LifeOS1)

Condensed from code audit 2026-07-13. Re-verify before claiming fixed.

## Dashboard — logic without UI
- Banner image (KV `banner_pic`)
- Weather in Time card
- `aiTips` Ollama JSON
- Supabase todos / user_data
- `saveToSheet` (alert only)
- Open AI Dock from home
- Follow-along avatar

## Shell
- Harmony score computed (hardcoded 92)
- AgentDock props from shell ignored
- Integrations panel not in sidebar
- PlaceholderPanel imported, unused
- Global CSS: most panels still inline styles

## AI Dock target vs code
- Unified one brain (split: ErebusCore, Hermes, worker, Ollama)
- Browser 8100 (archive)
- PC/files via Hermes `computer_use` (not in dock)
- Persona-only switching (different backends per avatar)

## Panels — partial
- Pulse: static metrics, hardcoded insight copy
- Terminal: fake builtins
- Calendar: LS only; week/list views not built
- Finance credit: manual Karma/Experian
- Cloudflare UI vs worker routes mismatch
- KPI: zeros until filled; live analytics need keys
- Social/email: need OAuth + worker secrets

## Unmounted panel files
Events, Invoicing, People, CreatorOS1, Messages v1, broken simulators (DreamForge, EchoPersona tsc errors)

## LLM cost
Many panels use `invokeLLM` → worker chain, not local Ollama by default.