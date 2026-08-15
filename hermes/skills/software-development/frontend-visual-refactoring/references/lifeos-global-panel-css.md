# LifeOS1 global panel CSS (index.css + PanelShell)

Chris: **fix CSS before feature wiring**. **Single source for chrome:** `src/index.css`. **Convention doc:** `src/styles/PANEL-STYLES.md`. **`theme.css`:** keep import in `main.jsx` but file may be empty (rules live in `index.css`).

## Architecture

| Piece | Path | Role |
|-------|------|------|
| Tokens + classes | `src/index.css` | `:root`, `.lo-shell`, `.lo-panel-root`, `.lo-panel--fill\|scroll\|split`, `.liquid-glass`, `.lo-card`, `.lo-tab`, `.lo-bar`, `.lo-chip`, `.lo-modal-*`, utilities |
| Wrapper | `PanelShell.jsx` | **Only** variant class (`lo-panel--fill` etc.) — **do not** add legacy `.lo-panel` with width cap |
| Shell | `LifeOSShell.jsx` | `wrapPanel()`; dashboard unwrapped; `lo-content-area` flex column |
| JS accents | `src/lib/lifeosUi.js` | `LO_CARD`, `themeColors` / `C` (crimson-centric; `teal` alias → `var(--crimson)`) |

## Full-width pitfall (common regression)

`max-width: 1280px; margin: 0 auto` on **any** shared panel class narrows/center **all** routes. **Only** `DashboardPanel.jsx` grid may cap at 1280px.

Required on routed panels: `.lo-panel-root` + variants → `width: 100%`, `max-width: none`, `margin: 0`, `flex: 1`, `align-self: stretch`.

## Chris: remove CSS from pages

**Do not add** on panels:

- `const S = { … }` (layout chrome) — use `lo-messages`, `lo-flex-col-fill`, `lo-bar`, `lo-chip`, `lo-viewport`, `lo-modal-overlay`, etc.
- `const C = { teal, blue, … }` — use `import { C } from "@/lib/lifeosUi"` or CSS vars
- `const inp` / `const btn` / `fieldStyle` — inputs under `.lo-panel-root` get global rules; buttons use `.lo-btn`, `.lo-btn-primary`, `.lo-btn-link`

**OK inline:** flex/grid geometry, chart dimensions, brand hex on platform dots, one-off `style={{ background: p.color }}`.

## Migration workflow

1. Shell + PanelShell + transparent panel roots (`#080912` / `#0d0e17` → transparent).
2. Height: `height: 100%` + `minHeight: 0` inside flex — not `calc(100vh - 52px)` on every file.
3. Cards: `className={LO_CARD}` not `const card = { background: … }`.
4. Tabs/headers: `.lo-panel-header`, `.lo-tabs`, `.lo-tab.is-active` (crimson).
5. **Strip palettes:** run `scripts/migrate-panel-c-palette.py` from repo root (panels + `KPIModules/`).
6. **Exemplar:** `MessagesPanel_v2.jsx` — zero local `S` object; all chrome classes.
7. **Settings:** drop `fieldStyle` / `addBtnStyle`; rely on global inputs + `lo-btn-link`.
8. **theme.css:** global `button:hover` breaks tabs — scope hovers to `.lo-panel-root` in `index.css` (or empty `theme.css`).

## Panel hotspots

| Area | Fix |
|------|-----|
| Messages | Class-based chrome (`lo-messages`, `lo-chip`, …) |
| Finance | `Card` → `LO_CARD`; `import { C, LO_CARD }` |
| Social | `var(--teal)` → `var(--crimson)`; inactive chips pass `color="var(--t2)"` to BrandIcon |
| BrandIcon | Default fill `var(--t2)` — not neon `#00ff9d` when `color` omitted |

## Global form rule

```css
.lo-panel-root input:not([type=checkbox]):not([type=radio])…,
.lo-panel-root textarea,
.lo-panel-root select { … }
```

New panels: bare `<input>` inside shell — no duplicate `inp` const.

## Verify

- `bun run build` after batch C migration
- Spot-check: Messages, Finance, Social, Settings — full width beside sidebar, dot grid visible, crimson active chrome
- Do not claim full visual parity until Chris names remaining offenders

## Remaining debt

Large panels (Finance, Social, Dashboard) still have **layout/data** inline styles — migrate to `lo-*` incrementally; not separate CSS files per route.