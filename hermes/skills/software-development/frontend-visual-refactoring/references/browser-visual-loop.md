# Browser Visual Verification Loop for Dashboard / Homepage UI Fixes

Use these exact tool sequences when the symptom is visual (sizes, overlaps, positions, shadows, module ordering).

## Minimal Tight Loop (run after every batch of edits)
1. `browser_navigate` to the exact route/hash:
   - `http://localhost:5173/`
   - `http://localhost:5173/#dashboard`
   - `http://localhost:5173/#home`

2. `browser_vision` with precise question targeting the complaint:
   ```
   "Inspect the homepage dashboard layout: are modules overlapping or sizes off? 
   Describe positions and sizes of the top row modules especially Time & Weather. 
   Note any blue shadows or casts around cards. 
   List the visible module titles in order."
   ```

3. `browser_snapshot` (full=true for structure, or default for interactive elements):
   - Look for GridCard titles, gridColumn hints in text, card order.

4. `browser_get_images` or `browser_console` only if needed for deeper issues.

## Common Questions to Ask vision
- "top row modules, exact position of Time & Weather"
- "any blue/purple cast or heavy shadows around the glass cards"
- "module sizes relative to each other, any that look cramped or overflowing"
- "list all visible card titles from top-left going right then down"

## When to Re-inspect
- After any size/span/gap change
- Immediately after moving a block
- Before claiming the task complete
- When user says "it still looks off"

## For Creative/UI Work (explicit rule)
Do **not** treat `bun run lint` or `typecheck` output as sufficient verification.
Do **not** say "verified" or "the fixes passed" solely from code tools.
Wait for user confirmation on the visual result ("looks good", "smaller now", "Time is in the right place") or be about to commit/push.

## Switching Context
When the user says "the repo is at https://github.com/...":
- Clone shallow: `git clone --depth 1 URL local-repo`
- cd into it
- Work on the cloned copy (more likely to match what the user will see)
- Ignore previous local paths outside the clone

## Quick Checklist Before Responding "Done"
- [ ] Visual inspection run after last edit
- [ ] Top row has the requested module in the requested position
- [ ] Spans add cleanly to 12 per row (spot-check)
- [ ] No garbled comments or broken JSX visible in read_file
- [ ] Shadows look neutral in vision description
- [ ] User has not yet contradicted the visual state

This loop replaces "run the tests" for pure layout work.