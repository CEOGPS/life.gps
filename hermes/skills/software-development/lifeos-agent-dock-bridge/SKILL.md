---
name: lifeos-agent-dock-bridge
description: Open LifeOS1 AgentDock (AI dock chat) from dashboard or anywhere; select Erebus/Kranos; never route to ErebusPanel unless user asks for full OS UI.
version: 1.1.0
---

# LifeOS Agent Dock bridge

## Product definition (Chris)
**AI Dock** = primary assistant: animated **talking avatar**, follows user on dashboard, **operational** (browser, PC/files, search, image/video/music/docs), reasoning + high-level coding + self-debug, **persistent memory** + continuous learning. Not ErebusPanel; not a status widget.

## Truth (code today)
- **AgentDock** (`src/components/lifeos/layout/AgentDock.jsx`) = floating chat + canvas avatar + voice. **Erebus** = `avatar.id === "erebus"` → `ErebusCore` + `ErebusTools` (no Hermes tools).
- **ErebusPanel** (`active === "erebus"`) = full-page OS — **not** the dock.
- **Full desktop/browser/file power** today lives in **Hermes gateway** (`:8642`) — **not wired into AgentDock** except Spencer via separate `hermesChat` on dashboard.
- **Erebus Python tools** (files/browser/media/skills) live on **`advanced_agent` `:8000`** when running — SPA `ErebusCore` can call it; Hermes uses **`POST /hermes`**. See skill **`lifeos-local-llm-wiring`** → `references/erebus-advanced-agent-backend.md`. Dock still ≠ that backend.
- `open` / `setOpen` are **internal** to AgentDock today — dashboard cannot open dock without a bridge.
- Shell passes `active`/`setActive` but **`AgentDock()` ignores props** (see `references/dock-implementation-gaps.md`).

## Target: unified AI (Chris)
One execution spine (Hermes + Ollama); avatars = **personality only**. Until built, use **`lifeos-platform-audit`** for honest split-backend inventory.

## Implementation pattern
1. Add `AgentDockContext` in `src/lib/AgentDockContext.jsx`:
   - `openDock({ agentId?: 'erebus' })` → sets open true + avatar index for agentId.
2. Wrap `LifeOSShell` inner tree with provider; AgentDock consumes context instead of only local state.
3. Dashboard Erebus card: `onClick={() => openDock({ agentId: 'erebus' })}` — no `setActive('erebus')`.

## Remove confusion
- Do not label **AIMonitorPanel** as Erebus ops — rename or remove from dashboard.
- Spencer (Hermes) card is separate; optional merge into dock as another avatar later.

## References
- `references/dock-implementation-gaps.md` — props ignored, follow avatar, Hermes bridge.

## Verify
- Click dashboard control → dock opens, Erebus avatar selected, first message path uses `getErebusCore().reason`.