# LifeOS inventory sources (session reference)

## Authoritative routing
- `src/LifeOSShell.jsx` — `PANELS`, `renderPanel()`, `AgentDock` mount
- `src/components/lifeos/layout/Sidebar.jsx` — visible nav ids
- `src/components/lifeos/panels/*.jsx` — 57 panel files; ~31 direct routes

## Dashboard
- `DashboardPanel.jsx` — grid, `GridCard`, state, KV/LS keys
- `dashboard/DashboardWidgets.jsx` — Calendar7Day, YouTube, Music, AI Insights, AIMonitor, RemindersChip
- `lib/financeDashSync.js` — hub ↔ dashboard finance
- `contexts/GlobalPlaybackContext.jsx` — YouTube + audio persistence

## AI surfaces
- `layout/AgentDock.jsx` — dock (used by shell)
- `api/agentdock.jsx` — duplicate, not imported by shell
- `panels/ErebusPanel.jsx` — full OS UI
- `lib/agents/erebus/ErebusCore.js`, `ErebusTools.js`
- `lib/connectors/hermesChat.js` — Spencer / :8642

## Plans in repo (update on major audits)
- `.hermes/plans/2026-07-13_panel-inventory-complete.md` — modules + Appendix C stubs
- `.hermes/plans/2026-07-13_lifeos-architecture-audit.md` — stacks, worker, appendices A/B

## Quick grep
```bash
rg "GridCard title=" src/components/lifeos/panels/DashboardPanel.jsx
rg "case \"" src/LifeOSShell.jsx
ls src/components/lifeos/panels/*.jsx | wc -l
```