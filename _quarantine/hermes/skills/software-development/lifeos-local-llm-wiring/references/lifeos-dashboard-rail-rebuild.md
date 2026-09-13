# LifeOS dashboard rail rebuild (session recipe)

**Repo:** `C:/dev/LifeOS1`  
**Mockup rule:** PNG = placement/alignment only — not pixel clone (black, glass, crimson hover, dot grid).

## Target layout (12-col)

| Rail | span | Stack |
|------|------|--------|
| Left | 3 | Time, Calendar7Day, Tasks, Links |
| Center | 6 | YouTubeDashboard, Spencer, AI Insights |
| Right | 3 | Notifications (blink), Finance snapshot, Leads+ts, AI Monitor |

**Lower rows:** Notes (4), Product revenue (5), Balances (4), Credit (3) + Budget hub (3), Tips 5/day (6+6), Social (2) + Playlist (2) + Quick budget (4).

## Files (do not drop modules)

- `DashboardPanel.jsx` — `RailColumn`, `dashboardGridStyle`, import widgets + `financeDashSync`
- `dashboard/DashboardWidgets.jsx` — Calendar7Day, YouTubeDashboard, MusicPlaylistMini, AIMonitor, AIInsights, RemindersChip
- `lib/GlobalPlaybackContext.jsx` — wrap `LifeOSShell` with `GlobalPlaybackProvider`
- `lib/dashboard/financeDashSync.js` — `/* global localStorage, fetch */`
- `layout/Topbar.jsx` — `RemindersChip` beside avatar

## Edit strategy

1. Prefer **incremental `patch`** (RailColumn + `gridColumn={false}`).
2. **Python splice** of a `_dashboard_return_fragment.txt` may be **blocked** until user consents to terminal — do not loop on blocked commands.
3. Never nest a hidden GridCard around Product Revenue (breaks JSX).

## Pacing (Chris)

- Pause after major chunks; do not marathon without checking for new user messages.
- No execution until **“OK go”** / **“approved — execute Phase X”** when user set an approval gate.

## Verify (compile)

```bash
python scripts/dashboard-layout-smoke.py
npm run build
npx eslint --quiet src/lib/dashboard/financeDashSync.js src/components/lifeos/panels/DashboardPanel.jsx ...
```

Full `eslint .` may OOM. `typecheck` may fail on unrelated panels.

## Hermes / Ollama (same session)

- Desktop + LifeOS: `hermes config set` → `ollama-local`, `qwen3.6:latest`, reasoning `none`
- New chat to leave Grok thread; `delegate_task` uses parent Ollama model