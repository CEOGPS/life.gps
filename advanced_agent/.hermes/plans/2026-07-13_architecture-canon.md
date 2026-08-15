# LifeOS1 — Architecture canon (Chris, 2026-07-13)

**Status:** Source of truth for all audits and build plans. **No implementation** until the master inventory (`2026-07-13_panel-inventory-complete.md` + per-panel feature tables) is complete and signed off.

## Agent model (your intent — not what the repo fully implements today)

| Role | Who | What they are |
|------|-----|----------------|
| **Main brain** | **Erebus** | Operational agent of the dashboard — reasoning, tools, memory spine, coding/debug loop. |
| **Assistant** | **Kranos** | Works *with* Erebus — execution/strategy coworker, not a second unrelated LLM product. |
| **Personas / skins** | Zero, Inferno, Nova, Viper, Rage, Aurora, Breeze, … | **Personality + avatar + prompt flavor** on the same family. When not “Erebus” face, may run as **lighter worker agents** (chat, search, email, lead sourcing). **Agent Zero** naming = one main agent, many faces. |
| **Hermes / Spencer** | Separate stack | Desktop Hermes agent you are learning; dashboard **Spencer card** is a thin `hermesChat` connector — not the dock, not Erebus. |
| **Cloudflare Workers** | `api.lifeos1.ceogps.com` | Email, OAuth, KV, social APIs, LLM invoke chain — infrastructure, not the “brain.” |
| **Telegram** | **Breeze** persona + worker bot | Comms channel; should be **toggleable from Agent Dock** (target). |

## UI / control (your intent)

| Surface | Target |
|---------|--------|
| **Agent Dock** | Primary assistant UI: talking avatar, **switch persona**, **toggle Breeze (Telegram) and Spencer (Hermes)**, optional on/off for **proactive speech** (agent speaks when it has something to say, not only on user prompt). |
| **One Agent Panel** | Single configuration surface for **all** agents/personas/toggles — **not** AI Hub tab 1 / tab 2 / tab 3 / separate Erebus sidebar / separate Kranos sidebar as the long-term model. |
| **Erebus panel (sidebar)** | Control room (mind, goals, projects, control) — **optional**; must not be a second competing “brain” vs dock. |
| **AI Monitor (dashboard)** | Should reflect **real** Erebus/dock state — not cosmetic labels. |

## Code reality snapshot (misalignment debt)

- **Dock** (`layout/AgentDock.jsx`): Erebus → `ErebusCore`; Kranos → `Kranos.think`; other avatars → worker `/api/llm/invoke`. **Different backends per avatar** today.
- **AI Hub**: Three tabs — full `ErebusPanel`, `AgentPanel` (10 agent defs incl. Spencer/Breeze), `AIModelsPanel`.
- **Sidebar**: Separate nav items **Erebus AI**, **Kranos**, **AI Hub** — fragments control.
- **AgentPanel** persists `lifeos_agents`; dock reads overrides — partial link only.
- **Shell** passes `active`/`setActive` to `AgentDock`; **dock component does not consume props** (no `openDock` from dashboard).
- **Proactive / wake loops**: Primarily on **Erebus panel** (`wake`, control), not dock-global.

## Inventory deliverables (in progress)

1. `2026-07-13_panel-inventory-complete.md` — dashboard modules, routed panels summary, Appendix C stubs.
2. Per-panel tables: **Feature | Description | In UI | Wired | Data/API | Blocker** — exhaustive pass over every `*Panel*.jsx` and nested tabs.
3. Master matrix (requested): **Panel | Feature | Implemented Y/N | Blocker**.

## Styling rule (unchanged)

Global layout/visual tokens → `src/index.css`; stop growing per-panel inline `const C` except during migration.