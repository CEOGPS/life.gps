---
name: frontend-visual-refactoring
description: "Safe iterative fixes for visual layout flaws in frontend dashboards (module sizes, overlaps, positioning, shadows, grid ordering) using code edits + visual verification."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [frontend, ui, react, jsx, layout, grid, dashboard, visual, refactoring, css, shadows]
    related_skills: [systematic-debugging, spike, plan, simplify-code, lifeos-local-llm-wiring]
    category: software-development
---

# Frontend Visual Refactoring

Fix design flaws in web app homepages/dashboards: overlapping or oversized modules, wrong positioning (e.g. move Time/Weather to top row), missing cards, bad shadows causing color casts.

**Core principle:** Visual symptoms require visual feedback loops. Code changes are experiments; browser inspection is the oracle. Prefer small, reversible edits with restores on breakage.

## Session pacing (Chris)
- Do not marathon large dashboard passes — pause and report status after major chunks; watch for new user messages.
- **CSS before features:** global panel theme (`index.css` / PanelShell) before wiring inventory items — avoids rework when chrome breaks layout.
- Mockup PNGs: placement/alignment only, not pixel-perfect clone.
- If user set an approval gate, wait for explicit **OK go** / **approved — execute** before implementing; after go, still sync between chunks.

## When to Use
- User: "module sizes are off and overlapping", "make them smaller", "move the Time module up top the first row", "remove shadow causing blue cast", "replace missing modules".
- Dashboard/homepage grid issues in React (12-col, GridCard, liquid-glass classes).
- Creative/UI work where the goal is perceived layout, not just passing tests.

**Always** combine code edits with live visual verification.

## Recommended Workflow
1. **Inspect visually first** (tight feedback loop):
   - `browser_navigate` to the page (e.g. `/#dashboard` or homepage).
   - `browser_vision` with specific question: "Describe module positions, sizes, overlaps, top row contents especially Time/Weather, any blue shadows/casts."
   - `browser_snapshot` for structure (titles, gridColumn spans).
   - Note current grid const, spans, padding/minHeight in code.

2. **Identify the grid and cards**:
   - Read the main panel file (usually `src/components/.../DashboardPanel.jsx`).
   - Locate `const grid = { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", ... }` and inner GridCard styles.
   - List current titles and their `gridColumn="span X"`.

3. **Apply changes safely**:
   - **Sizes**: reduce padding ('24px'→'16px'), minHeight (260px→180px), gap (16→12), gridAutoRows ("minmax(260px, auto)" → "minmax(170px, auto)"), maxWidth (1392→1280).
   - **Positioning**: To move a module (e.g. Time & Weather) to first in top row:
     - Insert the small card block immediately after `<div style={grid}>`.
     - Remove the duplicate old instance (awk/sed range delete using unique title + content).
     - Update row comments.
   - **Spans**: Adjust to keep rows summing to 12 (e.g. top: 3+3+3+3). Change specific `gridColumn="span 4"` via unique title matches.
   - **Shadows**: Target `.liquid-glass` and `.lo-panel` (or equivalent) — replace blue-tinted rgba(31,38,135,...) with neutral dark rgba(0,0,0,0.55).

4. **Edit strategy (in order of preference)**:
   - Try `patch` first (precise old/new).
   - On repeated failures (missing "path", duplicates, truncated strings): immediately switch to terminal.
   - Use `git checkout -- file` before risky batches.
   - Precise sed with unique strings or line numbers (`sed -i 'N c\ clean text'` for comments).
   - Awk for safe block removal/insert when duplicates appear.
   - Python for complex reordering when sed garbles.

5. **Verify**:
   - Re-run browser tools immediately after edits.
   - For creative/UI work: **hold off claiming "verified", "passed", or running full lint/typecheck as proof** until the user says they like the result or you are about to commit.
   - Check row sums manually (`python -c 'spans = re.findall...; print sums'`).
   - Test in dev server if needed.

6. **Authoritative source**:
   - If user provides a GitHub repo URL, clone it (shallow) and work there instead of stale local copies.

## Live Preview and Visual Acceptance
- Start the dev server in the background (`npm run dev` / project equivalent), then read its log and use the **actual** Vite URL. Port 5173 may already be occupied; do not assume the server chose it.
- Inspect the rendered page with browser/computer-use before stating that a spacing, hierarchy, hover, scrollbar, or responsive-layout request is complete. A clean build proves syntax and bundling, not appearance.
- For dashboard readability requests, increase the **card-level** padding/gap and readable base type together. Keep titles, values, actions, and body copy intentionally distinct; surface time-sensitive items with a brighter but restrained accent color.
- For a flexible 12-column dashboard, compose deliberate row totals of 12. Larger media/analytics cards can span 6–9 columns, while adjacent supporting cards must collectively fill the remainder. Use `gridAutoRows` and paired stack regions when the user wants aligned top/bottom edges rather than a rigid uniform-card grid.
- Prefer edge-only hover treatment: a thin border change plus a low-opacity, local perimeter glow. Do not scale/lift the full card or add a large colored cloud. If using hover dots, use a low-opacity radial dot background with a visibly spaced `background-size` so it reads as texture rather than haze.
- Apply custom scrollbar styling in the global stylesheet: dark track, crimson gradient thumb, rounded edges, and a restrained brighter hover state. Include Firefox `scrollbar-width` / `scrollbar-color` alongside WebKit selectors.

## Rebuilding a Dashboard Without Losing Modules
Use a clean render-grid rebuild only when iterative JSX patching has already created cascading tag/parenthesis defects. A clean render pass is **not** permission to simplify the product into a smaller dashboard.

1. Before editing, inventory all intended cards, embedded widgets, state, handlers, and helper components. Record which render block consumes each one.
2. Preserve every user-requested module in the new grid: old cards are requirements, not optional cleanup candidates. Keep their existing add/edit/delete/save/player/embed wiring unless the user explicitly asks to remove it.
3. Use a non-uniform 12-column composition. Deliberately total each visual row to 12; let dense media/analytics cards span 6–9 columns and pair them with one or more stacked support cards. Use equal row heights or an explicit stack wrapper when the user wants aligned top and bottom edges.
4. Do not use a giant shell-quoted `node -e` or heredoc replacement for JSX that contains template literals, apostrophes, or nested quotes. It is highly prone to shell truncation and silent malformed output. Prefer a checked-in temporary `.cjs` script, `write_file`, or a sequence of small uniquely-scoped patches; read the resulting section before the next edit.
5. After every structural replacement, immediately run a production build before any styling pass. If a component is restored by name (for example an embed/player or clock), confirm its definition and imports still exist before claiming it is wired.
6. **RailColumn stacks:** wrapper `gridColumn=\"span N\"` + inner `GridColumn={false}`; extract heavy widgets to `dashboard/DashboardWidgets.jsx`. See `references/lifeos-dashboard-rail-layout.md`. Terminal **python splice** may require user consent — use incremental patch if blocked.

## Pitfalls
- **Patch tool fragility**: Repeated "path required", "Duplicate tool output", truncation → stop retrying the same malformed call. Re-read the exact target and switch to a different edit strategy with all required arguments.
- **Shell-quoted JSX rewrites**: A bash command can fail before Node runs when the payload has an unescaped quote/backtick. Do not diagnose JSX from that failure; use a real script file or a small scoped patch instead.
- **False live-preview completion**: Starting Vite is not a live-preview verification. Read its log for the actual selected URL, navigate to it, and inspect the rendered layout with browser/computer-use before saying the preview is ready. If port 5173 is occupied, report the actual alternate port.
- **Build output misuse**: `tail` can hide the beginning of a failed build and pipelines can mask an exit status. Run the build without a truncating pipe when diagnosing; only summarize it after seeing the exit result.
- **Sed garbling on JSX**: Partial replaces on comments produce nested `/*` or remnant text (e.g. "Time /* old comment */ Weather"). Always follow with line `c\\\\\\\\` clean or full restore.
- **Row math**: Changing spans without rebalancing breaks layout (overlaps or gaps). Always verify 12-col rows.
- **Over-editing**: Don't change unrelated cards or add new logic during visual fixes.
- **Verification theater**: Running lint on a noisy project and saying "it passes" misleads when the real issue is visual. Use browser vision first.
- **Wrong copy**: Editing a local fork when the user just gave the official repo URL wastes effort. Immediately `git clone --depth 1 <url>` and cd into it.
- **Glassmorphism destruction (common after size/position edits)**: JSX inline `background: 'rgba(29,29,30,0.55)'` (or similar solid) on the inner `.liquid-glass` div completely overrides the CSS `linear-gradient` + `backdrop-filter`. Result: flat modules, lost frosted look. Fix: set `background: 'transparent'` (or remove the property) so the class's gradient shows. Darker gradients (base #0a0a0a instead of light grays like #a9a9a9) prevent halo/light casts.
- **Blue / light cast returning**: Even after dark `rgba(0,0,0,...)` shadows, light gradients or extra bevel layers re-introduce perceived blue/purple glow. After **any** geometry change (sizes, spans, bottom padding), explicitly perform a second recovery pass: transparent background + darker gradient + tightened shadows (remove "keep bevel" extras).
- **User perception of "not moved"**: Even when the card is DOM-first, user may report it wasn't moved if they are running an old copy or the visual order looks wrong due to spans. Always confirm "first child after <div style={grid}>" and show the exact snippet.
- **"Shorter / less bottom padding" requests almost always need the glass+cast recovery pass immediately after**. User will say "glass effect removed and blue light back". Treat as two-phase: geometry, then recovery. Use asymmetric `'12px 16px 6px 16px'` (or tighter) + `minHeight: '140px'` + matching `gridAutoRows`.
- **System-forced verification after every edit (even pure visual UI work)**: Environment will emit "You edited code... Verification status: stale" + force `bun run typecheck` / `npx vite build`. Do not claim done. Immediately: byte-strip + `cat -A` on cited lines + targeted repair (see references/appearance-first-daily-vibrant-edge-modules.md for exact 692 cast and 1113 helpers patterns). Report only the current post-repair state.
- **HMR desync after a runtime crash ("my edits aren't rendering")**: When a React component throws at runtime (e.g. `ReferenceError: X is not defined`), Vite's HMR socket dies. After that, every later edit compiles cleanly but is NEVER pushed to the browser — the user sees no change even after a normal refresh. Symptom: `bun run build` passes, server is up (`netstat` shows :5173 LISTEN), and `curl :5173/src/.../File.jsx` returns your current code — but the browser still shows old/blank. **Fix:** hard-restart the dev server, then hard-refresh the browser (Ctrl+Shift+R). To kill it under git-bash, `taskkill //PID` is unreliable — use PowerShell: `powershell.exe -NoProfile -Command "Stop-Process -Id <pid> -Force; Start-Sleep 2; Get-NetTCPConnection -LocalPort 5173 -State Listen -EA SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force }"`. Restart with `bun run dev`. Verify the served module contains your edits before telling the user it's fixed.
- **Missing import = runtime crash, not build error**: A used component/helper with no import (e.g. `<Button>` without `import { Button } from "@/lib/ui"`) compiles in some bundler configs but throws `ReferenceError: Button is not defined` at render. Grep for usage vs import across the file's siblings (they usually share the same `@/lib/ui` import) before assuming the server is at fault.
- **TypeScript/JavaScript interop in .jsx files**: When using TypeScript type annotations in .jsx files (e.g., `{ children }: { children: React.ReactNode }`), esbuild will fail with "Expected ')' but found ':'". **Fix:** Remove type annotations from function parameters in .jsx files and use plain destructuring like `{ children }` instead. Save typed interfaces for .tsx files only.
- **Agent/LLM cards on DashboardPanel**: Adding Spencer/Hermes chat or new GridCard blocks without re-checking file-level helpers (WORKER, `load`/`save`, ClockWidget, YouTubePlayer) can leave the panel uncompilable or **production-broken** (`ReferenceError: load is not defined` if `load` was removed but `useState(() => load(...))` remains). **Fix:** import `load`/`save` from `@/utils/lifeosStorage.js` and `npm run deploy`. Grep `load(` after structural edits. For Hermes/Ollama wiring (not pure layout), load **lifeos-local-llm-wiring** — do not fold gateway/model setup into visual-only passes.
- **esbuild vs tsc cast differences**: `as any` may satisfy some tsc but reliably breaks esbuild ("Expected ) but found as"). Use plain `{}` or minimal JSDoc for input state in dashboard helpers.

## Quick Reference Patterns
- Size reduction (one-liners):
  ```
  sed -i "s/padding: '24px',/padding: '16px',/" file.jsx
  sed -i 's/gap: 16,/gap: 12,/' file.jsx
  ```
- Safe move + dedupe (Time example):
  ```
  sed -i '/<div style={grid}>/a\        <GridCard ... Time ...>'
  awk ' /Time/ && /Calendar/ {count++; if(count>1) skip=1} ... ' > fixed && mv
  ```
- Clean garbled comment (line N):
  ```
  sed -i 'N c\        {/* clean comment */}' file.jsx
  ```
- Visual command sequence: navigate → vision("top row modules, Time position, overlaps, blue casts") → snapshot.

## References
- `references/sed-jsx-patterns.md` — reusable sed/awk snippets and garble fixes.
- `references/browser-visual-loop.md` — exact browser tool sequences for dashboard inspection.
- `references/vertical-compactness-and-bottom-padding.md` — patterns for "make modules shorter / less padding on the bottoms" + the glass + blue cast recovery steps that are almost always needed immediately after geometry changes.
- `references/appearance-first-daily-vibrant-edge-modules.md` — stabilize visuals first, edge-only hover (thin border glow), thin vibrant notifications + LEADS borders, daily non-repeating lists (date-seed 10/20) with + save to localStorage + spreadsheet note, immediate perl byte-strip after sed/JSX inserts, media persistence comments pointing to Erebus/shell. Now includes concrete post-edit recovery: cat -A diagnosis, 692-area cast simplification, 1113 helpers garble fixes, GridCard child balancing (missing input-row </div>, orphan fragment removal after LEADS), esbuild vs tsc cast guidance, and mandatory response to system-forced verification reminders.
- `references/lifeos-global-panel-css.md` — PanelShell, index.css, LO_CARD, full-width pitfall (no 1280px on all routes), Messages/Finance/Social/BrandIcon hotspots.
- `references/lifeos-dashboard-rail-layout.md` — RailColumn pattern, duplicate YouTube removal, 5/day tips, smoke+build verification.
- Related skill **`lifeos-local-llm-wiring`** — Spencer/Hermes API + Ollama fallback, `HERMES_HOME` path on Windows, gateway/API server env, 64K ctx, verification scope for LifeOS1.

Use this skill for any homepage/dashboard module layout complaint. Combine with visual tools; fall back to terminal early on patch pain.

**Session learning (appearance-first visual stabilization):** When user prioritizes "get the appearance taken care of" before data, lock geometry + glass + hover + accents + daily content first. System-forced typecheck after edits is common — respond with byte strip + targeted repair without claiming full visual verification.
