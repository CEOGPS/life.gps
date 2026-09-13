---
name: lifeos-platform-audit
description: LifeOS1 architecture alignment — exhaustive panel/feature inventory, stub vs implemented truth, dock vs Erebus panel, unified-AI target, and global CSS rules before building.
version: 1.1.0
author: Hermes Agent
metadata:
  hermes:
    tags: [lifeos, architecture, dashboard, panels, audit, inventory]
    related_skills: [lifeos-agent-dock-bridge, lifeos-local-llm-wiring, frontend-visual-refactoring, plan]
    category: software-development
---

# LifeOS platform audit & alignment

Use when Chris asks **what every panel/module does**, **what is stubbed**, **architecture synopsis**, or demands **zero miscommunication** before implementation.

**Repo:** `C:/dev/LifeOS1` (or user clone). **Routing source of truth:** `src/LifeOSShell.jsx` `PANELS` + `renderPanel()` switch. **Dashboard modules:** `src/components/lifeos/panels/DashboardPanel.jsx` + `src/components/lifeos/dashboard/DashboardWidgets.jsx`.

## Chris preferences (embed in every audit reply)

- **One combined AI** — single execution spine; **persona = personality only**, not different backends per avatar.
- **AI Dock** (`layout/AgentDock.jsx`) = primary assistant (talking avatar, follow on dashboard, browser/PC/files/search/media/docs, memory, coding). **Not** `ErebusPanel`, **not** AI Monitor widget, **not** `setActive('erebus')` from home.
- **Layout mock** (`Untitled design (9).png` etc.) = **placement and proportions**, not pixel clone. **Pause and ask** before grid experiments; no uniform-card reshuffles without spec.
- **Global styling:** move hardwired per-panel inline CSS into **`src/index.css`** (tokens, grid, cards) — see **`frontend-visual-refactoring`** → `references/lifeos-global-panel-css.md`. Routed panels **full width**; only dashboard grid may use `max-width: 1280px`.
- **Inventory before build:** deliver **panel × feature × implemented Y/N** (and **code exists but UI missing**) before coding layout or dock bridges. A 2-second plan is **wrong** for alignment requests.
- **When Chris asks for “the list”:** paste inventory **in the chat** (tables or full structured dump) **and** give the absolute path to the master markdown. **Never** reply with only file pointers, “continue Part 2C,” or routed/unrouted counts.
- **Annotated sign-off:** `LifeOS1 Parts.xlsx` in `.hermes/desktop-attachments/` — **Instructions** column = per-row requirements; see `references/chris-parts-spreadsheet.md`.
- **Module preservation:** dashboard rebuilds must keep **full module inventory** and wiring; never shrink to a minimal subset.
- **Pacing:** after explicit **OK go**, still **sync between major chunks** — no long silent implementation runs.
- **Broken panel that never worked:** If Chris says stop patching — **replace** the panel (e.g. Integrations) with a minimal implementation; see **`lifeos-local-llm-wiring`** → `references/integrations-panel-rebuild.md`.

## Workflow

1. **Route map** — Read `LifeOSShell.jsx` imports + `switch(active)`; list sidebar ids from `Sidebar.jsx` (note orphans e.g. `integrations`).
2. **Dashboard pass** — Every `GridCard` title, handlers, storage keys; flag dead state (loaded, not rendered).
3. **Dock vs panel** — `AgentDock` uses internal `open`; shell passes `active`/`setActive` but **`AgentDock()` ignores props** today. Duplicate file `src/api/agentdock.jsx` is unused.
4. **Stub pass** — See `references/not-implemented-checklist.md` and repo plan appendices.
5. **Write or update** `.hermes/plans/*_panel-inventory-complete.md` and `*_architecture-audit.md` in the **LifeOS repo** when the audit is large.
6. **Delegate_task** on local **`qwen3.6:latest`** often **OOM** (~9.4 GB) if model already loaded — run inventory **in-session** or pin **`qwen2.5-coder:latest`** for subagents (`delegation.model` in config).

## Key dead / stub dashboard facts (verify in code)

| Item | Typical gap |
|------|-------------|
| Banner | `bannerPic` + upload — **often no JSX** |
| Weather | Title only — **no Open-Meteo** |
| `aiTips` | Generated — **not displayed** |
| Supabase block | State — **no card** |
| Harmony 92 | **Hardcoded** `Topbar` prop |

## Unified AI target architecture (document, don’t assume built)

```
AgentDock UI → Hermes :8642 (tools) → Ollama fallback → Erebus persona/context (lifeos_er_*)
Worker only for OAuth cloud surfaces when needed
```

## Pitfalls

- **Erebus panel vs dock** — User anger is almost always this confusion; fix language before code.
- **`invokeLLM` panels** — Pulse, Entertainment, Health AI, etc. use **worker paid chain** unless redirected — not $0-by-default.
- **Cloudflare panel** — UI calls many `/api/cloudflare/*`; worker may only implement **`/api/cloudflare/summary`**.
- **Terminal panel** — **Simulated** shell, not Electron/Hermes terminal.
- **Planning wrong deliverable** — Architecture alignment needs **inventory tables**, not bite-sized implementation tasks only; use **plan** skill for execution **after** alignment doc exists.
- **Routing-only reply** — Routed/unrouted without **Feature | Purpose | UI | Data | Storage | Wired | Notes** per module is a **failed** audit.
- **User opens api.lifeos1.ceogps.com** — Not LifeOS; no DNS. Direct to **`bun run dev`** + **`lifeos-local-llm-wiring`** → `references/worker-url-sanitize.md`.

## References

- `references/inventory-deliverable-format.md` — mandatory columns, **chat delivery**, wired legend.
- `references/chris-parts-spreadsheet.md` — annotated Excel + Instructions column.
- `references/inventory-sources.md` — files to read, plan doc paths in repo.
- `references/not-implemented-checklist.md` — condensed stub/dead feature list.
- **`lifeos-agent-dock-bridge`** — open dock, remove AIMonitor confusion.
- **`lifeos-local-llm-wiring`** — Ollama/Hermes/delegation OOM, **Integrations/OAuth worker**.
- `references/oauth-worker-live-debug.md` — status probe, rebuilt IntegrationsPanel.
- **`frontend-visual-refactoring`** — layout/CSS migration, preserve modules.

## Verify (after implementation phases only)

`python scripts/dashboard-layout-smoke.py`, `npm run build`, scoped eslint; Chris visual sign-off in `npm run dev`.