# LifeOS1 — white screen after global CSS / `C` palette migration

## Symptom

- Entire app is a **blank white** page (or empty `#root` on white background).
- **`bun run build` succeeds** — failure is **runtime**, not compile.

## Root cause (2026-07 session)

1. Batch removed per-panel `const C = { … }` and added `import { C } from "@/lib/lifeosUi"` only on some files.
2. **~25 panels** kept `import { LO_CARD }` only but still referenced **`C.blue`**, **`C.teal`**, etc. in JSX.
3. **`LifeOSShell.jsx`** restores last panel from **`localStorage.getItem("lifeos_active_panel")`** — if that panel crashes on first render, user never sees dashboard or ErrorBoundary (depending on where error surfaces).

Typical error: **`ReferenceError: C is not defined`**.

## Fix (agent)

1. Audit:
   ```bash
   cd C:/dev/LifeOS1
   python scripts/fix-panel-c-imports.py
   ```
   Or grep: files with `\bC\.` but no `import { … C … } from "@/lib/lifeosUi"`.

2. Replace:
   - `import { LO_CARD } from "@/lib/lifeosUi"` → `import { LO_CARD, C } from "@/lib/lifeosUi"` when `C.` is used.

3. **OtherPanels.jsx** — Calendar/Pulse/AIOutput use `C` — easy to miss because file is not a `*Panel.jsx` name.

4. **MusicHub** — if `card` referenced `C.card` after strip, use `var(--b1)` / transparent + `LO_CARD`.

5. Base paint (optional but helps diagnosis):
   ```css
   html, body, #root { background: #000; width: 100%; min-height: 100%; }
   ```

## Fix (Chris, one-liner in DevTools console)

```js
localStorage.removeItem('lifeos_active_panel'); location.reload();
```

Forces **dashboard** on next load if the saved panel was the one crashing.

## Verify

1. `bun run dev` — read log for actual port (5173 may be taken).
2. `browser_navigate` or hard refresh **Ctrl+Shift+R**.
3. Console: **zero** red `ReferenceError` for `C`.
4. Click Finance, Messages, Academy, CRM — each should render.

## Pitfall for skill authors

**Never** claim “white screen fixed” from build alone. Always dev server + console or user-reported error string.