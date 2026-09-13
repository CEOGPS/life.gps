# Production `load is not defined` + deploy

## Symptom
```
ReferenceError: load is not defined
  at DashboardPanel / main bundle (e.g. lifeos1.pages.dev)
```

## Cause
- `useState(() => load("lifeos_dash_*", …))` without a module-scoped `load` function in the built chunk (partial edit, or deploy lag).

## Fix
1. Ensure `src/utils/lifeosStorage.js` exports `load` and `save` (`/* global localStorage */` for scoped ESLint).
2. In `DashboardPanel.jsx`: `import { load, save } from "@/utils/lifeosStorage";` — remove duplicate inline helpers.
3. `npm run build` then `npm run deploy` (Wrangler Pages).
4. User hard-refresh (Ctrl+Shift+R).

## AgentPanel
Keeps its own inline `load`/`save` today; optional refactor to shared util for consistency.

## Verification
```bash
npm run build   # must pass
npx eslint --quiet src/utils/lifeosStorage.js src/components/lifeos/panels/DashboardPanel.jsx
```