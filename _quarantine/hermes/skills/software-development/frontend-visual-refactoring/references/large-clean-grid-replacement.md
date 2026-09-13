# Large Clean Grid Replacement (escape hatch for edit-debt)

## Trigger
After many small patch/sed/node edits on a complex React dashboard panel (e.g. DashboardPanel.jsx), cascading JSX errors appear:
- "Unexpected closing \"GridCard\" tag does not match opening \"div\" tag"
- "Expected \")\" but found \"style\" / \"title\""
- Missing </div> inside .map() items or add-input rows

Piecemeal fixes stop converging.

## Pattern (one-shot reset)
1. Locate the main grid return block.
2. Leave all logic (states, getDaily*, saveToSheet, handlers, GridCard def) untouched.
3. Craft one clean, fully-balanced grid JSX string for the locked visual baseline.
4. Replace the entire old grid section in a single `node -e` atomic write.
5. Run `bun run build` (or npm equivalent) immediately.
6. Report build result. Only then tune visuals and seek user approval.

## Example structure (adapt to current vars)
Use a self-contained string for the grid div with proper nesting for all cards (Time first, Notifications, daily lists with + buttons calling existing saveToSheet, etc.).

## Why this works
Accumulated missing closes, extra ), and fragments from prior garbled large inserts make the tree unrecoverable by small edits. One clean tree is the fast path.

## Post-reset
- Small targeted patches only for final visual details (hover edge, padding).
- For creative/visual work: build + user "I like the look" is the signal. When the environment emits "verification status: stale", do byte-strip + build + report current state. Do not claim full visual verification.

See main SKILL.md pitfalls section and appearance-first reference.
