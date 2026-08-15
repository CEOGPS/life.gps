# LifeOS1 — “pages narrowed and centered” checklist

Use when Chris says **all routes** look like a skinny column in the main area (not just one panel).

## 1. Shell (index.css)

- [ ] `.lo-content-area` — `padding: 0` (not `0 10px`), `width: 100%`, `align-items: stretch`
- [ ] `.lo-content-area > *` — `width: 100%`, `max-width: none`, `margin-left/right: 0`, `flex: 1 1 auto`, `min-width: 0`
- [ ] `.lo-panel-root` — `max-width: none`, `margin: 0`, `width: 100%`
- [ ] No shared `.lo-panel { max-width: 1280px; margin: 0 auto }` on routed wrappers

## 2. PanelShell (`src/components/lifeos/layout/PanelShell.jsx`)

- [ ] Classes: `lo-panel-root` + variant only — **not** legacy `lo-panel` with width cap

## 3. Dashboard (`DashboardPanel.jsx`)

- [ ] `dashboardGridStyle` — `width: "100%"` only (no `maxWidth: 1280`, no `margin: "0 auto"`)
- [ ] Outer wrapper — `width: "100%"`, `boxSizing: "border-box"`

## 4. Per-panel inner caps (if one route still narrow)

`search_files` in that panel for `maxWidth`, `margin: "0 auto"`. Common: simulator panels, modal content, empty-state copy blocks — **not** the shell.

## 5. Verify

1. `bun run build`
2. Hard refresh or restart dev server
3. Spot-check: Finance, CRM, Social, Messages — header/tabs span full main column beside sidebar

## 6. Global CSS migration (same pass)

- `import { C, LO_CARD } from "@/lib/lifeosUi"` — no local `const C`
- `MessagesPanel_v2` pattern: `lo-messages`, `lo-bar`, `lo-chip` — no `const S`
- `python scripts/migrate-panel-c-palette.py` from repo root (copy script from skill if missing in repo)

**Convention:** `src/styles/PANEL-STYLES.md`